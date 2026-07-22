import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseThreeAFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import { createApplication } from "../bootstrap.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

interface AuthenticatedRequest {
  cookie: string;
  csrf: string;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 5B supplier ASN isolation", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  let supplierAOrderId: string;
  let supplierALineId: string;
  let supplierBOrderId: string;
  let supplierBLineId: string;
  let supplierBUserId: string;
  let asnId: string;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    const supplierBOrganization = await database.organization.create({
      data: {
        code: `ASN-SUP-B-${randomUUID().slice(0, 8).toUpperCase()}`,
        name: "Supplier B ASN isolation fixture",
        type: "SUPPLIER",
      },
    });
    supplierBUserId = randomUUID();
    const supplierB = await database.userProfile.create({
      data: {
        displayName: "Supplier B ASN User",
        email: `asn-supplier-b-${randomUUID()}@example.test`,
        id: supplierBUserId,
        issuer: "https://identity.example.test",
        subject: randomUUID(),
      },
    });
    const supplierBMembership = await database.membership.create({
      data: {
        organizationId: supplierBOrganization.id,
        roles: { create: { roleCode: "SUPPLIER_ADMIN" } },
        userId: supplierB.id,
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

    async function order(supplierOrganizationId: string) {
      const purchaseOrderNumber =
        Math.floor(Math.random() * 1_000_000_000) + 20_000;
      const workPackage = await database.workPackage.create({
        data: {
          code: `R5BA-${randomUUID().slice(0, 8)}`,
          name: `ASN authorization requirement ${purchaseOrderNumber}`,
          plannedEndDate: new Date("2026-08-31T00:00:00.000Z"),
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
                  quantity: "5",
                  unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
                },
              },
              revisionNumber: 1,
              status: "DRAFT",
              title: `ASN authorization BOM ${purchaseOrderNumber}`,
            },
          },
        },
        include: { revisions: { include: { lines: true } } },
      });
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
          requisitionNumber: purchaseOrderNumber,
          status: "APPROVED",
          title: `ASN authorization requisition ${purchaseOrderNumber}`,
        },
        include: { lines: true },
      });
      return database.$transaction(async (transaction) => {
        const purchaseOrder = await transaction.purchaseOrder.create({
          data: {
            acknowledgedAt: new Date(),
            createdByUserId: localFixtures.internalAdminUserId,
            projectId: phaseTwoFixtures.demoProjectId,
            purchaseOrderNumber,
            revisions: {
              create: {
                createdByUserId: localFixtures.internalAdminUserId,
                lines: {
                  create: {
                    itemId: phaseThreeAFixtures.demoItemId,
                    lineNumber: 1,
                    orderedQuantity: "5",
                    unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
                  },
                },
                revisionNumber: 1,
                revisionReason: "ASN authorization fixture",
                sentAt: new Date(),
                title: `ASN auth PO ${purchaseOrderNumber}`,
              },
            },
            sentAt: new Date(),
            status: "ACKNOWLEDGED",
            supplierOrganizationId,
          },
          include: { revisions: { include: { lines: true } } },
        });
        await transaction.purchaseOrderAllocation.create({
          data: {
            alreadyOrderedQuantitySnapshot: "0",
            approvedQuantitySnapshot: "5",
            availableQuantitySnapshot: "5",
            purchaseOrderLineId: purchaseOrder.revisions[0]!.lines[0]!.id,
            purchaseRequisitionLineId: requisition.lines[0]!.id,
            quantity: "5",
            requiredDateSnapshot: new Date("2026-08-31T00:00:00.000Z"),
          },
        });
        return purchaseOrder;
      });
    }

    const supplierAOrder = await order(localFixtures.supplierOrganizationId);
    const supplierBOrder = await order(supplierBOrganization.id);
    supplierAOrderId = supplierAOrder.id;
    supplierALineId = supplierAOrder.revisions[0]!.lines[0]!.id;
    supplierBOrderId = supplierBOrder.id;
    supplierBLineId = supplierBOrder.revisions[0]!.lines[0]!.id;

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

  function createBody(lineId: string) {
    return {
      lines: [{ purchaseOrderLineId: lineId, shippedQuantity: "5" }],
      supplierReference: `AUTH-ASN-${randomUUID().slice(0, 8)}`,
    };
  }

  async function post(
    path: string,
    auth: AuthenticatedRequest,
    body: unknown,
    includeCsrf = true,
  ) {
    return fetch(`${baseUrl}${path}`, {
      body: JSON.stringify(body),
      headers: {
        cookie: auth.cookie,
        "content-type": "application/json",
        ...(includeCsrf ? { "x-csrf-token": auth.csrf } : {}),
      },
      method: "POST",
    });
  }

  it("allows Supplier A to create only from its own acknowledged PO lines", async () => {
    const supplierA = await authenticated(localFixtures.supplierAdminUserId);
    const created = await post(
      `/api/v1/supplier/purchase-orders/${supplierAOrderId}/asns`,
      supplierA,
      createBody(supplierALineId),
    );
    expect(created.status).toBe(201);
    const body = (await created.json()) as { id: string };
    asnId = body.id;

    const foreignLine = await post(
      `/api/v1/supplier/purchase-orders/${supplierAOrderId}/asns`,
      supplierA,
      createBody(supplierBLineId),
    );
    expect(foreignLine.status).toBe(422);
    expect(
      await database.advanceShipmentNotice.count({
        where: { purchaseOrderId: supplierAOrderId },
      }),
    ).toBe(1);
  });

  it("makes Supplier B and nonexistent PO creation targets equivalent", async () => {
    const supplierB = await authenticated(supplierBUserId);
    const real = await post(
      `/api/v1/supplier/purchase-orders/${supplierAOrderId}/asns`,
      supplierB,
      createBody(supplierALineId),
    );
    const missing = await post(
      `/api/v1/supplier/purchase-orders/${randomUUID()}/asns`,
      supplierB,
      createBody(supplierALineId),
    );
    expect(real.status).toBe(404);
    expect(missing.status).toBe(404);
  });

  it("makes cross-supplier and nonexistent ASN detail and transition targets equivalent", async () => {
    const supplierB = await authenticated(supplierBUserId);
    const real = await fetch(`${baseUrl}/api/v1/supplier/asns/${asnId}`, {
      headers: { cookie: supplierB.cookie },
    });
    const missing = await fetch(
      `${baseUrl}/api/v1/supplier/asns/${randomUUID()}`,
      { headers: { cookie: supplierB.cookie } },
    );
    expect(real.status).toBe(404);
    expect(missing.status).toBe(404);

    const realCommand = await post(
      `/api/v1/supplier/asns/${asnId}/submit`,
      supplierB,
      { expectedVersion: 1, reason: "Unauthorized shipment submission" },
    );
    const missingCommand = await post(
      `/api/v1/supplier/asns/${randomUUID()}/submit`,
      supplierB,
      { expectedVersion: 1, reason: "Missing shipment submission" },
    );
    expect(realCommand.status).toBe(404);
    expect(missingCommand.status).toBe(404);
  });

  it("requires CSRF before supplier ASN creation and omits actor identities", async () => {
    const supplierA = await authenticated(localFixtures.supplierAdminUserId);
    const denied = await post(
      `/api/v1/supplier/purchase-orders/${supplierAOrderId}/asns`,
      supplierA,
      createBody(supplierALineId),
      false,
    );
    expect(denied.status).toBe(403);
    const detail = await fetch(`${baseUrl}/api/v1/supplier/asns/${asnId}`, {
      headers: { cookie: supplierA.cookie },
    });
    expect(detail.status).toBe(200);
    const serialized = JSON.stringify(await detail.json());
    expect(serialized).not.toContain("createdBy");
    expect(serialized).not.toContain("actorUserId");

    const ownB = await post(
      `/api/v1/supplier/purchase-orders/${supplierBOrderId}/asns`,
      await authenticated(supplierBUserId),
      createBody(supplierBLineId),
    );
    expect(ownB.status).toBe(201);
  });
});
