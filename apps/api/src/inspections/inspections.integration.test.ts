import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  parseServiceEnvironment,
  type ServiceEnvironment,
} from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import { postedInspectionFixture } from "./inspection-test-fixture.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 6A receiving inspection workflow", () => {
  let database: PrismaClient;
  let environment: ServiceEnvironment;
  const context = { correlationId: randomUUID(), requestId: randomUUID() };

  beforeAll(() => {
    database = createDatabaseClient(databaseUrl!);
    environment = parseServiceEnvironment(process.env) as ServiceEnvironment;
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  const actor = {
    actorUserId: localFixtures.internalAdminUserId,
    auditOrganizationId: localFixtures.internalOrganizationId,
    context,
  };

  it("automatically snapshots configured checks and finalizes lot quantities atomically", async () => {
    const fixture = await postedInspectionFixture({
      context,
      database,
      definitions: [
        { checkType: "CHECKLIST", code: "VISUAL" },
        {
          checkType: "MEASUREMENT",
          code: "THICKNESS",
          decimalPrecision: 2,
          maximumValue: "6.10",
          minimumValue: "5.90",
        },
      ],
      environment,
    });
    expect(fixture.inspection.status).toBe("OPEN");
    expect(fixture.inspection.checks.map(({ code }) => code).sort()).toEqual([
      "THICKNESS",
      "VISUAL",
    ]);
    const visualDefinition = (
      await fixture.inspections.listDefinitions(fixture.item.id)
    ).find(({ code }) => code === "VISUAL")!;
    const deactivated = await fixture.inspections.updateDefinition({
      ...actor,
      active: false,
      checkType: "CHECKLIST",
      code: visualDefinition.code,
      definitionId: visualDefinition.id,
      description: "Updated after the inspection snapshot was created",
      expectedVersion: visualDefinition.version,
      name: visualDefinition.name,
      required: true,
    });
    expect(deactivated.active).toBe(false);
    expect(
      await database.receivingInspectionCheck.findFirstOrThrow({
        where: { code: "VISUAL", receivingInspectionId: fixture.inspection.id },
      }),
    ).toMatchObject({
      description: "",
      required: true,
    });
    await expect(
      fixture.inspections.updateDefinition({
        ...actor,
        active: true,
        checkType: "CHECKLIST",
        code: visualDefinition.code,
        definitionId: visualDefinition.id,
        expectedVersion: visualDefinition.version,
        name: visualDefinition.name,
        required: true,
      }),
    ).rejects.toThrow("Concurrent modification");
    const visual = fixture.inspection.checks.find(
      ({ code }) => code === "VISUAL",
    )!;
    const thickness = fixture.inspection.checks.find(
      ({ code }) => code === "THICKNESS",
    )!;
    const recorded = await fixture.inspections.saveResults({
      ...actor,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        { checkId: visual.id, checklistPassed: true },
        { checkId: thickness.id, measuredValue: "6.00" },
      ],
    });
    const finalized = await fixture.inspections.finalize({
      ...actor,
      acceptedQuantity: "4",
      conditionalAuthorized: false,
      disposition: "ACCEPTED",
      expectedVersion: recorded!.version,
      inspectionId: fixture.inspection.id,
      reason: "Four units accepted and one unit rejected after inspection",
      rejectedQuantity: "1",
    });
    expect(finalized!.status).toBe("FINALIZED");
    expect(finalized!.acceptedQuantity).toBe("4");
    expect(finalized!.rejectedQuantity).toBe("1");
    expect(finalized!.quarantinedQuantity).toBe("0");
    const lot = await database.inventoryLot.findUniqueOrThrow({
      where: { id: fixture.lot.id },
    });
    expect(lot.status).toBe("ACCEPTED");
    expect(lot.acceptedQuantity.toString()).toBe("4");
    expect(lot.rejectedQuantity.toString()).toBe("1");
    expect(
      await database.auditEvent.count({
        where: {
          action: "RECEIVING_INSPECTION_FINALIZED",
          entityId: fixture.inspection.id,
        },
      }),
    ).toBe(1);
    const lateCorrection = await fixture.receiving.createCorrection({
      ...actor,
      correctsReceiptId: fixture.receipt.id,
      lines: [
        {
          goodsReceiptLineId: fixture.receipt.lines[0]!.id,
          quantityDelta: "-1",
        },
      ],
      reason: "Late correction must not alter dispositioned inventory",
      receivedAt: new Date().toISOString(),
      warehouseLocation: "Inspection test dock",
    });
    await expect(
      fixture.receiving.postReceipt({
        ...actor,
        expectedVersion: lateCorrection.version,
        goodsReceiptId: lateCorrection.id,
        idempotencyKey: `late-${randomUUID()}`,
        requestHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
      }),
    ).rejects.toThrow("cannot be corrected");
    expect(
      await database.goodsReceipt.findUniqueOrThrow({
        where: { id: lateCorrection.id },
      }),
    ).toMatchObject({ status: "DRAFT" });
  });

  it("creates an inspection explicitly for a pre-existing awaiting lot", async () => {
    const fixture = await postedInspectionFixture({
      configureAfterPosting: true,
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: "EXPLICIT" }],
      environment,
    });
    expect(fixture.inspection.status).toBe("OPEN");
    expect(fixture.inspection.checks[0]!.code).toBe("EXPLICIT");
    expect(
      await database.auditEvent.count({
        where: {
          action: "RECEIVING_INSPECTION_CREATED",
          entityId: fixture.inspection.id,
        },
      }),
    ).toBe(1);
  });

  it("finalizes against the corrected effective received quantity", async () => {
    const fixture = await postedInspectionFixture({
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: "CORRECTED" }],
      environment,
      receivedQuantity: "4",
    });
    const correction = await fixture.receiving.createCorrection({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      correctsReceiptId: fixture.receipt.id,
      lines: [
        {
          goodsReceiptLineId: fixture.receipt.lines[0]!.id,
          quantityDelta: "1",
        },
      ],
      reason: "One additional received unit confirmed before inspection",
      receivedAt: new Date().toISOString(),
      warehouseLocation: "Inspection test dock",
    });
    await fixture.receiving.postReceipt({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: correction.version,
      goodsReceiptId: correction.id,
      idempotencyKey: `correction-${randomUUID()}`,
      requestHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
    });
    const recorded = await fixture.inspections.saveResults({
      ...actor,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        {
          checkId: fixture.inspection.checks[0]!.id,
          checklistPassed: true,
        },
      ],
    });
    const finalized = await fixture.inspections.finalize({
      ...actor,
      acceptedQuantity: "5",
      conditionalAuthorized: false,
      disposition: "ACCEPTED",
      expectedVersion: recorded!.version,
      inspectionId: fixture.inspection.id,
      reason: "Corrected received quantity inspected and accepted",
      rejectedQuantity: "0",
    });
    expect(finalized!.finalizedReceivedQuantity).toBe("5");
    expect(finalized!.inventoryLot.effectiveQuantity).toBe("5");
  });

  it("rolls back disposition and lot changes when audit persistence fails", async () => {
    const fixture = await postedInspectionFixture({
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: "ROLLBACK" }],
      environment,
    });
    const recorded = await fixture.inspections.saveResults({
      ...actor,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        { checkId: fixture.inspection.checks[0]!.id, checklistPassed: true },
      ],
    });
    await expect(
      fixture.inspections.finalize({
        ...actor,
        acceptedQuantity: "5",
        conditionalAuthorized: false,
        context: { correlationId: "x".repeat(200), requestId: "x".repeat(200) },
        disposition: "ACCEPTED",
        expectedVersion: recorded!.version,
        inspectionId: fixture.inspection.id,
        reason: "Audit failure must roll back every material effect",
        rejectedQuantity: "0",
      }),
    ).rejects.toThrow();
    const [inspection, lot] = await Promise.all([
      database.receivingInspection.findUniqueOrThrow({
        where: { id: fixture.inspection.id },
      }),
      database.inventoryLot.findUniqueOrThrow({
        where: { id: fixture.lot.id },
      }),
    ]);
    expect(inspection.status).toBe("OPEN");
    expect(inspection.version).toBe(recorded!.version);
    expect(lot.status).toBe("AWAITING_INSPECTION");
    expect(lot.acceptedQuantity.toString()).toBe("0");
  });

  it("allows exactly one of two inspectors to finalize the same version", async () => {
    const fixture = await postedInspectionFixture({
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: "CONCURRENT" }],
      environment,
    });
    const recorded = await fixture.inspections.saveResults({
      ...actor,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        { checkId: fixture.inspection.checks[0]!.id, checklistPassed: true },
      ],
    });
    const command = () =>
      fixture.inspections.finalize({
        ...actor,
        acceptedQuantity: "5",
        conditionalAuthorized: false,
        disposition: "ACCEPTED",
        expectedVersion: recorded!.version,
        inspectionId: fixture.inspection.id,
        reason: "Concurrent finalization test disposition",
        rejectedQuantity: "0",
      });
    const outcomes = await Promise.allSettled([command(), command()]);
    expect(
      outcomes.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(outcomes.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    expect(
      await database.auditEvent.count({
        where: {
          action: "RECEIVING_INSPECTION_FINALIZED",
          entityId: fixture.inspection.id,
        },
      }),
    ).toBe(1);
  });

  it("serializes correction posting against inspection finalization", async () => {
    const fixture = await postedInspectionFixture({
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: "CORRECTION-RACE" }],
      environment,
    });
    const recorded = await fixture.inspections.saveResults({
      ...actor,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        { checkId: fixture.inspection.checks[0]!.id, checklistPassed: true },
      ],
    });
    const correction = await fixture.receiving.createCorrection({
      ...actor,
      correctsReceiptId: fixture.receipt.id,
      lines: [
        {
          goodsReceiptLineId: fixture.receipt.lines[0]!.id,
          quantityDelta: "-1",
        },
      ],
      reason: "Concurrent correction and inspection finalization test",
      receivedAt: new Date().toISOString(),
      warehouseLocation: "Inspection test dock",
    });
    const outcomes = await Promise.allSettled([
      fixture.inspections.finalize({
        ...actor,
        acceptedQuantity: "5",
        conditionalAuthorized: false,
        disposition: "ACCEPTED",
        expectedVersion: recorded!.version,
        inspectionId: fixture.inspection.id,
        reason: "Concurrent correction serialization test",
        rejectedQuantity: "0",
      }),
      fixture.receiving.postReceipt({
        ...actor,
        expectedVersion: correction.version,
        goodsReceiptId: correction.id,
        idempotencyKey: `correction-race-${randomUUID()}`,
        requestHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
      }),
    ]);
    expect(
      outcomes.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(outcomes.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    const [inspection, lot, persistedCorrection, adjustments] =
      await Promise.all([
        database.receivingInspection.findUniqueOrThrow({
          where: { id: fixture.inspection.id },
        }),
        database.inventoryLot.findUniqueOrThrow({
          where: { id: fixture.lot.id },
        }),
        database.goodsReceipt.findUniqueOrThrow({
          where: { id: correction.id },
        }),
        database.inventoryLotAdjustment.aggregate({
          _sum: { quantityDelta: true },
          where: { inventoryLotId: fixture.lot.id },
        }),
      ]);
    const effectiveQuantity = lot.quantity.plus(
      adjustments._sum.quantityDelta ?? 0,
    );
    if (inspection.status === "FINALIZED") {
      expect(persistedCorrection.status).toBe("DRAFT");
      expect(lot.status).toBe("ACCEPTED");
      expect(
        lot.acceptedQuantity
          .plus(lot.rejectedQuantity)
          .plus(lot.quarantinedQuantity)
          .eq(effectiveQuantity),
      ).toBe(true);
    } else {
      expect(persistedCorrection.status).toBe("POSTED");
      expect(lot.status).toBe("AWAITING_INSPECTION");
      expect(effectiveQuantity.toString()).toBe("4");
    }
  });

  it.each([
    {
      acceptedQuantity: "2",
      disposition: "QUARANTINED" as const,
      expectedQuarantinedQuantity: "2",
      rejectedQuantity: "1",
    },
    {
      acceptedQuantity: "0",
      disposition: "REJECTED" as const,
      expectedQuarantinedQuantity: "0",
      rejectedQuantity: "5",
    },
  ])(
    "finalizes a $disposition disposition with exact lot buckets",
    async ({
      acceptedQuantity,
      disposition,
      expectedQuarantinedQuantity,
      rejectedQuantity,
    }) => {
      const fixture = await postedInspectionFixture({
        context,
        database,
        definitions: [{ checkType: "CHECKLIST", code: disposition }],
        environment,
      });
      const recorded = await fixture.inspections.saveResults({
        ...actor,
        expectedVersion: fixture.inspection.version,
        inspectionId: fixture.inspection.id,
        results: [
          {
            checkId: fixture.inspection.checks[0]!.id,
            checklistPassed: false,
          },
        ],
      });
      await expect(
        fixture.inspections.finalize({
          ...actor,
          acceptedQuantity: "5",
          conditionalAuthorized: false,
          disposition: "ACCEPTED",
          expectedVersion: recorded!.version,
          inspectionId: fixture.inspection.id,
          reason: "Ordinary acceptance must reject nonconforming checks",
          rejectedQuantity: "0",
        }),
      ).rejects.toThrow("Nonconforming required checks");
      const finalized = await fixture.inspections.finalize({
        ...actor,
        acceptedQuantity,
        conditionalAuthorized: false,
        disposition,
        expectedVersion: recorded!.version,
        inspectionId: fixture.inspection.id,
        reason: `Verified ${disposition.toLowerCase()} disposition`,
        rejectedQuantity,
      });
      expect(finalized!.inventoryLot).toMatchObject({
        acceptedQuantity,
        quarantinedQuantity: expectedQuarantinedQuantity,
        rejectedQuantity,
        status: disposition,
      });
    },
  );

  async function evidenceDocument(inspectionId: string, approved: boolean) {
    const document = await database.document.create({
      data: {
        associations: {
          create: {
            entityId: inspectionId,
            entityType: "RECEIVING_INSPECTION",
          },
        },
        category: "MATERIAL_CERTIFICATE",
        createdByUserId: localFixtures.internalAdminUserId,
        ownerOrganizationId: localFixtures.internalOrganizationId,
        projectId: phaseTwoFixtures.demoProjectId,
        title: `Inspection certificate ${randomUUID()}`,
        versions: {
          create: {
            byteSize: 12,
            createdByUserId: localFixtures.internalAdminUserId,
            declaredMimeType: "application/pdf",
            extension: "pdf",
            originalFileName: "certificate.pdf",
            sha256: "a".repeat(64),
            storageKey: randomUUID(),
            uploadExpiresAt: new Date(Date.now() + 300_000),
            versionNumber: 1,
          },
        },
      },
      include: { versions: true },
    });
    if (approved) {
      const versionId = document.versions[0]!.id;
      await database.documentVersion.update({
        data: {
          detectedMimeType: "application/pdf",
          scanStatus: "CLEAN",
          scannedAt: new Date(),
          status: "DRAFT",
          uploadedAt: new Date(),
          version: { increment: 1 },
        },
        where: { id: versionId },
      });
      await database.documentVersion.update({
        data: { status: "IN_REVIEW", version: { increment: 1 } },
        where: { id: versionId },
      });
      await database.documentVersion.update({
        data: {
          reviewReason: "Certificate authenticity reviewed",
          reviewedAt: new Date(),
          reviewedByUserId: localFixtures.internalAdminUserId,
          status: "APPROVED",
          version: { increment: 1 },
        },
        where: { id: versionId },
      });
    }
    return document;
  }

  it("requires approved clean linked evidence for certificate review", async () => {
    const fixture = await postedInspectionFixture({
      context,
      database,
      definitions: [{ checkType: "CERTIFICATE", code: "CERT" }],
      environment,
    });
    const pending = await evidenceDocument(fixture.inspection.id, false);
    await expect(
      fixture.inspections.saveResults({
        ...actor,
        expectedVersion: fixture.inspection.version,
        inspectionId: fixture.inspection.id,
        results: [
          {
            certificateDecision: "ACCEPTED",
            checkId: fixture.inspection.checks[0]!.id,
            evidenceDocumentId: pending.id,
          },
        ],
      }),
    ).rejects.toThrow("approved clean");
    const approved = await evidenceDocument(fixture.inspection.id, true);
    const result = await fixture.inspections.saveResults({
      ...actor,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        {
          certificateDecision: "ACCEPTED",
          checkId: fixture.inspection.checks[0]!.id,
          evidenceDocumentId: approved.id,
        },
      ],
    });
    expect(result!.checks[0]!.evidenceDocumentId).toBe(approved.id);
    expect(result!.checks[0]!.conforming).toBe(true);
  });
});
