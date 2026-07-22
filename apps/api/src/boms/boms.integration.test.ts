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
import { BomsRepository } from "./boms.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 3B BOM lifecycle and release transactions", () => {
  let database: PrismaClient;
  let repository: BomsRepository;
  let bomId: string;
  let firstRevisionId: string;
  let secondRevisionId: string;
  const context = { correlationId: randomUUID(), requestId: randomUUID() };

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    const environment = parseServiceEnvironment(
      process.env,
    ) as ServiceEnvironment;
    repository = new BomsRepository(environment);
    const workPackage = await database.workPackage.create({
      data: {
        code: `BOM-${randomUUID().slice(0, 8).toUpperCase()}`,
        description: "Phase 3B transaction test scope",
        name: "BOM transaction scope",
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
    bomId = bom.id;
    const first = await database.bomRevision.create({
      data: {
        bomId,
        createdByUserId: localFixtures.internalAdminUserId,
        revisionNumber: 1,
        title: "First transaction revision",
      },
    });
    firstRevisionId = first.id;
    await database.bomLine.create({
      data: {
        bomRevisionId: first.id,
        itemId: phaseThreeAFixtures.demoItemId,
        lineNumber: 1,
        quantity: "1",
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
    });
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  function command(
    revisionId: string,
    expectedVersion: number,
    reason: string,
  ) {
    return {
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion,
      reason,
      revisionId,
    };
  }

  it("rejects duplicate revision numbers at the database boundary", async () => {
    await expect(
      database.bomRevision.create({
        data: {
          bomId,
          createdByUserId: localFixtures.internalAdminUserId,
          revisionNumber: 1,
          title: "Duplicate",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("releases transactionally and exposes only released lines as official", async () => {
    const reviewed = await repository.review(
      command(firstRevisionId, 1, "Ready for transaction review"),
    );
    const released = await repository.release(
      command(
        firstRevisionId,
        reviewed.version,
        "Approved transaction release",
      ),
    );
    expect(released.status).toBe("RELEASED");
    const official = await database.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM official_bom_lines
      WHERE "bomRevisionId" = ${firstRevisionId}::uuid
    `;
    expect(official[0]?.count).toBe(1n);
    expect(
      await database.auditEvent.count({
        where: { action: "BOM_REVISION_RELEASED", entityId: firstRevisionId },
      }),
    ).toBe(1);
  });

  it("atomically supersedes the prior release and retains one active released revision", async () => {
    const second = await database.bomRevision.create({
      data: {
        bomId,
        createdByUserId: localFixtures.internalAdminUserId,
        revisionNumber: 2,
        title: "Second transaction revision",
      },
    });
    secondRevisionId = second.id;
    await database.bomLine.create({
      data: {
        bomRevisionId: second.id,
        itemId: phaseThreeAFixtures.demoItemId,
        lineNumber: 1,
        quantity: "2",
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
    });
    const reviewed = await repository.review(
      command(second.id, 1, "Second revision review request"),
    );
    const released = await repository.release(
      command(
        second.id,
        reviewed.version,
        "Replace the first released revision",
      ),
    );
    expect(released.status).toBe("RELEASED");
    const statuses = await database.bomRevision.findMany({
      orderBy: { revisionNumber: "asc" },
      select: { status: true },
      where: { bomId },
    });
    expect(statuses.map(({ status }) => status)).toEqual([
      "SUPERSEDED",
      "RELEASED",
    ]);
    expect(
      await database.bomRevision.count({
        where: { bomId, status: "RELEASED" },
      }),
    ).toBe(1);
  });

  it("allows only one concurrent release of the same expected revision version", async () => {
    const third = await database.bomRevision.create({
      data: {
        bomId,
        createdByUserId: localFixtures.internalAdminUserId,
        revisionNumber: 3,
        title: "Concurrent release revision",
      },
    });
    await database.bomLine.create({
      data: {
        bomRevisionId: third.id,
        itemId: phaseThreeAFixtures.demoItemId,
        lineNumber: 1,
        quantity: "3",
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
    });
    const reviewed = await repository.review(
      command(third.id, 1, "Concurrent release review"),
    );
    const attempts = await Promise.allSettled([
      repository.release(
        command(third.id, reviewed.version, "First concurrent release"),
      ),
      repository.release(
        command(third.id, reviewed.version, "Second concurrent release"),
      ),
    ]);
    expect(
      attempts.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(attempts.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    expect(
      await database.bomRevision.count({
        where: { bomId, status: "RELEASED" },
      }),
    ).toBe(1);
  });

  it("does not supersede the active release when release rules reject a draft", async () => {
    const activeBefore = await database.bomRevision.findFirstOrThrow({
      where: { bomId, status: "RELEASED" },
    });
    const draft = await database.bomRevision.create({
      data: {
        bomId,
        createdByUserId: localFixtures.internalAdminUserId,
        revisionNumber: 4,
        title: "Invalid direct release",
      },
    });
    await expect(
      repository.release(
        command(draft.id, draft.version, "Direct draft release is forbidden"),
      ),
    ).rejects.toThrow();
    expect(
      await database.bomRevision.findUniqueOrThrow({
        where: { id: activeBefore.id },
      }),
    ).toMatchObject({ status: "RELEASED" });
    expect(secondRevisionId).toBeTruthy();
  });
});
