import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { INestApplication } from "@nestjs/common";
import { createApplication } from "../bootstrap.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

interface AuthenticatedRequest {
  cookie: string;
  csrf: string;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 3B BOM authorization", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    ({ app } = await createApplication());
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    if (sessionHashes.length > 0)
      await database.session.deleteMany({
        where: { tokenHash: { in: sessionHashes } },
      });
    if (app) await app.close();
    await disconnectDatabaseClient();
  });

  async function authenticated(userId: string): Promise<AuthenticatedRequest> {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    sessionHashes.push(tokenHash);
    await database.session.create({
      data: {
        csrfTokenHash: hash(csrf),
        expiresAt: new Date(Date.now() + 10 * 60_000),
        tokenHash,
        userId,
      },
    });
    return {
      cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}`,
      csrf,
    };
  }

  it("requires authentication and permits an authorized internal project member", async () => {
    expect(
      (
        await fetch(
          `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/boms`,
        )
      ).status,
    ).toBe(401);
    const admin = await authenticated(localFixtures.internalAdminUserId);
    const allowed = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/boms`,
      { headers: { cookie: admin.cookie } },
    );
    expect(allowed.status).toBe(200);
  });

  it("denies suppliers before disclosing real versus nonexistent project identifiers", async () => {
    const supplier = await authenticated(localFixtures.supplierAdminUserId);
    const responses = await Promise.all(
      [
        phaseTwoFixtures.demoProjectId,
        "ffffffff-ffff-4fff-8fff-ffffffffffff",
      ].map((projectId) =>
        fetch(`${baseUrl}/api/v1/projects/${projectId}/boms`, {
          headers: { cookie: supplier.cookie },
        }),
      ),
    );
    expect(responses.map(({ status }) => status)).toEqual([403, 403]);
    const bodies = (await Promise.all(
      responses.map((response) => response.json()),
    )) as Array<{
      error: unknown;
    }>;
    expect(bodies[0]?.error).toEqual(bodies[1]?.error);
  });

  it("enforces project scope for internal read-only users with safe identifier equivalence", async () => {
    const readonly = await authenticated(localFixtures.internalReadonlyUserId);
    const responses = await Promise.all(
      [
        phaseTwoFixtures.demoProjectId,
        "ffffffff-ffff-4fff-8fff-ffffffffffff",
      ].map((projectId) =>
        fetch(`${baseUrl}/api/v1/projects/${projectId}/boms`, {
          headers: { cookie: readonly.cookie },
        }),
      ),
    );
    expect(responses.map(({ status }) => status)).toEqual([404, 404]);
    const bodies = (await Promise.all(
      responses.map((response) => response.json()),
    )) as Array<{
      error: unknown;
    }>;
    expect(bodies[0]?.error).toEqual(bodies[1]?.error);
  });

  it("requires CSRF before accepting an upload body", async () => {
    const admin = await authenticated(localFixtures.internalAdminUserId);
    const response = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/bom-imports`,
      {
        body: JSON.stringify({
          contentBase64: Buffer.from(
            "item_code,item_name,quantity,unit_code,criticality,notes\n",
          ).toString("base64"),
          fileName: "denied.csv",
          mimeType: "text/csv",
        }),
        headers: { cookie: admin.cookie, "content-type": "application/json" },
        method: "POST",
      },
    );
    expect(response.status).toBe(403);
  });
});
