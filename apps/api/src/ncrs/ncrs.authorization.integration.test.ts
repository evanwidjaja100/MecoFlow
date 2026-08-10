import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
import { postedInspectionFixture } from "../inspections/inspection-test-fixture.js";
import { NcrsRepository } from "./ncrs.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

interface AuthenticatedRequest {
  cookie: string;
  csrf: string;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 6B NCR and allocation authorization", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  let supplierANcrId: string;
  let supplierBNcrId: string;
  let supplierBUserId: string;
  let managerUserId: string;
  let conditionalLotId: string;
  let conditionalBomLineId: string;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    const environment = parseServiceEnvironment(
      process.env,
    ) as ServiceEnvironment;
    const context = { correlationId: randomUUID(), requestId: randomUUID() };
    const repository = new NcrsRepository(environment);
    const actor = {
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
    };
    const supplierA = await repository.create({
      ...actor,
      description:
        "Supplier A must respond without seeing internal disposition",
      internalDispositionNotes:
        "Confidential internal legal and commercial analysis",
      projectId: phaseTwoFixtures.demoProjectId,
      shareInternalNotes: false,
      sourceType: "PROJECT",
      supplierOrganizationId: localFixtures.supplierOrganizationId,
      title: "Supplier A quality NCR",
    });
    supplierANcrId = supplierA.id;
    await repository.transition({
      ...actor,
      expectedVersion: supplierA.version,
      id: supplierA.id,
      reason: "Issue supplier A NCR for authorization verification",
      targetStatus: "ISSUED",
    });

