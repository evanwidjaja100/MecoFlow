import { afterAll, describe, expect, it } from "vitest";
import { createDatabaseClient, disconnectDatabaseClient } from "./client.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("database integration", () => {
  afterAll(disconnectDatabaseClient);

  it("connects to PostgreSQL and reads technical metadata", async () => {
    const database = createDatabaseClient(databaseUrl!);
    const rows = await database.$queryRaw<
      Array<{ result: number }>
    >`SELECT 1 AS result`;
    expect(rows[0]?.result).toBe(1);
  });
});
