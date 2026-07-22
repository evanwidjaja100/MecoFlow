import type { PrismaClient } from "../generated/prisma/client.js";
import { localFixtures, shouldSeedLocalFixtures } from "./phase-one-seed.js";
import { phaseTwoFixtures } from "./phase-two-seed.js";

const phaseFourBFixtures = {
  localSupplierProjectMemberId: "60000000-0000-4000-8000-000000000002",
  mockSupplierProjectMemberId: "60000000-0000-4000-8000-000000000003",
} as const;

export async function applyPhaseFourBSeed(
  database: PrismaClient,
): Promise<void> {
  if (!shouldSeedLocalFixtures(process.env.APP_ENV)) return;
  await database.$transaction(async (transaction) => {
    const supplierMemberships = await transaction.membership.findMany({
      where: {
        organizationId: localFixtures.supplierOrganizationId,
        userId: {
          in: [
            localFixtures.supplierAdminUserId,
            localFixtures.mockSupplierAdminUserId,
          ],
        },
      },
    });
    const ids = new Map(
      supplierMemberships.map((value) => [value.userId, value.id]),
    );
    const rows = [
      {
        id: phaseFourBFixtures.localSupplierProjectMemberId,
        membershipId: ids.get(localFixtures.supplierAdminUserId),
      },
      {
        id: phaseFourBFixtures.mockSupplierProjectMemberId,
        membershipId: ids.get(localFixtures.mockSupplierAdminUserId),
      },
    ];
    for (const row of rows) {
      if (!row.membershipId) continue;
      await transaction.projectMember.createMany({
        data: {
          addedByUserId: localFixtures.internalAdminUserId,
          id: row.id,
          membershipId: row.membershipId,
          projectId: phaseTwoFixtures.demoProjectId,
          role: "SUPPLIER",
        },
        skipDuplicates: true,
      });
      await transaction.projectMember.updateMany({
        data: { role: "SUPPLIER", status: "ACTIVE" },
        where: {
          id: row.id,
          OR: [{ role: { not: "SUPPLIER" } }, { status: { not: "ACTIVE" } }],
        },
      });
    }
    await transaction.systemMetadata.updateMany({
      data: { value: "phase-4b", version: { increment: 1 } },
      where: { key: "seed.version", NOT: { value: "phase-4b" } },
    });
  });
}

export { phaseFourBFixtures };
