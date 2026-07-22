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

interface VersionedMaster {
  active: boolean;
  code: string;
  description: string;
  id: string;
  name: string;
  version: number;
}

interface UnitRecord extends VersionedMaster {
  decimalPrecision: number;
  symbol: string;
}

interface AttributeRecord extends VersionedMaster {
  dataType: "TEXT" | "NUMBER" | "BOOLEAN";
  decimalPrecision: number | null;
  itemCategoryId: string;
  required: boolean;
  sortOrder: number;
  unitOfMeasureId: string | null;
}

interface ItemRecord extends VersionedMaster {
  itemCategoryId: string;
  specificationValues: unknown[];
  unitOfMeasureId: string;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function uniqueCode(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

describeWithDatabase("Phase 3A item-master workflows and integrity", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  let admin: AuthenticatedRequest;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    ({ app } = await createApplication());
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
    admin = await authenticated(localFixtures.internalAdminUserId);
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

  async function request(
    path: string,
    options: {
      body?: unknown;
      headers?: Record<string, string>;
      method?: "DELETE" | "GET" | "PATCH" | "POST";
    } = {},
  ): Promise<Response> {
    const method = options.method ?? "GET";
    return fetch(`${baseUrl}${path}`, {
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
      headers: {
        cookie: admin.cookie,
        ...(options.body === undefined
          ? {}
          : {
              "content-type": "application/json",
              "x-csrf-token": admin.csrf,
            }),
        ...options.headers,
      },
      method,
    });
  }

  async function json<T>(
    response: Response,
    expectedStatus: number,
  ): Promise<T> {
    const text = await response.text();
    expect(response.status, text).toBe(expectedStatus);
    return JSON.parse(text) as T;
  }

  async function createCategory(
    overrides: Record<string, unknown> = {},
  ): Promise<VersionedMaster> {
    return json<VersionedMaster>(
      await request("/api/v1/item-categories", {
        body: {
          code: uniqueCode("CAT"),
          description: "Item integration category",
          name: "Item integration category",
          ...overrides,
        },
        method: "POST",
      }),
      201,
    );
  }

  async function createUnit(
    overrides: Record<string, unknown> = {},
  ): Promise<UnitRecord> {
    return json<UnitRecord>(
      await request("/api/v1/units-of-measure", {
        body: {
          code: uniqueCode("UOM").slice(0, 30),
          decimalPrecision: 3,
          name: "Integration unit",
          symbol: "iu",
          ...overrides,
        },
        method: "POST",
      }),
      201,
    );
  }

  async function createAttribute(
    itemCategoryId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<AttributeRecord> {
    return json<AttributeRecord>(
      await request(
        `/api/v1/item-categories/${itemCategoryId}/specification-attributes`,
        {
          body: {
            code: uniqueCode("ATTR"),
            dataType: "TEXT",
            description: "Integration specification attribute",
            name: "Integration attribute",
            required: false,
            sortOrder: 0,
            ...overrides,
          },
          method: "POST",
        },
      ),
      201,
    );
  }

  async function createItem(
    itemCategoryId: string,
    unitOfMeasureId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<ItemRecord> {
    return json<ItemRecord>(
      await request("/api/v1/items", {
        body: {
          code: uniqueCode("ITEM"),
          description: "Item integration fixture",
          itemCategoryId,
          name: "Item integration fixture",
          specificationValues: [],
          unitOfMeasureId,
          ...overrides,
        },
        method: "POST",
      }),
      201,
    );
  }

  async function deactivateItem(item: ItemRecord, reason: string) {
    return json<ItemRecord>(
      await request(`/api/v1/items/${item.id}/deactivate`, {
        body: { expectedVersion: item.version, reason },
        method: "POST",
      }),
      201,
    );
  }

  it("rejects duplicate item-category, unit, and item codes with 422", async () => {
    const category = await createCategory();
    const duplicateCategory = await request("/api/v1/item-categories", {
      body: {
        code: category.code,
        description: "Duplicate category code",
        name: "Duplicate category",
      },
      method: "POST",
    });
    expect(duplicateCategory.status).toBe(422);

    const unit = await createUnit();
    const duplicateUnit = await request("/api/v1/units-of-measure", {
      body: {
        code: unit.code,
        decimalPrecision: 2,
        name: "Duplicate unit",
        symbol: "du",
      },
      method: "POST",
    });
    expect(duplicateUnit.status).toBe(422);

    const item = await createItem(category.id, unit.id);
    const duplicateItem = await request("/api/v1/items", {
      body: {
        code: item.code,
        description: "Duplicate item code",
        itemCategoryId: category.id,
        name: "Duplicate item",
        specificationValues: [],
        unitOfMeasureId: unit.id,
      },
      method: "POST",
    });
    expect(duplicateItem.status).toBe(422);
  });

  it("accepts UOM precision zero through six and rejects values outside it", async () => {
    const minimum = await createUnit({ decimalPrecision: 0 });
    const maximum = await createUnit({ decimalPrecision: 6 });
    expect(minimum.decimalPrecision).toBe(0);
    expect(maximum.decimalPrecision).toBe(6);

    for (const decimalPrecision of [-1, 7, 1.5]) {
      const response = await request("/api/v1/units-of-measure", {
        body: {
          code: uniqueCode("BAD-UOM").slice(0, 30),
          decimalPrecision,
          name: "Invalid precision unit",
          symbol: "bad",
        },
        method: "POST",
      });
      expect(response.status).toBe(400);
    }
  });

  it("validates specification shape, units, precision, and active parents", async () => {
    const category = await createCategory();
    const unit = await createUnit({ decimalPrecision: 2 });
    const numberAttribute = await createAttribute(category.id, {
      dataType: "NUMBER",
      decimalPrecision: 2,
      required: true,
      unitOfMeasureId: unit.id,
    });
    expect(numberAttribute).toMatchObject({
      dataType: "NUMBER",
      decimalPrecision: 2,
      unitOfMeasureId: unit.id,
    });

    for (const dataType of ["TEXT", "BOOLEAN"] as const) {
      const invalid = await request(
        `/api/v1/item-categories/${category.id}/specification-attributes`,
        {
          body: {
            code: uniqueCode(`BAD-${dataType}`),
            dataType,
            decimalPrecision: 1,
            description: "Invalid structured definition",
            name: `Invalid ${dataType} definition`,
            required: false,
            sortOrder: 1,
            unitOfMeasureId: unit.id,
          },
          method: "POST",
        },
      );
      expect(invalid.status).toBe(422);
    }

    const overUnitPrecision = await request(
      `/api/v1/item-categories/${category.id}/specification-attributes`,
      {
        body: {
          code: uniqueCode("TOO-PRECISE"),
          dataType: "NUMBER",
          decimalPrecision: 3,
          description: "Precision exceeds the unit",
          name: "Too precise",
          required: false,
          sortOrder: 2,
          unitOfMeasureId: unit.id,
        },
        method: "POST",
      },
    );
    expect(overUnitPrecision.status).toBe(422);

    const referencedUnitDeactivation = await request(
      `/api/v1/units-of-measure/${unit.id}`,
      {
        body: {
          active: false,
          code: unit.code,
          decimalPrecision: unit.decimalPrecision,
          expectedVersion: unit.version,
          name: unit.name,
          symbol: unit.symbol,
        },
        method: "PATCH",
      },
    );
    expect(referencedUnitDeactivation.status).toBe(422);

    const unusedUnit = await createUnit({ decimalPrecision: 2 });
    const inactiveUnit = await json<UnitRecord>(
      await request(`/api/v1/units-of-measure/${unusedUnit.id}`, {
        body: {
          active: false,
          code: unusedUnit.code,
          decimalPrecision: unusedUnit.decimalPrecision,
          expectedVersion: unusedUnit.version,
          name: unusedUnit.name,
          symbol: unusedUnit.symbol,
        },
        method: "PATCH",
      }),
      200,
    );
    expect(inactiveUnit.active).toBe(false);
    const inactiveUnitReference = await request(
      `/api/v1/item-categories/${category.id}/specification-attributes`,
      {
        body: {
          code: uniqueCode("INACTIVE-UOM"),
          dataType: "NUMBER",
          decimalPrecision: 1,
          description: "Inactive UOM reference",
          name: "Inactive UOM reference",
          required: false,
          sortOrder: 3,
          unitOfMeasureId: inactiveUnit.id,
        },
        method: "POST",
      },
    );
    expect(inactiveUnitReference.status).toBe(422);

    const inactiveCategory = await json<VersionedMaster>(
      await request(`/api/v1/item-categories/${category.id}`, {
        body: {
          active: false,
          code: category.code,
          description: category.description,
          expectedVersion: category.version,
          name: category.name,
        },
        method: "PATCH",
      }),
      200,
    );
    expect(inactiveCategory.active).toBe(false);
    const inactiveCategoryDefinition = await request(
      `/api/v1/item-categories/${category.id}/specification-attributes`,
      {
        body: {
          code: uniqueCode("INACTIVE-CAT"),
          dataType: "TEXT",
          description: "Inactive category reference",
          name: "Inactive category reference",
          required: false,
          sortOrder: 4,
        },
        method: "POST",
      },
    );
    expect(inactiveCategoryDefinition.status).toBe(422);
  });

  it("requires active, category-matched definitions and enforces NUMBER value precision", async () => {
    const category = await createCategory();
    const otherCategory = await createCategory();
    const unit = await createUnit({ decimalPrecision: 3 });
    const material = await createAttribute(category.id, {
      code: uniqueCode("MATERIAL"),
      dataType: "TEXT",
      required: true,
      sortOrder: 0,
    });
    const thickness = await createAttribute(category.id, {
      code: uniqueCode("THICKNESS"),
      dataType: "NUMBER",
      decimalPrecision: 2,
      required: true,
      sortOrder: 1,
      unitOfMeasureId: unit.id,
    });
    const foreignAttribute = await createAttribute(otherCategory.id, {
      code: uniqueCode("FOREIGN"),
      dataType: "TEXT",
      required: false,
    });
    const inactiveAttribute = await createAttribute(category.id, {
      code: uniqueCode("INACTIVE"),
      dataType: "BOOLEAN",
      required: false,
      sortOrder: 2,
    });
    await json<AttributeRecord>(
      await request(
        `/api/v1/item-categories/${category.id}/specification-attributes/${inactiveAttribute.id}`,
        {
          body: {
            active: false,
            code: inactiveAttribute.code,
            dataType: inactiveAttribute.dataType,
            description: inactiveAttribute.description,
            expectedVersion: inactiveAttribute.version,
            name: inactiveAttribute.name,
            required: inactiveAttribute.required,
            sortOrder: inactiveAttribute.sortOrder,
          },
          method: "PATCH",
        },
      ),
      200,
    );

    const missingRequired = await request("/api/v1/items", {
      body: {
        code: uniqueCode("MISSING"),
        description: "Missing required thickness",
        itemCategoryId: category.id,
        name: "Missing required specification",
        specificationValues: [
          { attributeDefinitionId: material.id, value: "316L" },
        ],
        unitOfMeasureId: unit.id,
      },
      method: "POST",
    });
    expect(missingRequired.status).toBe(422);

    const tooPrecise = await request("/api/v1/items", {
      body: {
        code: uniqueCode("PRECISE"),
        description: "Excess number precision",
        itemCategoryId: category.id,
        name: "Excess precision specification",
        specificationValues: [
          { attributeDefinitionId: material.id, value: "316L" },
          { attributeDefinitionId: thickness.id, value: "12.345" },
        ],
        unitOfMeasureId: unit.id,
      },
      method: "POST",
    });
    expect(tooPrecise.status).toBe(422);

    const categoryMismatch = await request("/api/v1/items", {
      body: {
        code: uniqueCode("MISMATCH"),
        description: "Foreign definition",
        itemCategoryId: category.id,
        name: "Category mismatch specification",
        specificationValues: [
          { attributeDefinitionId: material.id, value: "316L" },
          { attributeDefinitionId: thickness.id, value: "12.34" },
          { attributeDefinitionId: foreignAttribute.id, value: "foreign" },
        ],
        unitOfMeasureId: unit.id,
      },
      method: "POST",
    });
    expect(categoryMismatch.status).toBe(422);

    const inactiveDefinition = await request("/api/v1/items", {
      body: {
        code: uniqueCode("INACTIVE-ATTR"),
        description: "Inactive definition",
        itemCategoryId: category.id,
        name: "Inactive definition specification",
        specificationValues: [
          { attributeDefinitionId: material.id, value: "316L" },
          { attributeDefinitionId: thickness.id, value: "12.34" },
          { attributeDefinitionId: inactiveAttribute.id, value: true },
        ],
        unitOfMeasureId: unit.id,
      },
      method: "POST",
    });
    expect(inactiveDefinition.status).toBe(422);

    const valid = await createItem(category.id, unit.id, {
      specificationValues: [
        { attributeDefinitionId: material.id, value: "316L" },
        { attributeDefinitionId: thickness.id, value: "12.34" },
      ],
    });
    const detail = await json<ItemRecord>(
      await request(`/api/v1/items/${valid.id}`),
      200,
    );
    expect(detail.specificationValues).toHaveLength(2);
  });

  it("rejects inactive category and UOM references for new items", async () => {
    const category = await createCategory();
    const unit = await createUnit();
    await json<VersionedMaster>(
      await request(`/api/v1/item-categories/${category.id}`, {
        body: {
          active: false,
          code: category.code,
          description: category.description,
          expectedVersion: category.version,
          name: category.name,
        },
        method: "PATCH",
      }),
      200,
    );
    expect(
      (
        await request("/api/v1/items", {
          body: {
            code: uniqueCode("INACTIVE-CAT"),
            description: "Inactive category item",
            itemCategoryId: category.id,
            name: "Inactive category item",
            specificationValues: [],
            unitOfMeasureId: unit.id,
          },
          method: "POST",
        })
      ).status,
    ).toBe(422);

    const activeCategory = await createCategory();
    await json<UnitRecord>(
      await request(`/api/v1/units-of-measure/${unit.id}`, {
        body: {
          active: false,
          code: unit.code,
          decimalPrecision: unit.decimalPrecision,
          expectedVersion: unit.version,
          name: unit.name,
          symbol: unit.symbol,
        },
        method: "PATCH",
      }),
      200,
    );
    expect(
      (
        await request("/api/v1/items", {
          body: {
            code: uniqueCode("INACTIVE-UOM"),
            description: "Inactive UOM item",
            itemCategoryId: activeCategory.id,
            name: "Inactive UOM item",
            specificationValues: [],
            unitOfMeasureId: unit.id,
          },
          method: "POST",
        })
      ).status,
    ).toBe(422);
  });

  it("deactivates rather than deleting and rejects subsequent edits", async () => {
    const category = await createCategory();
    const unit = await createUnit();
    const item = await createItem(category.id, unit.id);

    const noDeleteRoute = await request(`/api/v1/items/${item.id}`, {
      method: "DELETE",
    });
    expect(noDeleteRoute.status).toBe(404);

    const reason = "Obsolete engineering catalog entry";
    const deactivated = await deactivateItem(item, reason);
    expect(deactivated).toMatchObject({
      active: false,
      version: item.version + 1,
    });

    const editAfterDeactivation = await request(`/api/v1/items/${item.id}`, {
      body: {
        code: item.code,
        description: "A deactivated item must remain read-only",
        expectedVersion: deactivated.version,
        name: item.name,
        specificationValues: [],
        unitOfMeasureId: unit.id,
      },
      method: "PATCH",
    });
    expect(editAfterDeactivation.status).toBe(422);

    const staleDeactivation = await request(
      `/api/v1/items/${item.id}/deactivate`,
      {
        body: { expectedVersion: item.version, reason: "Stale command" },
        method: "POST",
      },
    );
    expect(staleDeactivation.status).toBe(409);

    await expect(
      database.item.delete({ where: { id: item.id } }),
    ).rejects.toThrow(/deactivat|cannot be deleted/i);
    expect(
      await database.item.findUnique({ where: { id: item.id } }),
    ).not.toBeNull();

    const audit = await database.auditEvent.findFirstOrThrow({
      where: { action: "ITEM_DEACTIVATED", entityId: item.id },
    });
    expect(audit).toMatchObject({
      actorUserId: localFixtures.internalAdminUserId,
      outcome: "SUCCESS",
    });
    expect(audit.changes).toMatchObject({ reason });
  });

  it("searches case-insensitively and applies category, UOM, active, sort, and pagination filters", async () => {
    const marker = randomBytes(5).toString("hex").toUpperCase();
    const category = await createCategory();
    const otherCategory = await createCategory();
    const unit = await createUnit();
    const otherUnit = await createUnit();
    const alpha = await createItem(category.id, unit.id, {
      code: `ALPHA-${marker}`,
      name: `Alpha plate ${marker}`,
    });
    const zulu = await createItem(category.id, unit.id, {
      code: `ZULU-${marker}`,
      name: `Zulu plate ${marker}`,
    });
    const inactive = await createItem(otherCategory.id, otherUnit.id, {
      code: `OLD-${marker}`,
      name: `Obsolete plate ${marker}`,
    });
    await deactivateItem(inactive, "Search filter fixture");

    const codeSearch = await json<{ data: ItemRecord[] }>(
      await request(`/api/v1/items?q=${alpha.code.toLowerCase()}`),
      200,
    );
    expect(codeSearch.data.map(({ id }) => id)).toContain(alpha.id);

    const nameSearch = await json<{ data: ItemRecord[] }>(
      await request(
        `/api/v1/items?q=${encodeURIComponent(`zulu plate ${marker.toLowerCase()}`)}`,
      ),
      200,
    );
    expect(nameSearch.data.map(({ id }) => id)).toContain(zulu.id);

    const filtered = await json<{
      data: ItemRecord[];
      pagination: { page: number; pageSize: number; total: number };
    }>(
      await request(
        `/api/v1/items?q=${marker.toLowerCase()}&categoryId=${category.id}&unitOfMeasureId=${unit.id}&active=true&sort=name&direction=desc&page=1&pageSize=2`,
      ),
      200,
    );
    expect(filtered.data.map(({ id }) => id)).toEqual([zulu.id, alpha.id]);
    expect(filtered.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 2,
    });

    const inactiveOnly = await json<{ data: ItemRecord[] }>(
      await request(
        `/api/v1/items?q=${marker.toLowerCase()}&active=false&categoryId=${otherCategory.id}&unitOfMeasureId=${otherUnit.id}`,
      ),
      200,
    );
    expect(inactiveOnly.data.map(({ id }) => id)).toEqual([inactive.id]);
  });

  it("exports the same filtered items as formula-safe CSV and audits the export", async () => {
    const marker = randomBytes(5).toString("hex").toUpperCase();
    const category = await createCategory();
    const otherCategory = await createCategory();
    const unit = await createUnit();
    const formulaName = `=SUM(1,1)+${marker}`;
    const exported = await createItem(category.id, unit.id, {
      code: `CSV-${marker}`,
      name: formulaName,
    });
    const excluded = await createItem(otherCategory.id, unit.id, {
      code: `EXCLUDED-${marker}`,
      name: `Excluded ${marker}`,
    });
    const requestId = `items-export-${marker}`;
    const response = await request(
      `/api/v1/items/export.csv?q=${marker.toLowerCase()}&categoryId=${category.id}&unitOfMeasureId=${unit.id}&active=true&sort=code&direction=asc`,
      { headers: { "x-request-id": requestId } },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/csv\b/i);
    expect(response.headers.get("content-disposition")).toMatch(
      /attachment;\s*filename="?items\.csv"?/i,
    );
    const csv = await response.text();
    expect(csv).toContain(exported.code);
    expect(csv).not.toContain(excluded.code);
    expect(csv).toContain(`'${formulaName}`);
    expect(csv).not.toContain(`"${formulaName}`);

    const audit = await database.auditEvent.findFirstOrThrow({
      where: { action: "ITEMS_EXPORTED", requestId },
    });
    expect(audit).toMatchObject({
      actorUserId: localFixtures.internalAdminUserId,
      outcome: "SUCCESS",
    });
  });

  it("audits category, UOM, definition, and item creates and updates", async () => {
    const category = await createCategory();
    const unit = await createUnit();
    const attribute = await createAttribute(category.id);
    const item = await createItem(category.id, unit.id);

    await json<VersionedMaster>(
      await request(`/api/v1/item-categories/${category.id}`, {
        body: {
          active: category.active,
          code: category.code,
          description: "Updated audit category",
          expectedVersion: category.version,
          name: category.name,
        },
        method: "PATCH",
      }),
      200,
    );
    await json<UnitRecord>(
      await request(`/api/v1/units-of-measure/${unit.id}`, {
        body: {
          active: unit.active,
          code: unit.code,
          decimalPrecision: unit.decimalPrecision,
          expectedVersion: unit.version,
          name: unit.name,
          symbol: "iu2",
        },
        method: "PATCH",
      }),
      200,
    );
    await json<AttributeRecord>(
      await request(
        `/api/v1/item-categories/${category.id}/specification-attributes/${attribute.id}`,
        {
          body: {
            active: attribute.active,
            code: attribute.code,
            dataType: attribute.dataType,
            description: "Updated audit attribute",
            expectedVersion: attribute.version,
            name: attribute.name,
            required: attribute.required,
            sortOrder: attribute.sortOrder,
          },
          method: "PATCH",
        },
      ),
      200,
    );
    await json<ItemRecord>(
      await request(`/api/v1/items/${item.id}`, {
        body: {
          code: item.code,
          description: "Updated audit item",
          expectedVersion: item.version,
          name: item.name,
          specificationValues: [],
          unitOfMeasureId: item.unitOfMeasureId,
        },
        method: "PATCH",
      }),
      200,
    );

    const events = await database.auditEvent.findMany({
      select: {
        action: true,
        actorUserId: true,
        entityId: true,
        outcome: true,
      },
      where: {
        entityId: { in: [category.id, unit.id, attribute.id, item.id] },
      },
    });
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "ITEM_CATEGORY_CREATED",
          entityId: category.id,
        }),
        expect.objectContaining({
          action: "ITEM_CATEGORY_UPDATED",
          entityId: category.id,
        }),
        expect.objectContaining({
          action: "UNIT_OF_MEASURE_CREATED",
          entityId: unit.id,
        }),
        expect.objectContaining({
          action: "UNIT_OF_MEASURE_UPDATED",
          entityId: unit.id,
        }),
        expect.objectContaining({
          action: "SPECIFICATION_ATTRIBUTE_CREATED",
          entityId: attribute.id,
        }),
        expect.objectContaining({
          action: "SPECIFICATION_ATTRIBUTE_UPDATED",
          entityId: attribute.id,
        }),
        expect.objectContaining({ action: "ITEM_CREATED", entityId: item.id }),
        expect.objectContaining({ action: "ITEM_UPDATED", entityId: item.id }),
      ]),
    );
    expect(
      events.every(
        ({ actorUserId, outcome }) =>
          actorUserId === localFixtures.internalAdminUserId &&
          outcome === "SUCCESS",
      ),
    ).toBe(true);
  });

  it("allows exactly one concurrent item edit for an expected version", async () => {
    const category = await createCategory();
    const unit = await createUnit();
    const item = await createItem(category.id, unit.id);
    const edit = (name: string) =>
      request(`/api/v1/items/${item.id}`, {
        body: {
          code: item.code,
          description: "Concurrent item edit fixture",
          expectedVersion: item.version,
          name,
          specificationValues: [],
          unitOfMeasureId: unit.id,
        },
        method: "PATCH",
      });

    const responses = await Promise.all([
      edit("Concurrent item edit A"),
      edit("Concurrent item edit B"),
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(
      await database.auditEvent.count({
        where: { action: "ITEM_UPDATED", entityId: item.id },
      }),
    ).toBe(1);
  });
});
