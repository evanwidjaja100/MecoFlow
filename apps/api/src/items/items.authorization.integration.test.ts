import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
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

interface CreatedRecord {
  code: string;
  id: string;
  version: number;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function uniqueCode(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

describeWithDatabase("Phase 3A item-master authorization", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  let item: CreatedRecord;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    ({ app } = await createApplication());
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();

    const admin = await authenticated(localFixtures.internalAdminUserId);
    const category = await create<CreatedRecord>(
      admin,
      "/api/v1/item-categories",
      {
        code: uniqueCode("AUTH-CAT"),
        description: "Authorization item category",
        name: "Authorization item category",
      },
    );
    const unit = await create<CreatedRecord>(
      admin,
      "/api/v1/units-of-measure",
      {
        code: uniqueCode("AUTH-UOM").slice(0, 30),
        decimalPrecision: 2,
        name: "Authorization unit",
        symbol: "au",
      },
    );
    item = await create<CreatedRecord>(admin, "/api/v1/items", {
      code: uniqueCode("AUTH-ITEM"),
      description: "Authorization item fixture",
      itemCategoryId: category.id,
      name: "Authorization item fixture",
      specificationValues: [],
      unitOfMeasureId: unit.id,
    });
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

  async function create<T>(
    auth: AuthenticatedRequest,
    path: string,
    body: unknown,
  ): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      body: JSON.stringify(body),
      headers: {
        cookie: auth.cookie,
        "content-type": "application/json",
        "x-csrf-token": auth.csrf,
      },
      method: "POST",
    });
    const text = await response.text();
    expect(response.status, text).toBe(201);
    return JSON.parse(text) as T;
  }

  it("requires authentication for the item list", async () => {
    const response = await fetch(`${baseUrl}/api/v1/items`);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: "AUTHENTICATION_REQUIRED" },
    });
  });

  it("denies suppliers list, detail, export, and writes without revealing item existence", async () => {
    const supplier = await authenticated(localFixtures.supplierAdminUserId);
    const paths = [
      `/api/v1/items/${item.id}`,
      "/api/v1/items/ffffffff-ffff-4fff-8fff-ffffffffffff",
    ];
    const details = await Promise.all(
      paths.map((path) =>
        fetch(`${baseUrl}${path}`, { headers: { cookie: supplier.cookie } }),
      ),
    );
    expect(details.map(({ status }) => status)).toEqual([403, 403]);
    const detailBodies = (await Promise.all(
      details.map((response) => response.json()),
    )) as Array<{ error: { code: string; message: string } }>;
    expect(detailBodies[0]?.error).toEqual(detailBodies[1]?.error);
    expect(detailBodies[0]?.error).toEqual({
      code: "ACCESS_DENIED",
      message: "Access denied",
    });

    const list = await fetch(`${baseUrl}/api/v1/items`, {
      headers: { cookie: supplier.cookie },
    });
    expect(list.status).toBe(403);
    const exportResponse = await fetch(`${baseUrl}/api/v1/items/export.csv`, {
      headers: { cookie: supplier.cookie },
    });
    expect(exportResponse.status).toBe(403);

    const deniedWrite = await fetch(`${baseUrl}/api/v1/item-categories`, {
      body: JSON.stringify({
        code: uniqueCode("SUPPLIER-DENIED"),
        description: "Supplier must not write item master",
        name: "Supplier denied category",
      }),
      headers: {
        cookie: supplier.cookie,
        "content-type": "application/json",
        "x-csrf-token": supplier.csrf,
      },
      method: "POST",
    });
    expect(deniedWrite.status).toBe(403);
  });

  it("allows FINANCE_READONLY list and detail but denies export and writes", async () => {
    const readonly = await authenticated(localFixtures.internalReadonlyUserId);
    const list = await fetch(
      `${baseUrl}/api/v1/items?q=${encodeURIComponent(item.code.toLowerCase())}`,
      { headers: { cookie: readonly.cookie } },
    );
    expect(list.status).toBe(200);
    expect((await list.json()) as object).toMatchObject({
      data: [{ id: item.id }],
    });

    const detail = await fetch(`${baseUrl}/api/v1/items/${item.id}`, {
      headers: { cookie: readonly.cookie },
    });
    expect(detail.status).toBe(200);
    expect((await detail.json()) as object).toMatchObject({ id: item.id });

    const deniedExport = await fetch(
      `${baseUrl}/api/v1/items/export.csv?q=${encodeURIComponent(item.code)}`,
      { headers: { cookie: readonly.cookie } },
    );
    expect(deniedExport.status).toBe(403);

    const deniedWrite = await fetch(`${baseUrl}/api/v1/item-categories`, {
      body: JSON.stringify({
        code: uniqueCode("READONLY-DENIED"),
        description: "Read-only users must not write item master",
        name: "Read-only denied category",
      }),
      headers: {
        cookie: readonly.cookie,
        "content-type": "application/json",
        "x-csrf-token": readonly.csrf,
      },
      method: "POST",
    });
    expect(deniedWrite.status).toBe(403);
  });

  it("enforces CSRF on category, UOM, definition, item, edit, and deactivate commands", async () => {
    const admin = await authenticated(localFixtures.internalAdminUserId);
    const writes: Array<{
      body: unknown;
      method: "PATCH" | "POST";
      path: string;
    }> = [
      {
        body: {
          code: uniqueCode("NO-CSRF-CAT"),
          description: "Missing CSRF category",
          name: "Missing CSRF category",
        },
        method: "POST",
        path: "/api/v1/item-categories",
      },
      {
        body: {
          code: uniqueCode("NO-CSRF-UOM").slice(0, 30),
          decimalPrecision: 2,
          name: "Missing CSRF unit",
          symbol: "nc",
        },
        method: "POST",
        path: "/api/v1/units-of-measure",
      },
      {
        body: {
          active: true,
          code: uniqueCode("NO-CSRF-CAT-PATCH"),
          description: "Missing CSRF category edit",
          expectedVersion: 1,
          name: "Missing CSRF category edit",
        },
        method: "PATCH",
        path: "/api/v1/item-categories/ffffffff-ffff-4fff-8fff-ffffffffffff",
      },
      {
        body: {
          active: true,
          code: uniqueCode("NO-CSRF-UOM-PATCH").slice(0, 30),
          decimalPrecision: 2,
          expectedVersion: 1,
          name: "Missing CSRF unit edit",
          symbol: "nc",
        },
        method: "PATCH",
        path: "/api/v1/units-of-measure/ffffffff-ffff-4fff-8fff-ffffffffffff",
      },
      {
        body: {
          code: uniqueCode("NO-CSRF-ATTR"),
          dataType: "TEXT",
          description: "Missing CSRF definition",
          name: "Missing CSRF definition",
          required: false,
          sortOrder: 0,
        },
        method: "POST",
        path: `/api/v1/item-categories/ffffffff-ffff-4fff-8fff-ffffffffffff/specification-attributes`,
      },
      {
        body: {
          active: true,
          code: uniqueCode("NO-CSRF-ATTR-PATCH"),
          dataType: "TEXT",
          description: "Missing CSRF definition edit",
          expectedVersion: 1,
          name: "Missing CSRF definition edit",
          required: false,
          sortOrder: 0,
        },
        method: "PATCH",
        path: "/api/v1/item-categories/ffffffff-ffff-4fff-8fff-ffffffffffff/specification-attributes/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      },
      {
        body: {
          code: uniqueCode("NO-CSRF-ITEM"),
          description: "Missing CSRF item",
          itemCategoryId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          name: "Missing CSRF item",
          specificationValues: [],
          unitOfMeasureId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        },
        method: "POST",
        path: "/api/v1/items",
      },
      {
        body: {
          code: item.code,
          description: "Missing CSRF item edit",
          expectedVersion: item.version,
          name: "Missing CSRF item edit",
          specificationValues: [],
          unitOfMeasureId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        },
        method: "PATCH",
        path: `/api/v1/items/${item.id}`,
      },
      {
        body: { expectedVersion: item.version, reason: "Missing CSRF proof" },
        method: "POST",
        path: `/api/v1/items/${item.id}/deactivate`,
      },
    ];

    for (const write of writes) {
      const response = await fetch(`${baseUrl}${write.path}`, {
        body: JSON.stringify(write.body),
        headers: {
          cookie: admin.cookie,
          "content-type": "application/json",
        },
        method: write.method,
      });
      expect(response.status, `${write.method} ${write.path}`).toBe(403);
    }
  });
});
