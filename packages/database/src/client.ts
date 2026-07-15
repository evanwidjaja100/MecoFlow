import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

let client: PrismaClient | undefined;

export function createDatabaseClient(databaseUrl: string): PrismaClient {
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  return client;
}

export async function disconnectDatabaseClient(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = undefined;
  }
}
