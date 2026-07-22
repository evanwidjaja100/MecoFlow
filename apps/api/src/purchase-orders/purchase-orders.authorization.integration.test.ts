import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  parseServiceEnvironment,
  type ServiceEnvironment,
} from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseThreeAFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { INestApplication } from "@nestjs/common";
import { createApplication } from "../bootstrap.js";
import { BomsRepository } from "../boms/boms.repository.js";
import { PurchaseOrdersRepository } from "./purchase-orders.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

interface AuthenticatedRequest {
  cookie: string;
  csrf: string;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase(
  "Phase 4B purchase order object and field authorization",
  () => {
    let app: INestApplication;
    let baseUrl: string;
    let database: PrismaClient;
    let purchaseOrderId: string;
    let purchaseOrderVersion: number;
    let supplierBUserId: string;
    const sessionHashes: string[] = [];
    const context = { correlationId: randomUUID(), requestId: randomUUID() };

    beforeAll(async () => {
      database = createDatabaseClient(databaseUrl!);
      const environment = parseServiceEnvironment(
        process.env,
      ) as ServiceEnvironment;
      const orders = new PurchaseOrdersRepository(environment);
      const boms = new BomsRepository(environment);
      const supplierBOrganization = await database.organization.create({
        data: {
          code: `SUP-B-${randomUUID().slice(0, 8).toUpperCase()}`,
          name: "Supplier B authorization fixture",
          type: "SUPPLIER",
        },
      });
      supplierBUserId = randomUUID();
      const supplierB = await database.userProfile.create({
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

      const suffix = randomUUID().slice(0, 8).toUpperCase();
      const workPackage = await database.workPackage.create({
        data: {
          code: `AUTH-PO-${suffix}`,
          name: "PO authorization requirement",
          plannedEndDate: new Date("2026-09-30T00:00:00.000Z"),
          plannedStartDate: new Date("2026-08-10T00:00:00.000Z"),
          projectId: phaseTwoFixtures.demoProjectId,
        },
      });
      const bom = await database.bom.create({
        data: {
          projectId: phaseTwoFixtures.demoProjectId,
          workPackageId: workPackage.id,
        },
      });
      const revision = await database.bomRevision.create({
        data: {
          bomId: bom.id,
          createdByUserId: localFixtures.internalAdminUserId,
          revisionNumber: 1,
          title: "PO authorization BOM",
        },
      });
      const bomLine = await database.bomLine.create({
        data: {
          bomRevisionId: revision.id,
          itemId: phaseThreeAFixtures.demoItemId,
          lineNumber: 1,
          quantity: "5",
          unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
        },
      });
      const reviewed = await boms.review({
        actorUserId: localFixtures.internalAdminUserId,
        auditOrganizationId: localFixtures.internalOrganizationId,
        context,
        expectedVersion: 1,
        reason: "Review authorization test BOM requirement",
        revisionId: revision.id,
      });
      await boms.release({
        actorUserId: localFixtures.internalAdminUserId,
        auditOrganizationId: localFixtures.internalOrganizationId,
        context,
        expectedVersion: reviewed.version,
        reason: "Release authorization test BOM requirement",
        revisionId: revision.id,
      });
      const requisition = await database.purchaseRequisition.create({
        data: {
          approvedAt: new Date(),
          approverUserId: localFixtures.internalAdminUserId,
          lines: {
            create: {
              bomLineId: bomLine.id,
              coveredQuantitySnapshot: "0",
              lineNumber: 1,
              outstandingQuantitySnapshot: "5",
              quantity: "5",
              requiredQuantitySnapshot: "5",
            },
          },
          projectId: phaseTwoFixtures.demoProjectId,
          requesterUserId: localFixtures.internalAdminUserId,
          requisitionNumber: Math.floor(Math.random() * 1_000_000) + 2_000_000,
          status: "APPROVED",
          title: "Authorization approved source",
        },
        include: { lines: true },
      });
      const created = await orders.create({
        actorUserId: localFixtures.internalAdminUserId,
        auditOrganizationId: localFixtures.internalOrganizationId,
        canOverride: false,
        context,
        internalCommercialTerms: "INTERNAL-COMMERCIAL-SECRET",
        internalNotes: "INTERNAL-BUYER-SECRET",
        lines: [
          {
            allocations: [
              {
                purchaseRequisitionLineId: requisition.lines[0]!.id,
                quantity: "5",
              },
            ],
            internalLineNotes: "INTERNAL-LINE-SECRET",
            internalUnitPrice: "987654.00",
            orderedQuantity: "5",
          },
        ],
        projectId: phaseTwoFixtures.demoProjectId,
        revisionReason: "Create supplier authorization test PO",
        supplierMessage: "Supplier-visible instruction",
        supplierOrganizationId: localFixtures.supplierOrganizationId,
        title: "Supplier A authorized PO",
      });
      const sent = await orders.send({
        actorUserId: localFixtures.internalAdminUserId,
        auditOrganizationId: localFixtures.internalOrganizationId,
        context,
        expectedVersion: created.version,
        purchaseOrderId: created.id,
        reason: "Send authorization test PO to Supplier A",
      });
      purchaseOrderId = sent.id;
      purchaseOrderVersion = sent.version;

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

    async function authenticated(
      userId: string,
    ): Promise<AuthenticatedRequest> {
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

    it("returns Supplier A's PO with commercial fields filtered server-side", async () => {
      const supplierA = await authenticated(localFixtures.supplierAdminUserId);
      const list = await fetch(`${baseUrl}/api/v1/supplier/purchase-orders`, {
        headers: { cookie: supplierA.cookie },
      });
      expect(list.status).toBe(200);
      const listBody = (await list.json()) as { data: Array<{ id: string }> };
      expect(listBody.data.map(({ id }) => id)).toContain(purchaseOrderId);
      const response = await fetch(
        `${baseUrl}/api/v1/supplier/purchase-orders/${purchaseOrderId}`,
        { headers: { cookie: supplierA.cookie } },
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as {
        revision: { lines: Array<Record<string, unknown>> };
      };
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("INTERNAL-COMMERCIAL-SECRET");
      expect(serialized).not.toContain("INTERNAL-BUYER-SECRET");
      expect(serialized).not.toContain("INTERNAL-LINE-SECRET");
      expect(serialized).not.toContain("987654");
      expect(body.revision.lines[0]).not.toHaveProperty("internalUnitPrice");
      expect(body.revision.lines[0]).not.toHaveProperty("allocations");
    });

    it("makes Supplier B and nonexistent PO identifiers equivalent across objects and attachments", async () => {
      const supplierB = await authenticated(supplierBUserId);
      const nonexistent = "ffffffff-ffff-4fff-8fff-ffffffffffff";
      const paths = [
        `/api/v1/supplier/purchase-orders/${purchaseOrderId}`,
        `/api/v1/supplier/purchase-orders/${nonexistent}`,
        `/api/v1/supplier/purchase-orders/${purchaseOrderId}/attachments`,
        `/api/v1/supplier/purchase-orders/${nonexistent}/attachments`,
      ];
      const responses = await Promise.all(
        paths.map((path) =>
          fetch(`${baseUrl}${path}`, { headers: { cookie: supplierB.cookie } }),
        ),
      );
      expect(responses.map(({ status }) => status)).toEqual([
        404, 404, 404, 404,
      ]);
      const list = await fetch(`${baseUrl}/api/v1/supplier/purchase-orders`, {
        headers: { cookie: supplierB.cookie },
      });
      const listBody = (await list.json()) as { data: Array<{ id: string }> };
      expect(listBody.data.map(({ id }) => id)).not.toContain(purchaseOrderId);
    });

    it("denies Supplier B acknowledgement and commitment manipulation with safe not-found responses", async () => {
      const supplierB = await authenticated(supplierBUserId);
      const nonexistent = "ffffffff-ffff-4fff-8fff-ffffffffffff";
      for (const command of ["acknowledge", "commitments"] as const) {
        const bodies =
          command === "acknowledge"
            ? {
                expectedVersion: purchaseOrderVersion,
                reason: "Supplier B denied acknowledgement",
              }
            : {
                expectedVersion: purchaseOrderVersion,
                lines: [
                  {
                    committedDate: "2026-08-12",
                    purchaseOrderLineId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                  },
                ],
              };
        const responses = await Promise.all(
          [purchaseOrderId, nonexistent].map((id) =>
            fetch(
              `${baseUrl}/api/v1/supplier/purchase-orders/${id}/${command}`,
              {
                body: JSON.stringify(bodies),
                headers: {
                  cookie: supplierB.cookie,
                  "content-type": "application/json",
                  "x-csrf-token": supplierB.csrf,
                },
                method: "POST",
              },
            ),
          ),
        );
        expect(responses.map(({ status }) => status)).toEqual([404, 404]);
        const errors = (await Promise.all(
          responses.map((response) => response.json()),
        )) as Array<{ error: unknown }>;
        expect(errors[0]?.error).toEqual(errors[1]?.error);
      }
    });

    it("requires CSRF before internal purchase order creation", async () => {
      const admin = await authenticated(localFixtures.internalAdminUserId);
      const before = await database.purchaseOrder.count();
      const response = await fetch(
        `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/purchase-orders`,
        {
          body: JSON.stringify({
            lines: [
              {
                allocations: [
                  {
                    purchaseRequisitionLineId:
                      "ffffffff-ffff-4fff-8fff-ffffffffffff",
                    quantity: "1",
                  },
                ],
                orderedQuantity: "1",
              },
            ],
            revisionReason: "Valid body reaches CSRF enforcement",
            supplierOrganizationId: localFixtures.supplierOrganizationId,
            title: "CSRF denied purchase order",
          }),
          headers: { cookie: admin.cookie, "content-type": "application/json" },
          method: "POST",
        },
      );
      expect(response.status).toBe(403);
      expect(await database.purchaseOrder.count()).toBe(before);
    });
  },
);
