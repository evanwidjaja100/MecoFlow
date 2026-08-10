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
  const projectCode = `NOTIFY-${unique.slice(0, 8).toUpperCase()}`;
  const notificationMessage = `${projectCode} readiness changed to AMBER at 72.00%.`;
  try {
    await database.$transaction(async (transaction) => {
      const membership = await transaction.membership.findUniqueOrThrow({
        where: {
          userId_organizationId: {
            organizationId: localFixtures.internalOrganizationId,
            userId: localFixtures.mockInternalAdminUserId,
          },
        },
      });
      await transaction.project.create({
        data: {
          code: projectCode,
          createdByUserId: localFixtures.mockInternalAdminUserId,
          id: projectId,
          name: `Browser notifications ${unique.slice(0, 8)}`,
          organizationId: localFixtures.internalOrganizationId,
          plannedEndDate: new Date("2026-12-31T00:00:00.000Z"),
          plannedStartDate: new Date("2026-09-01T00:00:00.000Z"),
          productCategoryId: phaseTwoFixtures.demoCategoryId,
        },
      });
      await transaction.projectMember.create({
        data: {
          addedByUserId: localFixtures.mockInternalAdminUserId,
          membershipId: membership.id,
          projectId,
          role: "PROJECT_MANAGER",
        },
      });
      const event = await transaction.outboxEvent.create({
        data: {
          aggregateId: randomUUID(),
          aggregateType: "ReadinessSnapshot",
          eventType: "READINESS_ALERT_REQUESTED",
          payload: { projectId },
          processedAt: new Date(),
          status: "PROCESSED",
        },
      });
      await transaction.notification.create({
        data: {
          actionUrl: `/internal/projects/${projectId}/readiness`,
          message: notificationMessage,
          projectId,
          sourceOutboxEventId: event.id,
          title: "Readiness status update",
          type: "READINESS_ALERT",
          userId: localFixtures.mockInternalAdminUserId,
        },
      });
    });
    process.stdout.write(JSON.stringify({ notificationMessage, projectCode }));
  } finally {
    await disconnectDatabaseClient();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
