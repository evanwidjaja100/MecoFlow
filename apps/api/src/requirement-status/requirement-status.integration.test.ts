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
import { AllocationsRepository } from "../allocations/allocations.repository.js";
import { BomsRepository } from "../boms/boms.repository.js";
import { InspectionsRepository } from "../inspections/inspections.repository.js";
import { ReceivingRepository } from "../receiving/receiving.repository.js";
import { RequirementStatusRepository } from "./requirement-status.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 7A material requirement status projection", () => {
  let allocations: AllocationsRepository;
  let boms: BomsRepository;
  let database: PrismaClient;
  let environment: ServiceEnvironment;
  let inspections: InspectionsRepository;
  let projection: RequirementStatusRepository;
  let receiving: ReceivingRepository;
  const context = { correlationId: randomUUID(), requestId: randomUUID() };
  const internalActor = {
    actorUserId: localFixtures.internalAdminUserId,
    auditOrganizationId: localFixtures.internalOrganizationId,
    context,
  };

  beforeAll(() => {
    database = createDatabaseClient(databaseUrl!);
    environment = parseServiceEnvironment(process.env) as ServiceEnvironment;
    allocations = new AllocationsRepository(environment);
    boms = new BomsRepository(environment);
    inspections = new InspectionsRepository(environment);
    projection = new RequirementStatusRepository(environment);
    receiving = new ReceivingRepository(environment);
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  function postInput(receipt: { id: string; version: number }, key: string) {
    return {
      ...internalActor,
      expectedVersion: receipt.version,
      goodsReceiptId: receipt.id,
      idempotencyKey: key,
      requestHash: createHash("sha256")
        .update(`${receipt.id}:${receipt.version}`)
        .digest("hex"),
    };
  }

  it("projects split pooled supply, corrections, quality, allocations, and official revisions without double counting", async () => {
    const unique = randomUUID();
    const number = Math.floor(Math.random() * 500_000_000) + 400_000_000;
    const item = await database.item.create({
      data: {
        code: `P7A-${unique.slice(0, 8).toUpperCase()}`,
        createdByUserId: localFixtures.internalAdminUserId,
        description: "Phase 7A deterministic projection fixture",
        itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
        name: `Projection material ${unique}`,
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
    });
    await inspections.createDefinition({
      ...internalActor,
      checkType: "CHECKLIST",
      code: `P7A-${unique.slice(0, 8)}`,
      itemId: item.id,
      name: "Projection fixture conformity",
      required: true,
    });
    const workPackage = await database.workPackage.create({
      data: {
        code: `P7A-${unique.slice(0, 8)}`,
        name: "Phase 7A pooled projection",
        plannedEndDate: new Date("2026-10-31T00:00:00.000Z"),
        plannedStartDate: new Date("2026-08-01T00:00:00.000Z"),
        projectId: phaseTwoFixtures.demoProjectId,
      },
    });
    const bom = await database.bom.create({
      data: {
        projectId: phaseTwoFixtures.demoProjectId,
        revisions: {
          create: {
            createdByUserId: localFixtures.internalAdminUserId,
            lines: {
              create: [
                {
                  itemId: item.id,
                  lineNumber: 1,
                  quantity: "6",
                  unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
                },
                {
                  itemId: item.id,
                  lineNumber: 2,
                  quantity: "4",
                  unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
                },
              ],
            },
            revisionNumber: 1,
            title: "Pooled projection requirements",
          },
        },
        workPackageId: workPackage.id,
      },
      include: { revisions: { include: { lines: true } } },
    });
    const reviewed = await boms.review({
      ...internalActor,
      expectedVersion: bom.revisions[0]!.version,
      reason: "Review deterministic Phase 7A requirements",
      revisionId: bom.revisions[0]!.id,
    });
    await boms.release({
      ...internalActor,
      expectedVersion: reviewed.version,
      reason: "Release deterministic Phase 7A requirements",
      revisionId: reviewed.id,
    });
    const requirementA = bom.revisions[0]!.lines.find(
      (line) => line.lineNumber === 1,
    );
    const requirementB = bom.revisions[0]!.lines.find(
      (line) => line.lineNumber === 2,
    );

    const supersedeWorkPackage = await database.workPackage.create({
      data: {
        code: `P7S-${unique.slice(0, 8)}`,
        name: "Phase 7A superseded projection fixture",
        plannedEndDate: new Date("2026-11-30T00:00:00.000Z"),
        plannedStartDate: new Date("2026-09-01T00:00:00.000Z"),
        projectId: phaseTwoFixtures.demoProjectId,
      },
    });
    const supersedeBom = await database.bom.create({
      data: {
        projectId: phaseTwoFixtures.demoProjectId,
        revisions: {
          create: {
            createdByUserId: localFixtures.internalAdminUserId,
            lines: {
              create: {
                itemId: item.id,
                lineNumber: 1,
                quantity: "99",
                unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
              },
            },
            revisionNumber: 1,
            title: "Revision that must disappear from projection",
          },
        },
        workPackageId: supersedeWorkPackage.id,
      },
      include: { revisions: { include: { lines: true } } },
    });
    const oldReviewed = await boms.review({
      ...internalActor,
      expectedVersion: supersedeBom.revisions[0]!.version,
      reason: "Review superseded projection revision",
      revisionId: supersedeBom.revisions[0]!.id,
    });
    await boms.release({
      ...internalActor,
      expectedVersion: oldReviewed.version,
      reason: "Release superseded projection revision",
      revisionId: oldReviewed.id,
    });
    const replacement = await database.bomRevision.create({
      data: {
        bomId: supersedeBom.id,
        createdByUserId: localFixtures.internalAdminUserId,
        lines: {
          create: {
            itemId: item.id,
            lineNumber: 1,
            quantity: "2",
            unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
          },
        },
        revisionNumber: 2,
        title: "Current projection revision",
      },
      include: { lines: true },
    });
    const replacementReviewed = await boms.review({
      ...internalActor,
      expectedVersion: replacement.version,
      reason: "Review current projection revision",
      revisionId: replacement.id,
    });
    await boms.release({
      ...internalActor,
      expectedVersion: replacementReviewed.version,
      reason: "Release current projection revision",
      revisionId: replacementReviewed.id,
    });

    const requisition = await database.purchaseRequisition.create({
      data: {
        approvedAt: new Date("2026-07-25T00:00:00.000Z"),
        approverUserId: localFixtures.internalAdminUserId,
        lines: {
          create: [
            {
              bomLineId: requirementA!.id,
              coveredQuantitySnapshot: "0",
              lineNumber: 1,
              outstandingQuantitySnapshot: "6",
              quantity: "6",
              requiredQuantitySnapshot: "6",
            },
            {
              bomLineId: requirementB!.id,
              coveredQuantitySnapshot: "0",
              lineNumber: 2,
              outstandingQuantitySnapshot: "4",
              quantity: "4",
              requiredQuantitySnapshot: "4",
            },
          ],
        },
        projectId: phaseTwoFixtures.demoProjectId,
        requesterUserId: localFixtures.internalAdminUserId,
        requisitionNumber: number,
        status: "APPROVED",
        title: "Phase 7A pooled requirement source",
      },
      include: { lines: true },
    });
    const order = await database.purchaseOrder.create({
      data: {
        acknowledgedAt: new Date("2026-07-27T00:00:00.000Z"),
        createdByUserId: localFixtures.internalAdminUserId,
        projectId: phaseTwoFixtures.demoProjectId,
        purchaseOrderNumber: number,
        revisions: {
          create: {
            createdByUserId: localFixtures.internalAdminUserId,
            lines: {
              create: {
                itemId: item.id,
                lineNumber: 1,
                orderedQuantity: "10",
                unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
              },
            },
            revisionNumber: 1,
            revisionReason: "Phase 7A pooled fixture",
            sentAt: new Date("2026-07-26T00:00:00.000Z"),
            title: "Phase 7A pooled purchase order",
          },
        },
        sentAt: new Date("2026-07-26T00:00:00.000Z"),
        status: "ACKNOWLEDGED",
        supplierOrganizationId: localFixtures.supplierOrganizationId,
      },
      include: { revisions: { include: { lines: true } } },
    });
    const purchaseOrderLine = order.revisions[0]!.lines[0]!;
    const requisitionLineA = requisition.lines.find(
      (line) => line.lineNumber === 1,
    );
    const requisitionLineB = requisition.lines.find(
      (line) => line.lineNumber === 2,
    );
    await database.purchaseOrderAllocation.createMany({
      data: [
        {
          alreadyOrderedQuantitySnapshot: "0",
          approvedQuantitySnapshot: "6",
          availableQuantitySnapshot: "6",
          purchaseOrderLineId: purchaseOrderLine.id,
          purchaseRequisitionLineId: requisitionLineA!.id,
          quantity: "6",
          requiredDateSnapshot: new Date("2026-08-01T00:00:00.000Z"),
        },
        {
          alreadyOrderedQuantitySnapshot: "0",
          approvedQuantitySnapshot: "4",
          availableQuantitySnapshot: "4",
          purchaseOrderLineId: purchaseOrderLine.id,
          purchaseRequisitionLineId: requisitionLineB!.id,
          quantity: "4",
          requiredDateSnapshot: new Date("2026-09-01T00:00:00.000Z"),
        },
      ],
    });
    for (const commitment of [
      { committedDate: "2026-08-15", revisionNumber: 1 },
      { committedDate: "2026-08-20", revisionNumber: 2 },
    ])
      await database.supplierCommitmentRevision.create({
        data: {
          lines: {
            create: {
              committedDate: new Date(
                `${commitment.committedDate}T00:00:00.000Z`,
              ),
              purchaseOrderLineId: purchaseOrderLine.id,
            },
          },
          purchaseOrderRevisionId: order.revisions[0]!.id,
          revisionNumber: commitment.revisionNumber,
          submittedByUserId: localFixtures.supplierAdminUserId,
          supplierOrganizationId: localFixtures.supplierOrganizationId,
        },
      });

    const asn = await receiving.createAsn({
      actorUserId: localFixtures.supplierAdminUserId,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      lines: [
        { purchaseOrderLineId: purchaseOrderLine.id, shippedQuantity: "8" },
      ],
      purchaseOrderId: order.id,
      supplierOrganizationId: localFixtures.supplierOrganizationId,
      supplierReference: `P7A-ASN-${unique.slice(0, 10)}`,
    });
    const submitted = await receiving.transitionAsn({
      actorUserId: localFixtures.supplierAdminUserId,
      advanceShipmentNoticeId: asn.id,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      expectedVersion: asn.version,
      reason: "Submit Phase 7A partial shipment",
      targetStatus: "SUBMITTED",
    });
    const dispatched = await receiving.transitionAsn({
      actorUserId: localFixtures.supplierAdminUserId,
      advanceShipmentNoticeId: asn.id,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      expectedVersion: submitted.version,
      reason: "Dispatch Phase 7A partial shipment",
      targetStatus: "IN_TRANSIT",
    });
    const arrived = await receiving.transitionAsn({
      ...internalActor,
      advanceShipmentNoticeId: asn.id,
      expectedVersion: dispatched.version,
      reason: "Arrive Phase 7A partial shipment",
      targetStatus: "ARRIVED",
    });

    const firstReceipt = await receiving.createReceipt({
      ...internalActor,
      advanceShipmentNoticeId: arrived.id,
      lines: [
        {
          advanceShipmentNoticeLineId: arrived.lines[0]!.id,
          receivedQuantity: "5",
        },
      ],
      projectId: phaseTwoFixtures.demoProjectId,
      receivedAt: "2026-08-01T01:00:00.000Z",
      warehouseLocation: "Phase 7A dock",
    });
    const firstPosted = await receiving.postReceipt(
      postInput(firstReceipt, `p7a-first-${unique}`),
    );
    const correction = await receiving.createCorrection({
      ...internalActor,
      correctsReceiptId: firstPosted.id,
      lines: [
        {
          goodsReceiptLineId: firstPosted.lines[0]!.id,
          quantityDelta: "-1",
        },
      ],
      reason: "Correct Phase 7A fixture after deterministic recount",
      receivedAt: "2026-08-01T02:00:00.000Z",
      warehouseLocation: "Phase 7A dock",
    });
    await receiving.postReceipt(
      postInput(correction, `p7a-correction-${unique}`),
    );
    const secondReceipt = await receiving.createReceipt({
      ...internalActor,
      advanceShipmentNoticeId: arrived.id,
      lines: [
        {
          advanceShipmentNoticeLineId: arrived.lines[0]!.id,
          receivedQuantity: "3",
        },
      ],
      projectId: phaseTwoFixtures.demoProjectId,
      receivedAt: "2026-08-02T01:00:00.000Z",
      warehouseLocation: "Phase 7A dock",
    });
    const secondPosted = await receiving.postReceipt(
      postInput(secondReceipt, `p7a-second-${unique}`),
    );
    const firstLot = await database.inventoryLot.findUniqueOrThrow({
      include: { receivingInspection: { include: { checks: true } } },
      where: { goodsReceiptLineId: firstPosted.lines[0]!.id },
    });
    const secondLot = await database.inventoryLot.findUniqueOrThrow({
      include: { receivingInspection: { include: { checks: true } } },
      where: { goodsReceiptLineId: secondPosted.lines[0]!.id },
    });
    const firstResult = await inspections.saveResults({
      ...internalActor,
      expectedVersion: firstLot.receivingInspection!.version,
      inspectionId: firstLot.receivingInspection!.id,
      results: [
        {
          checkId: firstLot.receivingInspection!.checks[0]!.id,
          checklistPassed: false,
        },
      ],
    });
    await inspections.finalize({
      ...internalActor,
      acceptedQuantity: "2",
      conditionalAuthorized: false,
      disposition: "QUARANTINED",
      expectedVersion: firstResult!.version,
      inspectionId: firstLot.receivingInspection!.id,
      reason: "Retain mixed Phase 7A fixture material in quarantine",
      rejectedQuantity: "1",
    });
    const secondResult = await inspections.saveResults({
      ...internalActor,
      expectedVersion: secondLot.receivingInspection!.version,
      inspectionId: secondLot.receivingInspection!.id,
      results: [
        {
          checkId: secondLot.receivingInspection!.checks[0]!.id,
          checklistPassed: true,
        },
      ],
    });
    await inspections.finalize({
      ...internalActor,
      acceptedQuantity: "3",
      conditionalAuthorized: false,
      disposition: "ACCEPTED",
      expectedVersion: secondResult!.version,
      inspectionId: secondLot.receivingInspection!.id,
      reason: "Accept conforming Phase 7A fixture material",
      rejectedQuantity: "0",
    });

    const releasedAllocation = await allocations.create({
      ...internalActor,
      bomLineId: requirementB!.id,
      conditionalAuthorized: false,
      inventoryLotId: secondLot.id,
      projectId: phaseTwoFixtures.demoProjectId,
      quantity: "1",
    });
    await allocations.transition({
      ...internalActor,
      expectedVersion: releasedAllocation.version,
      id: releasedAllocation.id,
      reason: "Release Phase 7A fixture reservation",
      targetStatus: "RELEASED",
    });
    const consumedAllocation = await allocations.create({
      ...internalActor,
      bomLineId: requirementB!.id,
      conditionalAuthorized: false,
      inventoryLotId: secondLot.id,
      projectId: phaseTwoFixtures.demoProjectId,
      quantity: "2",
    });
    await allocations.transition({
      ...internalActor,
      expectedVersion: consumedAllocation.version,
      id: consumedAllocation.id,
      reason: "Consume Phase 7A fixture reservation",
      targetStatus: "CONSUMED",
    });

    const firstProjection = await projection.projectStatus(
      phaseTwoFixtures.demoProjectId,
    );
    const secondProjection = await projection.projectStatus(
      phaseTwoFixtures.demoProjectId,
    );
    expect(secondProjection).toEqual(firstProjection);
    expect(firstProjection.modelVersion).toBe("material-requirement-status-v1");
    const byId = new Map(
      firstProjection.data.map((line) => [line.bomLineId, line]),
    );
    expect(byId.has(supersedeBom.revisions[0]!.lines[0]!.id)).toBe(false);
    expect(byId.get(replacement.lines[0]!.id)).toMatchObject({
      blockerReason: "REQUISITION_SHORTFALL",
      requiredQuantity: "2",
    });
    expect(byId.get(requirementA!.id)).toMatchObject({
      acceptedQuantity: "4",
      allocatedQuantity: "0",
      blockerReason: "REJECTED_MATERIAL",
      certificateCompleteQuantity: "4",
      confirmedQuantity: "6",
      operativeCommitmentDate: "2026-08-20",
      orderedQuantity: "6",
      receivedQuantity: "6",
      requisitionedQuantity: "6",
      shippedQuantity: "6",
      shortage: "6",
    });
    expect(byId.get(requirementB!.id)).toMatchObject({
      acceptedQuantity: "1",
      allocatedQuantity: "2",
      blockerReason: "SHIPMENT_SHORTFALL",
      certificateCompleteQuantity: "1",
      confirmedQuantity: "4",
      operativeCommitmentDate: "2026-08-20",
      orderedQuantity: "4",
      receivedQuantity: "1",
      requisitionedQuantity: "4",
      shippedQuantity: "2",
      shortage: "2",
    });
    const projected = [requirementA!.id, requirementB!.id].map((id) =>
      byId.get(id)!,
    );
    expect(
      projected.reduce(
        (total, line) => total + Number(line.receivedQuantity),
        0,
      ),
    ).toBe(7);
    expect(
      projected.reduce(
        (total, line) => total + Number(line.acceptedQuantity),
        0,
      ),
    ).toBe(5);
    expect(
      projected.reduce(
        (total, line) => total + Number(line.allocatedQuantity),
        0,
      ),
    ).toBe(2);
  });
});