    const supplierBOrganization = await database.organization.create({
      data: {
        code: `SUP-B-${randomUUID().slice(0, 8)}`,
        name: "Supplier B isolation fixture",
        type: "SUPPLIER",
      },
    });
    supplierBUserId = randomUUID();
    const supplierBUser = await database.userProfile.create({
      data: {
        displayName: "Supplier B User",
        email: `supplier-b-${randomUUID()}@example.test`,
        id: supplierBUserId,
        issuer: "https://identity.example.test",
        subject: randomUUID(),
      },
    });
    const supplierBMembership = await database.membership.create({
      data: {
        organizationId: supplierBOrganization.id,
        roles: { create: { roleCode: "SUPPLIER_USER" } },
        userId: supplierBUser.id,
      },
    });
    await database.projectMember.create({
      data: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: supplierBMembership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "SUPPLIER",
      },
    });
    const supplierB = await repository.create({
      ...actor,
      description: "Supplier B isolated nonconformance record",
      internalDispositionNotes: "Supplier A must never receive this note",
      projectId: phaseTwoFixtures.demoProjectId,
      shareInternalNotes: false,
      sourceType: "PROJECT",
      supplierOrganizationId: supplierBOrganization.id,
      title: "Supplier B quality NCR",
    });
    supplierBNcrId = supplierB.id;
    await repository.transition({
      ...actor,
      expectedVersion: supplierB.version,
      id: supplierB.id,
      reason: "Issue supplier B NCR for isolation verification",
      targetStatus: "ISSUED",
    });

    managerUserId = randomUUID();
    const manager = await database.userProfile.create({
      data: {
        displayName: "Allocation Project Manager",
        email: `allocation-manager-${randomUUID()}@example.test`,
        id: managerUserId,
        issuer: "https://identity.example.test",
        subject: randomUUID(),
      },
    });
    const managerMembership = await database.membership.create({
      data: {
        organizationId: localFixtures.internalOrganizationId,
        roles: { create: { roleCode: "PROJECT_MANAGER" } },
        userId: manager.id,
      },
    });
    await database.projectMember.create({
      data: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: managerMembership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "PROJECT_MANAGER",
      },
    });
    const conditional = await postedInspectionFixture({
      bomStatus: "RELEASED",
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: `AUTH-${randomUUID()}` }],
      environment,
    });
    const recorded = await conditional.inspections.saveResults({
      ...actor,
      expectedVersion: conditional.inspection.version,
      inspectionId: conditional.inspection.id,
      results: [
        {
          checkId: conditional.inspection.checks[0]!.id,
          checklistPassed: false,
        },
      ],
    });
    await conditional.inspections.finalize({
      ...actor,
      acceptedQuantity: "5",
      conditionalAuthorized: true,
      disposition: "CONDITIONALLY_ACCEPTED",
      expectedVersion: recorded!.version,
      inspectionId: conditional.inspection.id,
      reason: "QA authorizes conditional acceptance for controlled use",
      rejectedQuantity: "0",
    });
    conditionalLotId = conditional.lot.id;
    conditionalBomLineId = conditional.bom.revisions[0]!.lines[0]!.id;

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

  it("isolates supplier objects and strips internal fields server-side", async () => {
    const supplierA = await authenticated(localFixtures.supplierAdminUserId);
    const own = await fetch(
      `${baseUrl}/api/v1/supplier/ncrs/${supplierANcrId}`,
      {
        headers: { cookie: supplierA.cookie },
      },
    );
    expect(own.status).toBe(200);
    const serialized = JSON.stringify(await own.json());
    expect(serialized).not.toContain("internalDispositionNotes");
    expect(serialized).not.toContain("shareInternalNotes");
    expect(serialized).not.toContain("Confidential internal legal");
    expect(serialized).not.toContain('"transitions"');
    expect(serialized).not.toContain('"createdBy"');

    const foreign = await fetch(
      `${baseUrl}/api/v1/supplier/ncrs/${supplierBNcrId}`,
      { headers: { cookie: supplierA.cookie } },
    );
    const missing = await fetch(
      `${baseUrl}/api/v1/supplier/ncrs/${randomUUID()}`,
      { headers: { cookie: supplierA.cookie } },
    );
    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);

    const list = await fetch(`${baseUrl}/api/v1/supplier/ncrs`, {
      headers: { cookie: supplierA.cookie },
    });
    const body = (await list.json()) as { data: Array<{ id: string }> };
    expect(body.data.some(({ id }) => id === supplierANcrId)).toBe(true);
    expect(body.data.some(({ id }) => id === supplierBNcrId)).toBe(false);

    const supplierB = await authenticated(supplierBUserId);
    expect(
      (
        await fetch(`${baseUrl}/api/v1/supplier/ncrs/${supplierBNcrId}`, {
          headers: { cookie: supplierB.cookie },
        })
      ).status,
    ).toBe(200);
  });

  it("requires CSRF for supplier responses and retains supplier attribution", async () => {
    const supplier = await authenticated(localFixtures.supplierAdminUserId);
    const detail = await fetch(
      `${baseUrl}/api/v1/supplier/ncrs/${supplierANcrId}`,
      { headers: { cookie: supplier.cookie } },
    );
    const current = (await detail.json()) as { version: number };
    const request = (csrf: boolean) =>
      fetch(`${baseUrl}/api/v1/supplier/ncrs/${supplierANcrId}/responses`, {
        body: JSON.stringify({
          expectedVersion: current.version,
          message: "Supplier response submitted through authorized workflow",
        }),
        headers: {
          cookie: supplier.cookie,
          "content-type": "application/json",
          ...(csrf ? { "x-csrf-token": supplier.csrf } : {}),
        },
        method: "POST",
      });
    expect((await request(false)).status).toBe(403);
    expect((await request(true)).status).toBe(201);
    const response = await database.ncrSupplierResponse.findFirstOrThrow({
      where: { ncrId: supplierANcrId },
    });
    expect(response.submittedByUserId).toBe(localFixtures.supplierAdminUserId);
  });

  it("requires independent conditional-use permission before allocation", async () => {
    const manager = await authenticated(managerUserId);
    const administrator = await authenticated(
      localFixtures.internalAdminUserId,
    );
    const create = (auth: AuthenticatedRequest) =>
      fetch(
        `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/material-allocations`,
        {
          body: JSON.stringify({
            bomLineId: conditionalBomLineId,
            conditionalUseReason:
              "Controlled allocation approved for a released BOM requirement",
            inventoryLotId: conditionalLotId,
            quantity: "1",
          }),
          headers: {
            cookie: auth.cookie,
            "content-type": "application/json",
            "x-csrf-token": auth.csrf,
          },
          method: "POST",
        },
      );
    expect((await create(manager)).status).toBe(403);
    expect((await create(administrator)).status).toBe(201);
  });
});
