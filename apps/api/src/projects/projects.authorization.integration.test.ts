import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { INestApplication } from "@nestjs/common";
import { createApplication } from "../bootstrap.js";

const supplierB = {
  membershipId: "91000000-0000-4000-8000-000000000001",
  organizationId: "92000000-0000-4000-8000-000000000001",
  userId: "93000000-0000-4000-8000-000000000001",
};
const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 2 project authorization", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    await database.organization.upsert({
      create: {
        code: "SUPPLIER-B-AUTH-TEST",
        id: supplierB.organizationId,
        name: "Supplier B authorization fixture",
        type: "SUPPLIER",
      },
      update: { active: true },
      where: { id: supplierB.organizationId },
    });
    await database.userProfile.upsert({
      create: {
        displayName: "Supplier B User",
        email: "supplier-b@example.test",
        id: supplierB.userId,
        issuer: "https://issuer.example.test",
        subject: "supplier-b-project-auth",
      },
      update: { status: "ACTIVE" },
      where: { id: supplierB.userId },
    });
    await database.membership.upsert({
      create: {
        id: supplierB.membershipId,
        organizationId: supplierB.organizationId,
        userId: supplierB.userId,
      },
      update: { status: "ACTIVE" },
      where: { id: supplierB.membershipId },
    });
    await database.membershipRole.upsert({
      create: {
        membershipId: supplierB.membershipId,
        roleCode: "SUPPLIER_USER",
      },
      update: {},
      where: {
        membershipId_roleCode: {
          membershipId: supplierB.membershipId,
          roleCode: "SUPPLIER_USER",
        },
      },
    });
    const supplierAMembership = await database.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.supplierOrganizationId,
          userId: localFixtures.supplierAdminUserId,
        },
      },
    });
    await database.projectMember.upsert({
      create: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: supplierAMembership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "SUPPLIER",
      },
      update: { role: "SUPPLIER", status: "ACTIVE" },
      where: {
        projectId_membershipId: {
          membershipId: supplierAMembership.id,
          projectId: phaseTwoFixtures.demoProjectId,
        },
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

  async function authenticated(userId: string) {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    sessionHashes.push(tokenHash);
    await database.session.create({
      data: {
        csrfTokenHash: hash(csrf),
        expiresAt: new Date(Date.now() + 120_000),
        tokenHash,
        userId,
      },
    });
    return {
      csrf,
      headers: { cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}` },
    };
  }

  it("allows Supplier A only its explicitly shared project and filters employee/history fields", async () => {
    const auth = await authenticated(localFixtures.supplierAdminUserId);
    const response = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}`,
      { headers: auth.headers },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty("members");
    expect(body).not.toHaveProperty("transitions");
  });

  it("returns equivalent safe responses for Supplier B and a nonexistent project", async () => {
    const auth = await authenticated(supplierB.userId);
    const paths = [
      `/api/v1/projects/${phaseTwoFixtures.demoProjectId}`,
      "/api/v1/projects/ffffffff-ffff-4fff-8fff-ffffffffffff",
    ];
    const responses = await Promise.all(
      paths.map((path) =>
        fetch(`${baseUrl}${path}`, { headers: auth.headers }),
      ),
    );
    expect(responses.map(({ status }) => status)).toEqual([404, 404]);
    expect(
      await Promise.all(responses.map((response) => response.json())),
    ).toEqual([
      {
        error: { code: "RESOURCE_NOT_FOUND", message: "Resource not found" },
        requestId: expect.any(String),
      },
      {
        error: { code: "RESOURCE_NOT_FOUND", message: "Resource not found" },
        requestId: expect.any(String),
      },
    ]);
  });

  it("denies project writes by a read-only internal role and enforces CSRF on transition commands", async () => {
    const readonly = await authenticated(localFixtures.internalReadonlyUserId);
    const denied = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/transitions`,
      {
        body: JSON.stringify({
          expectedVersion: 1,
          reason: "Read-only users cannot transition",
          targetState: "PLANNED",
        }),
        headers: {
          ...readonly.headers,
          "content-type": "application/json",
          "x-csrf-token": readonly.csrf,
        },
        method: "POST",
      },
    );
    expect(denied.status).toBe(403);

    const admin = await authenticated(localFixtures.internalAdminUserId);
    const noCsrf = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/transitions`,
      {
        body: JSON.stringify({
          expectedVersion: 1,
          reason: "Missing CSRF proof must be denied",
          targetState: "PLANNED",
        }),
        headers: { ...admin.headers, "content-type": "application/json" },
        method: "POST",
      },
    );
    expect(noCsrf.status).toBe(403);
  });
});
