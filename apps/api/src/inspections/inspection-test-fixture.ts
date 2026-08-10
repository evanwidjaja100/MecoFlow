import { createHash, randomUUID } from "node:crypto";
import type { ServiceEnvironment } from "@mecoflow/config";
import {
  localFixtures,
  phaseThreeAFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { RequestContext } from "../identity/identity.types.js";
import { BomsRepository } from "../boms/boms.repository.js";
import { ReceivingRepository } from "../receiving/receiving.repository.js";
import { InspectionsRepository } from "./inspections.repository.js";

export interface FixtureDefinition {
  checkType: "CERTIFICATE" | "CHECKLIST" | "MEASUREMENT";
  code: string;
  decimalPrecision?: number;
  maximumValue?: string;
  minimumValue?: string;
}

export async function postedInspectionFixture(input: {
  context: RequestContext;
  configureAfterPosting?: boolean;
  bomStatus?: "DRAFT" | "RELEASED";
  database: PrismaClient;
  definitions: FixtureDefinition[];
  environment: ServiceEnvironment;
  receivedQuantity?: string;
}) {
  const { context, database, definitions, environment } = input;
  const receiving = new ReceivingRepository(environment);
  const inspections = new InspectionsRepository(environment);
  const unique = randomUUID();
  const number = Math.floor(Math.random() * 1_000_000_000) + 30_000;
  const item = await database.item.create({
    data: {
      code: `INSPECT-${unique.slice(0, 8).toUpperCase()}`,
      createdByUserId: localFixtures.internalAdminUserId,
      description: "Phase 6A receiving inspection fixture",
      itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
      name: `Inspection material ${unique}`,
      unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
    },
  });
  const configureDefinitions = async () => {
    for (const definition of definitions)
      await inspections.createDefinition({
        actorUserId: localFixtures.internalAdminUserId,
        auditOrganizationId: localFixtures.internalOrganizationId,
        checkType: definition.checkType,
        code: definition.code,
        context,
        itemId: item.id,
        name: `${definition.code} fixture check`,
        required: true,
        ...(definition.decimalPrecision === undefined
          ? {}
          : { decimalPrecision: definition.decimalPrecision }),
        ...(definition.maximumValue === undefined
          ? {}
          : { maximumValue: definition.maximumValue }),
        ...(definition.minimumValue === undefined
          ? {}
          : { minimumValue: definition.minimumValue }),
      });
  };
  if (!input.configureAfterPosting) await configureDefinitions();
  const workPackage = await database.workPackage.create({
    data: {
      code: `I6A-${unique.slice(0, 8)}`,
      name: `Inspection requirement ${number}`,
      plannedEndDate: new Date("2026-08-31T00:00:00.000Z"),
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
            create: {
              itemId: item.id,
              lineNumber: 1,
              quantity: "5",
              unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
            },
          },
          revisionNumber: 1,
          status: "DRAFT",
          title: `Inspection BOM ${number}`,
        },
      },
      workPackageId: workPackage.id,
    },
    include: { revisions: { include: { lines: true } } },
  });
  if (input.bomStatus === "RELEASED") {
    const boms = new BomsRepository(environment);
    const reviewed = await boms.review({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: bom.revisions[0]!.version,
      reason: "Review Phase 6B allocation fixture requirement",
      revisionId: bom.revisions[0]!.id,
    });
    await boms.release({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: reviewed.version,
      reason: "Release Phase 6B allocation fixture requirement",
      revisionId: reviewed.id,
    });
  }
  const requisition = await database.purchaseRequisition.create({
    data: {
      approvedAt: new Date(),
      approverUserId: localFixtures.internalAdminUserId,
      lines: {
        create: {
          bomLineId: bom.revisions[0]!.lines[0]!.id,
          coveredQuantitySnapshot: "0",
          lineNumber: 1,
          outstandingQuantitySnapshot: "5",
          quantity: "5",
          requiredQuantitySnapshot: "5",
        },
      },
      projectId: phaseTwoFixtures.demoProjectId,
      requesterUserId: localFixtures.internalAdminUserId,
      requisitionNumber: number,
      status: "APPROVED",
      title: `Inspection requisition ${number}`,
    },
    include: { lines: true },
  });
  const order = await database.purchaseOrder.create({
    data: {
      acknowledgedAt: new Date(),
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
              orderedQuantity: "5",
              unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
            },
          },
          revisionNumber: 1,
          revisionReason: "Phase 6A inspection fixture",
          sentAt: new Date(),
          title: `Inspection PO ${number}`,
        },
      },
      sentAt: new Date(),
      status: "ACKNOWLEDGED",
      supplierOrganizationId: localFixtures.supplierOrganizationId,
    },
    include: { revisions: { include: { lines: true } } },
  });
  await database.purchaseOrderAllocation.create({
    data: {
      alreadyOrderedQuantitySnapshot: "0",
      approvedQuantitySnapshot: "5",
      availableQuantitySnapshot: "5",
      purchaseOrderLineId: order.revisions[0]!.lines[0]!.id,
      purchaseRequisitionLineId: requisition.lines[0]!.id,
      quantity: "5",
      requiredDateSnapshot: new Date("2026-08-31T00:00:00.000Z"),
    },
  });
  const asn = await receiving.createAsn({
    actorUserId: localFixtures.supplierAdminUserId,
    auditOrganizationId: localFixtures.supplierOrganizationId,
    context,
    lines: [
      {
        purchaseOrderLineId: order.revisions[0]!.lines[0]!.id,
        shippedQuantity: "5",
      },
    ],
    purchaseOrderId: order.id,
    supplierOrganizationId: localFixtures.supplierOrganizationId,
    supplierReference: `INSPECT-ASN-${unique.slice(0, 12)}`,
  });
  const submitted = await receiving.transitionAsn({
    actorUserId: localFixtures.supplierAdminUserId,
    advanceShipmentNoticeId: asn.id,
    auditOrganizationId: localFixtures.supplierOrganizationId,
    context,
    expectedVersion: asn.version,
    reason: "Submit inspection fixture shipment",
    targetStatus: "SUBMITTED",
  });
  const dispatched = await receiving.transitionAsn({
    actorUserId: localFixtures.supplierAdminUserId,
    advanceShipmentNoticeId: asn.id,
    auditOrganizationId: localFixtures.supplierOrganizationId,
    context,
    expectedVersion: submitted.version,
    reason: "Dispatch inspection fixture shipment",
    targetStatus: "IN_TRANSIT",
  });
  const arrived = await receiving.transitionAsn({
    actorUserId: localFixtures.internalAdminUserId,
    advanceShipmentNoticeId: asn.id,
    auditOrganizationId: localFixtures.internalOrganizationId,
    context,
    expectedVersion: dispatched.version,
    reason: "Receive inspection fixture shipment",
    targetStatus: "ARRIVED",
  });
  const receipt = await receiving.createReceipt({
    actorUserId: localFixtures.internalAdminUserId,
    advanceShipmentNoticeId: arrived.id,
    auditOrganizationId: localFixtures.internalOrganizationId,
    context,
    lines: [
      {
        advanceShipmentNoticeLineId: arrived.lines[0]!.id,
        batchNumber: `BATCH-${unique.slice(0, 8)}`,
        heatNumber: `HEAT-${unique.slice(0, 8)}`,
        receivedQuantity: input.receivedQuantity ?? "5",
      },
    ],
    projectId: phaseTwoFixtures.demoProjectId,
    receivedAt: new Date().toISOString(),
    warehouseLocation: "Inspection test dock",
  });
  await receiving.postReceipt({
    actorUserId: localFixtures.internalAdminUserId,
    auditOrganizationId: localFixtures.internalOrganizationId,
    context,
    expectedVersion: receipt.version,
    goodsReceiptId: receipt.id,
    idempotencyKey: `inspect-${unique}`,
    requestHash: createHash("sha256")
      .update(`${receipt.id}:${receipt.version}`)
      .digest("hex"),
  });
  const lot = await database.inventoryLot.findUniqueOrThrow({
    where: { goodsReceiptLineId: receipt.lines[0]!.id },
  });
  if (input.configureAfterPosting) {
    await configureDefinitions();
    await inspections.createExplicit({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      inventoryLotId: lot.id,
      projectId: phaseTwoFixtures.demoProjectId,
    });
  }
  const inspection = await database.receivingInspection.findUniqueOrThrow({
    include: { checks: true },
    where: { inventoryLotId: lot.id },
  });
  return { bom, inspection, inspections, item, lot, receipt, receiving };
}
