import type { PrismaClient } from "../generated/prisma/client.js";

export async function applyPhaseFourASeed(
  database: PrismaClient,
): Promise<void> {
  await database.systemMetadata.updateMany({
    data: { value: "phase-4a", version: { increment: 1 } },
    where: { key: "seed.version", NOT: { value: "phase-4a" } },
  });
}
