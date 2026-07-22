import { afterAll, describe, expect, it } from "vitest";
import { createDatabaseClient, disconnectDatabaseClient } from "./client.js";
import { applyPhaseZeroSeed } from "./phase-zero-seed.js";
import { applyPhaseOneSeed, localFixtures } from "./phase-one-seed.js";
import { applyPhaseTwoSeed, phaseTwoFixtures } from "./phase-two-seed.js";
import {
  applyPhaseThreeASeed,
  phaseThreeAFixtures,
} from "./phase-three-a-seed.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("database integration", () => {
  afterAll(disconnectDatabaseClient);

  it("connects to PostgreSQL and reads technical metadata", async () => {
    const database = createDatabaseClient(databaseUrl!);
    const rows = await database.$queryRaw<
      Array<{ result: number }>
    >`SELECT 1 AS result`;
    expect(rows[0]?.result).toBe(1);
  });

  it("applies the Phase 0 seed idempotently", async () => {
    const database = createDatabaseClient(databaseUrl!);
    await applyPhaseZeroSeed(database);
    const firstResult = await database.systemMetadata.findUniqueOrThrow({
      where: { key: "seed.version" },
    });

    await applyPhaseZeroSeed(database);
    const secondResult = await database.systemMetadata.findUniqueOrThrow({
      where: { key: "seed.version" },
    });

    expect(secondResult).toEqual(firstResult);
  });

  it("applies the Phase 1 roles and local fixtures idempotently", async () => {
    const database = createDatabaseClient(databaseUrl!);
    await applyPhaseOneSeed(database);
    const firstResult = await Promise.all([
      database.systemMetadata.findUniqueOrThrow({
        where: { key: "seed.version" },
      }),
      database.organization.findUniqueOrThrow({
        where: { id: localFixtures.internalOrganizationId },
      }),
      database.userProfile.findUniqueOrThrow({
        where: { id: localFixtures.internalAdminUserId },
      }),
      database.membership.findUniqueOrThrow({
        where: {
          userId_organizationId: {
            organizationId: localFixtures.internalOrganizationId,
            userId: localFixtures.internalAdminUserId,
          },
        },
      }),
    ]);

    await applyPhaseOneSeed(database);
    const secondResult = await Promise.all([
      database.systemMetadata.findUniqueOrThrow({
        where: { key: "seed.version" },
      }),
      database.organization.findUniqueOrThrow({
        where: { id: localFixtures.internalOrganizationId },
      }),
      database.userProfile.findUniqueOrThrow({
        where: { id: localFixtures.internalAdminUserId },
      }),
      database.membership.findUniqueOrThrow({
        where: {
          userId_organizationId: {
            organizationId: localFixtures.internalOrganizationId,
            userId: localFixtures.internalAdminUserId,
          },
        },
      }),
    ]);
    expect(secondResult).toEqual(firstResult);
  });

  it("applies the Phase 2 demo project idempotently", async () => {
    const database = createDatabaseClient(databaseUrl!);
    await applyPhaseTwoSeed(database);
    const firstResult = await database.project.findUniqueOrThrow({
      include: { members: true, milestones: true, workPackages: true },
      where: { id: phaseTwoFixtures.demoProjectId },
    });

    await applyPhaseTwoSeed(database);
    const secondResult = await database.project.findUniqueOrThrow({
      include: { members: true, milestones: true, workPackages: true },
      where: { id: phaseTwoFixtures.demoProjectId },
    });
    expect(secondResult).toEqual(firstResult);
  });

  it("applies the Phase 3A item-master fixtures idempotently", async () => {
    const database = createDatabaseClient(databaseUrl!);
    await applyPhaseThreeASeed(database);
    const firstResult = await database.item.findUniqueOrThrow({
      include: { specificationValues: true },
      where: { id: phaseThreeAFixtures.demoItemId },
    });

    await applyPhaseThreeASeed(database);
    const secondResult = await database.item.findUniqueOrThrow({
      include: { specificationValues: true },
      where: { id: phaseThreeAFixtures.demoItemId },
    });
    expect(secondResult).toEqual(firstResult);
  });
});
