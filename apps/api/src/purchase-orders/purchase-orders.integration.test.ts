import { randomUUID } from "node:crypto";
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
import { PurchaseOrdersRepository } from "./purchase-orders.repository.js";
import { RequisitionsRepository } from "../requisitions/requisitions.repository.js";
import { BomsRepository } from "../boms/boms.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 4B purchase order and commitment integrity", () => {
  let database: PrismaClient;
  let repository: PurchaseOrdersRepository;
  let requisitions: RequisitionsRepository;
  let boms: BomsRepository;
  const context = { correlationId: randomUUID(), requestId: randomUUID() };
  const actorUserId = localFixtures.internalAdminUserId;
  const auditOrganizationId = localFixtures.internalOrganizationId;

  beforeAll(() => {
    database = createDatabaseClient(databaseUrl!);
    const environment = parseServiceEnvironment(
      process.env,
    ) as ServiceEnvironment;
    repository = new PurchaseOrdersRepository(environment);
    requisitions = new RequisitionsRepository(environment);
    boms = new BomsRepository(environment);
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  async function approvedRequirement(quantity = "10") {
    const suffix = randomUUID().slice(0, 8).toUpperCase();
    const workPackage = await database.workPackage.create({
      data: {
        code: `PO-${suffix}`,
        name: `PO test ${suffix}`,
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
        createdByUserId: actorUserId,
        revisionNumber: 1,
        title: `Released PO test ${suffix}`,
      },
    });
    const bomLine = await database.bomLine.create({
      data: {
        bomRevisionId: revision.id,
        itemId: phaseThreeAFixtures.demoItemId,
        lineNumber: 1,
        quantity,
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
    });
    const reviewed = await boms.review({
      actorUserId,
      auditOrganizationId,
      context,
      expectedVersion: 1,
      reason: "Review purchase order integration requirement",
      revisionId: revision.id,
    });
    await boms.release({
      actorUserId,
      auditOrganizationId,
      context,
      expectedVersion: reviewed.version,
      reason: "Release purchase order integration requirement",
      revisionId: revision.id,
    });
    const requisition = await database.purchaseRequisition.create({
      data: {
        approvedAt: new Date(),
        approverUserId: actorUserId,
        lines: {
          create: {
            bomLineId: bomLine.id,
            coveredQuantitySnapshot: "0",
            lineNumber: 1,
            outstandingQuantitySnapshot: quantity,
            quantity,
            requiredQuantitySnapshot: quantity,
          },
        },
        projectId: phaseTwoFixtures.demoProjectId,
        requesterUserId: actorUserId,
        requisitionNumber: Math.floor(Math.random() * 1_000_000) + 10_000,
        status: "APPROVED",
        title: `Approved PO source ${suffix}`,
      },
      include: { lines: true },
    });
    return requisition.lines[0]!;
  }

  function revisionInput(
    purchaseRequisitionLineId: string,
    quantity: string,
    overrideReason?: string,
  ) {
    return {
      internalCommercialTerms: "Internal payment term 30 days",
      internalNotes: "Internal buyer note",
      lines: [
        {
          allocations: [
            {
              ...(overrideReason ? { overrideReason } : {}),
              purchaseRequisitionLineId,
              quantity,
            },
          ],
          internalLineNotes: "Internal negotiation note",
          internalUnitPrice: "125000.00",
          orderedQuantity: quantity,
        },
      ],
      revisionReason: "Initial approved quantity conversion",
      supplierMessage: "Please confirm the requested delivery date",
      title: `Purchase order ${randomUUID().slice(0, 8)}`,
    };
  }

  function create(
    purchaseRequisitionLineId: string,
    quantity: string,
    canOverride = false,
    overrideReason?: string,
  ) {
    return repository.create({
      ...revisionInput(purchaseRequisitionLineId, quantity, overrideReason),
      actorUserId,
      auditOrganizationId,
      canOverride,
      context,
      projectId: phaseTwoFixtures.demoProjectId,
      supplierOrganizationId: localFixtures.supplierOrganizationId,
    });
  }

  it("orders and allocates only approved available quantity unless reasoned override is authorized", async () => {
    const requirement = await approvedRequirement("10");
    const exact = await create(requirement.id, "10");
    expect(exact.currentRevision.lines[0]).toMatchObject({
      orderedQuantity: "10",
      requiredDate: "2026-08-10",
    });
    expect(exact.currentRevision.lines[0]?.allocations[0]).toMatchObject({
      approvedQuantitySnapshot: "10",
      availableQuantitySnapshot: "10",
      overOrderOverride: false,
      quantity: "10",
    });
    await expect(create(requirement.id, "1")).rejects.toThrow(
      "exceeds approved available quantity",
    );
    const overridden = await create(
      requirement.id,
      "1",
      true,
      "Authorized fabrication contingency quantity",
    );
    expect(overridden.currentRevision.lines[0]?.allocations[0]).toMatchObject({
      overOrderOverride: true,
      overrideReason: "Authorized fabrication contingency quantity",
    });
    expect(
      await database.auditEvent.count({
        where: {
          action: "PURCHASE_ORDER_OVER_ORDER_OVERRIDE_USED",
          entityId: overridden.id,
        },
      }),
    ).toBe(1);
  });

  it("serializes concurrent ordering against one approved requisition line", async () => {
    const requirement = await approvedRequirement("10");
    const results = await Promise.allSettled([
      create(requirement.id, "6"),
      create(requirement.id, "6"),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
  });

  it("preserves PO revisions and append-only original/latest supplier commitments", async () => {
    const requirement = await approvedRequirement("10");
    const created = await create(requirement.id, "4");
    const sent = await repository.send({
      actorUserId,
      auditOrganizationId,
      context,
      expectedVersion: created.version,
      purchaseOrderId: created.id,
      reason: "Send the initial revision to the supplier",
    });
    const revised = await repository.revise({
      ...revisionInput(requirement.id, "5"),
      actorUserId,
      auditOrganizationId,
      canOverride: false,
      context,
      expectedVersion: sent.version,
      purchaseOrderId: created.id,
      revisionReason: "Revise retained quantity before supplier confirmation",
    });
    expect(
      revised.revisions.map(({ revisionNumber }) => revisionNumber),
    ).toEqual([1, 2]);
    expect(revised.currentRevision.revisionNumber).toBe(2);
    const resent = await repository.send({
      actorUserId,
      auditOrganizationId,
      context,
      expectedVersion: revised.version,
      purchaseOrderId: created.id,
      reason: "Send the retained second revision to the supplier",
    });
    const acknowledged = await repository.acknowledge({
      actorUserId: localFixtures.supplierAdminUserId,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      expectedVersion: resent.version,
      purchaseOrderId: created.id,
      reason: "Supplier acknowledges purchase order revision two",
    });
    const lineId = acknowledged.revision.lines[0]!.id;
    const first = await repository.appendCommitment({
      actorUserId: localFixtures.supplierAdminUserId,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      expectedVersion: acknowledged.version,
      lines: [{ committedDate: "2026-08-08", purchaseOrderLineId: lineId }],
      note: "Initial supplier commitment",
      purchaseOrderId: created.id,
      supplierOrganizationId: localFixtures.supplierOrganizationId,
    });
    const latest = await repository.appendCommitment({
      actorUserId: localFixtures.supplierAdminUserId,
      auditOrganizationId: localFixtures.supplierOrganizationId,
      context,
      expectedVersion: first.version,
      lines: [{ committedDate: "2026-08-15", purchaseOrderLineId: lineId }],
      note: "Updated supplier commitment",
      purchaseOrderId: created.id,
      supplierOrganizationId: localFixtures.supplierOrganizationId,
    });
    expect(latest.revision.lines[0]).toMatchObject({
      latestCommitmentDate: "2026-08-15",
      originalCommitmentDate: "2026-08-08",
    });
    expect(
      latest.revision.commitments.map(({ revisionNumber }) => revisionNumber),
    ).toEqual([1, 2]);
    const exceptions = await repository.exceptions(
      phaseTwoFixtures.demoProjectId,
    );
    expect(exceptions).toContainEqual(
      expect.objectContaining({
        latestCommitmentDate: "2026-08-15",
        originalCommitmentDate: "2026-08-08",
        purchaseOrderId: created.id,
        requiredDate: "2026-08-10",
      }),
    );
    const commitment =
      await database.supplierCommitmentRevision.findFirstOrThrow({
        where: { purchaseOrderRevisionId: latest.revision.id },
      });
    await expect(
      database.supplierCommitmentRevision.update({
        data: { note: "Mutated history" },
        where: { id: commitment.id },
      }),
    ).rejects.toThrow();
  });

  it("prevents cancelling an approved requisition that an active PO consumes", async () => {
    const requirement = await approvedRequirement("3");
    await create(requirement.id, "3");
    const requisition = await database.purchaseRequisition.findUniqueOrThrow({
      where: { id: requirement.purchaseRequisitionId },
    });
    await expect(
      requisitions.cancel({
        actorUserId,
        auditOrganizationId,
        context,
        expectedVersion: requisition.version,
        reason: "Attempt to cancel allocated approved requisition",
        requisitionId: requisition.id,
      }),
    ).rejects.toThrow("allocated to an active purchase order");
  });
});
