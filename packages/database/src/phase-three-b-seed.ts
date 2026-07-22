import type { PrismaClient } from "../generated/prisma/client.js";

export async function applyPhaseThreeBSeed(
  database: PrismaClient,
): Promise<void> {
  await database.systemMetadata.updateMany({
    data: { value: "phase-3b", version: { increment: 1 } },
    where: { key: "seed.version", NOT: { value: "phase-3b" } },
  });
}
