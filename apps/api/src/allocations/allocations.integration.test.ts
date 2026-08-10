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
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import { postedInspectionFixture } from "../inspections/inspection-test-fixture.js";
import { AllocationsRepository } from "./allocations.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 6B material allocation workflow", () => {
  let database: PrismaClient;
  let environment: ServiceEnvironment;
  let repository: AllocationsRepository;
  const context = { correlationId: randomUUID(), requestId: randomUUID() };
  const actor = {
    actorUserId: localFixtures.internalAdminUserId,
    auditOrganizationId: localFixtures.internalOrganizationId,
    context,
  };

  beforeAll(() => {
    database = createDatabaseClient(databaseUrl!);
    environment = parseServiceEnvironment(process.env) as ServiceEnvironment;
    repository = new AllocationsRepository(environment);
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  async function finalizedFixture(
    disposition: "ACCEPTED" | "CONDITIONALLY_ACCEPTED" | "QUARANTINED",
  ) {
    const conditional = disposition === "CONDITIONALLY_ACCEPTED";
    const fixture = await postedInspectionFixture({
      bomStatus: "RELEASED",
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: `ALLOC-${randomUUID()}` }],
      environment,
    });
    const recorded = await fixture.inspections.saveResults({
      ...actor,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        {
          checkId: fixture.inspection.checks[0]!.id,
          checklistPassed: disposition === "ACCEPTED",
        },
      ],
    });
    await fixture.inspections.finalize({
      ...actor,
      acceptedQuantity: disposition === "QUARANTINED" ? "0" : "5",
      conditionalAuthorized: conditional,
      disposition,
      expectedVersion: recorded!.version,
      inspectionId: fixture.inspection.id,
      reason: conditional
        ? "Conditional disposition authorized for controlled project use"
        : "Final allocation fixture inspection disposition recorded",
      rejectedQuantity: "0",
    });
    return fixture;
  }

  it("allocates accepted quantity and preserves release and consumption history", async () => {
    const fixture = await finalizedFixture("ACCEPTED");
    const bomLineId = fixture.bom.revisions[0]!.lines[0]!.id;
    const first = await repository.create({
      ...actor,
      bomLineId,
      conditionalAuthorized: false,
      inventoryLotId: fixture.lot.id,
      projectId: phaseTwoFixtures.demoProjectId,
      quantity: "3",
    });
    expect(first).toMatchObject({ quantity: "3", status: "ALLOCATED" });
    expect(first.inventoryLot.availableQuantity).toBe("2");
    const released = await repository.transition({
      ...actor,
      expectedVersion: first.version,
      id: first.id,
      reason: "Release reservation back to accepted lot availability",
      targetStatus: "RELEASED",
    });
    expect(released.status).toBe("RELEASED");
    expect(released.transitions[0]).toMatchObject({
      quantitySnapshot: "3",
      sourceStatus: "ALLOCATED",
      targetStatus: "RELEASED",
    });
    const second = await repository.create({
      ...actor,
      bomLineId,
      conditionalAuthorized: false,
      inventoryLotId: fixture.lot.id,
      projectId: phaseTwoFixtures.demoProjectId,
      quantity: "5",
    });
    const consumed = await repository.transition({
      ...actor,
      expectedVersion: second.version,
      id: second.id,
      reason: "Issue material to production and record full consumption",
      targetStatus: "CONSUMED",
    });
    expect(consumed.status).toBe("CONSUMED");
    expect(consumed.inventoryLot.availableQuantity).toBe("0");
    expect(
      await database.auditEvent.count({
        where: {
          entityId: { in: [first.id, second.id] },
          entityType: "MaterialAllocation",
        },
      }),
    ).toBe(4);
  });

  it("rejects quarantined material and requires dedicated conditional authority", async () => {
    const quarantined = await finalizedFixture("QUARANTINED");
    await expect(
      repository.create({
        ...actor,
        bomLineId: quarantined.bom.revisions[0]!.lines[0]!.id,
        conditionalAuthorized: false,
        inventoryLotId: quarantined.lot.id,
        projectId: phaseTwoFixtures.demoProjectId,
        quantity: "1",
      }),
    ).rejects.toThrow("Rejected or quarantined material cannot be allocated");

    const conditional = await finalizedFixture("CONDITIONALLY_ACCEPTED");
    const conditionalInput = {
      ...actor,
      bomLineId: conditional.bom.revisions[0]!.lines[0]!.id,
      conditionalUseReason:
        "Controlled allocation approved for this BOM requirement",
      inventoryLotId: conditional.lot.id,
      projectId: phaseTwoFixtures.demoProjectId,
      quantity: "2",
    };
    await expect(
      repository.create({ ...conditionalInput, conditionalAuthorized: false }),
    ).rejects.toThrow("Conditional material requires");
    const allocation = await repository.create({
      ...conditionalInput,
      conditionalAuthorized: true,
    });
    expect(allocation.conditionalUseAuthorizedBy?.id).toBe(
      localFixtures.internalAdminUserId,
    );
    expect(
      await database.auditEvent.count({
        where: {
          action: "material-allocation.conditional-use-authorized",
          entityId: allocation.id,
        },
      }),
    ).toBe(1);
  });

  it("prevents concurrent over-allocation transactionally", async () => {
    const fixture = await finalizedFixture("ACCEPTED");
    const input = {
      ...actor,
      bomLineId: fixture.bom.revisions[0]!.lines[0]!.id,
      conditionalAuthorized: false,
      inventoryLotId: fixture.lot.id,
      projectId: phaseTwoFixtures.demoProjectId,
      quantity: "4",
    };
    const results = await Promise.allSettled([
      repository.create(input),
      repository.create(input),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    const total = await database.materialAllocation.aggregate({
      _sum: { quantity: true },
      where: {
        inventoryLotId: fixture.lot.id,
        status: { in: ["ALLOCATED", "CONSUMED"] },
      },
    });
    expect(total._sum.quantity?.toString()).toBe("4");
  });

  it("rolls allocation creation back when its audit write fails", async () => {
    const fixture = await finalizedFixture("ACCEPTED");
    await expect(
      repository.create({
        ...actor,
        bomLineId: fixture.bom.revisions[0]!.lines[0]!.id,
        conditionalAuthorized: false,
        context: { ...context, requestId: "x".repeat(200) },
        inventoryLotId: fixture.lot.id,
        projectId: phaseTwoFixtures.demoProjectId,
        quantity: "1",
      }),
    ).rejects.toThrow();
    expect(
      await database.materialAllocation.count({
        where: { inventoryLotId: fixture.lot.id },
      }),
    ).toBe(0);
  });
});
