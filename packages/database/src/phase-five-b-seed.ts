import type { PrismaClient } from "../generated/prisma/client.js";

export async function applyPhaseFiveBSeed(
  database: PrismaClient,
): Promise<void> {
  await database.systemMetadata.updateMany({
    data: { value: "phase-5b", version: { increment: 1 } },
    where: { key: "seed.version", NOT: { value: "phase-5b" } },
  });
}
