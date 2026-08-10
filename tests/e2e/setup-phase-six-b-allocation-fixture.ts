import { randomUUID } from "node:crypto";
import type { ServiceEnvironment } from "../../packages/config/src/index.js";

type PostedInspectionFixture =
  typeof import("../../apps/api/src/inspections/inspection-test-fixture.js").postedInspectionFixture;
type DatabaseModule = typeof import("../../packages/database/src/index.js");

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://mecoflow_local:local_only_change_me@127.0.0.1:5432/mecoflow?schema=public";

async function main() {
  const { createDatabaseClient, disconnectDatabaseClient, localFixtures } =
    (await import("../../packages/database/dist/src/index.js")) as unknown as DatabaseModule;
  const { postedInspectionFixture } =
    (await import("../../apps/api/dist/inspections/inspection-test-fixture.js")) as unknown as {
      postedInspectionFixture: PostedInspectionFixture;
    };
  const database = createDatabaseClient(databaseUrl);
  const context = { correlationId: randomUUID(), requestId: randomUUID() };
  const environment = { DATABASE_URL: databaseUrl } as ServiceEnvironment;
  try {
    const fixture = await postedInspectionFixture({
      bomStatus: "RELEASED",
      context,
      database,
      definitions: [
        { checkType: "CHECKLIST", code: `E2E-ALLOC-${randomUUID()}` },
      ],
      environment,
    });
    const recorded = await fixture.inspections.saveResults({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        {
          checkId: fixture.inspection.checks[0]!.id,
          checklistPassed: true,
        },
      ],
    });
    await fixture.inspections.finalize({
      acceptedQuantity: "5",
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      conditionalAuthorized: false,
      context,
      disposition: "ACCEPTED",
      expectedVersion: recorded!.version,
      inspectionId: fixture.inspection.id,
      reason: "Accepted browser allocation fixture after conforming inspection",
      rejectedQuantity: "0",
    });
    process.stdout.write(
      JSON.stringify({
        bomLineId: fixture.bom.revisions[0]!.lines[0]!.id,
        itemCode: fixture.item.code,
        lotId: fixture.lot.id,
        lotNumber: fixture.lot.lotNumber,
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
