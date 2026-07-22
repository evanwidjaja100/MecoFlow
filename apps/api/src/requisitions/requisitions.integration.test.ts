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
import { BomsRepository } from "../boms/boms.repository.js";
import { RequisitionsRepository } from "./requisitions.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 4A purchase requisition integrity", () => {
  let database: PrismaClient;
  let repository: RequisitionsRepository;
  let bomLineId: string;
  const context = { correlationId: randomUUID(), requestId: randomUUID() };
  const actorUserId = localFixtures.internalAdminUserId;
  const auditOrganizationId = localFixtures.internalOrganizationId;

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    const environment = parseServiceEnvironment(
      process.env,
    ) as ServiceEnvironment;
    repository = new RequisitionsRepository(environment);
    const boms = new BomsRepository(environment);
    const workPackage = await database.workPackage.create({
      data: {
        code: `PR-${randomUUID().slice(0, 8).toUpperCase()}`,
        description: "Phase 4A requisition transaction scope",
        name: "Requisition transaction scope",
        plannedEndDate: new Date("2026-09-10T00:00:00.000Z"),
        plannedStartDate: new Date("2026-08-04T00:00:00.000Z"),
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
        title: "Released requisition test need",
      },
    });
    const line = await database.bomLine.create({
      data: {
        bomRevisionId: revision.id,
        itemId: phaseThreeAFixtures.demoItemId,
        lineNumber: 1,
        quantity: "10",
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
    });
    bomLineId = line.id;
    const reviewed = await boms.review({
      actorUserId,
      auditOrganizationId,
      context,
      expectedVersion: 1,
      reason: "Ready for requisition integration test",
      revisionId: revision.id,
    });
    await boms.release({
      actorUserId,
      auditOrganizationId,
      context,
      expectedVersion: reviewed.version,
      reason: "Release requisition integration need",
      revisionId: revision.id,
    });
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  function create(
    quantity: string,
    canOverride = false,
    overrideReason?: string,
  ) {
    return repository.create({
      actorUserId,
      auditOrganizationId,
      canOverride,
      context,
      lines: [
        { bomLineId, quantity, ...(overrideReason ? { overrideReason } : {}) },
      ],
      notes: "Integration coverage",
      projectId: phaseTwoFixtures.demoProjectId,
      title: `Requisition ${randomUUID().slice(0, 8)}`,
    });
  }

  function command(
    requisitionId: string,
    expectedVersion: number,
    reason: string,
  ) {
    return {
      actorUserId,
      auditOrganizationId,
      context,
      expectedVersion,
      reason,
      requisitionId,
    };
  }

  it("counts active requisition coverage once and displays outstanding quantity", async () => {
    const requisition = await create("6");
    expect(requisition.lines[0]).toMatchObject({
      coveredQuantitySnapshot: "0",
      outstandingQuantitySnapshot: "10",
      overNeedOverride: false,
      quantity: "6",
      requiredQuantitySnapshot: "10",
    });
    const requirements = await repository.requirements(
      phaseTwoFixtures.demoProjectId,
    );
    expect(
      requirements.find((line) => line.bomLineId === bomLineId),
    ).toMatchObject({
      coveredQuantity: "6",
      outstandingQuantity: "4",
      requiredQuantity: "10",
    });
  });

  it("rejects over-need quantity without override and audits an authorized override", async () => {
    await expect(create("5")).rejects.toThrow(
      "Requisition quantity exceeds outstanding need",
    );
    const overridden = await create(
      "5",
      true,
      "Approved contingency quantity for fabrication",
    );
    expect(overridden.lines[0]).toMatchObject({
      overNeedOverride: true,
      overrideReason: "Approved contingency quantity for fabrication",
    });
    expect(overridden.lines[0]?.overrideAuthorizedBy?.id).toBe(actorUserId);
    expect(
      await database.auditEvent.count({
        where: {
          action: "PURCHASE_REQUISITION_OVER_NEED_OVERRIDE_USED",
          entityId: overridden.id,
        },
      }),
    ).toBe(1);
  });

  it("preserves requester and approver attribution through explicit transitions", async () => {
    const requisitions = await database.purchaseRequisition.findMany({
      orderBy: { requisitionNumber: "asc" },
      where: {
        lines: { some: { bomLineId } },
        status: "DRAFT",
      },
    });
    const first = requisitions[0]!;
    const submitted = await repository.submit(
      command(first.id, first.version, "Submit released need for approval"),
    );
    const approved = await repository.approve(
      command(
        first.id,
        submitted.version,
        "Approve released need for purchasing",
      ),
    );
    expect(approved.requester.id).toBe(actorUserId);
    expect(approved.approver?.id).toBe(actorUserId);
    expect(approved.approvedAt).toBeTruthy();
    expect(
      approved.transitions.map(({ targetStatus }) => targetStatus),
    ).toEqual(["SUBMITTED", "APPROVED"]);
    await expect(
      repository.reject(
        command(first.id, approved.version, "Invalid reverse transition"),
      ),
    ).rejects.toThrow("Invalid purchase requisition transition");
    await expect(
      database.purchaseRequisition.update({
        data: { requesterUserId: localFixtures.internalReadonlyUserId },
        where: { id: first.id },
      }),
    ).rejects.toThrow();
  });

  it("rejection and cancellation release coverage while preserving history", async () => {
    const drafts = await database.purchaseRequisition.findMany({
      orderBy: { requisitionNumber: "asc" },
      where: { lines: { some: { bomLineId } }, status: "DRAFT" },
    });
    const override = drafts[0]!;
    const submitted = await repository.submit(
      command(override.id, override.version, "Submit override for decision"),
    );
    await repository.reject(
      command(override.id, submitted.version, "Reject contingency quantity"),
    );
    const approved = await database.purchaseRequisition.findFirstOrThrow({
      where: { lines: { some: { bomLineId } }, status: "APPROVED" },
    });
    await repository.cancel(
      command(
        approved.id,
        approved.version,
        "Cancel retained approved request",
      ),
    );
    const requirement = (
      await repository.requirements(phaseTwoFixtures.demoProjectId)
    ).find((line) => line.bomLineId === bomLineId);
    expect(requirement?.coveredQuantity).toBe("0");
    expect(requirement?.outstandingQuantity).toBe("10");
    expect(
      await database.purchaseRequisitionTransition.count({
        where: { purchaseRequisitionId: approved.id },
      }),
    ).toBe(3);
  });

  it("serializes concurrent creates so need cannot be double counted", async () => {
    const results = await Promise.allSettled([create("6"), create("6")]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    const requirement = (
      await repository.requirements(phaseTwoFixtures.demoProjectId)
    ).find((line) => line.bomLineId === bomLineId);
    expect(requirement?.coveredQuantity).toBe("6");
    expect(requirement?.outstandingQuantity).toBe("4");
  });

  it("database triggers retain requisition lines and transition history", async () => {
    const line = await database.purchaseRequisitionLine.findFirstOrThrow({
      where: { bomLineId },
    });
    await expect(
      database.purchaseRequisitionLine.update({
        data: { quantity: "1" },
        where: { id: line.id },
      }),
    ).rejects.toThrow();
    const transition =
      await database.purchaseRequisitionTransition.findFirstOrThrow({
        where: { purchaseRequisition: { lines: { some: { bomLineId } } } },
      });
    await expect(
      database.purchaseRequisitionTransition.delete({
        where: { id: transition.id },
      }),
    ).rejects.toThrow();
  });
});
