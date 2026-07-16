import {
  createDatabaseClient,
  disconnectDatabaseClient,
} from "../src/client.js";
import { applyPhaseZeroSeed } from "../src/phase-zero-seed.js";
import { applyPhaseOneSeed } from "../src/phase-one-seed.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL is required to seed the database");

const database = createDatabaseClient(databaseUrl);

await applyPhaseZeroSeed(database);
await applyPhaseOneSeed(database);

await disconnectDatabaseClient();
