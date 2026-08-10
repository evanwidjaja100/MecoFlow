import { randomInt, randomUUID } from "node:crypto";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseThreeAFixtures,
  phaseTwoFixtures,
} from "@mecoflow/database";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://mecoflow_local:local_only_change_me@127.0.0.1:5432/mecoflow?schema=public";

async function main() {
  const database = createDatabaseClient(databaseUrl);
  try {
    const unique = randomUUID();
    const sequence = randomInt(1, 2_147_483_647);
    const requiredDate = new Date("2026-08-31T00:00:00.000Z");
    await database.inspectionCheckDefinition.upsert({
      create: {
        checkType: "CHECKLIST",
        code: "E2E-VISUAL-CONDITION",
        createdByUserId: localFixtures.internalAdminUserId,
        description: "Verify received material has no visible transit damage",
        itemId: phaseThreeAFixtures.demoItemId,
        name: "Visual condition",
        required: true,
      },
      update: {
        active: true,
        checkType: "CHECKLIST",
        description: "Verify received material has no visible transit damage",
        name: "Visual condition",
        required: true,
      },
      where: {
        itemId_code: {
          code: "E2E-VISUAL-CONDITION",
          itemId: phaseThreeAFixtures.demoItemId,
        },
      },
    });
    const workPackage = await database.workPackage.create({
      data: {
        code: `E2E-${unique.slice(0, 8)}`,
        description: "Tablet receiving browser fixture",
        name: `Receiving fixture ${unique}`,
        plannedEndDate: requiredDate,
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
                quantity: "3",
                unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
              },
            },
            revisionNumber: 1,
            status: "DRAFT",
            title: `Tablet receiving BOM ${unique}`,
          },
        },
      },
      include: { revisions: { include: { lines: true } } },
    });
    const requisition = await database.purchaseRequisition.create({
      data: {
        approvedAt: new Date(),
        approverUserId: localFixtures.internalAdminUserId,
        projectId: phaseTwoFixtures.demoProjectId,
        requesterUserId: localFixtures.internalAdminUserId,
        requisitionNumber: sequence,
        status: "APPROVED",
        title: `Tablet receiving requisition ${unique}`,
        lines: {
          create: {
            bomLineId: bom.revisions[0]!.lines[0]!.id,
            coveredQuantitySnapshot: "0",
            lineNumber: 1,
            outstandingQuantitySnapshot: "3",
            quantity: "3",
            requiredQuantitySnapshot: "3",
          },
        },
      },
      include: { lines: true },
    });
    const title = `Tablet receiving order ${unique}`;
    const order = await database.purchaseOrder.create({
      data: {
        acknowledgedAt: new Date(),
        createdByUserId: localFixtures.internalAdminUserId,
        projectId: phaseTwoFixtures.demoProjectId,
        purchaseOrderNumber: sequence,
        revisions: {
          create: {
            createdByUserId: localFixtures.internalAdminUserId,
            lines: {
              create: {
                itemId: phaseThreeAFixtures.demoItemId,
                lineNumber: 1,
                orderedQuantity: "3",
                unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
              },
            },
            revisionNumber: 1,
            revisionReason: "Tablet receiving browser fixture",
            sentAt: new Date(),
            title,
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
        approvedQuantitySnapshot: "3",
        availableQuantitySnapshot: "3",
        purchaseOrderLineId: order.revisions[0]!.lines[0]!.id,
        purchaseRequisitionLineId: requisition.lines[0]!.id,
        quantity: "3",
        requiredDateSnapshot: requiredDate,
      },
    });
    process.stdout.write(
      JSON.stringify({
        bomLineId: bom.revisions[0]!.lines[0]!.id,
        bomRevisionId: bom.revisions[0]!.id,
        orderId: order.id,
        projectId: phaseTwoFixtures.demoProjectId,
        title,
        unique,
      }),
    );
  } finally {
    await disconnectDatabaseClient();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
