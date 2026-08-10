import type { PrismaClient } from "../generated/prisma/client.js";

export async function applyPhaseSixASeed(
  database: PrismaClient,
): Promise<void> {
  await database.systemMetadata.updateMany({
    data: { value: "phase-6a", version: { increment: 1 } },
    where: { key: "seed.version", NOT: { value: "phase-6a" } },
  });
}
