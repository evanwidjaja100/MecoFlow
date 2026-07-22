import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  parseServiceEnvironment,
  type ServiceEnvironment,
} from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseThreeAFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import { DocumentsRepository } from "../documents/documents.repository.js";
import { ReceivingRepository } from "./receiving.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 5B ASN and receiving integrity", () => {
  let database: PrismaClient;
  let repository: ReceivingRepository;
  let documents: DocumentsRepository;
  const context = { correlationId: randomUUID(), requestId: randomUUID() };

  beforeAll(() => {
    database = createDatabaseClient(databaseUrl!);
    const environment = parseServiceEnvironment(
      process.env,
    ) as ServiceEnvironment;
    repository = new ReceivingRepository(environment);
    documents = new DocumentsRepository(environment);
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  async function acknowledgedOrder(lineCount = 1) {
    const number = Math.floor(Math.random() * 1_000_000_000) + 10_000;
    const totalQuantity = String(lineCount * 10);
    const workPackage = await database.workPackage.create({
      data: {
        code: `R5B-${randomUUID().slice(0, 8)}`,
        name: `Receiving integration requirement ${number}`,
        plannedEndDate: new Date("2026-08-31T00:00:00.000Z"),
        plannedStartDate: new Date("2026-08-01T00:00:00.000Z"),
        projectId: phaseTwoFixtures.demoProjectId,
      },
    });
    const bom = await database.bom.create({
      data: {
        projectId: phaseTwoFixtures.demoProjectId,
        workPackageId: workPackage.id,
        revisions: {
          create: {
            createdByUserId: localFixtures.internalAdminUserId,
            lines: {
              create: {
                itemId: phaseThreeAFixtures.demoItemId,
                lineNumber: 1,
                quantity: totalQuantity,
                unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
              },
            },
            revisionNumber: 1,
            status: "DRAFT",
            title: `Receiving integration BOM ${number}`,
          },
        },
      },
      include: { revisions: { include: { lines: true } } },
    });
    const requisition = await database.purchaseRequisition.create({
      data: {
        approvedAt: new Date(),
        approverUserId: localFixtures.internalAdminUserId,
        lines: {
          create: {
            bomLineId: bom.revisions[0]!.lines[0]!.id,
            coveredQuantitySnapshot: "0",
            lineNumber: 1,
            outstandingQuantitySnapshot: totalQuantity,
            quantity: totalQuantity,
            requiredQuantitySnapshot: totalQuantity,
          },
        },
        projectId: phaseTwoFixtures.demoProjectId,
        requesterUserId: localFixtures.internalAdminUserId,
        requisitionNumber: number,
        status: "APPROVED",
        title: `Receiving integration requisition ${number}`,
      },
      include: { lines: true },
    });
    return database.$transaction(async (transaction) => {
      const order = await transaction.purchaseOrder.create({
        data: {
          acknowledgedAt: new Date(),
          createdByUserId: localFixtures.internalAdminUserId,
          projectId: phaseTwoFixtures.demoProjectId,
          purchaseOrderNumber: number,
          revisions: {
            create: {
              createdByUserId: localFixtures.internalAdminUserId,
              lines: {
                create: Array.from({ length: lineCount }, (_, index) => ({
                  internalLineNotes: "Phase 5B integration fixture",
                  itemId: phaseThreeAFixtures.demoItemId,
                  lineNumber: index + 1,
                  orderedQuantity: "10",
                  unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
                })),
              },
              revisionNumber: 1,
              revisionReason: "Phase 5B acknowledged fixture",
              sentAt: new Date(),
              title: `Receiving fixture ${number}`,
            },
          },
          sentAt: new Date(),
          status: "ACKNOWLEDGED",
          supplierOrganizationId: localFixtures.supplierOrganizationId,
        },
        include: { revisions: { include: { lines: true } } },
      });
      await transaction.purchaseOrderAllocation.createMany({
        data: order.revisions[0]!.lines.map((line, index) => ({
          alreadyOrderedQuantitySnapshot: String(index * 10),
          approvedQuantitySnapshot: totalQuantity,
          availableQuantitySnapshot: String((lineCount - index) * 10),
          purchaseOrderLineId: line.id,
          purchaseRequisitionLineId: requisition.lines[0]!.id,
          quantity: "10",
          requiredDateSnapshot: new Date("2026-08-31T00:00:00.000Z"),
        })),
      });
      return order;
    });
  }

  async function arrivedAsn(lineCount = 1) {
    const order = await acknowledgedOrder(lineCount);
    const lines = order.revisions[0]!.lines;
    const created = await repository.createAsn({
      actorUserId: localFixtures.supplierAdminUserId,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      lines: lines.map((line, index) => ({
        packageReference: `PKG-${index + 1}`,
        purchaseOrderLineId: line.id,
        shippedQuantity: "5",
      })),
      purchaseOrderId: order.id,
      supplierOrganizationId: localFixtures.supplierOrganizationId,
      supplierReference: `ASN-${randomUUID().slice(0, 12)}`,
    });
    const submitted = await repository.transitionAsn({
      actorUserId: localFixtures.supplierAdminUserId,
      advanceShipmentNoticeId: created.id,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      expectedVersion: created.version,
      reason: "Submit complete shipment notice",
      targetStatus: "SUBMITTED",
    });
    const dispatched = await repository.transitionAsn({
      actorUserId: localFixtures.supplierAdminUserId,
      advanceShipmentNoticeId: created.id,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      expectedVersion: submitted.version,
      reason: "Shipment departed supplier facility",
      targetStatus: "IN_TRANSIT",
    });
    const arrived = await repository.transitionAsn({
      actorUserId: localFixtures.internalAdminUserId,
      advanceShipmentNoticeId: created.id,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: dispatched.version,
      reason: "Shipment verified at receiving dock",
      targetStatus: "ARRIVED",
    });
    return arrived;
  }

  async function draftReceipt(lineCount = 1) {
    const asn = await arrivedAsn(lineCount);
    const receipt = await repository.createReceipt({
      actorUserId: localFixtures.internalAdminUserId,
      advanceShipmentNoticeId: asn.id,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      lines: asn.lines.map((line, index) => ({
        advanceShipmentNoticeLineId: line.id,
        batchNumber: `BATCH-${index + 1}`,
        heatNumber: `HEAT-${index + 1}`,
        manufacturer: "Fictional Metals Ltd",
        packageReference: line.packageReference,
        receivedQuantity: "5",
      })),
      projectId: phaseTwoFixtures.demoProjectId,
      receivedAt: new Date().toISOString(),
      warehouseLocation: "Dock A",
    });
    return { asn, receipt };
  }

  function postInput(receipt: { id: string; version: number }, key: string) {
    return {
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: receipt.version,
      goodsReceiptId: receipt.id,
      idempotencyKey: key,
      requestHash: createHash("sha256")
        .update(`${receipt.id}:${receipt.version}`)
        .digest("hex"),
    };
  }

  it("ties supplier ASN lines to the owned current PO and preserves explicit shipment transitions", async () => {
    const orderA = await acknowledgedOrder();
    const orderB = await acknowledgedOrder();
    await expect(
      repository.createAsn({
        actorUserId: localFixtures.supplierAdminUserId,
        auditOrganizationId: localFixtures.supplierOrganizationId,
        context,
        lines: [
          {
            purchaseOrderLineId: orderB.revisions[0]!.lines[0]!.id,
            shippedQuantity: "1",
          },
        ],
        purchaseOrderId: orderA.id,
        supplierOrganizationId: localFixtures.supplierOrganizationId,
        supplierReference: `ASN-SCOPE-${randomUUID().slice(0, 8)}`,
      }),
    ).rejects.toThrow("current supplier-owned purchase order revision");
    const arrived = await arrivedAsn();
    expect(arrived.status).toBe("ARRIVED");
    expect(arrived.transitions.map(({ targetStatus }) => targetStatus)).toEqual(
      ["SUBMITTED", "IN_TRANSIT", "ARRIVED"],
    );
    await expect(
      repository.transitionAsn({
        actorUserId: localFixtures.internalAdminUserId,
        advanceShipmentNoticeId: arrived.id,
        auditOrganizationId: localFixtures.internalOrganizationId,
        context,
        expectedVersion: arrived.version,
        reason: "Attempt invalid terminal shipment transition",
        targetStatus: "CANCELLED",
      }),
    ).rejects.toThrow("Invalid shipment transition");
    await expect(
      database.advanceShipmentNoticeLine.update({
        data: { packageReference: "MUTATED" },
        where: { id: arrived.lines[0]!.id },
      }),
    ).rejects.toThrow();
  });

  it("posts receipt and awaiting-inspection lots once for an idempotent retry", async () => {
    const { receipt } = await draftReceipt();
    const key = `receipt-${randomUUID()}`;
    const first = await repository.postReceipt(postInput(receipt, key));
    const retry = await repository.postReceipt(postInput(receipt, key));
    expect(first.status).toBe("POSTED");
    expect(retry.id).toBe(first.id);
    expect(first.lines[0]).toMatchObject({
      batchNumber: "BATCH-1",
      heatNumber: "HEAT-1",
      manufacturer: "Fictional Metals Ltd",
      packageReference: "PKG-1",
    });
    expect(first.lines[0]!.inventoryLot).toMatchObject({
      quantity: "5",
      status: "AWAITING_INSPECTION",
    });
    expect(
      await database.inventoryLot.count({
        where: { sourceGoodsReceiptId: receipt.id },
      }),
    ).toBe(1);
    expect(
      await database.auditEvent.count({
        where: { action: "GOODS_RECEIPT_POSTED", entityId: receipt.id },
      }),
    ).toBe(1);
    await expect(
      database.goodsReceipt.update({
        data: { notes: "Mutated posted receipt" },
        where: { id: receipt.id },
      }),
    ).rejects.toThrow();
    await expect(
      database.goodsReceiptLine.update({
        data: { heatNumber: "MUTATED" },
        where: { id: first.lines[0]!.id },
      }),
    ).rejects.toThrow();
  });

  it("posts a separate traceable correction without mutating the original lot", async () => {
    const { receipt } = await draftReceipt();
    const posted = await repository.postReceipt(
      postInput(receipt, `receipt-${randomUUID()}`),
    );
    const correction = await repository.createCorrection({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      correctsReceiptId: posted.id,
      lines: [
        {
          goodsReceiptLineId: posted.lines[0]!.id,
          quantityDelta: "-1",
        },
      ],
      reason: "Correct quantity after recount",
      receivedAt: new Date().toISOString(),
      warehouseLocation: "Dock A",
    });
    const corrected = await repository.postReceipt(
      postInput(correction, `correction-${randomUUID()}`),
    );
    expect(corrected).toMatchObject({
      correctionReason: "Correct quantity after recount",
      correctsReceiptId: posted.id,
      kind: "CORRECTION",
      status: "POSTED",
    });
    expect(corrected.lines[0]!.inventoryLotAdjustment).toMatchObject({
      quantityDelta: "-1",
    });
    const lot = await database.inventoryLot.findUniqueOrThrow({
      include: { adjustments: true },
      where: { goodsReceiptLineId: posted.lines[0]!.id },
    });
    expect(lot.quantity.toString()).toBe("5");
    expect(
      lot.adjustments.map(({ quantityDelta }) => quantityDelta.toString()),
    ).toEqual(["-1"]);
  });

  it("rolls back posting and lot creation when the transactional audit write fails", async () => {
    const { receipt } = await draftReceipt(2);
    const suffix = randomUUID().replaceAll("-", "");
    const functionName = `test_fail_receipt_audit_${suffix}`;
    const triggerName = `test_fail_receipt_audit_trigger_${suffix}`;
    await database.$executeRawUnsafe(
      `CREATE FUNCTION ${functionName}() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'forced receipt audit failure'; END; $$ LANGUAGE plpgsql`,
    );
    await database.$executeRawUnsafe(
      `CREATE TRIGGER ${triggerName} BEFORE INSERT ON audit_events FOR EACH ROW WHEN (NEW.action = 'GOODS_RECEIPT_POSTED' AND NEW."entityId" = '${receipt.id}') EXECUTE FUNCTION ${functionName}()`,
    );
    try {
      await expect(
        repository.postReceipt(
          postInput(receipt, `transaction-${randomUUID()}`),
        ),
      ).rejects.toThrow();
      expect(
        await database.goodsReceipt.findUniqueOrThrow({
          where: { id: receipt.id },
        }),
      ).toMatchObject({ status: "DRAFT" });
      expect(
        await database.inventoryLot.count({
          where: { sourceGoodsReceiptId: receipt.id },
        }),
      ).toBe(0);
    } finally {
      await database.$executeRawUnsafe(
        `DROP TRIGGER ${triggerName} ON audit_events`,
      );
      await database.$executeRawUnsafe(`DROP FUNCTION ${functionName}()`);
    }
  });

  it("associates supplier shipment documents and internal receipt photographs through secure document scope", async () => {
    const { asn, receipt } = await draftReceipt();
    const metadata = () => ({
      byteSize: 16,
      extension: "pdf" as const,
      mimeType: "application/pdf",
      originalFileName: "packing-list.pdf",
      sha256: "a".repeat(64),
      storageKey: randomUUID(),
      uploadExpiresAt: new Date(Date.now() + 300_000),
    });
    const supplierDocument = await documents.create({
      actorUserId: localFixtures.supplierAdminUserId,
      associations: [
        { entityId: asn.id, entityType: "ADVANCE_SHIPMENT_NOTICE" },
      ],
      auditOrganizationId: localFixtures.supplierOrganizationId,
      category: "PACKING_LIST",
      context,
      description: "Secure shipment association",
      ownerOrganizationId: localFixtures.supplierOrganizationId,
      ownerType: "SUPPLIER",
      projectId: phaseTwoFixtures.demoProjectId,
      title: "Packing list",
      upload: metadata(),
    });
    expect(supplierDocument.associations).toContainEqual(
      expect.objectContaining({
        entityId: asn.id,
        entityType: "ADVANCE_SHIPMENT_NOTICE",
      }),
    );
    await expect(
      documents.create({
        actorUserId: localFixtures.supplierAdminUserId,
        associations: [{ entityId: receipt.id, entityType: "GOODS_RECEIPT" }],
        auditOrganizationId: localFixtures.supplierOrganizationId,
        category: "RECEIPT_PHOTOGRAPH",
        context,
        description: "Supplier must not attach to internal receipt",
        ownerOrganizationId: localFixtures.supplierOrganizationId,
        ownerType: "SUPPLIER",
        projectId: phaseTwoFixtures.demoProjectId,
        title: "Unauthorized photograph",
        upload: metadata(),
      }),
    ).rejects.toThrow("Invalid document association");
    const internalDocument = await documents.create({
      actorUserId: localFixtures.internalAdminUserId,
      associations: [{ entityId: receipt.id, entityType: "GOODS_RECEIPT" }],
      auditOrganizationId: localFixtures.internalOrganizationId,
      category: "RECEIPT_PHOTOGRAPH",
      context,
      description: "Secure receipt photograph association",
      ownerOrganizationId: localFixtures.internalOrganizationId,
      ownerType: "INTERNAL",
      projectId: phaseTwoFixtures.demoProjectId,
      title: "Receiving photograph",
      upload: {
        ...metadata(),
        extension: "png",
        mimeType: "image/png",
        originalFileName: "receipt.png",
      },
    });
    expect(internalDocument.associations).toContainEqual(
      expect.objectContaining({
        entityId: receipt.id,
        entityType: "GOODS_RECEIPT",
      }),
    );
  });
});
