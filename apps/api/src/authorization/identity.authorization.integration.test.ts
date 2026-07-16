import { randomBytes, createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { INestApplication } from "@nestjs/common";
import { createApplication } from "../bootstrap.js";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 1 authorization integration", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
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
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash,
        userId,
      },
    });
    return {
      csrf,
      headers: { cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}` },
    };
  }

  it("returns /me for an active user with an active membership", async () => {
    const auth = await authenticated(localFixtures.internalAdminUserId);
    const response = await fetch(`${baseUrl}/api/v1/me`, {
      headers: auth.headers,
    });
    expect(response.status).toBe(200);
    expect((await response.json()) as object).toMatchObject({
      shell: "INTERNAL",
    });
  });

  it("denies an inactive user", async () => {
    const auth = await authenticated(localFixtures.inactiveUserId);
    const response = await fetch(`${baseUrl}/api/v1/me`, {
      headers: auth.headers,
    });
    expect(response.status).toBe(403);
  });

  it("denies an inactive membership", async () => {
    const auth = await authenticated(localFixtures.inactiveMembershipUserId);
    const response = await fetch(`${baseUrl}/api/v1/me`, {
      headers: auth.headers,
    });
    expect(response.status).toBe(403);
  });

  it("denies supplier access to internal administration with equivalent safe responses for object IDs", async () => {
    const auth = await authenticated(localFixtures.supplierAdminUserId);
    const paths = [
      `/api/v1/administration/organizations/${localFixtures.internalOrganizationId}/memberships`,
      `/api/v1/administration/organizations/${localFixtures.supplierOrganizationId}/memberships`,
      "/api/v1/administration/organizations/ffffffff-ffff-4fff-8fff-ffffffffffff/memberships",
    ];
    const statuses = await Promise.all(
      paths.map(
        async (path) =>
          (await fetch(`${baseUrl}${path}`, { headers: auth.headers })).status,
      ),
    );
    expect(statuses).toEqual([403, 403, 403]);
  });

  it("denies writes by a read-only role", async () => {
    const auth = await authenticated(localFixtures.internalReadonlyUserId);
    const response = await fetch(
      `${baseUrl}/api/v1/administration/organizations`,
      {
        body: JSON.stringify({
          code: "DENIED",
          name: "Denied organization",
          type: "INTERNAL",
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "POST",
      },
    );
    expect(response.status).toBe(403);
  });

  it("denies unsafe administration requests without the session CSRF proof", async () => {
    const auth = await authenticated(localFixtures.internalAdminUserId);
    const response = await fetch(
      `${baseUrl}/api/v1/administration/organizations`,
      {
        body: JSON.stringify({
          code: "NO-CSRF",
          name: "Rejected organization",
          type: "INTERNAL",
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
        },
        method: "POST",
      },
    );
    expect(response.status).toBe(403);
  });

  it("writes an immutable audit event in the same role-change operation", async () => {
    const auth = await authenticated(localFixtures.internalAdminUserId);
    const membership = await database.membership.findUniqueOrThrow({
      include: { roles: true },
      where: {
        userId_organizationId: {
          organizationId: localFixtures.internalOrganizationId,
          userId: localFixtures.internalReadonlyUserId,
        },
      },
    });
    const originalRoles = membership.roles.map(({ roleCode }) => roleCode);
    const changedRoles = originalRoles.includes("MECO_MANAGEMENT")
      ? ["FINANCE_READONLY"]
      : ["MECO_MANAGEMENT"];
    const changeResponse = await fetch(
      `${baseUrl}/api/v1/administration/organizations/${membership.organizationId}/memberships/${membership.id}/roles`,
      {
        body: JSON.stringify({
          expectedVersion: membership.version,
          roleCodes: changedRoles,
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "PUT",
      },
    );
    expect(changeResponse.status).toBe(200);
    const auditEvent = await database.auditEvent.findFirstOrThrow({
      orderBy: { occurredAt: "desc" },
      where: { action: "MEMBERSHIP_ROLES_CHANGED", entityId: membership.id },
    });
    expect(auditEvent.actorUserId).toBe(localFixtures.internalAdminUserId);
    expect(auditEvent.changes).toMatchObject({
      added: expect.any(Array),
      removed: expect.any(Array),
    });
    await expect(
      database.$executeRaw`UPDATE audit_events SET outcome = 'ALTERED' WHERE id = ${auditEvent.id}::uuid`,
    ).rejects.toThrow(/immutable/i);

    const updated = await database.membership.findUniqueOrThrow({
      where: { id: membership.id },
    });
    const restoreResponse = await fetch(
      `${baseUrl}/api/v1/administration/organizations/${membership.organizationId}/memberships/${membership.id}/roles`,
      {
        body: JSON.stringify({
          expectedVersion: updated.version,
          roleCodes: originalRoles,
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "PUT",
      },
    );
    expect(restoreResponse.status).toBe(200);
  });
});
