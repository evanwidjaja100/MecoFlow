import type { PrismaClient } from "../generated/prisma/client.js";
import { localFixtures, shouldSeedLocalFixtures } from "./phase-one-seed.js";

const phaseTwoFixtures = {
  demoCategoryId: "40000000-0000-4000-8000-000000000001",
  demoProjectId: "50000000-0000-4000-8000-000000000001",
  demoProjectMemberId: "60000000-0000-4000-8000-000000000001",
  demoMilestoneId: "70000000-0000-4000-8000-000000000001",
  demoWorkPackageId: "80000000-0000-4000-8000-000000000001",
} as const;

export async function applyPhaseTwoSeed(database: PrismaClient): Promise<void> {
  if (!shouldSeedLocalFixtures(process.env.APP_ENV)) return;

  await database.$transaction(async (transaction) => {
    await transaction.productCategory.createMany({
      data: {
        code: "PROCESS-EQUIPMENT",
        description: "Engineered process equipment and fabrication projects",
        id: phaseTwoFixtures.demoCategoryId,
        name: "Process equipment",
      },
      skipDuplicates: true,
    });
    await transaction.productCategory.updateMany({
      data: {
        active: true,
        description: "Engineered process equipment and fabrication projects",
        name: "Process equipment",
      },
      where: {
        id: phaseTwoFixtures.demoCategoryId,
        OR: [
          { active: { not: true } },
          { name: { not: "Process equipment" } },
          {
            description: {
              not: "Engineered process equipment and fabrication projects",
            },
          },
        ],
      },
    });

    const plannedStartDate = new Date("2026-08-03T00:00:00.000Z");
    const plannedEndDate = new Date("2026-11-27T00:00:00.000Z");
    await transaction.project.createMany({
      data: {
        code: "DEMO-2026",
        createdByUserId: localFixtures.internalAdminUserId,
        description: "Fictional local demonstration project",
        id: phaseTwoFixtures.demoProjectId,
        name: "Demo process equipment project",
        organizationId: localFixtures.internalOrganizationId,
        plannedEndDate,
        plannedStartDate,
        productCategoryId: phaseTwoFixtures.demoCategoryId,
      },
      skipDuplicates: true,
    });
    await transaction.project.updateMany({
      data: {
        description: "Fictional local demonstration project",
        name: "Demo process equipment project",
        plannedEndDate,
        plannedStartDate,
        productCategoryId: phaseTwoFixtures.demoCategoryId,
      },
      where: {
        id: phaseTwoFixtures.demoProjectId,
        OR: [
          { description: { not: "Fictional local demonstration project" } },
          { name: { not: "Demo process equipment project" } },
          { plannedEndDate: { not: plannedEndDate } },
          { plannedStartDate: { not: plannedStartDate } },
          { productCategoryId: { not: phaseTwoFixtures.demoCategoryId } },
        ],
      },
    });

    const membership = await transaction.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.internalOrganizationId,
          userId: localFixtures.internalAdminUserId,
        },
      },
    });
    await transaction.projectMember.createMany({
      data: {
        addedByUserId: localFixtures.internalAdminUserId,
        id: phaseTwoFixtures.demoProjectMemberId,
        membershipId: membership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "PROJECT_MANAGER",
      },
      skipDuplicates: true,
    });

    await transaction.milestone.createMany({
      data: {
        code: "FAB-START",
        description: "Planned fabrication commencement",
        id: phaseTwoFixtures.demoMilestoneId,
        name: "Fabrication start",
        projectId: phaseTwoFixtures.demoProjectId,
        targetDate: new Date("2026-09-14T00:00:00.000Z"),
      },
      skipDuplicates: true,
    });
    await transaction.workPackage.createMany({
      data: {
        code: "WP-001",
        description: "Demo fabrication preparation work package",
        id: phaseTwoFixtures.demoWorkPackageId,
        milestoneId: phaseTwoFixtures.demoMilestoneId,
        name: "Fabrication preparation",
        plannedEndDate: new Date("2026-09-11T00:00:00.000Z"),
        plannedStartDate: new Date("2026-08-03T00:00:00.000Z"),
        projectId: phaseTwoFixtures.demoProjectId,
      },
      skipDuplicates: true,
    });

    await transaction.systemMetadata.updateMany({
      data: { value: "phase-2", version: { increment: 1 } },
      where: { key: "seed.version", NOT: { value: "phase-2" } },
    });
  });
}

export { phaseTwoFixtures };
