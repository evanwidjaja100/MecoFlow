import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
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
import { createApplication } from "../bootstrap.js";
import { postedInspectionFixture } from "./inspection-test-fixture.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

interface AuthenticatedRequest {
  cookie: string;
  csrf: string;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 6A receiving inspection authorization", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  let inspectionId: string;
  let inspectionVersion: number;
  let projectManagerUserId: string;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    const environment = parseServiceEnvironment(
      process.env,
    ) as ServiceEnvironment;
    const context = { correlationId: randomUUID(), requestId: randomUUID() };
    const fixture = await postedInspectionFixture({
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: "AUTHORIZATION" }],
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
          checklistPassed: false,
        },
      ],
    });
    inspectionId = fixture.inspection.id;
    inspectionVersion = recorded!.version;

    projectManagerUserId = randomUUID();
    const manager = await database.userProfile.create({
      data: {
        displayName: "Inspection Project Manager",
        email: `inspection-manager-${randomUUID()}@example.test`,
        id: projectManagerUserId,
        issuer: "https://identity.example.test",
        subject: randomUUID(),
      },
    });
    const membership = await database.membership.create({
      data: {
        organizationId: localFixtures.internalOrganizationId,
        roles: { create: { roleCode: "PROJECT_MANAGER" } },
        userId: manager.id,
      },
    });
    await database.projectMember.create({
      data: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: membership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "PROJECT_MANAGER",
      },
    });

    ({ app } = await createApplication());
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    if (sessionHashes.length > 0)
      await database.session.deleteMany({
        where: { tokenHash: { in: sessionHashes } },
      });
    if (app) await app.close();
    await disconnectDatabaseClient();
  });

  async function authenticated(userId: string): Promise<AuthenticatedRequest> {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    sessionHashes.push(tokenHash);
    await database.session.create({
      data: {
        csrfTokenHash: hash(csrf),
        expiresAt: new Date(Date.now() + 10 * 60_000),
        tokenHash,
        userId,
      },
    });
    return {
      cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}`,
      csrf,
    };
  }

  async function finalize(
    id: string,
    auth: AuthenticatedRequest,
    includeCsrf = true,
  ) {
    return fetch(`${baseUrl}/api/v1/receiving-inspections/${id}/finalize`, {
      body: JSON.stringify({
        acceptedQuantity: "5",
        disposition: "CONDITIONALLY_ACCEPTED",
        expectedVersion: inspectionVersion,
        reason: "Conditionally accepted under explicit QA authority",
        rejectedQuantity: "0",
      }),
      headers: {
        cookie: auth.cookie,
        "content-type": "application/json",
        ...(includeCsrf ? { "x-csrf-token": auth.csrf } : {}),
      },
      method: "POST",
    });
  }

  it("denies supplier inspection disclosure before real or missing object resolution", async () => {
    const supplier = await authenticated(localFixtures.supplierAdminUserId);
    const real = await fetch(
      `${baseUrl}/api/v1/receiving-inspections/${inspectionId}`,
      { headers: { cookie: supplier.cookie } },
    );
    const missing = await fetch(
      `${baseUrl}/api/v1/receiving-inspections/${randomUUID()}`,
      { headers: { cookie: supplier.cookie } },
    );
    expect(real.status).toBe(403);
    expect(missing.status).toBe(403);
  });

  it("requires the independent conditional-accept permission before object disclosure", async () => {
    const manager = await authenticated(projectManagerUserId);
    const real = await finalize(inspectionId, manager);
    const missing = await finalize(randomUUID(), manager);
    expect(real.status).toBe(403);
    expect(missing.status).toBe(403);
    expect(
      await database.receivingInspection.findUniqueOrThrow({
        where: { id: inspectionId },
      }),
    ).toMatchObject({ status: "OPEN", version: inspectionVersion });
  });

  it("requires CSRF and records authorized conditional acceptance", async () => {
    const administrator = await authenticated(
      localFixtures.internalAdminUserId,
    );
    expect((await finalize(inspectionId, administrator, false)).status).toBe(
      403,
    );
    const accepted = await finalize(inspectionId, administrator);
    expect(accepted.status).toBe(201);
    const body = (await accepted.json()) as {
      conditionalAcceptanceAuthorizedBy: { id: string };
      disposition: string;
    };
    expect(body.disposition).toBe("CONDITIONALLY_ACCEPTED");
    expect(body.conditionalAcceptanceAuthorizedBy.id).toBe(
      localFixtures.internalAdminUserId,
    );
    expect(
      await database.auditEvent.count({
        where: {
          action: "RECEIVING_INSPECTION_CONDITIONAL_ACCEPTANCE_AUTHORIZED",
          entityId: inspectionId,
        },
      }),
    ).toBe(1);
  });
});
