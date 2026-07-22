import { createHash, randomBytes, randomUUID } from "node:crypto";
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

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

const supplierB = {
  membershipId: "95000000-0000-4000-8000-000000000003",
  organizationId: "95000000-0000-4000-8000-000000000001",
  projectMemberId: "95000000-0000-4000-8000-000000000004",
  userId: "95000000-0000-4000-8000-000000000002",
};

interface AuthenticatedRequest {
  cookie: string;
  csrf: string;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 5A document authorization", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  let supplierADocumentId: string;
  let supplierAVersionId: string;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    const supplierAMembership = await database.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.supplierOrganizationId,
          userId: localFixtures.supplierAdminUserId,
        },
      },
    });
    await database.organization.upsert({
      create: {
        code: "SUPPLIER-PHASE5A-B",
        id: supplierB.organizationId,
        name: "Phase 5A supplier B",
        type: "SUPPLIER",
      },
      update: { active: true },
      where: { id: supplierB.organizationId },
    });
    await database.userProfile.upsert({
      create: {
        email: "phase5a-supplier-b@example.invalid",
        displayName: "Phase 5A Supplier B",
        id: supplierB.userId,
        issuer: localFixtures.issuer,
        subject: "phase5a-supplier-b",
      },
      update: { status: "ACTIVE" },
      where: { id: supplierB.userId },
    });
    await database.membership.upsert({
      create: {
        id: supplierB.membershipId,
        organizationId: supplierB.organizationId,
        roles: { create: { roleCode: "SUPPLIER_USER" } },
        userId: supplierB.userId,
      },
      update: { status: "ACTIVE" },
      where: { id: supplierB.membershipId },
    });
    await database.projectMember.upsert({
      create: {
        addedByUserId: localFixtures.internalAdminUserId,
        id: supplierB.projectMemberId,
        membershipId: supplierB.membershipId,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "SUPPLIER",
      },
      update: { status: "ACTIVE" },
      where: { id: supplierB.projectMemberId },
    });
    await database.projectMember.upsert({
      create: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: supplierAMembership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "SUPPLIER",
      },
      update: { status: "ACTIVE" },
      where: {
        projectId_membershipId: {
          membershipId: supplierAMembership.id,
          projectId: phaseTwoFixtures.demoProjectId,
        },
      },
    });
    const document = await database.document.create({
      data: {
        associations: {
          create: {
            entityId: phaseTwoFixtures.demoProjectId,
            entityType: "PROJECT",
          },
        },
        category: "Supplier certificate",
        createdByUserId: localFixtures.supplierAdminUserId,
        ownerOrganizationId: localFixtures.supplierOrganizationId,
        projectId: phaseTwoFixtures.demoProjectId,
        title: `Supplier A document ${randomUUID()}`,
        versions: {
          create: {
            byteSize: 10,
            createdByUserId: localFixtures.supplierAdminUserId,
            declaredMimeType: "text/plain",
            extension: "txt",
            originalFileName: "supplier-a.txt",
            sha256: "a".repeat(64),
            storageKey: `documents/${randomUUID()}`,
            uploadExpiresAt: new Date(Date.now() + 300_000),
            versionNumber: 1,
          },
        },
      },
      include: { versions: true },
    });
    supplierADocumentId = document.id;
    supplierAVersionId = document.versions[0]!.id;

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
        expiresAt: new Date(Date.now() + 600_000),
        tokenHash,
        userId,
      },
    });
    return {
      cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}`,
      csrf,
    };
  }

  it("keeps supplier organizations isolated with nonexistent equivalence", async () => {
    const supplierA = await authenticated(localFixtures.supplierAdminUserId);
    const supplierBRequest = await authenticated(supplierB.userId);
    const own = await fetch(
      `${baseUrl}/api/v1/documents/${supplierADocumentId}`,
      {
        headers: { cookie: supplierA.cookie },
      },
    );
    expect(own.status).toBe(200);
    expect(JSON.stringify(await own.json())).not.toContain("storageKey");

    const denied = await Promise.all(
      [supplierADocumentId, "ffffffff-ffff-4fff-8fff-ffffffffffff"].map((id) =>
        fetch(`${baseUrl}/api/v1/documents/${id}`, {
          headers: { cookie: supplierBRequest.cookie },
        }),
      ),
    );
    expect(denied.map(({ status }) => status)).toEqual([404, 404]);
    const errors = await Promise.all(denied.map((response) => response.json()));
    expect(errors[0].error).toEqual(errors[1].error);
  });

  it("denies supplier approval before real versus nonexistent version disclosure", async () => {
    const supplier = await authenticated(localFixtures.supplierAdminUserId);
    const responses = await Promise.all(
      [supplierAVersionId, "ffffffff-ffff-4fff-8fff-ffffffffffff"].map((id) =>
        fetch(`${baseUrl}/api/v1/document-versions/${id}/approve`, {
          body: JSON.stringify({
            expectedVersion: 1,
            reason: "Supplier must not approve documents",
          }),
          headers: {
            cookie: supplier.cookie,
            "content-type": "application/json",
            "x-csrf-token": supplier.csrf,
          },
          method: "POST",
        }),
      ),
    );
    expect(responses.map(({ status }) => status)).toEqual([403, 403]);
    const errors = await Promise.all(
      responses.map((response) => response.json()),
    );
    expect(errors[0].error).toEqual(errors[1].error);
  });

  it("requires authentication and CSRF before upload initiation", async () => {
    expect(
      (
        await fetch(
          `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/documents`,
        )
      ).status,
    ).toBe(401);
    const supplier = await authenticated(localFixtures.supplierAdminUserId);
    const response = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/documents/uploads`,
      {
        body: JSON.stringify({
          byteSize: 10,
          category: "Certificate",
          fileName: "certificate.txt",
          mimeType: "text/plain",
          sha256: "a".repeat(64),
          title: "CSRF denied upload",
        }),
        headers: {
          cookie: supplier.cookie,
          "content-type": "application/json",
        },
        method: "POST",
      },
    );
    expect(response.status).toBe(403);
  });
});
