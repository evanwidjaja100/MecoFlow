import {
  createDatabaseClient,
  disconnectDatabaseClient,
} from "../src/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL is required to seed the database");

const database = createDatabaseClient(databaseUrl);

await database.systemMetadata.upsert({
  where: { key: "seed.version" },
  create: { key: "seed.version", value: "phase-0" },
  update: { value: "phase-0", version: { increment: 1 } },
});

await disconnectDatabaseClient();
