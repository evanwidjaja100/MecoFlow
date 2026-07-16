import type { PrismaClient } from "../generated/prisma/client.js";

const phaseZeroSeed = {
  key: "seed.version",
  value: "phase-0",
} as const;

export async function applyPhaseZeroSeed(
  database: PrismaClient,
): Promise<void> {
  await database.systemMetadata.createMany({
    data: phaseZeroSeed,
    skipDuplicates: true,
  });
  await database.systemMetadata.updateMany({
    data: { value: phaseZeroSeed.value, version: { increment: 1 } },
    where: { key: phaseZeroSeed.key, NOT: { value: phaseZeroSeed.value } },
  });
}
