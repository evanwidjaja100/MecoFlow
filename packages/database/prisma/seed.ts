import {
  createDatabaseClient,
  disconnectDatabaseClient,
} from "../src/client.js";
import { applyPhaseZeroSeed } from "../src/phase-zero-seed.js";
import { applyPhaseOneSeed } from "../src/phase-one-seed.js";
import { applyPhaseTwoSeed } from "../src/phase-two-seed.js";
import { applyPhaseThreeASeed } from "../src/phase-three-a-seed.js";
import { applyPhaseThreeBSeed } from "../src/phase-three-b-seed.js";
import { applyPhaseFourASeed } from "../src/phase-four-a-seed.js";
import { applyPhaseFourBSeed } from "../src/phase-four-b-seed.js";
import { applyPhaseFiveBSeed } from "../src/phase-five-b-seed.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL is required to seed the database");

const database = createDatabaseClient(databaseUrl);

await applyPhaseZeroSeed(database);
await applyPhaseOneSeed(database);
await applyPhaseTwoSeed(database);
await applyPhaseThreeASeed(database);
await applyPhaseThreeBSeed(database);
await applyPhaseFourASeed(database);
await applyPhaseFourBSeed(database);
await applyPhaseFiveBSeed(database);

await disconnectDatabaseClient();
