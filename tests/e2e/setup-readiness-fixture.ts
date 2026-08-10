import { randomUUID } from "node:crypto";

type DatabaseModule = typeof import("../../packages/database/src/index.js");

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://mecoflow_local:local_only_change_me@127.0.0.1:5432/mecoflow?schema=public";

async function main() {
  const {
    createDatabaseClient,
    disconnectDatabaseClient,
    localFixtures,
    phaseTwoFixtures,
  } =
    (await import("../../packages/database/dist/src/index.js")) as unknown as DatabaseModule;
  const database = createDatabaseClient(databaseUrl);
  const unique = randomUUID();
  const projectId = randomUUID();
  const workPackageId = randomUUID();
  const lineId = randomUUID();
  const oldBatchId = randomUUID();
  const batchId = randomUUID();
  const projectCode = `READY-${unique.slice(0, 8).toUpperCase()}`;
  const projectName = `Browser readiness ${unique.slice(0, 8)}`;
  const itemCode = `RISK-${unique.slice(0, 8).toUpperCase()}`;
  try {
    await database.$transaction(async (transaction) => {
      await transaction.project.create({
        data: {
          code: projectCode,
          createdByUserId: localFixtures.internalAdminUserId,
          id: projectId,
          name: projectName,
          organizationId: localFixtures.internalOrganizationId,
          plannedEndDate: new Date("2026-12-31T00:00:00.000Z"),
          plannedStartDate: new Date("2026-09-01T00:00:00.000Z"),
          productCategoryId: phaseTwoFixtures.demoCategoryId,
        },
      });
      await transaction.workPackage.create({
        data: {
          code: "WP-READY",
          id: workPackageId,
          name: "Browser fabrication package",
          plannedEndDate: new Date("2026-11-30T00:00:00.000Z"),
          plannedStartDate: new Date("2026-09-15T00:00:00.000Z"),
          projectId,
        },
      });
      await transaction.outboxEvent.updateMany({
        data: { processedAt: new Date(), status: "PROCESSED" },
        where: {
          aggregateId: projectId,
          eventType: "READINESS_RECALCULATION_REQUESTED",
          status: "PENDING",
        },
      });

      const blockers = [
        {
          bomLineId: lineId,
          code: "ALLOCATION_SHORTFALL",
          explanation: `${itemCode} has two units not yet allocated.`,
        },
      ];
      const actions = [
        {
          action:
            "Allocate accepted material before the fabrication start date.",
          bomLineId: lineId,
          code: "ALLOCATE_ACCEPTED_MATERIAL",
        },
      ];
      const lines = [
        {
          acceptedQuantity: "8",
          allocatedQuantity: "8",
          blockerReason: "ALLOCATION_SHORTFALL",
          bomLineId: lineId,
          certificateCompleteQuantity: "8",
          certificateRequired: true,
          confirmedQuantity: "10",
          criticality: "HIGH",
          currentStage: "ALLOCATED",
          itemCode,
          itemName: "Browser readiness plate",
          lineNumber: 1,
          openNcrCount: 0,
          operativeCommitmentDate: "2026-09-10",
          orderedQuantity: "10",
          receivedQuantity: "8",
          requiredDate: "2026-09-15",
          requiredQuantity: "10",
          requisitionedQuantity: "10",
          shippedQuantity: "8",
          shortage: "2",
          unitCode: "EA",
          unitSymbol: "ea",
          workPackageCode: "WP-READY",
          workPackageId,
          workPackageName: "Browser fabrication package",
        },
      ];
      const common = {
        blockerCount: 1,
        blockers,
        calculationDate: new Date("2026-07-22T00:00:00.000Z"),
        calculatorVersion: "readiness-calculator-v1",
        criticalLineCount: 0,
        inputHash: "a".repeat(64),
        inputs: {
          calculationDate: "2026-07-22",
          lines,
          scopeId: projectId,
          scopeType: "PROJECT",
          unresolvedProjectNcrCount: 0,
        },
        lineCount: 1,
        materialProjectionVersion: "material-requirement-status-v1",
        projectId,
        readyCriticalLineCount: 0,
        reasonCodes: ["SHORTAGE_DUE_SOON"],
        recommendedActions: actions,
        ruleVersion: "readiness-rules-v1",
        scopeKey: "PROJECT",
        scopeType: "PROJECT" as const,
        status: "AMBER" as const,
        trigger: "EVENT",
      };
      await transaction.readinessSnapshot.create({
        data: {
          ...common,
          batchId: oldBatchId,
          calculatedAt: new Date("2026-07-21T10:00:00.000Z"),
          explanation: {
            lineExplanations: [],
            summary: "AMBER readiness at 72.00%; earlier retained calculation.",
          },
          inputHash: "b".repeat(64),
          score: 72,
        },
      });
      await transaction.readinessSnapshot.create({
        data: {
          ...common,
          batchId,
          calculatedAt: new Date("2026-07-22T10:00:00.000Z"),
          explanation: {
            lineExplanations: [
              {
                blockerCodes: ["ALLOCATION_SHORTFALL"],
                bomLineId: lineId,
                criticality: "HIGH",
                currentStage: "ALLOCATED",
                itemCode,
                lineNumber: 1,
                reasonCodes: ["SHORTAGE_DUE_SOON"],
                stageScore: 95,
                weightedPoints: 380,
              },
            ],
            summary:
              "AMBER readiness at 88.00%; one explained allocation blocker.",
          },
          score: 88,
        },
      });
      await transaction.readinessSnapshot.create({
        data: {
          ...common,
          batchId,
          calculatedAt: new Date("2026-07-22T10:00:00.000Z"),
          explanation: {
            lineExplanations: [],
            summary:
              "AMBER work-package readiness at 88.00%; one explained allocation blocker.",
          },
          inputHash: "c".repeat(64),
          inputs: {
            calculationDate: "2026-07-22",
            lines,
            scopeId: workPackageId,
            scopeType: "WORK_PACKAGE",
            unresolvedProjectNcrCount: 0,
          },
          scopeKey: `WORK_PACKAGE:${workPackageId}`,
          scopeType: "WORK_PACKAGE",
          score: 88,
          workPackageId,
        },
      });
    });
    process.stdout.write(
      JSON.stringify({ itemCode, projectCode, projectId, projectName }),
    );
  } finally {
    await disconnectDatabaseClient();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
