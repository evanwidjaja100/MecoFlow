This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.githooks/
  pre-commit
.github/
  workflows/
    ci.yml
  dependency-review-config.yml
apps/
  api/
    src/
      administration/
        administration.controller.ts
        administration.dto.ts
        administration.repository.ts
        administration.service.ts
      authorization/
        authorization.policy.authorization.test.ts
        authorization.policy.ts
        identity.authorization.integration.test.ts
        project-scope.policy.ts
      health/
        health.controller.test.ts
        health.controller.ts
        health.service.test.ts
        health.service.ts
      identity/
        auth.controller.ts
        crypto.ts
        identity.repository.ts
        identity.service.ts
        identity.types.ts
        me.controller.ts
        oidc.service.ts
      items/
        item-authorization.policy.ts
        item-csv.test.ts
        item-csv.ts
        item-validation.test.ts
        item-validation.ts
        items.authorization.integration.test.ts
        items.controller.ts
        items.dto.ts
        items.integration.test.ts
        items.repository.ts
        items.service.ts
      projects/
        project-authorization.policy.ts
        project-state.test.ts
        project-state.ts
        projects.authorization.integration.test.ts
        projects.controller.ts
        projects.dto.ts
        projects.integration.test.ts
        projects.repository.ts
        projects.service.ts
      app.module.ts
      bootstrap.ts
      generate-openapi.ts
      logger.ts
      main.ts
      request-context.ts
      request-logging.ts
      safe-api-exception.filter.ts
      tokens.ts
    Dockerfile
    package.json
    tsconfig.build.json
    tsconfig.json
    vitest.authorization.config.ts
    vitest.config.ts
    vitest.integration.config.ts
  web/
    app/
      access-denied/
        page.tsx
      internal/
        administration/
          memberships/
            page.tsx
          organizations/
            page.tsx
          roles/
            page.tsx
          actions.ts
          data.ts
          page.tsx
        items/
          [itemId]/
            page.tsx
          export/
            route.ts
          actions.ts
          data.ts
          page.tsx
          specification-fields.tsx
        projects/
          [projectId]/
            page.tsx
          actions.ts
          data.ts
          page.tsx
        layout.tsx
        page.tsx
      lib/
        api.ts
      login/
        page.tsx
      supplier/
        layout.tsx
        page.tsx
      api-health-status.tsx
      layout.tsx
      page.tsx
      styles.css
    Dockerfile
    next.config.ts
    package.json
    postcss.config.mjs
    tsconfig.json
  worker/
    src/
      heartbeat.test.ts
      heartbeat.ts
      main.ts
    Dockerfile
    package.json
    tsconfig.build.json
    tsconfig.json
docs/
  adr/
    ADR-0001-modular-monolith.md
    ADR-0002-pnpm-turborepo.md
    ADR-0003-nextjs-nestjs.md
    ADR-0004-postgresql-prisma.md
    ADR-0005-keycloak-oidc.md
    ADR-0006-redis-outbox.md
    ADR-0007-s3-storage.md
    ADR-0008-rest-openapi.md
    ADR-0009-authorization-policies.md
    ADR-0010-readiness-calculation.md
    ADR-0011-audit-events.md
    ADR-0012-container-deployment.md
    ADR-0013-localization.md
    ADR-0014-bom-import.md
  generated/
    openapi.json
  API_CONVENTIONS.md
  ARCHITECTURE.md
  AUTHORIZATION_MATRIX.md
  BACKUP_RESTORE.md
  CHANGE_MANAGEMENT.md
  DATA_IMPORT.md
  DEPENDENCIES.md
  DEPLOYMENT.md
  DOMAIN_MODEL.md
  IMPLEMENTATION_STATUS.md
  ITEM_MASTER_API.md
  OPERATIONS_RUNBOOK.md
  PILOT_PLAN.md
  PRODUCT_REQUIREMENTS.md
  PROJECTS_API.md
  SECURITY_MODEL.md
  TEST_STRATEGY.md
  UI_UX_SPECIFICATION.md
infra/
  docker/
    README.md
  keycloak/
    mecoflow-local-realm.json
  minio/
    README.md
  monitoring/
    README.md
  proxy/
    README.md
  scripts/
    setup.ps1
packages/
  config/
    src/
      index.ts
      service-environment.test.ts
      service-environment.ts
    package.json
    tsconfig.json
  contracts/
    src/
      health.test.ts
      health.ts
      index.ts
    package.json
    tsconfig.json
  database/
    prisma/
      migrations/
        20260715000000_phase_0_foundation/
          migration.sql
        20260716000000_phase_1_identity_authorization/
          migration.sql
        20260716010000_phase_2_projects_milestones/
          migration.sql
        20260716020000_phase_3a_item_master/
          migration.sql
        migration_lock.toml
      schema.prisma
      seed.ts
    src/
      client.integration.test.ts
      client.ts
      index.ts
      phase-one-seed.test.ts
      phase-one-seed.ts
      phase-three-a-seed.ts
      phase-two-seed.ts
      phase-zero-seed.ts
    package.json
    prisma.config.ts
    tsconfig.json
    vitest.config.ts
    vitest.integration.config.ts
  eslint-config/
    base.mjs
    package.json
  test-utils/
    src/
      index.ts
    package.json
    tsconfig.json
  typescript-config/
    base.json
    library.json
    nestjs.json
    nextjs.json
    package.json
  ui/
    src/
      index.ts
      service-status.tsx
    package.json
    tsconfig.json
scripts/
  check-openapi.mjs
  clean.mjs
  prepare.mjs
tests/
  e2e/
    identity-authorization.spec.ts
    items.spec.ts
    projects.spec.ts
  fixtures/
    README.md
  security/
    README.md
  oidc-mock.mjs
.dockerignore
.editorconfig
.env.example
.gitignore
.prettierignore
AGENTS.md
CHANGELOG.md
compose.override.yaml
compose.yaml
CONTRIBUTING.md
eslint.config.mjs
LICENSE
Makefile
package.json
playwright.config.ts
pnpm-workspace.yaml
README.md
SECURITY.md
turbo.json
```

# Files

## File: apps/api/src/items/item-authorization.policy.ts
````typescript
import { ForbiddenException, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";

@Injectable()
export class ItemAuthorizationPolicy {
  private requireInternalPermission(
    principal: AuthenticatedPrincipal,
    permission: "item.export" | "item.read" | "item.write",
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  requireRead(principal: AuthenticatedPrincipal): PrincipalMembership {
    return this.requireInternalPermission(principal, "item.read");
  }

  requireWrite(principal: AuthenticatedPrincipal): PrincipalMembership {
    return this.requireInternalPermission(principal, "item.write");
  }

  requireExport(principal: AuthenticatedPrincipal): PrincipalMembership {
    return this.requireInternalPermission(principal, "item.export");
  }
}
````

## File: apps/api/src/items/item-csv.test.ts
````typescript
import { describe, expect, it } from "vitest";
import { createItemsCsv } from "./item-csv.js";

function row(overrides: Partial<{ description: string; name: string }> = {}) {
  return {
    active: true,
    code: "PLATE-001",
    description: "Safe description",
    itemCategory: { code: "PLATE", name: "Plate" },
    name: "Stainless plate",
    specificationValues: [],
    unitOfMeasure: { code: "KG", decimalPrecision: 3, symbol: "kg" },
    ...overrides,
  };
}

describe("item CSV export", () => {
  it("escapes delimiters, quotes, and line breaks", () => {
    const csv = createItemsCsv([
      row({
        description: "Line one\nLine two",
        name: 'Plate, 10 mm "pickled"',
      }),
    ]);

    expect(csv).toContain('"Plate, 10 mm ""pickled"""');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it.each(["=2+3", "+2+3", "-2+3", "@SUM(A1:A2)"])(
    "neutralizes formula-capable value %s",
    (name) => {
      const csv = createItemsCsv([row({ name })]);

      expect(csv).toContain(`'${name}`);
      expect(csv).not.toMatch(new RegExp(`(?:^|,)${escapeRegExp(name)}`));
      expect(csv).not.toMatch(new RegExp(`(?:^|,)"${escapeRegExp(name)}`));
    },
  );

  it("emits a stable header even when no rows match", () => {
    const csv = createItemsCsv([]);
    const [header, ...rows] = csv.trimEnd().split(/\r?\n/);

    expect(header?.toLowerCase()).toContain("code");
    expect(header?.toLowerCase()).toContain("name");
    expect(rows).toHaveLength(0);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

## File: apps/api/src/items/item-csv.ts
````typescript
export interface CsvItemRow {
  active: boolean;
  code: string;
  description: string;
  itemCategory: { code: string; name: string };
  name: string;
  specificationValues: Array<{
    attributeDefinition: {
      code: string;
      dataType: SpecificationDataType;
      unitOfMeasure: { symbol: string } | null;
    };
    booleanValue: boolean | null;
    numericValue: { toString(): string } | null;
    textValue: string | null;
  }>;
  unitOfMeasure: {
    code: string;
    decimalPrecision: number;
    symbol: string;
  };
}

type SpecificationDataType = "TEXT" | "NUMBER" | "BOOLEAN";

function formulaSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function cell(value: string | number): string {
  return `"${formulaSafe(String(value)).replaceAll('"', '""')}"`;
}

function specificationValue(
  value: CsvItemRow["specificationValues"][number],
): string {
  if (value.attributeDefinition.dataType === "BOOLEAN")
    return value.booleanValue ? "true" : "false";
  if (value.attributeDefinition.dataType === "NUMBER") {
    const number = value.numericValue?.toString() ?? "";
    return value.attributeDefinition.unitOfMeasure
      ? `${number} ${value.attributeDefinition.unitOfMeasure.symbol}`
      : number;
  }
  return value.textValue ?? "";
}

export function createItemsCsv(rows: readonly CsvItemRow[]): string {
  const header = [
    "Code",
    "Name",
    "Description",
    "Category code",
    "Category name",
    "Unit code",
    "Unit symbol",
    "Unit decimal precision",
    "Status",
    "Specifications",
  ];
  const lines = rows.map((row) => [
    row.code,
    row.name,
    row.description,
    row.itemCategory.code,
    row.itemCategory.name,
    row.unitOfMeasure.code,
    row.unitOfMeasure.symbol,
    row.unitOfMeasure.decimalPrecision,
    row.active ? "ACTIVE" : "INACTIVE",
    row.specificationValues
      .map(
        (value) =>
          `${value.attributeDefinition.code}=${specificationValue(value)}`,
      )
      .join("; "),
  ]);
  return [header, ...lines]
    .map((row) => row.map((value) => cell(value)).join(","))
    .join("\r\n")
    .concat("\r\n");
}
````

## File: apps/api/src/items/item-validation.test.ts
````typescript
import { describe, expect, it } from "vitest";
import { validateSpecificationValues } from "./item-validation.js";

const categoryId = "10000000-0000-4000-8000-000000000001";
const unitId = "20000000-0000-4000-8000-000000000001";

const definitions = [
  {
    active: true,
    code: "MATERIAL",
    dataType: "TEXT" as const,
    decimalPrecision: null,
    id: "30000000-0000-4000-8000-000000000001",
    itemCategoryId: categoryId,
    required: true,
    unitOfMeasureId: null,
  },
  {
    active: true,
    code: "THICKNESS",
    dataType: "NUMBER" as const,
    decimalPrecision: 2,
    id: "30000000-0000-4000-8000-000000000002",
    itemCategoryId: categoryId,
    required: true,
    unitOfMeasureId: unitId,
  },
  {
    active: true,
    code: "COATED",
    dataType: "BOOLEAN" as const,
    decimalPrecision: null,
    id: "30000000-0000-4000-8000-000000000003",
    itemCategoryId: categoryId,
    required: false,
    unitOfMeasureId: null,
  },
];

describe("structured item specification values", () => {
  it("accepts values of the declared types", () => {
    expect(() =>
      validateSpecificationValues(definitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
        { attributeDefinitionId: definitions[2]!.id, value: true },
      ]),
    ).not.toThrow();
  });

  it("requires every required specification attribute", () => {
    expect(() =>
      validateSpecificationValues(definitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
      ]),
    ).toThrow();
  });

  it.each(["12.345", "12.", "1e3", "not-a-number"])(
    "rejects invalid or over-precision NUMBER value %s",
    (value) => {
      expect(() =>
        validateSpecificationValues(definitions, [
          {
            attributeDefinitionId: definitions[0]!.id,
            value: "ASTM A240 316L",
          },
          { attributeDefinitionId: definitions[1]!.id, value },
        ]),
      ).toThrow();
    },
  );

  it.each([
    { attributeDefinitionId: definitions[0]!.id, value: true },
    { attributeDefinitionId: definitions[1]!.id, value: false },
    { attributeDefinitionId: definitions[2]!.id, value: "true" },
  ])("rejects a value with the wrong declared type", (invalidValue) => {
    const values = [
      {
        attributeDefinitionId: definitions[0]!.id,
        value: "ASTM A240 316L",
      },
      { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
      invalidValue,
    ].filter(
      (value) =>
        value.attributeDefinitionId !== invalidValue.attributeDefinitionId,
    );
    values.push(invalidValue);

    expect(() => validateSpecificationValues(definitions, values)).toThrow();
  });

  it("rejects inactive definitions", () => {
    const inactiveDefinitions = definitions.map((definition, index) =>
      index === 1 ? { ...definition, active: false } : definition,
    );
    expect(() =>
      validateSpecificationValues(inactiveDefinitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
      ]),
    ).toThrow();
  });

  it("rejects unknown and duplicate definition identifiers", () => {
    expect(() =>
      validateSpecificationValues(definitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
        {
          attributeDefinitionId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          value: "unknown",
        },
      ]),
    ).toThrow();

    expect(() =>
      validateSpecificationValues(definitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "duplicate",
        },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
      ]),
    ).toThrow();
  });

  it("rejects blank required text", () => {
    expect(() =>
      validateSpecificationValues(definitions, [
        { attributeDefinitionId: definitions[0]!.id, value: "   " },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
      ]),
    ).toThrow();
  });
});
````

## File: apps/api/src/items/item-validation.ts
````typescript
import { UnprocessableEntityException } from "@nestjs/common";

export type SpecificationDataType = "TEXT" | "NUMBER" | "BOOLEAN";

export interface SpecificationDefinitionForValidation {
  active: boolean;
  dataType: SpecificationDataType;
  decimalPrecision: number | null;
  id: string;
  itemCategoryId: string;
  required: boolean;
}

export interface SpecificationValueInput {
  attributeDefinitionId: string;
  value: boolean | string;
}

export interface ValidatedSpecificationValue {
  attributeDefinitionId: string;
  booleanValue?: boolean;
  numericValue?: string;
  textValue?: string;
}

const decimalPattern = /^-?(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/;

function invalid(message = "Invalid specification values"): never {
  throw new UnprocessableEntityException(message);
}

export function isDecimalPrecision(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

export function validateSpecificationDefinition(input: {
  dataType: SpecificationDataType;
  decimalPrecision?: number;
  unitDecimalPrecision?: number;
  unitOfMeasureId?: string;
}): void {
  if (input.dataType !== "NUMBER") {
    if (
      input.decimalPrecision !== undefined ||
      input.unitOfMeasureId !== undefined
    )
      invalid("Text and boolean attributes cannot define a unit or precision");
    return;
  }
  if (
    input.decimalPrecision === undefined ||
    !isDecimalPrecision(input.decimalPrecision)
  )
    invalid("Numeric attributes require decimal precision from 0 to 6");
  if (
    input.unitDecimalPrecision !== undefined &&
    input.decimalPrecision > input.unitDecimalPrecision
  )
    invalid("Attribute precision exceeds its unit precision");
}

export function validateSpecificationValues(
  definitions: readonly SpecificationDefinitionForValidation[],
  values: readonly SpecificationValueInput[],
): ValidatedSpecificationValue[] {
  const activeDefinitions = new Map(
    definitions
      .filter(({ active }) => active)
      .map((definition) => [definition.id, definition]),
  );
  const seen = new Set<string>();
  const validated = values.map((input): ValidatedSpecificationValue => {
    if (seen.has(input.attributeDefinitionId))
      invalid("Duplicate specification attribute");
    seen.add(input.attributeDefinitionId);
    const definition = activeDefinitions.get(input.attributeDefinitionId);
    if (!definition) invalid("Specification attribute is unavailable");

    if (definition.dataType === "BOOLEAN") {
      if (typeof input.value !== "boolean")
        invalid("Boolean specification value expected");
      return {
        attributeDefinitionId: definition.id,
        booleanValue: input.value,
      };
    }
    if (typeof input.value !== "string")
      invalid("Text specification value expected");
    const value = input.value.trim();
    if (!value) invalid("Specification values cannot be empty");

    if (definition.dataType === "TEXT") {
      if (value.length > 1000) invalid("Specification value is too long");
      return { attributeDefinitionId: definition.id, textValue: value };
    }

    if (!decimalPattern.test(value))
      invalid("Numeric specification value is invalid");
    const precision = value.includes(".") ? value.split(".")[1]!.length : 0;
    if (
      definition.decimalPrecision === null ||
      precision > definition.decimalPrecision
    )
      invalid("Numeric specification value exceeds decimal precision");
    return { attributeDefinitionId: definition.id, numericValue: value };
  });

  const missingRequired = definitions.some(
    ({ active, id, required }) => active && required && !seen.has(id),
  );
  if (missingRequired) invalid("Required specification value is missing");
  return validated;
}
````

## File: apps/api/src/items/items.authorization.integration.test.ts
````typescript
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
````

## File: apps/api/src/items/items.controller.ts
````typescript
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  CreateItemCategoryDto,
  CreateItemDto,
  CreateSpecificationAttributeDto,
  CreateUnitOfMeasureDto,
  DeactivateItemDto,
  ExportItemsQueryDto,
  ListItemsQueryDto,
  UpdateItemCategoryDto,
  UpdateItemDto,
  UpdateSpecificationAttributeDto,
  UpdateUnitOfMeasureDto,
} from "./items.dto.js";
import { ItemsService } from "./items.service.js";

@ApiTags("item master")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks the required internal item permission",
})
@Controller("api/v1")
export class ItemsController {
  constructor(
    @Inject(ItemsService) private readonly items: ItemsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("item-categories")
  @ApiOperation({ summary: "List item categories and attribute definitions" })
  async itemCategories(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.items.listItemCategories(principal),
      meta: requestContext(request),
    };
  }

  @Post("item-categories")
  @ApiOperation({ summary: "Create an item category" })
  @ApiBody({ type: CreateItemCategoryDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createItemCategory(
    @Req() request: Request,
    @Body() input: CreateItemCategoryDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.createItemCategory(
      principal,
      requestContext(request),
      input,
    );
  }

  @Patch("item-categories/:categoryId")
  @ApiOperation({ summary: "Edit an item category with an expected version" })
  @ApiParam({ format: "uuid", name: "categoryId" })
  @ApiBody({ type: UpdateItemCategoryDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateItemCategory(
    @Req() request: Request,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Body() input: UpdateItemCategoryDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.updateItemCategory(
      principal,
      requestContext(request),
      categoryId,
      input,
    );
  }

  @Post("item-categories/:categoryId/specification-attributes")
  @ApiOperation({ summary: "Create a structured specification attribute" })
  @ApiParam({ format: "uuid", name: "categoryId" })
  @ApiBody({ type: CreateSpecificationAttributeDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createSpecificationAttribute(
    @Req() request: Request,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Body() input: CreateSpecificationAttributeDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.createSpecificationAttribute(
      principal,
      requestContext(request),
      categoryId,
      input,
    );
  }

  @Patch("item-categories/:categoryId/specification-attributes/:attributeId")
  @ApiOperation({ summary: "Edit a structured specification attribute" })
  @ApiParam({ format: "uuid", name: "categoryId" })
  @ApiParam({ format: "uuid", name: "attributeId" })
  @ApiBody({ type: UpdateSpecificationAttributeDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateSpecificationAttribute(
    @Req() request: Request,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Param("attributeId", new ParseUUIDPipe()) attributeId: string,
    @Body() input: UpdateSpecificationAttributeDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.updateSpecificationAttribute(
      principal,
      requestContext(request),
      categoryId,
      attributeId,
      input,
    );
  }

  @Get("units-of-measure")
  @ApiOperation({ summary: "List units of measure" })
  async unitsOfMeasure(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.items.listUnitsOfMeasure(principal),
      meta: requestContext(request),
    };
  }

  @Post("units-of-measure")
  @ApiOperation({ summary: "Create a unit of measure" })
  @ApiBody({ type: CreateUnitOfMeasureDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createUnitOfMeasure(
    @Req() request: Request,
    @Body() input: CreateUnitOfMeasureDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.createUnitOfMeasure(
      principal,
      requestContext(request),
      input,
    );
  }

  @Patch("units-of-measure/:unitId")
  @ApiOperation({ summary: "Edit a unit of measure with an expected version" })
  @ApiParam({ format: "uuid", name: "unitId" })
  @ApiBody({ type: UpdateUnitOfMeasureDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateUnitOfMeasure(
    @Req() request: Request,
    @Param("unitId", new ParseUUIDPipe()) unitId: string,
    @Body() input: UpdateUnitOfMeasureDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.updateUnitOfMeasure(
      principal,
      requestContext(request),
      unitId,
      input,
    );
  }

  @Get("items/export.csv")
  @ApiOperation({ summary: "Export the filtered internal item master as CSV" })
  @ApiProduces("text/csv")
  @ApiQuery({ name: "active", required: false, enum: ["true", "false"] })
  @ApiQuery({ name: "categoryId", required: false, format: "uuid" })
  @ApiQuery({ name: "q", required: false, maxLength: 100 })
  @ApiQuery({ name: "unitOfMeasureId", required: false, format: "uuid" })
  async exportItems(
    @Req() request: Request,
    @Query() query: ExportItemsQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    const result = await this.items.exportItems(
      principal,
      requestContext(request),
      query,
    );
    return new StreamableFile(Buffer.from(result.csv, "utf8"), {
      disposition: `attachment; filename="${result.filename}"`,
      type: "text/csv; charset=utf-8",
    });
  }

  @Get("items")
  @ApiOperation({ summary: "Search and list internal item-master records" })
  @ApiQuery({ name: "active", required: false, enum: ["true", "false"] })
  @ApiQuery({ name: "categoryId", required: false, format: "uuid" })
  @ApiQuery({ name: "direction", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "page", required: false, minimum: 1, type: Number })
  @ApiQuery({
    name: "pageSize",
    required: false,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @ApiQuery({ name: "q", required: false, maxLength: 100 })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["code", "name", "updatedAt"],
  })
  @ApiQuery({ name: "unitOfMeasureId", required: false, format: "uuid" })
  async listItems(@Req() request: Request, @Query() query: ListItemsQueryDto) {
    const principal = await this.identity.principal(request);
    const result = await this.items.listItems(principal, query);
    const page = Number(query.page ?? "1");
    const pageSize = Number(query.pageSize ?? "20");
    return {
      data: result.data,
      meta: requestContext(request),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  @Post("items")
  @ApiOperation({ summary: "Create an item with structured specifications" })
  @ApiBody({ type: CreateItemDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createItem(@Req() request: Request, @Body() input: CreateItemDto) {
    const principal = await this.identity.principal(request, true);
    return this.items.createItem(principal, requestContext(request), input);
  }

  @Get("items/:itemId")
  @ApiOperation({ summary: "Read an internal item detail" })
  @ApiParam({ format: "uuid", name: "itemId" })
  @ApiNotFoundResponse({ description: "Item does not exist" })
  async itemDetail(
    @Req() request: Request,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.items.itemDetail(principal, itemId);
  }

  @Patch("items/:itemId")
  @ApiOperation({ summary: "Edit an active item with an expected version" })
  @ApiParam({ format: "uuid", name: "itemId" })
  @ApiBody({ type: UpdateItemDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateItem(
    @Req() request: Request,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
    @Body() input: UpdateItemDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.updateItem(
      principal,
      requestContext(request),
      itemId,
      input,
    );
  }

  @Post("items/:itemId/deactivate")
  @ApiOperation({ summary: "Deactivate an item; hard deletion is unavailable" })
  @ApiParam({ format: "uuid", name: "itemId" })
  @ApiBody({ type: DeactivateItemDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async deactivateItem(
    @Req() request: Request,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
    @Body() input: DeactivateItemDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.deactivateItem(
      principal,
      requestContext(request),
      itemId,
      input,
    );
  }
}
````

## File: apps/api/src/items/items.dto.ts
````typescript
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const codePattern = /^[A-Z0-9][A-Z0-9._-]*$/;
const specificationDataTypes = {
  BOOLEAN: "BOOLEAN",
  NUMBER: "NUMBER",
  TEXT: "TEXT",
} as const;
const itemSortFields = {
  code: "code",
  name: "name",
  updatedAt: "updatedAt",
} as const;
const sortDirections = { asc: "asc", desc: "desc" } as const;
const activeValues = { false: "false", true: "true" } as const;

export class CreateItemCategoryDto {
  @ApiProperty({ example: "RAW-MATERIAL", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 150, type: String })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateItemCategoryDto extends CreateItemCategoryDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class CreateUnitOfMeasureDto {
  @ApiProperty({ example: "MM", maxLength: 30, type: String })
  @IsString()
  @Length(1, 30)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 100, type: String })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiProperty({ maxLength: 20, type: String })
  @IsString()
  @Length(1, 20)
  symbol!: string;

  @ApiProperty({ maximum: 6, minimum: 0, type: Number })
  @IsInt()
  @Min(0)
  @Max(6)
  decimalPrecision!: number;
}

export class UpdateUnitOfMeasureDto extends CreateUnitOfMeasureDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class SpecificationAttributeDetailsDto {
  @ApiProperty({ example: "THICKNESS", maxLength: 50, type: String })
  @IsString()
  @Length(1, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 150, type: String })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: specificationDataTypes, type: String })
  @IsEnum(specificationDataTypes)
  dataType!: keyof typeof specificationDataTypes;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  unitOfMeasureId?: string;

  @ApiPropertyOptional({ maximum: 6, minimum: 0, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  decimalPrecision?: number;

  @ApiProperty({ maximum: 10000, minimum: 0, type: Number })
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder!: number;
}

export class CreateSpecificationAttributeDto extends SpecificationAttributeDetailsDto {}

export class UpdateSpecificationAttributeDto extends SpecificationAttributeDetailsDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class SpecificationValueDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  attributeDefinitionId!: string;

  @ApiProperty({
    oneOf: [{ type: "string" }, { type: "boolean" }],
    type: Array,
  })
  @IsDefined()
  value!: boolean | string;
}

export class ItemDetailsDto {
  @ApiProperty({ example: "PLATE-SS304-6MM", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  unitOfMeasureId!: string;

  @ApiProperty({ type: [SpecificationValueDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SpecificationValueDto)
  specificationValues!: SpecificationValueDto[];
}

export class CreateItemDto extends ItemDetailsDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  itemCategoryId!: string;
}

export class UpdateItemDto extends ItemDetailsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class DeactivateItemDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class ItemFiltersQueryDto {
  @ApiPropertyOptional({ enum: activeValues, type: String })
  @IsOptional()
  @IsEnum(activeValues)
  active?: "false" | "true";

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ maxLength: 100, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  unitOfMeasureId?: string;

  @ApiPropertyOptional({ enum: itemSortFields, type: String })
  @IsOptional()
  @IsEnum(itemSortFields)
  sort?: keyof typeof itemSortFields;

  @ApiPropertyOptional({ enum: sortDirections, type: String })
  @IsOptional()
  @IsEnum(sortDirections)
  direction?: "asc" | "desc";
}

export class ListItemsQueryDto extends ItemFiltersQueryDto {
  @ApiPropertyOptional({ example: "1", type: String })
  @IsOptional()
  @Matches(/^\d{1,6}$/)
  page?: string;

  @ApiPropertyOptional({ example: "20", type: String })
  @IsOptional()
  @Matches(/^\d{1,3}$/)
  pageSize?: string;
}

export class ExportItemsQueryDto extends ItemFiltersQueryDto {}
````

## File: apps/api/src/items/items.integration.test.ts
````typescript
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
````

## File: apps/api/src/items/items.repository.ts
````typescript
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import {
  createDatabaseClient,
  Prisma,
  type PrismaClient,
} from "@mecoflow/database";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type {
  SpecificationDataType,
  ValidatedSpecificationValue,
} from "./item-validation.js";

interface AuditInput {
  action: string;
  actorUserId: string;
  changes: Prisma.InputJsonValue;
  context: RequestContext;
  entityId: string;
  entityType: string;
  organizationId: string;
}

export interface ItemFilters {
  active?: boolean;
  categoryId?: string;
  direction: "asc" | "desc";
  q?: string;
  sort: "code" | "name" | "updatedAt";
  unitOfMeasureId?: string;
}

const itemDetailInclude = {
  itemCategory: true,
  specificationValues: {
    include: {
      attributeDefinition: { include: { unitOfMeasure: true } },
    },
    orderBy: { attributeDefinition: { sortOrder: "asc" as const } },
  },
  unitOfMeasure: true,
} as const;

type ItemDetailRecord = Prisma.ItemGetPayload<{
  include: typeof itemDetailInclude;
}>;

function isPrismaError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function duplicate(error: unknown, entity: string): never {
  if (isPrismaError(error, "P2002"))
    throw new UnprocessableEntityException(`Duplicate ${entity} code`);
  throw error;
}

function itemWhere(input: ItemFilters): Prisma.ItemWhereInput {
  return {
    ...(input.active === undefined ? {} : { active: input.active }),
    ...(input.categoryId ? { itemCategoryId: input.categoryId } : {}),
    ...(input.unitOfMeasureId
      ? { unitOfMeasureId: input.unitOfMeasureId }
      : {}),
    ...(input.q
      ? {
          OR: [
            { code: { contains: input.q, mode: "insensitive" as const } },
            { name: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

function itemOrderBy(
  input: ItemFilters,
): Prisma.ItemOrderByWithRelationInput[] {
  if (input.sort === "name") return [{ name: input.direction }, { id: "asc" }];
  if (input.sort === "updatedAt")
    return [{ updatedAt: input.direction }, { id: "asc" }];
  return [{ code: input.direction }, { id: "asc" }];
}

function specificationData(itemId: string, value: ValidatedSpecificationValue) {
  return {
    attributeDefinitionId: value.attributeDefinitionId,
    booleanValue: value.booleanValue ?? null,
    itemId,
    numericValue: value.numericValue ?? null,
    textValue: value.textValue ?? null,
  };
}

function presentItem(item: ItemDetailRecord) {
  const { specificationValues, ...record } = item;
  return {
    ...record,
    specificationValues: specificationValues.map((entry) => ({
      attributeDefinition: entry.attributeDefinition,
      attributeDefinitionId: entry.attributeDefinitionId,
      value:
        entry.attributeDefinition.dataType === "BOOLEAN"
          ? entry.booleanValue
          : entry.attributeDefinition.dataType === "NUMBER"
            ? entry.numericValue?.toString()
            : entry.textValue,
    })),
  };
}

@Injectable()
export class ItemsRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private audit(transaction: Prisma.TransactionClient, input: AuditInput) {
    return transaction.auditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: input.entityType,
        organizationId: input.organizationId,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
      },
    });
  }

  listItemCategories() {
    return this.database.itemCategory.findMany({
      include: {
        specificationAttributes: {
          include: { unitOfMeasure: true },
          orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });
  }

  activeItemCategory(id: string) {
    return this.database.itemCategory.findFirst({
      where: { active: true, id },
    });
  }

  async createItemCategory(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    name: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        const category = await transaction.itemCategory.create({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
          },
        });
        await this.audit(transaction, {
          action: "ITEM_CATEGORY_CREATED",
          actorUserId: input.actorUserId,
          changes: { code: { from: null, to: category.code } },
          context: input.context,
          entityId: category.id,
          entityType: "ItemCategory",
          organizationId: input.auditOrganizationId,
        });
        return category;
      });
    } catch (error) {
      duplicate(error, "item category");
    }
  }

  async updateItemCategory(input: {
    active: boolean;
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    id: string;
    name: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${input.id}::uuid FOR UPDATE`;
        const current = await transaction.itemCategory.findUnique({
          where: { id: input.id },
        });
        if (!current) throw new NotFoundException("Resource not found");
        if (current.version !== input.expectedVersion)
          throw new ConflictException("Concurrent modification");
        if (!input.active && current.active) {
          const activeItems = await transaction.item.count({
            where: { active: true, itemCategoryId: input.id },
          });
          if (activeItems > 0)
            throw new UnprocessableEntityException(
              "Item category is used by active items",
            );
        }
        const result = await transaction.itemCategory.updateMany({
          data: {
            active: input.active,
            code: input.code,
            description: input.description,
            name: input.name,
            version: { increment: 1 },
          },
          where: { id: input.id, version: input.expectedVersion },
        });
        if (result.count !== 1)
          throw new ConflictException("Concurrent modification");
        const updated = await transaction.itemCategory.findUniqueOrThrow({
          where: { id: input.id },
        });
        await this.audit(transaction, {
          action: "ITEM_CATEGORY_UPDATED",
          actorUserId: input.actorUserId,
          changes: {
            active: { from: current.active, to: updated.active },
            code: { from: current.code, to: updated.code },
            name: { from: current.name, to: updated.name },
          },
          context: input.context,
          entityId: updated.id,
          entityType: "ItemCategory",
          organizationId: input.auditOrganizationId,
        });
        return updated;
      });
    } catch (error) {
      duplicate(error, "item category");
    }
  }

  listUnitsOfMeasure() {
    return this.database.unitOfMeasure.findMany({ orderBy: { name: "asc" } });
  }

  activeUnitOfMeasure(id: string) {
    return this.database.unitOfMeasure.findFirst({
      where: { active: true, id },
    });
  }

  async createUnitOfMeasure(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    decimalPrecision: number;
    name: string;
    symbol: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        const unit = await transaction.unitOfMeasure.create({
          data: {
            code: input.code,
            decimalPrecision: input.decimalPrecision,
            name: input.name,
            symbol: input.symbol,
          },
        });
        await this.audit(transaction, {
          action: "UNIT_OF_MEASURE_CREATED",
          actorUserId: input.actorUserId,
          changes: {
            code: { from: null, to: unit.code },
            decimalPrecision: { from: null, to: unit.decimalPrecision },
          },
          context: input.context,
          entityId: unit.id,
          entityType: "UnitOfMeasure",
          organizationId: input.auditOrganizationId,
        });
        return unit;
      });
    } catch (error) {
      duplicate(error, "unit of measure");
    }
  }

  async updateUnitOfMeasure(input: {
    active: boolean;
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    decimalPrecision: number;
    expectedVersion: number;
    id: string;
    name: string;
    symbol: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.id}::uuid FOR UPDATE`;
        const current = await transaction.unitOfMeasure.findUnique({
          where: { id: input.id },
        });
        if (!current) throw new NotFoundException("Resource not found");
        if (current.version !== input.expectedVersion)
          throw new ConflictException("Concurrent modification");
        const incompatibleAttributes =
          await transaction.specificationAttributeDefinition.count({
            where: {
              active: true,
              decimalPrecision: { gt: input.decimalPrecision },
              unitOfMeasureId: input.id,
            },
          });
        if (incompatibleAttributes > 0)
          throw new UnprocessableEntityException(
            "Unit precision is used by specification attributes",
          );
        if (!input.active && current.active) {
          const activeItems = await transaction.item.count({
            where: { active: true, unitOfMeasureId: input.id },
          });
          const activeAttributes =
            await transaction.specificationAttributeDefinition.count({
              where: { active: true, unitOfMeasureId: input.id },
            });
          if (activeItems > 0 || activeAttributes > 0)
            throw new UnprocessableEntityException(
              "Unit of measure is used by active records",
            );
        }
        const result = await transaction.unitOfMeasure.updateMany({
          data: {
            active: input.active,
            code: input.code,
            decimalPrecision: input.decimalPrecision,
            name: input.name,
            symbol: input.symbol,
            version: { increment: 1 },
          },
          where: { id: input.id, version: input.expectedVersion },
        });
        if (result.count !== 1)
          throw new ConflictException("Concurrent modification");
        const updated = await transaction.unitOfMeasure.findUniqueOrThrow({
          where: { id: input.id },
        });
        await this.audit(transaction, {
          action: "UNIT_OF_MEASURE_UPDATED",
          actorUserId: input.actorUserId,
          changes: {
            active: { from: current.active, to: updated.active },
            code: { from: current.code, to: updated.code },
            decimalPrecision: {
              from: current.decimalPrecision,
              to: updated.decimalPrecision,
            },
          },
          context: input.context,
          entityId: updated.id,
          entityType: "UnitOfMeasure",
          organizationId: input.auditOrganizationId,
        });
        return updated;
      });
    } catch (error) {
      duplicate(error, "unit of measure");
    }
  }

  specificationDefinitions(itemCategoryId: string) {
    return this.database.specificationAttributeDefinition.findMany({
      include: { unitOfMeasure: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      where: { itemCategoryId },
    });
  }

  async createSpecificationAttribute(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    dataType: SpecificationDataType;
    decimalPrecision?: number;
    description: string;
    itemCategoryId: string;
    name: string;
    required: boolean;
    sortOrder: number;
    unitOfMeasureId?: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${input.itemCategoryId}::uuid FOR UPDATE`;
        const category = await transaction.itemCategory.findFirst({
          where: { active: true, id: input.itemCategoryId },
        });
        if (!category)
          throw new UnprocessableEntityException(
            "Item category is unavailable",
          );
        if (input.unitOfMeasureId) {
          await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.unitOfMeasureId}::uuid FOR SHARE`;
          const unit = await transaction.unitOfMeasure.findFirst({
            where: { active: true, id: input.unitOfMeasureId },
          });
          if (!unit)
            throw new UnprocessableEntityException(
              "Unit of measure is unavailable",
            );
        }
        if (input.required) {
          const existingItems = await transaction.item.count({
            where: { active: true, itemCategoryId: input.itemCategoryId },
          });
          if (existingItems > 0)
            throw new UnprocessableEntityException(
              "A required attribute cannot be added after active items exist",
            );
        }
        const attribute =
          await transaction.specificationAttributeDefinition.create({
            data: {
              code: input.code,
              dataType: input.dataType,
              decimalPrecision: input.decimalPrecision ?? null,
              description: input.description,
              itemCategoryId: input.itemCategoryId,
              name: input.name,
              required: input.required,
              sortOrder: input.sortOrder,
              unitOfMeasureId: input.unitOfMeasureId ?? null,
            },
            include: { unitOfMeasure: true },
          });
        await this.audit(transaction, {
          action: "SPECIFICATION_ATTRIBUTE_CREATED",
          actorUserId: input.actorUserId,
          changes: {
            code: { from: null, to: attribute.code },
            dataType: { from: null, to: attribute.dataType },
          },
          context: input.context,
          entityId: attribute.id,
          entityType: "SpecificationAttributeDefinition",
          organizationId: input.auditOrganizationId,
        });
        return attribute;
      });
    } catch (error) {
      duplicate(error, "specification attribute");
    }
  }

  async updateSpecificationAttribute(input: {
    active: boolean;
    actorUserId: string;
    attributeId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    dataType: SpecificationDataType;
    decimalPrecision?: number;
    description: string;
    expectedVersion: number;
    itemCategoryId: string;
    name: string;
    required: boolean;
    sortOrder: number;
    unitOfMeasureId?: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${input.itemCategoryId}::uuid FOR UPDATE`;
        await transaction.$queryRaw`SELECT id FROM specification_attribute_definitions WHERE id = ${input.attributeId}::uuid FOR UPDATE`;
        const current =
          await transaction.specificationAttributeDefinition.findFirst({
            include: { _count: { select: { specificationValues: true } } },
            where: {
              id: input.attributeId,
              itemCategoryId: input.itemCategoryId,
            },
          });
        if (!current) throw new NotFoundException("Resource not found");
        if (current.version !== input.expectedVersion)
          throw new ConflictException("Concurrent modification");
        if (input.unitOfMeasureId) {
          await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.unitOfMeasureId}::uuid FOR SHARE`;
          const unit = await transaction.unitOfMeasure.findFirst({
            where: { active: true, id: input.unitOfMeasureId },
          });
          if (!unit)
            throw new UnprocessableEntityException(
              "Unit of measure is unavailable",
            );
        }
        const structuralChange =
          current.dataType !== input.dataType ||
          current.decimalPrecision !== (input.decimalPrecision ?? null) ||
          current.unitOfMeasureId !== (input.unitOfMeasureId ?? null);
        if (structuralChange && current._count.specificationValues > 0)
          throw new UnprocessableEntityException(
            "Used specification attribute structure cannot change",
          );
        if (
          input.active &&
          input.required &&
          (!current.active || !current.required)
        ) {
          const missingValues = await transaction.item.count({
            where: {
              active: true,
              itemCategoryId: input.itemCategoryId,
              specificationValues: {
                none: { attributeDefinitionId: input.attributeId },
              },
            },
          });
          if (missingValues > 0)
            throw new UnprocessableEntityException(
              "Active items are missing the required specification",
            );
        }
        const result =
          await transaction.specificationAttributeDefinition.updateMany({
            data: {
              active: input.active,
              code: input.code,
              dataType: input.dataType,
              decimalPrecision: input.decimalPrecision ?? null,
              description: input.description,
              name: input.name,
              required: input.required,
              sortOrder: input.sortOrder,
              unitOfMeasureId: input.unitOfMeasureId ?? null,
              version: { increment: 1 },
            },
            where: { id: input.attributeId, version: input.expectedVersion },
          });
        if (result.count !== 1)
          throw new ConflictException("Concurrent modification");
        const updated =
          await transaction.specificationAttributeDefinition.findUniqueOrThrow({
            include: { unitOfMeasure: true },
            where: { id: input.attributeId },
          });
        await this.audit(transaction, {
          action: "SPECIFICATION_ATTRIBUTE_UPDATED",
          actorUserId: input.actorUserId,
          changes: {
            active: { from: current.active, to: updated.active },
            code: { from: current.code, to: updated.code },
            required: { from: current.required, to: updated.required },
          },
          context: input.context,
          entityId: updated.id,
          entityType: "SpecificationAttributeDefinition",
          organizationId: input.auditOrganizationId,
        });
        return updated;
      });
    } catch (error) {
      duplicate(error, "specification attribute");
    }
  }

  async listItems(input: ItemFilters & { page: number; pageSize: number }) {
    const where = itemWhere(input);
    const [data, total] = await this.database.$transaction([
      this.database.item.findMany({
        include: { itemCategory: true, unitOfMeasure: true },
        orderBy: itemOrderBy(input),
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        where,
      }),
      this.database.item.count({ where }),
    ]);
    return { data, total };
  }

  async itemDetail(id: string) {
    const item = await this.database.item.findUnique({
      include: itemDetailInclude,
      where: { id },
    });
    return item ? presentItem(item) : null;
  }

  async createItem(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    itemCategoryId: string;
    name: string;
    specificationValues: ValidatedSpecificationValue[];
    unitOfMeasureId: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${input.itemCategoryId}::uuid FOR SHARE`;
        await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.unitOfMeasureId}::uuid FOR SHARE`;
        await transaction.$queryRaw`SELECT id FROM specification_attribute_definitions WHERE "itemCategoryId" = ${input.itemCategoryId}::uuid FOR SHARE`;
        const category = await transaction.itemCategory.findFirst({
          where: { active: true, id: input.itemCategoryId },
        });
        const unit = await transaction.unitOfMeasure.findFirst({
          where: { active: true, id: input.unitOfMeasureId },
        });
        if (!category || !unit)
          throw new UnprocessableEntityException(
            "Item category or unit is unavailable",
          );
        const availableDefinitions =
          await transaction.specificationAttributeDefinition.findMany({
            where: { active: true, itemCategoryId: input.itemCategoryId },
          });
        const definitionIds = new Set(availableDefinitions.map(({ id }) => id));
        if (
          input.specificationValues.some(
            ({ attributeDefinitionId }) =>
              !definitionIds.has(attributeDefinitionId),
          ) ||
          availableDefinitions.some(
            ({ id, required }) =>
              required &&
              !input.specificationValues.some(
                ({ attributeDefinitionId }) => attributeDefinitionId === id,
              ),
          )
        )
          throw new UnprocessableEntityException(
            "Specification definitions changed",
          );
        const item = await transaction.item.create({
          data: {
            code: input.code,
            createdByUserId: input.actorUserId,
            description: input.description,
            itemCategoryId: input.itemCategoryId,
            name: input.name,
            specificationValues: {
              create: input.specificationValues.map((value) => ({
                attributeDefinitionId: value.attributeDefinitionId,
                booleanValue: value.booleanValue ?? null,
                numericValue: value.numericValue ?? null,
                textValue: value.textValue ?? null,
              })),
            },
            unitOfMeasureId: input.unitOfMeasureId,
          },
          include: itemDetailInclude,
        });
        await this.audit(transaction, {
          action: "ITEM_CREATED",
          actorUserId: input.actorUserId,
          changes: {
            code: { from: null, to: item.code },
            specificationAttributeIds: input.specificationValues.map(
              ({ attributeDefinitionId }) => attributeDefinitionId,
            ),
          },
          context: input.context,
          entityId: item.id,
          entityType: "Item",
          organizationId: input.auditOrganizationId,
        });
        return presentItem(item);
      });
    } catch (error) {
      duplicate(error, "item");
    }
  }

  async updateItem(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    id: string;
    name: string;
    specificationValues: ValidatedSpecificationValue[];
    unitOfMeasureId: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        const current = await transaction.item.findUnique({
          where: { id: input.id },
        });
        if (!current) throw new NotFoundException("Resource not found");
        if (current.version !== input.expectedVersion)
          throw new ConflictException("Concurrent modification");
        if (!current.active)
          throw new UnprocessableEntityException(
            "Deactivated items are read-only",
          );
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${current.itemCategoryId}::uuid FOR SHARE`;
        await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.unitOfMeasureId}::uuid FOR SHARE`;
        await transaction.$queryRaw`SELECT id FROM specification_attribute_definitions WHERE "itemCategoryId" = ${current.itemCategoryId}::uuid FOR SHARE`;
        const unit = await transaction.unitOfMeasure.findFirst({
          where: { active: true, id: input.unitOfMeasureId },
        });
        if (!unit)
          throw new UnprocessableEntityException(
            "Unit of measure is unavailable",
          );
        const availableDefinitions =
          await transaction.specificationAttributeDefinition.findMany({
            where: { active: true, itemCategoryId: current.itemCategoryId },
          });
        const definitionIds = new Set(availableDefinitions.map(({ id }) => id));
        if (
          input.specificationValues.some(
            ({ attributeDefinitionId }) =>
              !definitionIds.has(attributeDefinitionId),
          ) ||
          availableDefinitions.some(
            ({ id, required }) =>
              required &&
              !input.specificationValues.some(
                ({ attributeDefinitionId }) => attributeDefinitionId === id,
              ),
          )
        )
          throw new UnprocessableEntityException(
            "Specification definitions changed",
          );
        const result = await transaction.item.updateMany({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
            unitOfMeasureId: input.unitOfMeasureId,
            version: { increment: 1 },
          },
          where: { id: input.id, version: input.expectedVersion },
        });
        if (result.count !== 1)
          throw new ConflictException("Concurrent modification");
        await transaction.itemSpecificationValue.deleteMany({
          where: { itemId: input.id },
        });
        if (input.specificationValues.length > 0)
          await transaction.itemSpecificationValue.createMany({
            data: input.specificationValues.map((value) =>
              specificationData(input.id, value),
            ),
          });
        const updated = await transaction.item.findUniqueOrThrow({
          include: itemDetailInclude,
          where: { id: input.id },
        });
        await this.audit(transaction, {
          action: "ITEM_UPDATED",
          actorUserId: input.actorUserId,
          changes: {
            code: { from: current.code, to: updated.code },
            name: { from: current.name, to: updated.name },
            specificationAttributeIds: input.specificationValues.map(
              ({ attributeDefinitionId }) => attributeDefinitionId,
            ),
            unitOfMeasureId: {
              from: current.unitOfMeasureId,
              to: updated.unitOfMeasureId,
            },
          },
          context: input.context,
          entityId: updated.id,
          entityType: "Item",
          organizationId: input.auditOrganizationId,
        });
        return presentItem(updated);
      });
    } catch (error) {
      duplicate(error, "item");
    }
  }

  async deactivateItem(input: {
    actorUserId: string;
    auditOrganizationId: string;
    context: RequestContext;
    expectedVersion: number;
    id: string;
    reason: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const current = await transaction.item.findUnique({
        where: { id: input.id },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (!current.active)
        throw new UnprocessableEntityException("Item is already deactivated");
      const result = await transaction.item.updateMany({
        data: { active: false, version: { increment: 1 } },
        where: {
          active: true,
          id: input.id,
          version: input.expectedVersion,
        },
      });
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.item.findUniqueOrThrow({
        include: itemDetailInclude,
        where: { id: input.id },
      });
      await this.audit(transaction, {
        action: "ITEM_DEACTIVATED",
        actorUserId: input.actorUserId,
        changes: {
          active: { from: true, to: false },
          reason: input.reason,
        },
        context: input.context,
        entityId: updated.id,
        entityType: "Item",
        organizationId: input.auditOrganizationId,
      });
      return presentItem(updated);
    });
  }

  exportItems(
    principal: AuthenticatedPrincipal,
    input: ItemFilters,
    audit: {
      auditOrganizationId: string;
      context: RequestContext;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      const rows = await transaction.item.findMany({
        include: {
          itemCategory: true,
          specificationValues: {
            include: {
              attributeDefinition: { include: { unitOfMeasure: true } },
            },
            orderBy: { attributeDefinition: { sortOrder: "asc" } },
          },
          unitOfMeasure: true,
        },
        orderBy: itemOrderBy(input),
        take: 10001,
        where: itemWhere(input),
      });
      if (rows.length > 10000)
        throw new UnprocessableEntityException(
          "Export exceeds the 10000 item limit",
        );
      await this.audit(transaction, {
        action: "ITEMS_EXPORTED",
        actorUserId: principal.user.id,
        changes: {
          count: rows.length,
          filters: {
            active: input.active ?? null,
            categoryId: input.categoryId ?? null,
            searchApplied: Boolean(input.q),
            unitOfMeasureId: input.unitOfMeasureId ?? null,
          },
        },
        context: audit.context,
        entityId: "items",
        entityType: "ItemExport",
        organizationId: audit.auditOrganizationId,
      });
      return rows;
    });
  }
}
````

## File: apps/api/src/items/items.service.ts
````typescript
import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { ItemAuthorizationPolicy } from "./item-authorization.policy.js";
import { createItemsCsv } from "./item-csv.js";
import {
  isDecimalPrecision,
  type SpecificationDataType,
  type SpecificationValueInput,
  validateSpecificationDefinition,
  validateSpecificationValues,
} from "./item-validation.js";
import { ItemsRepository, type ItemFilters } from "./items.repository.js";

function text(value: string | undefined): string {
  return value?.trim() ?? "";
}

function code(value: string): string {
  return value.trim().toUpperCase();
}

@Injectable()
export class ItemsService {
  constructor(
    @Inject(ItemAuthorizationPolicy)
    private readonly policy: ItemAuthorizationPolicy,
    @Inject(ItemsRepository)
    private readonly repository: ItemsRepository,
  ) {}

  listItemCategories(principal: AuthenticatedPrincipal) {
    this.policy.requireRead(principal);
    return this.repository.listItemCategories();
  }

  createItemCategory(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: { code: string; description?: string; name: string },
  ) {
    const membership = this.policy.requireWrite(principal);
    return this.repository.createItemCategory({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      name: input.name.trim(),
    });
  }

  updateItemCategory(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      active: boolean;
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    return this.repository.updateItemCategory({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      id,
      name: input.name.trim(),
    });
  }

  listUnitsOfMeasure(principal: AuthenticatedPrincipal) {
    this.policy.requireRead(principal);
    return this.repository.listUnitsOfMeasure();
  }

  createUnitOfMeasure(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: {
      code: string;
      decimalPrecision: number;
      name: string;
      symbol: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    if (!isDecimalPrecision(input.decimalPrecision))
      throw new UnprocessableEntityException("Invalid decimal precision");
    return this.repository.createUnitOfMeasure({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      decimalPrecision: input.decimalPrecision,
      name: input.name.trim(),
      symbol: input.symbol.trim(),
    });
  }

  updateUnitOfMeasure(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      active: boolean;
      code: string;
      decimalPrecision: number;
      expectedVersion: number;
      name: string;
      symbol: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    if (!isDecimalPrecision(input.decimalPrecision))
      throw new UnprocessableEntityException("Invalid decimal precision");
    return this.repository.updateUnitOfMeasure({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      id,
      name: input.name.trim(),
      symbol: input.symbol.trim(),
    });
  }

  private async validatedDefinition(input: {
    dataType: SpecificationDataType;
    decimalPrecision?: number;
    unitOfMeasureId?: string;
  }): Promise<void> {
    const unit = input.unitOfMeasureId
      ? await this.repository.activeUnitOfMeasure(input.unitOfMeasureId)
      : null;
    if (input.unitOfMeasureId && !unit)
      throw new UnprocessableEntityException("Unit of measure is unavailable");
    validateSpecificationDefinition({
      dataType: input.dataType,
      ...(input.decimalPrecision === undefined
        ? {}
        : { decimalPrecision: input.decimalPrecision }),
      ...(unit ? { unitDecimalPrecision: unit.decimalPrecision } : {}),
      ...(input.unitOfMeasureId
        ? { unitOfMeasureId: input.unitOfMeasureId }
        : {}),
    });
  }

  async createSpecificationAttribute(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    itemCategoryId: string,
    input: {
      code: string;
      dataType: SpecificationDataType;
      decimalPrecision?: number;
      description?: string;
      name: string;
      required: boolean;
      sortOrder: number;
      unitOfMeasureId?: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    await this.validatedDefinition(input);
    return this.repository.createSpecificationAttribute({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      itemCategoryId,
      name: input.name.trim(),
    });
  }

  async updateSpecificationAttribute(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    itemCategoryId: string,
    attributeId: string,
    input: {
      active: boolean;
      code: string;
      dataType: SpecificationDataType;
      decimalPrecision?: number;
      description?: string;
      expectedVersion: number;
      name: string;
      required: boolean;
      sortOrder: number;
      unitOfMeasureId?: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    await this.validatedDefinition(input);
    return this.repository.updateSpecificationAttribute({
      ...input,
      actorUserId: principal.user.id,
      attributeId,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      itemCategoryId,
      name: input.name.trim(),
    });
  }

  private filters(input: {
    active?: "false" | "true";
    categoryId?: string;
    direction?: "asc" | "desc";
    q?: string;
    sort?: "code" | "name" | "updatedAt";
    unitOfMeasureId?: string;
  }): ItemFilters {
    return {
      direction: input.direction ?? "asc",
      sort: input.sort ?? "code",
      ...(input.active === undefined
        ? {}
        : { active: input.active === "true" }),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(text(input.q) ? { q: text(input.q) } : {}),
      ...(input.unitOfMeasureId
        ? { unitOfMeasureId: input.unitOfMeasureId }
        : {}),
    };
  }

  listItems(
    principal: AuthenticatedPrincipal,
    input: {
      active?: "false" | "true";
      categoryId?: string;
      direction?: "asc" | "desc";
      page?: string;
      pageSize?: string;
      q?: string;
      sort?: "code" | "name" | "updatedAt";
      unitOfMeasureId?: string;
    },
  ) {
    this.policy.requireRead(principal);
    const page = Number(input.page ?? "1");
    const pageSize = Number(input.pageSize ?? "20");
    if (page < 1 || pageSize < 1 || pageSize > 100)
      throw new UnprocessableEntityException("Invalid pagination");
    return this.repository.listItems({
      ...this.filters(input),
      page,
      pageSize,
    });
  }

  async itemDetail(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requireRead(principal);
    const item = await this.repository.itemDetail(id);
    if (!item) throw new NotFoundException("Resource not found");
    return item;
  }

  private async validatedItemValues(
    itemCategoryId: string,
    unitOfMeasureId: string,
    values: readonly SpecificationValueInput[],
  ) {
    const [category, unit, definitions] = await Promise.all([
      this.repository.activeItemCategory(itemCategoryId),
      this.repository.activeUnitOfMeasure(unitOfMeasureId),
      this.repository.specificationDefinitions(itemCategoryId),
    ]);
    if (!category || !unit)
      throw new UnprocessableEntityException(
        "Item category or unit is unavailable",
      );
    return validateSpecificationValues(definitions, values);
  }

  async createItem(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: {
      code: string;
      description?: string;
      itemCategoryId: string;
      name: string;
      specificationValues: SpecificationValueInput[];
      unitOfMeasureId: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    const specificationValues = await this.validatedItemValues(
      input.itemCategoryId,
      input.unitOfMeasureId,
      input.specificationValues,
    );
    return this.repository.createItem({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      itemCategoryId: input.itemCategoryId,
      name: input.name.trim(),
      specificationValues,
      unitOfMeasureId: input.unitOfMeasureId,
    });
  }

  async updateItem(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
      specificationValues: SpecificationValueInput[];
      unitOfMeasureId: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    const current = await this.repository.itemDetail(id);
    if (!current) throw new NotFoundException("Resource not found");
    const specificationValues = await this.validatedItemValues(
      current.itemCategoryId,
      input.unitOfMeasureId,
      input.specificationValues,
    );
    return this.repository.updateItem({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      expectedVersion: input.expectedVersion,
      id,
      name: input.name.trim(),
      specificationValues,
      unitOfMeasureId: input.unitOfMeasureId,
    });
  }

  deactivateItem(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    const membership = this.policy.requireWrite(principal);
    return this.repository.deactivateItem({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      id,
      reason: input.reason.trim(),
    });
  }

  async exportItems(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: {
      active?: "false" | "true";
      categoryId?: string;
      direction?: "asc" | "desc";
      q?: string;
      sort?: "code" | "name" | "updatedAt";
      unitOfMeasureId?: string;
    },
  ) {
    const membership = this.policy.requireExport(principal);
    const rows = await this.repository.exportItems(
      principal,
      this.filters(input),
      { auditOrganizationId: membership.organization.id, context },
    );
    return { csv: createItemsCsv(rows), filename: "items.csv" };
  }
}
````

## File: apps/api/src/projects/project-authorization.policy.ts
````typescript
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthorizationPolicy } from "../authorization/authorization.policy.js";
import type {
  ProjectScope,
  ProjectScopePolicy,
} from "../authorization/project-scope.policy.js";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectsRepository } from "./projects.repository.js";

@Injectable()
export class ProjectAuthorizationPolicy implements ProjectScopePolicy {
  constructor(
    @Inject(AuthorizationPolicy)
    private readonly authorization: AuthorizationPolicy,
    @Inject(ProjectsRepository)
    private readonly projects: ProjectsRepository,
  ) {}

  requireList(principal: AuthenticatedPrincipal): void {
    this.authorization.requirePermission(principal, "project.read");
  }

  requireCategoryWrite(principal: AuthenticatedPrincipal): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has("project.write"),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  requireCreate(
    principal: AuthenticatedPrincipal,
    organizationId: string,
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.id === organizationId &&
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has("project.write"),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  async scope(projectId: string): Promise<ProjectScope> {
    const scope = await this.projects.scope(projectId);
    if (!scope) throw new NotFoundException("Resource not found");
    return scope;
  }

  async requireProjectRead(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void> {
    this.authorization.requirePermission(principal, "project.read");
    if (!(await this.projects.canAccessProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }

  async requireProjectWrite(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void> {
    this.authorization.requirePermission(principal, "project.write");
    if (!(await this.projects.canWriteProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }

  async requireMemberManagement(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void> {
    this.authorization.requirePermission(
      principal,
      "project.membership.manage",
    );
    if (!(await this.projects.canWriteProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }
}
````

## File: apps/api/src/projects/project-state.test.ts
````typescript
import { describe, expect, it } from "vitest";
import {
  allowedProjectTransitions,
  canTransitionProject,
  projectStates,
} from "./project-state.js";

describe("project state transitions", () => {
  const expected = {
    ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
    CANCELLED: [],
    COMPLETED: [],
    DRAFT: ["PLANNED", "CANCELLED"],
    ON_HOLD: ["ACTIVE", "CANCELLED"],
    PLANNED: ["ACTIVE", "ON_HOLD", "CANCELLED"],
  } as const;

  it.each(projectStates)(
    "allows only documented transitions from %s",
    (source) => {
      expect(allowedProjectTransitions(source)).toEqual(expected[source]);
      for (const target of projectStates)
        expect(canTransitionProject(source, target)).toBe(
          expected[source].some((candidate) => candidate === target),
        );
    },
  );

  it("forbids reopening a completed project through the normal transition command", () => {
    expect(canTransitionProject("COMPLETED", "ACTIVE")).toBe(false);
  });
});
````

## File: apps/api/src/projects/project-state.ts
````typescript
export const projectStates = [
  "DRAFT",
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ProjectState = (typeof projectStates)[number];

const transitions: Readonly<Record<ProjectState, readonly ProjectState[]>> = {
  ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
  DRAFT: ["PLANNED", "CANCELLED"],
  ON_HOLD: ["ACTIVE", "CANCELLED"],
  PLANNED: ["ACTIVE", "ON_HOLD", "CANCELLED"],
};

export function allowedProjectTransitions(
  state: ProjectState,
): readonly ProjectState[] {
  return transitions[state];
}

export function canTransitionProject(
  source: ProjectState,
  target: ProjectState,
): boolean {
  return transitions[source].includes(target);
}

export function datesAreOrdered(startDate: Date, endDate: Date): boolean {
  return startDate.getTime() <= endDate.getTime();
}
````

## File: apps/api/src/projects/projects.authorization.integration.test.ts
````typescript
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

const supplierB = {
  membershipId: "91000000-0000-4000-8000-000000000001",
  organizationId: "92000000-0000-4000-8000-000000000001",
  userId: "93000000-0000-4000-8000-000000000001",
};
const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 2 project authorization", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    await database.organization.upsert({
      create: {
        code: "SUPPLIER-B-AUTH-TEST",
        id: supplierB.organizationId,
        name: "Supplier B authorization fixture",
        type: "SUPPLIER",
      },
      update: { active: true },
      where: { id: supplierB.organizationId },
    });
    await database.userProfile.upsert({
      create: {
        displayName: "Supplier B User",
        email: "supplier-b@example.test",
        id: supplierB.userId,
        issuer: "https://issuer.example.test",
        subject: "supplier-b-project-auth",
      },
      update: { status: "ACTIVE" },
      where: { id: supplierB.userId },
    });
    await database.membership.upsert({
      create: {
        id: supplierB.membershipId,
        organizationId: supplierB.organizationId,
        userId: supplierB.userId,
      },
      update: { status: "ACTIVE" },
      where: { id: supplierB.membershipId },
    });
    await database.membershipRole.upsert({
      create: {
        membershipId: supplierB.membershipId,
        roleCode: "SUPPLIER_USER",
      },
      update: {},
      where: {
        membershipId_roleCode: {
          membershipId: supplierB.membershipId,
          roleCode: "SUPPLIER_USER",
        },
      },
    });
    const supplierAMembership = await database.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.supplierOrganizationId,
          userId: localFixtures.supplierAdminUserId,
        },
      },
    });
    await database.projectMember.upsert({
      create: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: supplierAMembership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "SUPPLIER",
      },
      update: { role: "SUPPLIER", status: "ACTIVE" },
      where: {
        projectId_membershipId: {
          membershipId: supplierAMembership.id,
          projectId: phaseTwoFixtures.demoProjectId,
        },
      },
    });
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

  async function authenticated(userId: string) {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    sessionHashes.push(tokenHash);
    await database.session.create({
      data: {
        csrfTokenHash: hash(csrf),
        expiresAt: new Date(Date.now() + 120_000),
        tokenHash,
        userId,
      },
    });
    return {
      csrf,
      headers: { cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}` },
    };
  }

  it("allows Supplier A only its explicitly shared project and filters employee/history fields", async () => {
    const auth = await authenticated(localFixtures.supplierAdminUserId);
    const response = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}`,
      { headers: auth.headers },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty("members");
    expect(body).not.toHaveProperty("transitions");
  });

  it("returns equivalent safe responses for Supplier B and a nonexistent project", async () => {
    const auth = await authenticated(supplierB.userId);
    const paths = [
      `/api/v1/projects/${phaseTwoFixtures.demoProjectId}`,
      "/api/v1/projects/ffffffff-ffff-4fff-8fff-ffffffffffff",
    ];
    const responses = await Promise.all(
      paths.map((path) =>
        fetch(`${baseUrl}${path}`, { headers: auth.headers }),
      ),
    );
    expect(responses.map(({ status }) => status)).toEqual([404, 404]);
    expect(
      await Promise.all(responses.map((response) => response.json())),
    ).toEqual([
      {
        error: { code: "RESOURCE_NOT_FOUND", message: "Resource not found" },
        requestId: expect.any(String),
      },
      {
        error: { code: "RESOURCE_NOT_FOUND", message: "Resource not found" },
        requestId: expect.any(String),
      },
    ]);
  });

  it("denies project writes by a read-only internal role and enforces CSRF on transition commands", async () => {
    const readonly = await authenticated(localFixtures.internalReadonlyUserId);
    const denied = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/transitions`,
      {
        body: JSON.stringify({
          expectedVersion: 1,
          reason: "Read-only users cannot transition",
          targetState: "PLANNED",
        }),
        headers: {
          ...readonly.headers,
          "content-type": "application/json",
          "x-csrf-token": readonly.csrf,
        },
        method: "POST",
      },
    );
    expect(denied.status).toBe(403);

    const admin = await authenticated(localFixtures.internalAdminUserId);
    const noCsrf = await fetch(
      `${baseUrl}/api/v1/projects/${phaseTwoFixtures.demoProjectId}/transitions`,
      {
        body: JSON.stringify({
          expectedVersion: 1,
          reason: "Missing CSRF proof must be denied",
          targetState: "PLANNED",
        }),
        headers: { ...admin.headers, "content-type": "application/json" },
        method: "POST",
      },
    );
    expect(noCsrf.status).toBe(403);
  });
});
````

## File: apps/api/src/projects/projects.controller.ts
````typescript
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  AddProjectMemberDto,
  CreateMilestoneDto,
  CreateProductCategoryDto,
  CreateProjectDto,
  CreateWorkPackageDto,
  ListProjectsQueryDto,
  TransitionProjectDto,
  UpdateMilestoneDto,
  UpdateProductCategoryDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
  UpdateWorkPackageDto,
} from "./projects.dto.js";
import { ProjectsService } from "./projects.service.js";

@ApiTags("projects")
@ApiCookieAuth("session")
@ApiForbiddenResponse({ description: "The principal lacks project permission" })
@Controller("api/v1")
export class ProjectsController {
  constructor(
    @Inject(ProjectsService) private readonly projects: ProjectsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("product-categories")
  @ApiOperation({ summary: "List product categories" })
  async productCategories(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    const supplierOnly = principal.memberships.every(
      (membership) => membership.organization.type === "SUPPLIER",
    );
    return {
      data: await this.projects.listProductCategories(principal, supplierOnly),
      meta: requestContext(request),
    };
  }

  @Post("product-categories")
  @ApiOperation({ summary: "Create a product category" })
  @ApiBody({ type: CreateProductCategoryDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createProductCategory(
    @Req() request: Request,
    @Body() input: CreateProductCategoryDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.createProductCategory(
      principal,
      requestContext(request),
      input,
    );
  }

  @Patch("product-categories/:categoryId")
  @ApiOperation({ summary: "Edit a product category with an expected version" })
  @ApiParam({ format: "uuid", name: "categoryId" })
  @ApiBody({ type: UpdateProductCategoryDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateProductCategory(
    @Req() request: Request,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Body() input: UpdateProductCategoryDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateProductCategory(
      principal,
      requestContext(request),
      categoryId,
      input,
    );
  }

  @Get("projects")
  @ApiOperation({
    summary: "List authorized projects with filtering, sorting, and pagination",
  })
  @ApiQuery({
    name: "categoryId",
    required: false,
    type: String,
    format: "uuid",
  })
  @ApiQuery({ name: "direction", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({
    name: "pageSize",
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @ApiQuery({ name: "q", required: false, type: String, maxLength: 100 })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["code", "name", "plannedStartDate", "state", "updatedAt"],
  })
  @ApiQuery({
    name: "state",
    required: false,
    enum: ["DRAFT", "PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"],
  })
  async listProjects(
    @Req() request: Request,
    @Query() query: ListProjectsQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    const result = await this.projects.listProjects(principal, query);
    const page = Number(query.page ?? "1");
    const pageSize = Number(query.pageSize ?? "20");
    return {
      data: result.data,
      meta: requestContext(request),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  @Post("projects")
  @ApiOperation({
    summary: "Create a draft project and assign its creator as project manager",
  })
  @ApiBody({ type: CreateProjectDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createProject(
    @Req() request: Request,
    @Body() input: CreateProjectDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.createProject(
      principal,
      requestContext(request),
      input,
    );
  }

  @Get("projects/:projectId")
  @ApiOperation({ summary: "Read an authorized project overview" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiNotFoundResponse({
    description: "Project is nonexistent or inaccessible",
  })
  async projectOverview(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.projects.projectOverview(principal, projectId);
  }

  @Patch("projects/:projectId")
  @ApiOperation({ summary: "Edit project details; state is not patchable" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: UpdateProjectDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateProject(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: UpdateProjectDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateProject(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Post("projects/:projectId/transitions")
  @ApiOperation({ summary: "Execute an explicit project-state transition" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: TransitionProjectDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async transitionProject(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: TransitionProjectDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.transitionProject(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("projects/:projectId/member-candidates")
  @ApiOperation({
    summary: "List active memberships eligible for project assignment",
  })
  @ApiParam({ format: "uuid", name: "projectId" })
  async memberCandidates(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.projects.memberCandidates(principal, projectId),
      meta: requestContext(request),
    };
  }

  @Post("projects/:projectId/members")
  @ApiOperation({ summary: "Add an explicit project member" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: AddProjectMemberDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async addProjectMember(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: AddProjectMemberDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.addProjectMember(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Patch("projects/:projectId/members/:memberId")
  @ApiOperation({ summary: "Change a project member role or active status" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiParam({ format: "uuid", name: "memberId" })
  @ApiBody({ type: UpdateProjectMemberDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateProjectMember(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Param("memberId", new ParseUUIDPipe()) memberId: string,
    @Body() input: UpdateProjectMemberDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateProjectMember(
      principal,
      requestContext(request),
      projectId,
      memberId,
      input,
    );
  }

  @Post("projects/:projectId/milestones")
  @ApiOperation({ summary: "Create a project milestone" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: CreateMilestoneDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createMilestone(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateMilestoneDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.createMilestone(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Patch("projects/:projectId/milestones/:milestoneId")
  @ApiOperation({ summary: "Edit a project milestone" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiParam({ format: "uuid", name: "milestoneId" })
  @ApiBody({ type: UpdateMilestoneDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateMilestone(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Param("milestoneId", new ParseUUIDPipe()) milestoneId: string,
    @Body() input: UpdateMilestoneDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateMilestone(
      principal,
      requestContext(request),
      projectId,
      milestoneId,
      input,
    );
  }

  @Post("projects/:projectId/work-packages")
  @ApiOperation({ summary: "Create a project work package" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: CreateWorkPackageDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createWorkPackage(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateWorkPackageDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.createWorkPackage(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Patch("projects/:projectId/work-packages/:workPackageId")
  @ApiOperation({ summary: "Edit a project work package" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiParam({ format: "uuid", name: "workPackageId" })
  @ApiBody({ type: UpdateWorkPackageDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateWorkPackage(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Param("workPackageId", new ParseUUIDPipe()) workPackageId: string,
    @Body() input: UpdateWorkPackageDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateWorkPackage(
      principal,
      requestContext(request),
      projectId,
      workPackageId,
      input,
    );
  }
}
````

## File: apps/api/src/projects/projects.dto.ts
````typescript
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { projectStates, type ProjectState } from "./project-state.js";

const projectStateEnum = Object.fromEntries(
  projectStates.map((state) => [state, state]),
) as Record<ProjectState, ProjectState>;
const projectMemberRoles = {
  CONTRIBUTOR: "CONTRIBUTOR",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  SUPPLIER: "SUPPLIER",
  VIEWER: "VIEWER",
} as const;
const projectMemberStatuses = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
const projectSortFields = {
  code: "code",
  name: "name",
  plannedStartDate: "plannedStartDate",
  state: "state",
  updatedAt: "updatedAt",
} as const;
const sortDirections = { asc: "asc", desc: "desc" } as const;
const codePattern = /^[A-Z0-9][A-Z0-9._-]*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class CreateProductCategoryDto {
  @ApiProperty({ example: "PROCESS-EQUIPMENT", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 150, type: String })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateProductCategoryDto extends CreateProductCategoryDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class ListProjectsQueryDto {
  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "1", type: String })
  @IsOptional()
  @Matches(/^\d{1,6}$/)
  page?: string;

  @ApiPropertyOptional({ example: "20", type: String })
  @IsOptional()
  @Matches(/^\d{1,3}$/)
  pageSize?: string;

  @ApiPropertyOptional({ maxLength: 100, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: projectSortFields, type: String })
  @IsOptional()
  @IsEnum(projectSortFields)
  sort?: keyof typeof projectSortFields;

  @ApiPropertyOptional({ enum: sortDirections, type: String })
  @IsOptional()
  @IsEnum(sortDirections)
  direction?: "asc" | "desc";

  @ApiPropertyOptional({ enum: projectStateEnum, type: String })
  @IsOptional()
  @IsEnum(projectStateEnum)
  state?: ProjectState;
}

export class ProjectDetailsDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  productCategoryId!: string;

  @ApiProperty({ example: "PRJ-2026-001", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: "2026-08-03", type: String })
  @Matches(datePattern)
  plannedStartDate!: string;

  @ApiProperty({ example: "2026-11-27", type: String })
  @Matches(datePattern)
  plannedEndDate!: string;
}

export class CreateProjectDto extends ProjectDetailsDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  organizationId!: string;
}

export class UpdateProjectDto extends ProjectDetailsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class TransitionProjectDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;

  @ApiProperty({ enum: projectStateEnum, type: String })
  @IsEnum(projectStateEnum)
  targetState!: ProjectState;
}

export class AddProjectMemberDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  membershipId!: string;

  @ApiProperty({ enum: projectMemberRoles, type: String })
  @IsEnum(projectMemberRoles)
  role!: keyof typeof projectMemberRoles;
}

export class UpdateProjectMemberDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ enum: projectMemberRoles, type: String })
  @IsEnum(projectMemberRoles)
  role!: keyof typeof projectMemberRoles;

  @ApiProperty({ enum: projectMemberStatuses, type: String })
  @IsEnum(projectMemberStatuses)
  status!: keyof typeof projectMemberStatuses;
}

export class MilestoneDetailsDto {
  @ApiProperty({ maxLength: 50, type: String })
  @IsString()
  @Length(1, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: "2026-09-14", type: String })
  @Matches(datePattern)
  targetDate!: string;
}

export class CreateMilestoneDto extends MilestoneDetailsDto {}

export class UpdateMilestoneDto extends MilestoneDetailsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class WorkPackageDetailsDto {
  @ApiProperty({ maxLength: 50, type: String })
  @IsString()
  @Length(1, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ format: "uuid", nullable: true, type: String })
  @IsOptional()
  @IsUUID()
  milestoneId?: string;

  @ApiProperty({ example: "2026-08-03", type: String })
  @Matches(datePattern)
  plannedStartDate!: string;

  @ApiProperty({ example: "2026-09-11", type: String })
  @Matches(datePattern)
  plannedEndDate!: string;
}

export class CreateWorkPackageDto extends WorkPackageDetailsDto {}

export class UpdateWorkPackageDto extends WorkPackageDetailsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
````

## File: apps/api/src/projects/projects.integration.test.ts
````typescript
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

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 2 project workflows and concurrency", () => {
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

  async function admin() {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    sessionHashes.push(tokenHash);
    await database.session.create({
      data: {
        csrfTokenHash: hash(csrf),
        expiresAt: new Date(Date.now() + 120_000),
        tokenHash,
        userId: localFixtures.internalAdminUserId,
      },
    });
    return {
      csrf,
      headers: {
        cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}`,
      },
    };
  }

  async function createProject() {
    const auth = await admin();
    const code = `IT-${randomBytes(6).toString("hex").toUpperCase()}`;
    const response = await fetch(`${baseUrl}/api/v1/projects`, {
      body: JSON.stringify({
        code,
        description: "Project integration fixture",
        name: `Integration ${code}`,
        organizationId: localFixtures.internalOrganizationId,
        plannedEndDate: "2026-12-18",
        plannedStartDate: "2026-08-03",
        productCategoryId: phaseTwoFixtures.demoCategoryId,
      }),
      headers: {
        ...auth.headers,
        "content-type": "application/json",
        "x-csrf-token": auth.csrf,
      },
      method: "POST",
    });
    expect(response.status).toBe(201);
    return {
      auth,
      project: (await response.json()) as {
        code: string;
        id: string;
        name: string;
        version: number;
      },
    };
  }

  it("permits a documented transition, records immutable transition detail, and forbids a reverse transition", async () => {
    const { auth, project } = await createProject();
    const allowed = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/transitions`,
      {
        body: JSON.stringify({
          expectedVersion: project.version,
          reason: "Planning baseline approved",
          targetState: "PLANNED",
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "POST",
      },
    );
    expect(allowed.status).toBe(201);
    const planned = (await allowed.json()) as { version: number };
    const transition = await database.projectTransition.findFirstOrThrow({
      where: { projectId: project.id },
    });
    expect(transition).toMatchObject({
      actorUserId: localFixtures.internalAdminUserId,
      reason: "Planning baseline approved",
      sourceState: "DRAFT",
      targetState: "PLANNED",
    });
    await expect(
      database.$executeRaw`UPDATE project_transitions SET reason = 'altered' WHERE id = ${transition.id}::uuid`,
    ).rejects.toThrow(/immutable/i);

    const forbidden = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/transitions`,
      {
        body: JSON.stringify({
          expectedVersion: planned.version,
          reason: "Attempt an invalid reverse transition",
          targetState: "DRAFT",
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "POST",
      },
    );
    expect(forbidden.status).toBe(422);
  });

  it("accepts exactly one of two concurrent edits with the same expected version", async () => {
    const { auth, project } = await createProject();
    const edit = (name: string) =>
      fetch(`${baseUrl}/api/v1/projects/${project.id}`, {
        body: JSON.stringify({
          code: project.code,
          description: "Concurrent edit fixture",
          expectedVersion: project.version,
          name,
          plannedEndDate: "2026-12-18",
          plannedStartDate: "2026-08-03",
          productCategoryId: phaseTwoFixtures.demoCategoryId,
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "PATCH",
      });
    const responses = await Promise.all([
      edit("Concurrent edit A"),
      edit("Concurrent edit B"),
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(
      await database.auditEvent.count({
        where: { action: "PROJECT_UPDATED", entityId: project.id },
      }),
    ).toBe(1);
  });

  it("rejects arbitrary state patching", async () => {
    const { auth, project } = await createProject();
    const response = await fetch(`${baseUrl}/api/v1/projects/${project.id}`, {
      body: JSON.stringify({
        code: project.code,
        description: "Status must not be patched",
        expectedVersion: project.version,
        name: project.name,
        plannedEndDate: "2026-12-18",
        plannedStartDate: "2026-08-03",
        productCategoryId: phaseTwoFixtures.demoCategoryId,
        state: "ACTIVE",
      }),
      headers: {
        ...auth.headers,
        "content-type": "application/json",
        "x-csrf-token": auth.csrf,
      },
      method: "PATCH",
    });
    expect(response.status).toBe(400);
  });

  it("creates and edits categories, members, milestones, and work packages and lists them through bounded query state", async () => {
    const auth = await admin();
    const suffix = randomBytes(6).toString("hex").toUpperCase();
    const jsonHeaders = {
      ...auth.headers,
      "content-type": "application/json",
      "x-csrf-token": auth.csrf,
    };
    const categoryResponse = await fetch(
      `${baseUrl}/api/v1/product-categories`,
      {
        body: JSON.stringify({
          code: `CAT-${suffix}`,
          description: "Integration category",
          name: `Category ${suffix}`,
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(categoryResponse.status).toBe(201);
    const category = (await categoryResponse.json()) as {
      code: string;
      id: string;
      version: number;
    };
    const categoryEdit = await fetch(
      `${baseUrl}/api/v1/product-categories/${category.id}`,
      {
        body: JSON.stringify({
          active: true,
          code: category.code,
          description: "Edited integration category",
          expectedVersion: category.version,
          name: `Edited category ${suffix}`,
        }),
        headers: jsonHeaders,
        method: "PATCH",
      },
    );
    expect(categoryEdit.status).toBe(200);

    const code = `FULL-${suffix}`;
    const projectResponse = await fetch(`${baseUrl}/api/v1/projects`, {
      body: JSON.stringify({
        code,
        description: "Full aggregate integration fixture",
        name: `Full aggregate ${suffix}`,
        organizationId: localFixtures.internalOrganizationId,
        plannedEndDate: "2026-12-18",
        plannedStartDate: "2026-08-03",
        productCategoryId: category.id,
      }),
      headers: jsonHeaders,
      method: "POST",
    });
    expect(projectResponse.status).toBe(201);
    const project = (await projectResponse.json()) as { id: string };

    const milestoneResponse = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/milestones`,
      {
        body: JSON.stringify({
          code: "M-001",
          description: "Integration milestone",
          name: "Engineering complete",
          targetDate: "2026-09-14",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(milestoneResponse.status).toBe(201);
    const milestone = (await milestoneResponse.json()) as {
      id: string;
      version: number;
    };
    expect(
      (
        await fetch(
          `${baseUrl}/api/v1/projects/${project.id}/milestones/${milestone.id}`,
          {
            body: JSON.stringify({
              code: "M-001",
              description: "Edited integration milestone",
              expectedVersion: milestone.version,
              name: "Engineering baseline complete",
              targetDate: "2026-09-18",
            }),
            headers: jsonHeaders,
            method: "PATCH",
          },
        )
      ).status,
    ).toBe(200);

    const workPackageResponse = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/work-packages`,
      {
        body: JSON.stringify({
          code: "WP-001",
          description: "Integration work package",
          milestoneId: milestone.id,
          name: "Engineering package",
          plannedEndDate: "2026-09-11",
          plannedStartDate: "2026-08-03",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(workPackageResponse.status).toBe(201);
    const workPackage = (await workPackageResponse.json()) as {
      id: string;
      version: number;
    };
    expect(
      (
        await fetch(
          `${baseUrl}/api/v1/projects/${project.id}/work-packages/${workPackage.id}`,
          {
            body: JSON.stringify({
              code: "WP-001",
              description: "Edited integration work package",
              expectedVersion: workPackage.version,
              milestoneId: milestone.id,
              name: "Released engineering package",
              plannedEndDate: "2026-09-12",
              plannedStartDate: "2026-08-04",
            }),
            headers: jsonHeaders,
            method: "PATCH",
          },
        )
      ).status,
    ).toBe(200);

    const invalidProjectDates = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}`,
      {
        body: JSON.stringify({
          code,
          description: "Must retain child date coverage",
          expectedVersion: 1,
          name: `Full aggregate ${suffix}`,
          plannedEndDate: "2026-12-18",
          plannedStartDate: "2026-09-15",
          productCategoryId: category.id,
        }),
        headers: jsonHeaders,
        method: "PATCH",
      },
    );
    expect(invalidProjectDates.status).toBe(422);

    const readonlyMembership = await database.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.internalOrganizationId,
          userId: localFixtures.internalReadonlyUserId,
        },
      },
    });
    const memberResponse = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/members`,
      {
        body: JSON.stringify({
          membershipId: readonlyMembership.id,
          role: "VIEWER",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(memberResponse.status).toBe(201);
    const member = (await memberResponse.json()) as {
      id: string;
      role: string;
      version: number;
    };
    expect(
      (
        await fetch(
          `${baseUrl}/api/v1/projects/${project.id}/members/${member.id}`,
          {
            body: JSON.stringify({
              expectedVersion: member.version,
              role: member.role,
              status: "INACTIVE",
            }),
            headers: jsonHeaders,
            method: "PATCH",
          },
        )
      ).status,
    ).toBe(200);

    const listResponse = await fetch(
      `${baseUrl}/api/v1/projects?q=${code}&state=DRAFT&sort=name&direction=desc&page=1&pageSize=1`,
      { headers: auth.headers },
    );
    expect(listResponse.status).toBe(200);
    expect((await listResponse.json()) as object).toMatchObject({
      data: [{ code }],
      pagination: { page: 1, pageSize: 1, total: 1, totalPages: 1 },
    });
    expect(
      await database.auditEvent.count({
        where: {
          action: {
            in: [
              "PRODUCT_CATEGORY_CREATED",
              "PRODUCT_CATEGORY_UPDATED",
              "MILESTONE_CREATED",
              "MILESTONE_UPDATED",
              "WORK_PACKAGE_CREATED",
              "WORK_PACKAGE_UPDATED",
              "PROJECT_MEMBER_ADDED",
              "PROJECT_MEMBER_UPDATED",
            ],
          },
          OR: [
            { entityId: category.id },
            { entityId: milestone.id },
            { entityId: workPackage.id },
            { entityId: member.id },
          ],
        },
      }),
    ).toBe(8);
  });
});
````

## File: apps/api/src/projects/projects.repository.ts
````typescript
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  createDatabaseClient,
  Prisma,
  type PrismaClient,
} from "@mecoflow/database";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import type {
  ProjectScopeResolver,
  ProjectScope,
} from "../authorization/project-scope.policy.js";
import { canTransitionProject, type ProjectState } from "./project-state.js";

type ProjectMemberRole =
  "PROJECT_MANAGER" | "CONTRIBUTOR" | "VIEWER" | "SUPPLIER";

interface AuditInput {
  action: string;
  actorUserId: string;
  changes: Prisma.InputJsonValue;
  context: RequestContext;
  entityId: string;
  entityType: string;
  organizationId?: string;
}

@Injectable()
export class ProjectsRepository implements ProjectScopeResolver {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private accessWhere(
    principal: AuthenticatedPrincipal,
  ): Prisma.ProjectWhereInput {
    const readableMemberships = principal.memberships.filter((membership) =>
      membership.permissions.has("project.read"),
    );
    const membershipIds = readableMemberships.map(({ id }) => id);
    const managementOrganizationIds = readableMemberships
      .filter(
        (membership) =>
          membership.organization.type === "INTERNAL" &&
          membership.roles.includes("MECO_MANAGEMENT"),
      )
      .map((membership) => membership.organization.id);
    const systemAdministrator = readableMemberships.some(
      (membership) =>
        membership.organization.type === "INTERNAL" &&
        membership.roles.includes("SYSTEM_ADMIN"),
    );
    const OR: Prisma.ProjectWhereInput[] = [];
    if (systemAdministrator) OR.push({ organization: { type: "INTERNAL" } });
    if (managementOrganizationIds.length > 0)
      OR.push({ organizationId: { in: managementOrganizationIds } });
    if (membershipIds.length > 0)
      OR.push({
        members: {
          some: { membershipId: { in: membershipIds }, status: "ACTIVE" },
        },
      });
    return OR.length > 0 ? { OR } : { id: { in: [] } };
  }

  private audit(transaction: Prisma.TransactionClient, input: AuditInput) {
    return transaction.auditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: input.entityType,
        organizationId: input.organizationId ?? null,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
      },
    });
  }

  async scope(projectId: string): Promise<ProjectScope | null> {
    return this.database.project
      .findUnique({
        select: { organizationId: true, id: true },
        where: { id: projectId },
      })
      .then((project) =>
        project
          ? { organizationId: project.organizationId, projectId: project.id }
          : null,
      );
  }

  async canAccessProject(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<boolean> {
    return Boolean(
      await this.database.project.findFirst({
        select: { id: true },
        where: {
          ...this.accessWhere(principal),
          id: scope.projectId,
          organizationId: scope.organizationId,
        },
      }),
    );
  }

  async canWriteProject(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<boolean> {
    const writableMembershipIds = principal.memberships
      .filter((membership) => membership.permissions.has("project.write"))
      .map(({ id }) => id);
    const systemAdministrator = principal.memberships.some(
      (membership) =>
        membership.organization.type === "INTERNAL" &&
        membership.roles.includes("SYSTEM_ADMIN") &&
        membership.permissions.has("project.write"),
    );
    return Boolean(
      await this.database.project.findFirst({
        select: { id: true },
        where: {
          id: scope.projectId,
          organizationId: scope.organizationId,
          OR: [
            ...(systemAdministrator
              ? [{ organization: { type: "INTERNAL" as const } }]
              : []),
            {
              members: {
                some: {
                  membershipId: { in: writableMembershipIds },
                  status: "ACTIVE",
                },
              },
            },
          ],
        },
      }),
    );
  }

  listProductCategories(activeOnly = false) {
    return this.database.productCategory.findMany({
      orderBy: { name: "asc" },
      ...(activeOnly ? { where: { active: true } } : {}),
    });
  }

  async createProductCategory(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    name: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      let category;
      try {
        category = await transaction.productCategory.create({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
          },
        });
      } catch {
        throw new UnprocessableEntityException("Invalid product category");
      }
      await this.audit(transaction, {
        action: "PRODUCT_CATEGORY_CREATED",
        actorUserId: input.actorUserId,
        changes: { code: { from: null, to: category.code } },
        context: input.context,
        entityId: category.id,
        entityType: "ProductCategory",
        organizationId: input.auditOrganizationId,
      });
      return category;
    });
  }

  async updateProductCategory(input: {
    active: boolean;
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    id: string;
    name: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const current = await transaction.productCategory.findUnique({
        where: { id: input.id },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      let result;
      try {
        result = await transaction.productCategory.updateMany({
          data: {
            active: input.active,
            code: input.code,
            description: input.description,
            name: input.name,
            version: { increment: 1 },
          },
          where: { id: input.id, version: input.expectedVersion },
        });
      } catch {
        throw new UnprocessableEntityException("Invalid product category");
      }
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.productCategory.findUniqueOrThrow({
        where: { id: input.id },
      });
      await this.audit(transaction, {
        action: "PRODUCT_CATEGORY_UPDATED",
        actorUserId: input.actorUserId,
        changes: {
          active: { from: current.active, to: updated.active },
          code: { from: current.code, to: updated.code },
          name: { from: current.name, to: updated.name },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "ProductCategory",
        organizationId: input.auditOrganizationId,
      });
      return updated;
    });
  }

  async listProjects(
    principal: AuthenticatedPrincipal,
    input: {
      categoryId?: string;
      direction: "asc" | "desc";
      page: number;
      pageSize: number;
      q?: string;
      sort: "code" | "name" | "plannedStartDate" | "state" | "updatedAt";
      state?: ProjectState;
    },
  ) {
    const where: Prisma.ProjectWhereInput = {
      AND: [
        this.accessWhere(principal),
        {
          ...(input.categoryId ? { productCategoryId: input.categoryId } : {}),
          ...(input.state ? { state: input.state } : {}),
          ...(input.q
            ? {
                OR: [
                  { code: { contains: input.q, mode: "insensitive" } },
                  { name: { contains: input.q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      ],
    };
    const [data, total] = await this.database.$transaction([
      this.database.project.findMany({
        orderBy: [{ [input.sort]: input.direction }, { id: "asc" }],
        select: {
          code: true,
          id: true,
          name: true,
          plannedEndDate: true,
          plannedStartDate: true,
          productCategory: { select: { code: true, id: true, name: true } },
          state: true,
          updatedAt: true,
          version: true,
        },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        where,
      }),
      this.database.project.count({ where }),
    ]);
    return { data, total };
  }

  async createProject(input: {
    actorMembershipId: string;
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    name: string;
    organizationId: string;
    plannedEndDate: Date;
    plannedStartDate: Date;
    productCategoryId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const [organization, category, membership] = await Promise.all([
        transaction.organization.findFirst({
          where: { active: true, id: input.organizationId, type: "INTERNAL" },
        }),
        transaction.productCategory.findFirst({
          where: { active: true, id: input.productCategoryId },
        }),
        transaction.membership.findFirst({
          where: {
            id: input.actorMembershipId,
            organizationId: input.organizationId,
            status: "ACTIVE",
            userId: input.actorUserId,
          },
        }),
      ]);
      if (!organization || !category || !membership)
        throw new UnprocessableEntityException("Invalid project scope");
      let project;
      try {
        project = await transaction.project.create({
          data: {
            code: input.code,
            createdByUserId: input.actorUserId,
            description: input.description,
            name: input.name,
            organizationId: input.organizationId,
            plannedEndDate: input.plannedEndDate,
            plannedStartDate: input.plannedStartDate,
            productCategoryId: input.productCategoryId,
          },
        });
      } catch {
        throw new UnprocessableEntityException("Invalid or duplicate project");
      }
      await transaction.projectMember.create({
        data: {
          addedByUserId: input.actorUserId,
          membershipId: input.actorMembershipId,
          projectId: project.id,
          role: "PROJECT_MANAGER",
        },
      });
      await this.audit(transaction, {
        action: "PROJECT_CREATED",
        actorUserId: input.actorUserId,
        changes: {
          code: { from: null, to: project.code },
          state: { from: null, to: "DRAFT" },
        },
        context: input.context,
        entityId: project.id,
        entityType: "Project",
        organizationId: project.organizationId,
      });
      return project;
    });
  }

  projectOverview(projectId: string) {
    return this.database.project.findUnique({
      include: {
        members: {
          include: {
            membership: {
              include: {
                organization: {
                  select: { code: true, id: true, name: true, type: true },
                },
                user: { select: { displayName: true, email: true, id: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        milestones: { orderBy: [{ targetDate: "asc" }, { code: "asc" }] },
        organization: { select: { code: true, id: true, name: true } },
        productCategory: { select: { code: true, id: true, name: true } },
        transitions: {
          include: { actor: { select: { displayName: true, id: true } } },
          orderBy: { occurredAt: "desc" },
        },
        workPackages: {
          orderBy: [{ plannedStartDate: "asc" }, { code: "asc" }],
        },
      },
      where: { id: projectId },
    });
  }

  async updateProject(input: {
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    name: string;
    plannedEndDate: Date;
    plannedStartDate: Date;
    productCategoryId: string;
    projectId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const [current, category] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        transaction.productCategory.findFirst({
          where: { active: true, id: input.productCategoryId },
        }),
      ]);
      if (!current) throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(current.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (!category)
        throw new UnprocessableEntityException("Invalid product category");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const [milestoneOutsideDates, workPackageOutsideDates] =
        await Promise.all([
          transaction.milestone.findFirst({
            select: { id: true },
            where: {
              projectId: input.projectId,
              OR: [
                { targetDate: { lt: input.plannedStartDate } },
                { targetDate: { gt: input.plannedEndDate } },
              ],
            },
          }),
          transaction.workPackage.findFirst({
            select: { id: true },
            where: {
              projectId: input.projectId,
              OR: [
                { plannedStartDate: { lt: input.plannedStartDate } },
                { plannedEndDate: { gt: input.plannedEndDate } },
              ],
            },
          }),
        ]);
      if (milestoneOutsideDates || workPackageOutsideDates)
        throw new UnprocessableEntityException(
          "Project dates exclude existing planned work",
        );
      let result;
      try {
        result = await transaction.project.updateMany({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
            plannedEndDate: input.plannedEndDate,
            plannedStartDate: input.plannedStartDate,
            productCategoryId: input.productCategoryId,
            version: { increment: 1 },
          },
          where: { id: input.projectId, version: input.expectedVersion },
        });
      } catch {
        throw new UnprocessableEntityException("Invalid or duplicate project");
      }
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.project.findUniqueOrThrow({
        where: { id: input.projectId },
      });
      await this.audit(transaction, {
        action: "PROJECT_UPDATED",
        actorUserId: input.actorUserId,
        changes: {
          code: { from: current.code, to: updated.code },
          name: { from: current.name, to: updated.name },
          plannedEndDate: {
            from: current.plannedEndDate.toISOString(),
            to: updated.plannedEndDate.toISOString(),
          },
          plannedStartDate: {
            from: current.plannedStartDate.toISOString(),
            to: updated.plannedStartDate.toISOString(),
          },
        },
        context: input.context,
        entityId: current.id,
        entityType: "Project",
        organizationId: current.organizationId,
      });
      return updated;
    });
  }

  async transitionProject(input: {
    actorUserId: string;
    context: RequestContext;
    expectedVersion: number;
    projectId: string;
    reason: string;
    targetState: ProjectState;
  }) {
    return this.database.$transaction(async (transaction) => {
      const current = await transaction.project.findUnique({
        where: { id: input.projectId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (!canTransitionProject(current.state, input.targetState))
        throw new UnprocessableEntityException("Invalid project transition");
      const result = await transaction.project.updateMany({
        data: { state: input.targetState, version: { increment: 1 } },
        where: { id: input.projectId, version: input.expectedVersion },
      });
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const transition = await transaction.projectTransition.create({
        data: {
          actorUserId: input.actorUserId,
          projectId: input.projectId,
          reason: input.reason,
          sourceState: current.state,
          targetState: input.targetState,
        },
      });
      await this.audit(transaction, {
        action: "PROJECT_STATE_TRANSITIONED",
        actorUserId: input.actorUserId,
        changes: {
          reason: input.reason,
          sourceState: current.state,
          targetState: input.targetState,
          transitionId: transition.id,
        },
        context: input.context,
        entityId: current.id,
        entityType: "Project",
        organizationId: current.organizationId,
      });
      return transaction.project.findUniqueOrThrow({
        where: { id: current.id },
      });
    });
  }

  async memberCandidates(projectId: string) {
    const project = await this.database.project.findUnique({
      select: { organizationId: true },
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Resource not found");
    return this.database.membership.findMany({
      orderBy: [{ organization: { name: "asc" } }, { user: { email: "asc" } }],
      select: {
        id: true,
        organization: {
          select: { code: true, id: true, name: true, type: true },
        },
        user: { select: { displayName: true, email: true, id: true } },
      },
      where: {
        organization: {
          active: true,
          OR: [{ id: project.organizationId }, { type: "SUPPLIER" }],
        },
        projectMembers: { none: { projectId } },
        status: "ACTIVE",
      },
    });
  }

  async addProjectMember(input: {
    actorUserId: string;
    context: RequestContext;
    membershipId: string;
    projectId: string;
    role: ProjectMemberRole;
  }) {
    return this.database.$transaction(async (transaction) => {
      const [project, membership] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        transaction.membership.findFirst({
          include: { organization: true },
          where: {
            id: input.membershipId,
            organization: { active: true },
            status: "ACTIVE",
          },
        }),
      ]);
      if (!project || !membership)
        throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      const supplier = membership.organization.type === "SUPPLIER";
      if (
        (supplier && input.role !== "SUPPLIER") ||
        (!supplier && input.role === "SUPPLIER") ||
        (!supplier && membership.organizationId !== project.organizationId)
      )
        throw new UnprocessableEntityException("Invalid project member scope");
      let member;
      try {
        member = await transaction.projectMember.create({
          data: {
            addedByUserId: input.actorUserId,
            membershipId: input.membershipId,
            projectId: input.projectId,
            role: input.role,
          },
        });
      } catch {
        throw new UnprocessableEntityException("Project member already exists");
      }
      await this.audit(transaction, {
        action: "PROJECT_MEMBER_ADDED",
        actorUserId: input.actorUserId,
        changes: {
          membershipId: input.membershipId,
          role: { from: null, to: input.role },
          status: { from: null, to: "ACTIVE" },
        },
        context: input.context,
        entityId: member.id,
        entityType: "ProjectMember",
        organizationId: project.organizationId,
      });
      return member;
    });
  }

  async updateProjectMember(input: {
    actorUserId: string;
    context: RequestContext;
    expectedVersion: number;
    memberId: string;
    projectId: string;
    role: ProjectMemberRole;
    status: "ACTIVE" | "INACTIVE";
  }) {
    return this.database.$transaction(async (transaction) => {
      const current = await transaction.projectMember.findFirst({
        include: {
          membership: { include: { organization: true } },
          project: true,
        },
        where: { id: input.memberId, projectId: input.projectId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(current.project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const supplier = current.membership.organization.type === "SUPPLIER";
      if (
        (supplier && input.role !== "SUPPLIER") ||
        (!supplier && input.role === "SUPPLIER")
      )
        throw new UnprocessableEntityException("Invalid project member scope");
      if (
        input.status === "ACTIVE" &&
        (current.membership.status !== "ACTIVE" ||
          !current.membership.organization.active)
      )
        throw new UnprocessableEntityException("Inactive membership scope");
      if (
        current.status === "ACTIVE" &&
        current.role === "PROJECT_MANAGER" &&
        (input.status !== "ACTIVE" || input.role !== "PROJECT_MANAGER")
      ) {
        const managerCount = await transaction.projectMember.count({
          where: {
            projectId: input.projectId,
            role: "PROJECT_MANAGER",
            status: "ACTIVE",
          },
        });
        if (managerCount <= 1)
          throw new UnprocessableEntityException(
            "A project manager is required",
          );
      }
      const result = await transaction.projectMember.updateMany({
        data: {
          role: input.role,
          status: input.status,
          version: { increment: 1 },
        },
        where: {
          id: input.memberId,
          projectId: input.projectId,
          version: input.expectedVersion,
        },
      });
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.projectMember.findUniqueOrThrow({
        where: { id: input.memberId },
      });
      await this.audit(transaction, {
        action: "PROJECT_MEMBER_UPDATED",
        actorUserId: input.actorUserId,
        changes: {
          role: { from: current.role, to: updated.role },
          status: { from: current.status, to: updated.status },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "ProjectMember",
        organizationId: current.project.organizationId,
      });
      return updated;
    });
  }

  async createMilestone(input: {
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    name: string;
    projectId: string;
    targetDate: Date;
  }) {
    return this.database.$transaction(async (transaction) => {
      const project = await transaction.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (
        input.targetDate < project.plannedStartDate ||
        input.targetDate > project.plannedEndDate
      )
        throw new UnprocessableEntityException(
          "Milestone date is outside project dates",
        );
      let milestone;
      try {
        milestone = await transaction.milestone.create({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
            projectId: input.projectId,
            targetDate: input.targetDate,
          },
        });
      } catch {
        throw new UnprocessableEntityException(
          "Invalid or duplicate milestone",
        );
      }
      await this.audit(transaction, {
        action: "MILESTONE_CREATED",
        actorUserId: input.actorUserId,
        changes: {
          code: { from: null, to: milestone.code },
          targetDate: milestone.targetDate.toISOString(),
        },
        context: input.context,
        entityId: milestone.id,
        entityType: "Milestone",
        organizationId: project.organizationId,
      });
      return milestone;
    });
  }

  async updateMilestone(input: {
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    milestoneId: string;
    name: string;
    projectId: string;
    targetDate: Date;
  }) {
    return this.database.$transaction(async (transaction) => {
      const [project, current] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        transaction.milestone.findFirst({
          where: { id: input.milestoneId, projectId: input.projectId },
        }),
      ]);
      if (!project || !current)
        throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (
        input.targetDate < project.plannedStartDate ||
        input.targetDate > project.plannedEndDate
      )
        throw new UnprocessableEntityException(
          "Milestone date is outside project dates",
        );
      let result;
      try {
        result = await transaction.milestone.updateMany({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
            targetDate: input.targetDate,
            version: { increment: 1 },
          },
          where: {
            id: input.milestoneId,
            projectId: input.projectId,
            version: input.expectedVersion,
          },
        });
      } catch {
        throw new UnprocessableEntityException(
          "Invalid or duplicate milestone",
        );
      }
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.milestone.findUniqueOrThrow({
        where: { id: input.milestoneId },
      });
      await this.audit(transaction, {
        action: "MILESTONE_UPDATED",
        actorUserId: input.actorUserId,
        changes: {
          targetDate: {
            from: current.targetDate.toISOString(),
            to: updated.targetDate.toISOString(),
          },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "Milestone",
        organizationId: project.organizationId,
      });
      return updated;
    });
  }

  async createWorkPackage(input: {
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    milestoneId?: string;
    name: string;
    plannedEndDate: Date;
    plannedStartDate: Date;
    projectId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const [project, milestone] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        input.milestoneId
          ? transaction.milestone.findFirst({
              where: { id: input.milestoneId, projectId: input.projectId },
            })
          : Promise.resolve(null),
      ]);
      if (!project || (input.milestoneId && !milestone))
        throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (
        input.plannedStartDate < project.plannedStartDate ||
        input.plannedEndDate > project.plannedEndDate
      )
        throw new UnprocessableEntityException(
          "Work package dates are outside project dates",
        );
      let workPackage;
      try {
        workPackage = await transaction.workPackage.create({
          data: {
            code: input.code,
            description: input.description,
            milestoneId: input.milestoneId ?? null,
            name: input.name,
            plannedEndDate: input.plannedEndDate,
            plannedStartDate: input.plannedStartDate,
            projectId: input.projectId,
          },
        });
      } catch {
        throw new UnprocessableEntityException(
          "Invalid or duplicate work package",
        );
      }
      await this.audit(transaction, {
        action: "WORK_PACKAGE_CREATED",
        actorUserId: input.actorUserId,
        changes: {
          code: { from: null, to: workPackage.code },
          milestoneId: input.milestoneId ?? null,
        },
        context: input.context,
        entityId: workPackage.id,
        entityType: "WorkPackage",
        organizationId: project.organizationId,
      });
      return workPackage;
    });
  }

  async updateWorkPackage(input: {
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    milestoneId?: string;
    name: string;
    plannedEndDate: Date;
    plannedStartDate: Date;
    projectId: string;
    workPackageId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const [project, current, milestone] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        transaction.workPackage.findFirst({
          where: { id: input.workPackageId, projectId: input.projectId },
        }),
        input.milestoneId
          ? transaction.milestone.findFirst({
              where: { id: input.milestoneId, projectId: input.projectId },
            })
          : Promise.resolve(null),
      ]);
      if (!project || !current || (input.milestoneId && !milestone))
        throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (
        input.plannedStartDate < project.plannedStartDate ||
        input.plannedEndDate > project.plannedEndDate
      )
        throw new UnprocessableEntityException(
          "Work package dates are outside project dates",
        );
      let result;
      try {
        result = await transaction.workPackage.updateMany({
          data: {
            code: input.code,
            description: input.description,
            milestoneId: input.milestoneId ?? null,
            name: input.name,
            plannedEndDate: input.plannedEndDate,
            plannedStartDate: input.plannedStartDate,
            version: { increment: 1 },
          },
          where: {
            id: input.workPackageId,
            projectId: input.projectId,
            version: input.expectedVersion,
          },
        });
      } catch {
        throw new UnprocessableEntityException(
          "Invalid or duplicate work package",
        );
      }
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.workPackage.findUniqueOrThrow({
        where: { id: input.workPackageId },
      });
      await this.audit(transaction, {
        action: "WORK_PACKAGE_UPDATED",
        actorUserId: input.actorUserId,
        changes: {
          milestoneId: { from: current.milestoneId, to: updated.milestoneId },
          plannedEndDate: {
            from: current.plannedEndDate.toISOString(),
            to: updated.plannedEndDate.toISOString(),
          },
          plannedStartDate: {
            from: current.plannedStartDate.toISOString(),
            to: updated.plannedStartDate.toISOString(),
          },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "WorkPackage",
        organizationId: project.organizationId,
      });
      return updated;
    });
  }
}
````

## File: apps/api/src/projects/projects.service.ts
````typescript
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { datesAreOrdered, type ProjectState } from "./project-state.js";
import { ProjectAuthorizationPolicy } from "./project-authorization.policy.js";
import { ProjectsRepository } from "./projects.repository.js";

function text(value: string | undefined): string {
  return value?.trim() ?? "";
}

function date(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    throw new UnprocessableEntityException("Invalid date");
  return parsed;
}

function projectDates(input: {
  plannedEndDate: string;
  plannedStartDate: string;
}): { plannedEndDate: Date; plannedStartDate: Date } {
  const plannedStartDate = date(input.plannedStartDate);
  const plannedEndDate = date(input.plannedEndDate);
  if (!datesAreOrdered(plannedStartDate, plannedEndDate))
    throw new UnprocessableEntityException("Invalid project dates");
  return { plannedEndDate, plannedStartDate };
}

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly policy: ProjectAuthorizationPolicy,
    @Inject(ProjectsRepository)
    private readonly repository: ProjectsRepository,
  ) {}

  listProductCategories(principal: AuthenticatedPrincipal, activeOnly = false) {
    this.policy.requireList(principal);
    return this.repository.listProductCategories(activeOnly);
  }

  createProductCategory(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: { code: string; description?: string; name: string },
  ) {
    const membership = this.policy.requireCategoryWrite(principal);
    return this.repository.createProductCategory({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      name: input.name.trim(),
    });
  }

  updateProductCategory(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      active: boolean;
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
    },
  ) {
    const membership = this.policy.requireCategoryWrite(principal);
    return this.repository.updateProductCategory({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      id,
      name: input.name.trim(),
    });
  }

  async listProjects(
    principal: AuthenticatedPrincipal,
    input: {
      categoryId?: string;
      direction?: "asc" | "desc";
      page?: string;
      pageSize?: string;
      q?: string;
      sort?: "code" | "name" | "plannedStartDate" | "state" | "updatedAt";
      state?: ProjectState;
    },
  ) {
    this.policy.requireList(principal);
    const page = Number(input.page ?? "1");
    const pageSize = Number(input.pageSize ?? "20");
    if (page < 1 || pageSize < 1 || pageSize > 100)
      throw new UnprocessableEntityException("Invalid pagination");
    return this.repository.listProjects(principal, {
      direction: input.direction ?? "asc",
      page,
      pageSize,
      sort: input.sort ?? "code",
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(text(input.q) ? { q: text(input.q) } : {}),
      ...(input.state ? { state: input.state } : {}),
    });
  }

  createProject(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: {
      code: string;
      description?: string;
      name: string;
      organizationId: string;
      plannedEndDate: string;
      plannedStartDate: string;
      productCategoryId: string;
    },
  ) {
    const membership = this.policy.requireCreate(
      principal,
      input.organizationId,
    );
    return this.repository.createProject({
      ...projectDates(input),
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      name: input.name.trim(),
      organizationId: input.organizationId,
      productCategoryId: input.productCategoryId,
    });
  }

  async projectOverview(principal: AuthenticatedPrincipal, projectId: string) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireProjectRead(principal, scope);
    const project = await this.repository.projectOverview(projectId);
    if (!project) throw new UnprocessableEntityException("Project unavailable");
    const internal = principal.memberships.some(
      (membership) => membership.organization.type === "INTERNAL",
    );
    if (internal) return project;
    return { ...project, members: undefined, transitions: undefined };
  }

  async updateProject(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
      plannedEndDate: string;
      plannedStartDate: string;
      productCategoryId: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireProjectWrite(principal, scope);
    return this.repository.updateProject({
      ...projectDates(input),
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      expectedVersion: input.expectedVersion,
      name: input.name.trim(),
      productCategoryId: input.productCategoryId,
      projectId,
    });
  }

  async transitionProject(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      expectedVersion: number;
      reason: string;
      targetState: ProjectState;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireProjectWrite(principal, scope);
    return this.repository.transitionProject({
      actorUserId: principal.user.id,
      context,
      expectedVersion: input.expectedVersion,
      projectId,
      reason: input.reason.trim(),
      targetState: input.targetState,
    });
  }

  async memberCandidates(principal: AuthenticatedPrincipal, projectId: string) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireMemberManagement(principal, scope);
    return this.repository.memberCandidates(projectId);
  }

  async addProjectMember(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      membershipId: string;
      role: "PROJECT_MANAGER" | "CONTRIBUTOR" | "VIEWER" | "SUPPLIER";
    },
  ) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireMemberManagement(principal, scope);
    return this.repository.addProjectMember({
      actorUserId: principal.user.id,
      context,
      membershipId: input.membershipId,
      projectId,
      role: input.role,
    });
  }

  async updateProjectMember(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    memberId: string,
    input: {
      expectedVersion: number;
      role: "PROJECT_MANAGER" | "CONTRIBUTOR" | "VIEWER" | "SUPPLIER";
      status: "ACTIVE" | "INACTIVE";
    },
  ) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireMemberManagement(principal, scope);
    return this.repository.updateProjectMember({
      actorUserId: principal.user.id,
      context,
      memberId,
      projectId,
      ...input,
    });
  }

  async createMilestone(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      code: string;
      description?: string;
      name: string;
      targetDate: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireProjectWrite(principal, scope);
    return this.repository.createMilestone({
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      name: input.name.trim(),
      projectId,
      targetDate: date(input.targetDate),
    });
  }

  async updateMilestone(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    milestoneId: string,
    input: {
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
      targetDate: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireProjectWrite(principal, scope);
    return this.repository.updateMilestone({
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      expectedVersion: input.expectedVersion,
      milestoneId,
      name: input.name.trim(),
      projectId,
      targetDate: date(input.targetDate),
    });
  }

  async createWorkPackage(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      code: string;
      description?: string;
      milestoneId?: string;
      name: string;
      plannedEndDate: string;
      plannedStartDate: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireProjectWrite(principal, scope);
    return this.repository.createWorkPackage({
      ...projectDates(input),
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      ...(input.milestoneId ? { milestoneId: input.milestoneId } : {}),
      name: input.name.trim(),
      projectId,
    });
  }

  async updateWorkPackage(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    workPackageId: string,
    input: {
      code: string;
      description?: string;
      expectedVersion: number;
      milestoneId?: string;
      name: string;
      plannedEndDate: string;
      plannedStartDate: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireProjectWrite(principal, scope);
    return this.repository.updateWorkPackage({
      ...projectDates(input),
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      expectedVersion: input.expectedVersion,
      ...(input.milestoneId ? { milestoneId: input.milestoneId } : {}),
      name: input.name.trim(),
      projectId,
      workPackageId,
    });
  }
}
````

## File: apps/web/app/internal/items/[itemId]/page.tsx
````typescript
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../lib/api";
import { deactivateItem, updateItem } from "../actions";
import {
  formatDateTime,
  itemCategories,
  itemDetail,
  unitsOfMeasure,
  type SpecificationAttributeDefinition,
} from "../data";
import { SpecificationFields } from "../specification-fields";

function displaySpecificationValue(
  value: string | boolean | undefined,
): string {
  if (value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      itemId,
    )
  ) {
    notFound();
  }
  const [me, item, categories, units] = await Promise.all([
    requireMe("INTERNAL"),
    itemDetail(itemId),
    itemCategories(),
    unitsOfMeasure(),
  ]);
  const canWrite =
    item.active &&
    me.memberships.some((membership) =>
      membership.permissions.includes("item.write"),
    );
  const category = categories.find(({ id }) => id === item.itemCategory.id);
  const values = new Map(
    item.specificationValues.map(({ attributeDefinitionId, value }) => [
      attributeDefinitionId,
      value,
    ]),
  );
  const definitions = new Map<string, SpecificationAttributeDefinition>();
  for (const definition of category?.specificationAttributes ?? []) {
    definitions.set(definition.id, definition);
  }
  for (const specification of item.specificationValues) {
    if (!definitions.has(specification.attributeDefinitionId)) {
      definitions.set(
        specification.attributeDefinitionId,
        specification.attributeDefinition,
      );
    }
  }
  const specificationDefinitions = [...definitions.values()].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
  );

  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/items">Items</Link>
        <span aria-hidden="true">/</span>
        <span>{item.code}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">{item.itemCategory.name}</p>
          <h1>{item.name}</h1>
          <p className="lede">{item.code}</p>
        </div>
        <span
          className={`status status--${item.active ? "active" : "inactive"}`}
        >
          {item.active ? "Active" : "Inactive"}
        </span>
      </div>

      <section className="summary-grid" aria-label="Item summary">
        <div>
          <span>Category</span>
          <strong>{item.itemCategory.name}</strong>
        </div>
        <div>
          <span>Base unit</span>
          <strong>
            {item.unitOfMeasure.name} ({item.unitOfMeasure.symbol})
          </strong>
        </div>
        <div>
          <span>Quantity precision</span>
          <strong>{item.unitOfMeasure.decimalPrecision} decimal places</strong>
        </div>
        <div>
          <span>Last updated</span>
          <strong>{formatDateTime(item.updatedAt)}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Item details</h2>
        <p>{item.description || "No item description."}</p>
        {!item.active ? (
          <p className="notice">
            This item is inactive and retained for historical traceability.
            Normal hard deletion is not available.
          </p>
        ) : null}
        {canWrite ? (
          <details>
            <summary>Edit item</summary>
            <form
              action={updateItem}
              aria-label={`Edit item ${item.code}`}
              className="form-grid form-grid--wide"
            >
              <input type="hidden" name="itemId" value={item.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={item.version}
              />
              <label>
                Item code
                <input
                  name="code"
                  defaultValue={item.code}
                  required
                  minLength={2}
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Item name
                <input
                  name="name"
                  defaultValue={item.name}
                  required
                  minLength={2}
                  maxLength={200}
                />
              </label>
              <label>
                Category (cannot be changed)
                <input value={item.itemCategory.name} readOnly />
              </label>
              <label>
                Base unit of measure
                <select
                  name="unitOfMeasureId"
                  defaultValue={item.unitOfMeasure.id}
                  required
                >
                  {units
                    .filter(
                      (unit) =>
                        unit.active || unit.id === item.unitOfMeasure.id,
                    )
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.code} — {unit.name} ({unit.symbol})
                        {unit.active ? "" : " — inactive"}
                      </option>
                    ))}
                </select>
              </label>
              <label className="span-all">
                Item description
                <textarea
                  name="description"
                  defaultValue={item.description}
                  rows={3}
                  maxLength={2000}
                />
              </label>
              <SpecificationFields
                attributes={specificationDefinitions.filter(
                  (definition) => definition.active,
                )}
                values={values}
              />
              <button type="submit">Save item</button>
            </form>
          </details>
        ) : null}
      </section>

      <section className="panel">
        <h2>Specifications</h2>
        {specificationDefinitions.length === 0 ? (
          <p>This item category has no structured specifications.</p>
        ) : (
          <table>
            <caption className="visually-hidden">
              Structured specification values for {item.code}
            </caption>
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Value</th>
                <th>Definition status</th>
              </tr>
            </thead>
            <tbody>
              {specificationDefinitions.map((definition) => (
                <tr key={definition.id}>
                  <td>
                    {definition.name}
                    <small>{definition.code}</small>
                  </td>
                  <td>
                    {displaySpecificationValue(values.get(definition.id))}
                    {definition.unitOfMeasure
                      ? ` ${definition.unitOfMeasure.symbol}`
                      : ""}
                  </td>
                  <td>
                    {definition.active ? "Active" : "Inactive"} ·{" "}
                    {definition.required ? "Required" : "Optional"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {canWrite ? (
        <section className="panel panel--danger">
          <h2 id="deactivate-item-title">Deactivate item</h2>
          <p>
            Deactivation removes this item from normal active selection while
            preserving its identifier, specifications, and audit history.
          </p>
          <form
            action={deactivateItem}
            aria-labelledby="deactivate-item-title"
            className="form-grid"
          >
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="expectedVersion" value={item.version} />
            <label>
              Deactivation reason
              <input name="reason" required minLength={5} maxLength={500} />
            </label>
            <button className="button--danger" type="submit">
              Deactivate item
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
````

## File: apps/web/app/internal/items/export/route.ts
````typescript
import type { NextRequest } from "next/server";
import { apiRequest } from "../../../lib/api";

export async function GET(request: NextRequest): Promise<Response> {
  const upstream = await apiRequest(
    `/api/v1/items/export.csv${request.nextUrl.search}`,
  );
  if (upstream.status === 401) {
    return Response.redirect(new URL("/login", request.url));
  }
  if (upstream.status === 403) {
    return Response.redirect(new URL("/access-denied", request.url));
  }
  if (!upstream.ok) {
    return new Response("Item export is unavailable", {
      headers: { "content-type": "text/plain; charset=utf-8" },
      status: upstream.status >= 500 ? 502 : upstream.status,
    });
  }

  const headers = new Headers({
    "cache-control": "private, no-store",
    "content-disposition":
      upstream.headers.get("content-disposition") ??
      'attachment; filename="items.csv"',
    "content-type":
      upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  return new Response(upstream.body, { headers, status: upstream.status });
}
````

## File: apps/web/app/internal/items/actions.ts
````typescript
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";
import type { SpecificationDataType } from "./data";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, name: string): boolean {
  return field(formData, name) === "true";
}

async function write<T>(
  path: string,
  method: "PATCH" | "POST",
  body: unknown,
): Promise<T> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const result = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf ?? "",
    },
    method,
  });
  if (!result.ok) {
    const error = (await result.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? "The item-master change could not be completed",
    );
  }
  return (result.status === 204 ? undefined : await result.json()) as T;
}

function specificationDefinitionBody(formData: FormData) {
  const dataType = field(formData, "dataType") as SpecificationDataType;
  const unitOfMeasureId = field(formData, "attributeUnitOfMeasureId");
  const decimalPrecision = field(formData, "attributeDecimalPrecision");
  return {
    code: field(formData, "attributeCode").toUpperCase(),
    dataType,
    description: field(formData, "attributeDescription"),
    name: field(formData, "attributeName"),
    required: checked(formData, "attributeRequired"),
    sortOrder: Number(field(formData, "attributeSortOrder")),
    ...(dataType === "NUMBER" && decimalPrecision !== ""
      ? { decimalPrecision: Number(decimalPrecision) }
      : {}),
    ...(dataType === "NUMBER" && unitOfMeasureId ? { unitOfMeasureId } : {}),
  };
}

function specificationValues(formData: FormData) {
  const values: Array<{
    attributeDefinitionId: string;
    value: string | boolean;
  }> = [];
  const seen = new Set<string>();
  for (const entry of formData.getAll("specificationAttribute")) {
    if (typeof entry !== "string") continue;
    const [attributeDefinitionId, dataType] = entry.split("|");
    if (
      !attributeDefinitionId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        attributeDefinitionId,
      ) ||
      !dataType ||
      !(["TEXT", "NUMBER", "BOOLEAN"] as string[]).includes(dataType) ||
      seen.has(attributeDefinitionId)
    ) {
      throw new Error("The specification input is invalid");
    }
    seen.add(attributeDefinitionId);
    const name = `specificationValue.${attributeDefinitionId}`;
    if (dataType === "BOOLEAN") {
      values.push({
        attributeDefinitionId,
        value: field(formData, name) === "true",
      });
      continue;
    }
    const value = field(formData, name);
    if (value !== "") values.push({ attributeDefinitionId, value });
  }
  return values;
}

export async function createItemCategory(formData: FormData): Promise<void> {
  await write("/api/v1/item-categories", "POST", {
    code: field(formData, "categoryCode").toUpperCase(),
    description: field(formData, "categoryDescription"),
    name: field(formData, "categoryName"),
  });
  revalidatePath("/internal/items");
}

export async function updateItemCategory(formData: FormData): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await write(`/api/v1/item-categories/${categoryId}`, "PATCH", {
    active: checked(formData, "categoryActive"),
    code: field(formData, "categoryCode").toUpperCase(),
    description: field(formData, "categoryDescription"),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "categoryName"),
  });
  revalidatePath("/internal/items");
}

export async function createUnitOfMeasure(formData: FormData): Promise<void> {
  await write("/api/v1/units-of-measure", "POST", {
    code: field(formData, "unitCode").toUpperCase(),
    decimalPrecision: Number(field(formData, "unitDecimalPrecision")),
    name: field(formData, "unitName"),
    symbol: field(formData, "unitSymbol"),
  });
  revalidatePath("/internal/items");
}

export async function updateUnitOfMeasure(formData: FormData): Promise<void> {
  const unitOfMeasureId = field(formData, "unitOfMeasureId");
  await write(`/api/v1/units-of-measure/${unitOfMeasureId}`, "PATCH", {
    active: checked(formData, "unitActive"),
    code: field(formData, "unitCode").toUpperCase(),
    decimalPrecision: Number(field(formData, "unitDecimalPrecision")),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "unitName"),
    symbol: field(formData, "unitSymbol"),
  });
  revalidatePath("/internal/items");
}

export async function createSpecificationAttribute(
  formData: FormData,
): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await write(
    `/api/v1/item-categories/${categoryId}/specification-attributes`,
    "POST",
    specificationDefinitionBody(formData),
  );
  revalidatePath("/internal/items");
}

export async function updateSpecificationAttribute(
  formData: FormData,
): Promise<void> {
  const categoryId = field(formData, "categoryId");
  const attributeDefinitionId = field(formData, "attributeDefinitionId");
  await write(
    `/api/v1/item-categories/${categoryId}/specification-attributes/${attributeDefinitionId}`,
    "PATCH",
    {
      ...specificationDefinitionBody(formData),
      active: checked(formData, "attributeActive"),
      expectedVersion: Number(field(formData, "expectedVersion")),
    },
  );
  revalidatePath("/internal/items");
}

export async function createItem(formData: FormData): Promise<void> {
  const item = await write<{ id: string }>("/api/v1/items", "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    itemCategoryId: field(formData, "itemCategoryId"),
    name: field(formData, "name"),
    specificationValues: specificationValues(formData),
    unitOfMeasureId: field(formData, "unitOfMeasureId"),
  });
  redirect(`/internal/items/${item.id}`);
}

export async function updateItem(formData: FormData): Promise<void> {
  const itemId = field(formData, "itemId");
  await write(`/api/v1/items/${itemId}`, "PATCH", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "name"),
    specificationValues: specificationValues(formData),
    unitOfMeasureId: field(formData, "unitOfMeasureId"),
  });
  revalidatePath(`/internal/items/${itemId}`);
  revalidatePath("/internal/items");
}

export async function deactivateItem(formData: FormData): Promise<void> {
  const itemId = field(formData, "itemId");
  await write(`/api/v1/items/${itemId}/deactivate`, "POST", {
    expectedVersion: Number(field(formData, "expectedVersion")),
    reason: field(formData, "reason"),
  });
  revalidatePath(`/internal/items/${itemId}`);
  revalidatePath("/internal/items");
}
````

## File: apps/web/app/internal/items/data.ts
````typescript
import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export type SpecificationDataType = "TEXT" | "NUMBER" | "BOOLEAN";

export interface UnitOfMeasure {
  active: boolean;
  code: string;
  decimalPrecision: number;
  id: string;
  name: string;
  symbol: string;
  version: number;
}

export interface SpecificationAttributeDefinition {
  active: boolean;
  code: string;
  dataType: SpecificationDataType;
  decimalPrecision: number | null;
  description: string;
  id: string;
  name: string;
  required: boolean;
  sortOrder: number;
  unitOfMeasure: Pick<
    UnitOfMeasure,
    "code" | "decimalPrecision" | "id" | "name" | "symbol"
  > | null;
  unitOfMeasureId: string | null;
  version: number;
}

export interface ItemCategory {
  active: boolean;
  code: string;
  description: string;
  id: string;
  name: string;
  specificationAttributes: SpecificationAttributeDefinition[];
  version: number;
}

export interface ItemListItem {
  active: boolean;
  code: string;
  description: string;
  id: string;
  itemCategory: Pick<ItemCategory, "code" | "id" | "name">;
  name: string;
  unitOfMeasure: Pick<
    UnitOfMeasure,
    "code" | "decimalPrecision" | "id" | "name" | "symbol"
  >;
  updatedAt: string;
  version: number;
}

export interface ItemDetail extends ItemListItem {
  specificationValues: Array<{
    attributeDefinition: SpecificationAttributeDefinition;
    attributeDefinitionId: string;
    value: string | boolean;
  }>;
}

export interface ItemListResponse {
  data: ItemListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Item-master data is unavailable");
  return (await result.json()) as T;
}

export const itemCategories = async () =>
  (await response<{ data: ItemCategory[] }>("/api/v1/item-categories")).data;

export const unitsOfMeasure = async () =>
  (await response<{ data: UnitOfMeasure[] }>("/api/v1/units-of-measure")).data;

export const itemList = (query: URLSearchParams) =>
  response<ItemListResponse>(`/api/v1/items?${query.toString()}`);

export const itemDetail = (itemId: string) =>
  response<ItemDetail>(`/api/v1/items/${itemId}`);

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.APP_TIMEZONE ?? "Asia/Jakarta",
  }).format(new Date(value));
}

export function specificationStep(decimalPrecision: number | null): string {
  const precision = Math.max(0, Math.min(decimalPrecision ?? 0, 6));
  return precision === 0 ? "1" : `0.${"0".repeat(precision - 1)}1`;
}
````

## File: apps/web/app/internal/items/page.tsx
````typescript
import Link from "next/link";
import { requireMe } from "../../lib/api";
import {
  createItem,
  createItemCategory,
  createSpecificationAttribute,
  createUnitOfMeasure,
  updateItemCategory,
  updateSpecificationAttribute,
  updateUnitOfMeasure,
} from "./actions";
import {
  formatDateTime,
  itemCategories,
  itemList,
  unitsOfMeasure,
  type ItemCategory,
  type SpecificationAttributeDefinition,
  type UnitOfMeasure,
} from "./data";
import { SpecificationFields } from "./specification-fields";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(
  input: Record<string, string | string[] | undefined>,
  key: string,
  fallback = "",
): string {
  const candidate = input[key];
  return typeof candidate === "string" ? candidate : fallback;
}

function query(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const key of [
    "active",
    "categoryId",
    "direction",
    "page",
    "pageSize",
    "q",
    "sort",
    "unitOfMeasureId",
  ]) {
    const candidate = value(input, key);
    if (candidate) params.set(key, candidate);
  }
  if (!params.has("page")) params.set("page", "1");
  if (!params.has("pageSize")) params.set("pageSize", "20");
  return params;
}

function pageLink(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/internal/items?${next.toString()}`;
}

function sortLink(params: URLSearchParams, sort: string): string {
  const next = new URLSearchParams(params);
  const same = next.get("sort") === sort;
  next.set("sort", sort);
  next.set(
    "direction",
    same && next.get("direction") !== "desc" ? "desc" : "asc",
  );
  next.set("page", "1");
  return `/internal/items?${next.toString()}`;
}

function exportLink(params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  next.delete("page");
  next.delete("pageSize");
  const suffix = next.toString();
  return `/internal/items/export${suffix ? `?${suffix}` : ""}`;
}

function ariaSort(
  params: URLSearchParams,
  column: string,
): "ascending" | "descending" | "none" {
  if ((params.get("sort") ?? "code") !== column) return "none";
  return params.get("direction") === "desc" ? "descending" : "ascending";
}

function UnitOptions({
  units,
  selectedId,
}: {
  units: UnitOfMeasure[];
  selectedId?: string | null;
}) {
  return units
    .filter((unit) => unit.active || unit.id === selectedId)
    .map((unit) => (
      <option key={unit.id} value={unit.id}>
        {unit.code} — {unit.name} ({unit.symbol})
        {unit.active ? "" : " — inactive"}
      </option>
    ));
}

function SpecificationDefinitionFields({
  attribute,
  units,
}: {
  attribute?: SpecificationAttributeDefinition;
  units: UnitOfMeasure[];
}) {
  return (
    <>
      <label>
        Attribute code
        <input
          name="attributeCode"
          defaultValue={attribute?.code}
          required
          minLength={1}
          maxLength={50}
          pattern="[A-Za-z0-9._-]+"
        />
      </label>
      <label>
        Attribute name
        <input
          name="attributeName"
          defaultValue={attribute?.name}
          required
          minLength={2}
          maxLength={150}
        />
      </label>
      <label>
        Data type
        <select name="dataType" defaultValue={attribute?.dataType ?? "TEXT"}>
          <option value="TEXT">Text</option>
          <option value="NUMBER">Number</option>
          <option value="BOOLEAN">Yes / no</option>
        </select>
      </label>
      <label>
        Number unit (optional)
        <select
          name="attributeUnitOfMeasureId"
          defaultValue={attribute?.unitOfMeasureId ?? ""}
        >
          <option value="">No unit</option>
          <UnitOptions
            units={units}
            selectedId={attribute?.unitOfMeasureId ?? null}
          />
        </select>
      </label>
      <label>
        Number decimal precision
        <input
          type="number"
          name="attributeDecimalPrecision"
          min={0}
          max={6}
          defaultValue={attribute?.decimalPrecision ?? 0}
        />
      </label>
      <label>
        Sort order
        <input
          type="number"
          name="attributeSortOrder"
          min={0}
          max={10000}
          defaultValue={attribute?.sortOrder ?? 0}
          required
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="attributeRequired"
          value="true"
          defaultChecked={attribute?.required}
        />
        Required for items
      </label>
      {attribute ? (
        <label>
          Attribute status
          <select
            name="attributeActive"
            defaultValue={String(attribute.active)}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      ) : null}
      <label className="span-all">
        Attribute description
        <textarea
          name="attributeDescription"
          defaultValue={attribute?.description}
          rows={2}
          maxLength={500}
        />
      </label>
    </>
  );
}

function CreateItems({
  categories,
  units,
}: {
  categories: ItemCategory[];
  units: UnitOfMeasure[];
}) {
  const activeCategories = categories.filter(({ active }) => active);
  const activeUnits = units.filter(({ active }) => active);
  if (activeCategories.length === 0 || activeUnits.length === 0) {
    return (
      <p>
        Create at least one active item category and unit of measure before
        creating an item.
      </p>
    );
  }
  return (
    <div className="stack">
      {activeCategories.map((category) => {
        const titleId = `create-item-${category.id}`;
        return (
          <details key={category.id}>
            <summary>
              {category.code} — {category.name}
            </summary>
            <form
              action={createItem}
              aria-labelledby={titleId}
              className="form-grid form-grid--wide"
            >
              <h3 className="span-all" id={titleId}>
                New {category.name} item
              </h3>
              <input type="hidden" name="itemCategoryId" value={category.id} />
              <label>
                Item code
                <input
                  name="code"
                  required
                  minLength={2}
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Item name
                <input name="name" required minLength={2} maxLength={200} />
              </label>
              <label>
                Base unit of measure
                <select name="unitOfMeasureId" required>
                  <UnitOptions units={activeUnits} />
                </select>
              </label>
              <label className="span-all">
                Item description
                <textarea name="description" rows={3} maxLength={2000} />
              </label>
              <SpecificationFields
                attributes={category.specificationAttributes.filter(
                  ({ active }) => active,
                )}
              />
              <button type="submit">Create item</button>
            </form>
          </details>
        );
      })}
    </div>
  );
}

function UnitAdministration({ units }: { units: UnitOfMeasure[] }) {
  return (
    <section className="panel">
      <h2>Units of measure</h2>
      <form
        action={createUnitOfMeasure}
        aria-label="Create unit of measure"
        className="form-grid"
      >
        <label>
          Unit code
          <input
            name="unitCode"
            required
            minLength={1}
            maxLength={30}
            pattern="[A-Za-z0-9._-]+"
          />
        </label>
        <label>
          Unit name
          <input name="unitName" required minLength={2} maxLength={100} />
        </label>
        <label>
          Symbol
          <input name="unitSymbol" required maxLength={20} />
        </label>
        <label>
          Decimal precision
          <input
            type="number"
            name="unitDecimalPrecision"
            min={0}
            max={6}
            defaultValue={0}
            required
          />
        </label>
        <button type="submit">Add unit</button>
      </form>
      <div className="stack">
        {units.map((unit) => (
          <details key={unit.id}>
            <summary>
              {unit.code} — {unit.name} ({unit.symbol}) —{" "}
              {unit.active ? "Active" : "Inactive"}
            </summary>
            <form
              action={updateUnitOfMeasure}
              aria-label={`Edit unit ${unit.code}`}
              className="form-grid"
            >
              <input type="hidden" name="unitOfMeasureId" value={unit.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={unit.version}
              />
              <label>
                Unit code
                <input
                  name="unitCode"
                  defaultValue={unit.code}
                  required
                  minLength={1}
                  maxLength={30}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Unit name
                <input
                  name="unitName"
                  defaultValue={unit.name}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label>
                Symbol
                <input
                  name="unitSymbol"
                  defaultValue={unit.symbol}
                  required
                  minLength={1}
                  maxLength={20}
                />
              </label>
              <label>
                Decimal precision
                <input
                  type="number"
                  name="unitDecimalPrecision"
                  min={0}
                  max={6}
                  defaultValue={unit.decimalPrecision}
                  required
                />
              </label>
              <label>
                Unit status
                <select name="unitActive" defaultValue={String(unit.active)}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
              <button type="submit">Save unit</button>
            </form>
          </details>
        ))}
      </div>
    </section>
  );
}

function CategoryAdministration({
  categories,
  units,
}: {
  categories: ItemCategory[];
  units: UnitOfMeasure[];
}) {
  return (
    <section className="panel">
      <h2>Item categories and specification definitions</h2>
      <form
        action={createItemCategory}
        aria-label="Create item category"
        className="form-grid"
      >
        <label>
          Category code
          <input
            name="categoryCode"
            required
            minLength={2}
            maxLength={50}
            pattern="[A-Za-z0-9._-]+"
          />
        </label>
        <label>
          Category name
          <input name="categoryName" required minLength={2} maxLength={150} />
        </label>
        <label>
          Category description
          <input name="categoryDescription" maxLength={500} />
        </label>
        <button type="submit">Add category</button>
      </form>
      <div className="stack">
        {categories.map((category) => (
          <details key={category.id}>
            <summary>
              {category.code} — {category.name} —{" "}
              {category.active ? "Active" : "Inactive"}
            </summary>
            <form
              action={updateItemCategory}
              aria-label={`Edit category ${category.code}`}
              className="form-grid"
            >
              <input type="hidden" name="categoryId" value={category.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={category.version}
              />
              <label>
                Category code
                <input
                  name="categoryCode"
                  defaultValue={category.code}
                  required
                  minLength={2}
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Category name
                <input
                  name="categoryName"
                  defaultValue={category.name}
                  required
                  minLength={2}
                  maxLength={150}
                />
              </label>
              <label>
                Category description
                <input
                  name="categoryDescription"
                  defaultValue={category.description}
                  maxLength={500}
                />
              </label>
              <label>
                Category status
                <select
                  name="categoryActive"
                  defaultValue={String(category.active)}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
              <button type="submit">Save category</button>
            </form>

            <h3>Specification attributes</h3>
            {category.active ? (
              <form
                action={createSpecificationAttribute}
                aria-label={`Add specification attribute to ${category.name}`}
                className="form-grid form-grid--wide"
              >
                <input type="hidden" name="categoryId" value={category.id} />
                <SpecificationDefinitionFields units={units} />
                <button type="submit">Add specification attribute</button>
              </form>
            ) : (
              <p>Reactivate this category before adding definitions.</p>
            )}
            <div className="stack">
              {category.specificationAttributes.map((attribute) => (
                <details key={attribute.id}>
                  <summary>
                    {attribute.code} — {attribute.name} ({attribute.dataType}) —{" "}
                    {attribute.active ? "Active" : "Inactive"}
                  </summary>
                  <form
                    action={updateSpecificationAttribute}
                    aria-label={`Edit specification attribute ${attribute.code}`}
                    className="form-grid form-grid--wide"
                  >
                    <input
                      type="hidden"
                      name="categoryId"
                      value={category.id}
                    />
                    <input
                      type="hidden"
                      name="attributeDefinitionId"
                      value={attribute.id}
                    />
                    <input
                      type="hidden"
                      name="expectedVersion"
                      value={attribute.version}
                    />
                    <SpecificationDefinitionFields
                      attribute={attribute}
                      units={units}
                    />
                    <button type="submit">Save specification attribute</button>
                  </form>
                </details>
              ))}
              {category.specificationAttributes.length === 0 ? (
                <p>No specification attributes yet.</p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [me, rawParams, categories, units] = await Promise.all([
    requireMe("INTERNAL"),
    searchParams,
    itemCategories(),
    unitsOfMeasure(),
  ]);
  const params = query(rawParams);
  const items = await itemList(params);
  const canWrite = me.memberships.some((membership) =>
    membership.permissions.includes("item.write"),
  );
  const canExport = me.memberships.some((membership) =>
    membership.permissions.includes("item.export"),
  );

  return (
    <main className="workspace">
      <p className="eyebrow">Phase 3A</p>
      <div className="heading-row">
        <div>
          <h1>Items</h1>
          <p className="lede">
            Search the internal item master, structured specifications, and
            approved units of measure.
          </p>
        </div>
        <div className="heading-actions">
          <span className="badge">{items.pagination.total} items</span>
          {canExport ? (
            <a
              className="button button--secondary"
              download
              href={exportLink(params)}
            >
              Export CSV
            </a>
          ) : null}
        </div>
      </div>

      <section className="panel">
        <h2>Filter items</h2>
        <form action="/internal/items" className="form-grid" method="get">
          <label>
            Search
            <input
              type="search"
              name="q"
              defaultValue={params.get("q") ?? ""}
              maxLength={100}
            />
          </label>
          <label>
            Category
            <select
              name="categoryId"
              defaultValue={params.get("categoryId") ?? ""}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.code} — {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unit of measure
            <select
              name="unitOfMeasureId"
              defaultValue={params.get("unitOfMeasureId") ?? ""}
            >
              <option value="">All units</option>
              <UnitOptions
                units={units}
                selectedId={params.get("unitOfMeasureId")}
              />
            </select>
          </label>
          <label>
            Status
            <select name="active" defaultValue={params.get("active") ?? ""}>
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label>
            Page size
            <select
              name="pageSize"
              defaultValue={params.get("pageSize") ?? "20"}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <input
            type="hidden"
            name="sort"
            value={params.get("sort") ?? "code"}
          />
          <input
            type="hidden"
            name="direction"
            value={params.get("direction") ?? "asc"}
          />
          <button type="submit">Apply filters</button>
          <Link className="button button--secondary" href="/internal/items">
            Clear filters
          </Link>
        </form>
      </section>

      <section className="panel">
        <h2>Item directory</h2>
        {items.data.length === 0 ? (
          <p>No items match these filters.</p>
        ) : (
          <table>
            <caption className="visually-hidden">
              Authorized item-master results
            </caption>
            <thead>
              <tr>
                <th aria-sort={ariaSort(params, "code")}>
                  <Link href={sortLink(params, "code")}>Code</Link>
                </th>
                <th aria-sort={ariaSort(params, "name")}>
                  <Link href={sortLink(params, "name")}>Item</Link>
                </th>
                <th>Category</th>
                <th>Base unit</th>
                <th>Status</th>
                <th aria-sort={ariaSort(params, "updatedAt")}>
                  <Link href={sortLink(params, "updatedAt")}>Updated</Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/internal/items/${item.id}`}>{item.code}</Link>
                  </td>
                  <td>{item.name}</td>
                  <td>{item.itemCategory.name}</td>
                  <td>
                    {item.unitOfMeasure.name} ({item.unitOfMeasure.symbol})
                  </td>
                  <td>
                    <span
                      className={`status status--${item.active ? "active" : "inactive"}`}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDateTime(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <nav className="pagination" aria-label="Item pages">
          {items.pagination.page > 1 ? (
            <Link href={pageLink(params, items.pagination.page - 1)}>
              Previous
            </Link>
          ) : (
            <span>Previous</span>
          )}
          <span>
            Page {items.pagination.page} of{" "}
            {Math.max(1, items.pagination.totalPages)}
          </span>
          {items.pagination.page < items.pagination.totalPages ? (
            <Link href={pageLink(params, items.pagination.page + 1)}>Next</Link>
          ) : (
            <span>Next</span>
          )}
        </nav>
      </section>

      {canWrite ? (
        <>
          <section className="panel" id="create-item">
            <h2>Create item</h2>
            <p>
              Select a category below. Category-specific specification fields
              are validated when the item is saved.
            </p>
            <CreateItems categories={categories} units={units} />
          </section>
          <CategoryAdministration categories={categories} units={units} />
          <UnitAdministration units={units} />
        </>
      ) : null}
    </main>
  );
}
````

## File: apps/web/app/internal/items/specification-fields.tsx
````typescript
import {
  specificationStep,
  type SpecificationAttributeDefinition,
} from "./data";

export function SpecificationFields({
  attributes,
  values = new Map<string, string | boolean>(),
}: {
  attributes: SpecificationAttributeDefinition[];
  values?: ReadonlyMap<string, string | boolean>;
}) {
  const ordered = [...attributes].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
  );
  return (
    <fieldset className="specification-fields span-all">
      <legend>Structured specifications</legend>
      {ordered.length === 0 ? (
        <p>This category has no specification attributes.</p>
      ) : (
        <div className="specification-grid">
          {ordered.map((attribute) => {
            const name = `specificationValue.${attribute.id}`;
            const value = values.get(attribute.id);
            const qualifier = [
              attribute.required ? "required" : "optional",
              attribute.active ? null : "inactive definition",
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <div key={attribute.id}>
                <input
                  type="hidden"
                  name="specificationAttribute"
                  value={`${attribute.id}|${attribute.dataType}`}
                />
                {attribute.dataType === "BOOLEAN" ? (
                  <label className="checkbox specification-checkbox">
                    <input
                      type="checkbox"
                      name={name}
                      value="true"
                      defaultChecked={value === true || value === "true"}
                    />
                    <span>
                      {attribute.name} ({qualifier})
                    </span>
                  </label>
                ) : (
                  <label>
                    {attribute.name}
                    {attribute.unitOfMeasure
                      ? ` (${attribute.unitOfMeasure.symbol})`
                      : ""}
                    <input
                      name={name}
                      type={attribute.dataType === "NUMBER" ? "number" : "text"}
                      step={
                        attribute.dataType === "NUMBER"
                          ? specificationStep(attribute.decimalPrecision)
                          : undefined
                      }
                      defaultValue={typeof value === "string" ? value : ""}
                      required={attribute.required}
                      maxLength={
                        attribute.dataType === "TEXT" ? 1000 : undefined
                      }
                    />
                    <small>
                      {attribute.code} · {qualifier}
                      {attribute.dataType === "NUMBER" &&
                      attribute.decimalPrecision !== null
                        ? ` · up to ${attribute.decimalPrecision} decimal places`
                        : ""}
                    </small>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
````

## File: apps/web/app/internal/projects/[projectId]/page.tsx
````typescript
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../lib/api";
import {
  addProjectMember,
  createMilestone,
  createWorkPackage,
  transitionProject,
  updateMilestone,
  updateProject,
  updateProjectMember,
  updateWorkPackage,
} from "../actions";
import {
  dateInput,
  formatDate,
  memberCandidates,
  productCategories,
  projectOverview,
  type ProjectState,
} from "../data";

const transitions: Record<ProjectState, ProjectState[]> = {
  ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
  DRAFT: ["PLANNED", "CANCELLED"],
  ON_HOLD: ["ACTIVE", "CANCELLED"],
  PLANNED: ["ACTIVE", "ON_HOLD", "CANCELLED"],
};

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const [me, project, categories] = await Promise.all([
    requireMe("INTERNAL"),
    projectOverview(projectId),
    productCategories(),
  ]);
  const terminal = ["COMPLETED", "CANCELLED"].includes(project.state);
  const canWrite =
    !terminal &&
    me.memberships.some((membership) =>
      membership.permissions.includes("project.write"),
    );
  const canManageMembers =
    !terminal &&
    me.memberships.some((membership) =>
      membership.permissions.includes("project.membership.manage"),
    );
  const candidates = canManageMembers ? await memberCandidates(project.id) : [];

  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <span>{project.code}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">{project.productCategory.name}</p>
          <h1>{project.name}</h1>
          <p className="lede">
            {project.code} · {project.organization.name}
          </p>
        </div>
        <span className={`status status--${project.state.toLowerCase()}`}>
          {project.state.replace("_", " ")}
        </span>
      </div>

      <section className="summary-grid" aria-label="Project summary">
        <div>
          <span>Planned start</span>
          <strong>{formatDate(project.plannedStartDate)}</strong>
        </div>
        <div>
          <span>Planned end</span>
          <strong>{formatDate(project.plannedEndDate)}</strong>
        </div>
        <div>
          <span>Milestones</span>
          <strong>{project.milestones.length}</strong>
        </div>
        <div>
          <span>Work packages</span>
          <strong>{project.workPackages.length}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Project details</h2>
        <p>{project.description || "No project description."}</p>
        {canWrite ? (
          <details>
            <summary>Edit project</summary>
            <form action={updateProject} className="form-grid form-grid--wide">
              <input type="hidden" name="projectId" value={project.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={project.version}
              />
              <label>
                Project code
                <input
                  name="code"
                  defaultValue={project.code}
                  required
                  maxLength={50}
                />
              </label>
              <label>
                Project name
                <input
                  name="name"
                  defaultValue={project.name}
                  required
                  maxLength={200}
                />
              </label>
              <label>
                Product category
                <select
                  name="productCategoryId"
                  defaultValue={project.productCategory.id}
                >
                  {categories
                    .filter(
                      ({ active, id }) =>
                        active || id === project.productCategory.id,
                    )
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Planned start
                <input
                  type="date"
                  name="plannedStartDate"
                  defaultValue={dateInput(project.plannedStartDate)}
                  required
                />
              </label>
              <label>
                Planned end
                <input
                  type="date"
                  name="plannedEndDate"
                  defaultValue={dateInput(project.plannedEndDate)}
                  required
                />
              </label>
              <label className="span-all">
                Description
                <textarea
                  name="description"
                  defaultValue={project.description}
                  maxLength={2000}
                  rows={3}
                />
              </label>
              <button type="submit">Save project</button>
            </form>
          </details>
        ) : null}
      </section>

      <section className="panel">
        <h2>Lifecycle</h2>
        {canWrite && transitions[project.state].length > 0 ? (
          <form action={transitionProject} className="form-grid">
            <input type="hidden" name="projectId" value={project.id} />
            <input
              type="hidden"
              name="expectedVersion"
              value={project.version}
            />
            <label>
              Target state
              <select name="targetState">
                {transitions[project.state].map((state) => (
                  <option key={state} value={state}>
                    {state.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input name="reason" required minLength={5} maxLength={500} />
            </label>
            <button type="submit">Transition project</button>
          </form>
        ) : (
          <p>
            No standard transition is available from{" "}
            {project.state.replace("_", " ")}.
          </p>
        )}
        <div className="timeline">
          {project.transitions.length === 0 ? (
            <p>
              No transitions recorded. The project remains in its initial draft
              state.
            </p>
          ) : (
            project.transitions.map((transition) => (
              <article key={transition.id}>
                <strong>
                  {transition.sourceState.replace("_", " ")} →{" "}
                  {transition.targetState.replace("_", " ")}
                </strong>
                <span>
                  {formatDate(transition.occurredAt)} ·{" "}
                  {transition.actor.displayName}
                </span>
                <p>{transition.reason}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Milestones</h2>
        {canWrite ? (
          <form action={createMilestone} className="form-grid">
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Code
              <input name="code" required maxLength={50} />
            </label>
            <label>
              Name
              <input name="name" required maxLength={200} />
            </label>
            <label>
              Target date
              <input type="date" name="targetDate" required />
            </label>
            <label>
              Description
              <input name="description" maxLength={1000} />
            </label>
            <button type="submit">Add milestone</button>
          </form>
        ) : null}
        <div className="stack">
          {project.milestones.map((milestone) => (
            <details key={milestone.id}>
              <summary>
                {milestone.code} — {milestone.name} ·{" "}
                {formatDate(milestone.targetDate)}
              </summary>
              <p>{milestone.description || "No description."}</p>
              {canWrite ? (
                <form action={updateMilestone} className="form-grid">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    type="hidden"
                    name="milestoneId"
                    value={milestone.id}
                  />
                  <input
                    type="hidden"
                    name="expectedVersion"
                    value={milestone.version}
                  />
                  <label>
                    Code
                    <input name="code" defaultValue={milestone.code} required />
                  </label>
                  <label>
                    Name
                    <input name="name" defaultValue={milestone.name} required />
                  </label>
                  <label>
                    Target date
                    <input
                      type="date"
                      name="targetDate"
                      defaultValue={dateInput(milestone.targetDate)}
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      name="description"
                      defaultValue={milestone.description}
                    />
                  </label>
                  <button type="submit">Save milestone</button>
                </form>
              ) : null}
            </details>
          ))}
          {project.milestones.length === 0 ? <p>No milestones yet.</p> : null}
        </div>
      </section>

      <section className="panel">
        <h2>Work packages</h2>
        {canWrite ? (
          <form
            action={createWorkPackage}
            className="form-grid form-grid--wide"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Code
              <input name="code" required maxLength={50} />
            </label>
            <label>
              Name
              <input name="name" required maxLength={200} />
            </label>
            <label>
              Milestone
              <select name="milestoneId">
                <option value="">No milestone</option>
                {project.milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.code} — {milestone.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Planned start
              <input type="date" name="plannedStartDate" required />
            </label>
            <label>
              Planned end
              <input type="date" name="plannedEndDate" required />
            </label>
            <label>
              Description
              <input name="description" maxLength={1000} />
            </label>
            <button type="submit">Add work package</button>
          </form>
        ) : null}
        <div className="stack">
          {project.workPackages.map((workPackage) => (
            <details key={workPackage.id}>
              <summary>
                {workPackage.code} — {workPackage.name} ·{" "}
                {formatDate(workPackage.plannedStartDate)} –{" "}
                {formatDate(workPackage.plannedEndDate)}
              </summary>
              <p>{workPackage.description || "No description."}</p>
              {canWrite ? (
                <form
                  action={updateWorkPackage}
                  className="form-grid form-grid--wide"
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    type="hidden"
                    name="workPackageId"
                    value={workPackage.id}
                  />
                  <input
                    type="hidden"
                    name="expectedVersion"
                    value={workPackage.version}
                  />
                  <label>
                    Code
                    <input
                      name="code"
                      defaultValue={workPackage.code}
                      required
                    />
                  </label>
                  <label>
                    Name
                    <input
                      name="name"
                      defaultValue={workPackage.name}
                      required
                    />
                  </label>
                  <label>
                    Milestone
                    <select
                      name="milestoneId"
                      defaultValue={workPackage.milestoneId ?? ""}
                    >
                      <option value="">No milestone</option>
                      {project.milestones.map((milestone) => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.code} — {milestone.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Planned start
                    <input
                      type="date"
                      name="plannedStartDate"
                      defaultValue={dateInput(workPackage.plannedStartDate)}
                      required
                    />
                  </label>
                  <label>
                    Planned end
                    <input
                      type="date"
                      name="plannedEndDate"
                      defaultValue={dateInput(workPackage.plannedEndDate)}
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      name="description"
                      defaultValue={workPackage.description}
                    />
                  </label>
                  <button type="submit">Save work package</button>
                </form>
              ) : null}
            </details>
          ))}
          {project.workPackages.length === 0 ? (
            <p>No work packages yet.</p>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2>Project members</h2>
        {canManageMembers && candidates.length > 0 ? (
          <form action={addProjectMember} className="form-grid">
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Membership
              <select name="candidate">
                {candidates.map((candidate) => (
                  <option
                    key={candidate.id}
                    value={`${candidate.id}|${candidate.organization.type}`}
                  >
                    {candidate.user.displayName} · {candidate.organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Internal project role
              <select name="role">
                <option value="CONTRIBUTOR">Contributor</option>
                <option value="PROJECT_MANAGER">Project manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </label>
            <button type="submit">Add member</button>
          </form>
        ) : null}
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Organization</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {project.members.map((member) => (
              <tr key={member.id}>
                <td>
                  {member.membership.user.displayName}
                  <small>{member.membership.user.email}</small>
                </td>
                <td>{member.membership.organization.name}</td>
                <td>{member.role.replace("_", " ")}</td>
                <td>{member.status}</td>
                <td>
                  {canManageMembers ? (
                    <form action={updateProjectMember} className="inline-form">
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />
                      <input type="hidden" name="memberId" value={member.id} />
                      <input
                        type="hidden"
                        name="expectedVersion"
                        value={member.version}
                      />
                      <input type="hidden" name="role" value={member.role} />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                        }
                      />
                      <button type="submit">
                        {member.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
````

## File: apps/web/app/internal/projects/actions.ts
````typescript
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function write<T>(
  path: string,
  method: "PATCH" | "POST",
  body: unknown,
): Promise<T> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const result = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf ?? "",
    },
    method,
  });
  if (!result.ok) {
    const error = (await result.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? "The project change could not be completed",
    );
  }
  return (await result.json()) as T;
}

export async function createProductCategory(formData: FormData): Promise<void> {
  await write("/api/v1/product-categories", "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    name: field(formData, "name"),
  });
  revalidatePath("/internal/projects");
}

export async function updateProductCategory(formData: FormData): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await write(`/api/v1/product-categories/${categoryId}`, "PATCH", {
    active: field(formData, "active") === "true",
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "name"),
  });
  revalidatePath("/internal/projects");
}

export async function createProject(formData: FormData): Promise<void> {
  const project = await write<{ id: string }>("/api/v1/projects", "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    name: field(formData, "name"),
    organizationId: field(formData, "organizationId"),
    plannedEndDate: field(formData, "plannedEndDate"),
    plannedStartDate: field(formData, "plannedStartDate"),
    productCategoryId: field(formData, "productCategoryId"),
  });
  redirect(`/internal/projects/${project.id}`);
}

export async function updateProject(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await write(`/api/v1/projects/${projectId}`, "PATCH", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "name"),
    plannedEndDate: field(formData, "plannedEndDate"),
    plannedStartDate: field(formData, "plannedStartDate"),
    productCategoryId: field(formData, "productCategoryId"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
  revalidatePath("/internal/projects");
}

export async function transitionProject(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await write(`/api/v1/projects/${projectId}/transitions`, "POST", {
    expectedVersion: Number(field(formData, "expectedVersion")),
    reason: field(formData, "reason"),
    targetState: field(formData, "targetState"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
  revalidatePath("/internal/projects");
}

export async function addProjectMember(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const candidate = field(formData, "candidate").split("|");
  await write(`/api/v1/projects/${projectId}/members`, "POST", {
    membershipId: candidate[0],
    role: candidate[1] === "SUPPLIER" ? "SUPPLIER" : field(formData, "role"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateProjectMember(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const memberId = field(formData, "memberId");
  await write(`/api/v1/projects/${projectId}/members/${memberId}`, "PATCH", {
    expectedVersion: Number(field(formData, "expectedVersion")),
    role: field(formData, "role"),
    status: field(formData, "status"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function createMilestone(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await write(`/api/v1/projects/${projectId}/milestones`, "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    name: field(formData, "name"),
    targetDate: field(formData, "targetDate"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateMilestone(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const milestoneId = field(formData, "milestoneId");
  await write(
    `/api/v1/projects/${projectId}/milestones/${milestoneId}`,
    "PATCH",
    {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      name: field(formData, "name"),
      targetDate: field(formData, "targetDate"),
    },
  );
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function createWorkPackage(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const milestoneId = field(formData, "milestoneId");
  await write(`/api/v1/projects/${projectId}/work-packages`, "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    ...(milestoneId ? { milestoneId } : {}),
    name: field(formData, "name"),
    plannedEndDate: field(formData, "plannedEndDate"),
    plannedStartDate: field(formData, "plannedStartDate"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateWorkPackage(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const workPackageId = field(formData, "workPackageId");
  const milestoneId = field(formData, "milestoneId");
  await write(
    `/api/v1/projects/${projectId}/work-packages/${workPackageId}`,
    "PATCH",
    {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      ...(milestoneId ? { milestoneId } : {}),
      name: field(formData, "name"),
      plannedEndDate: field(formData, "plannedEndDate"),
      plannedStartDate: field(formData, "plannedStartDate"),
    },
  );
  revalidatePath(`/internal/projects/${projectId}`);
}
````

## File: apps/web/app/internal/projects/data.ts
````typescript
import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export type ProjectState =
  "DRAFT" | "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface ProductCategory {
  active: boolean;
  code: string;
  description: string;
  id: string;
  name: string;
  version: number;
}

export interface ProjectListItem {
  code: string;
  id: string;
  name: string;
  plannedEndDate: string;
  plannedStartDate: string;
  productCategory: Pick<ProductCategory, "code" | "id" | "name">;
  state: ProjectState;
  updatedAt: string;
  version: number;
}

export interface ProjectOverview extends ProjectListItem {
  description: string;
  members: Array<{
    id: string;
    membership: {
      organization: {
        code: string;
        id: string;
        name: string;
        type: "INTERNAL" | "SUPPLIER";
      };
      user: { displayName: string; email: string; id: string };
    };
    role: "PROJECT_MANAGER" | "CONTRIBUTOR" | "VIEWER" | "SUPPLIER";
    status: "ACTIVE" | "INACTIVE";
    version: number;
  }>;
  milestones: Array<{
    code: string;
    description: string;
    id: string;
    name: string;
    targetDate: string;
    version: number;
  }>;
  organization: { code: string; id: string; name: string };
  transitions: Array<{
    actor: { displayName: string; id: string };
    id: string;
    occurredAt: string;
    reason: string;
    sourceState: ProjectState;
    targetState: ProjectState;
  }>;
  workPackages: Array<{
    code: string;
    description: string;
    id: string;
    milestoneId: string | null;
    name: string;
    plannedEndDate: string;
    plannedStartDate: string;
    version: number;
  }>;
}

export interface MemberCandidate {
  id: string;
  organization: {
    code: string;
    id: string;
    name: string;
    type: "INTERNAL" | "SUPPLIER";
  };
  user: { displayName: string; email: string; id: string };
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Project data is unavailable");
  return (await result.json()) as T;
}

export const productCategories = async () =>
  (await response<{ data: ProductCategory[] }>("/api/v1/product-categories"))
    .data;

export const projectList = (query: URLSearchParams) =>
  response<{
    data: ProjectListItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(`/api/v1/projects?${query.toString()}`);

export const projectOverview = (projectId: string) =>
  response<ProjectOverview>(`/api/v1/projects/${projectId}`);

export const memberCandidates = async (projectId: string) =>
  (
    await response<{ data: MemberCandidate[] }>(
      `/api/v1/projects/${projectId}/member-candidates`,
    )
  ).data;

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: process.env.APP_TIMEZONE ?? "Asia/Jakarta",
  }).format(new Date(value));
}

export function dateInput(value: string): string {
  return value.slice(0, 10);
}
````

## File: apps/web/app/internal/projects/page.tsx
````typescript
import Link from "next/link";
import { requireMe } from "../../lib/api";
import {
  createProductCategory,
  createProject,
  updateProductCategory,
} from "./actions";
import { formatDate, productCategories, projectList } from "./data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(
  input: Record<string, string | string[] | undefined>,
  key: string,
  fallback = "",
): string {
  const candidate = input[key];
  return typeof candidate === "string" ? candidate : fallback;
}

function query(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const key of [
    "categoryId",
    "direction",
    "page",
    "pageSize",
    "q",
    "sort",
    "state",
  ]) {
    const candidate = value(input, key);
    if (candidate) params.set(key, candidate);
  }
  if (!params.has("page")) params.set("page", "1");
  if (!params.has("pageSize")) params.set("pageSize", "20");
  return params;
}

function pageLink(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/internal/projects?${next.toString()}`;
}

function sortLink(params: URLSearchParams, sort: string): string {
  const next = new URLSearchParams(params);
  const same = next.get("sort") === sort;
  next.set("sort", sort);
  next.set(
    "direction",
    same && next.get("direction") !== "desc" ? "desc" : "asc",
  );
  next.set("page", "1");
  return `/internal/projects?${next.toString()}`;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [me, rawParams, categories] = await Promise.all([
    requireMe("INTERNAL"),
    searchParams,
    productCategories(),
  ]);
  const params = query(rawParams);
  const projects = await projectList(params);
  const writeMembership = me.memberships.find(
    (membership) =>
      membership.organization.type === "INTERNAL" &&
      membership.permissions.includes("project.write"),
  );
  const canWrite = Boolean(writeMembership);

  return (
    <main className="workspace">
      <p className="eyebrow">Phase 2</p>
      <div className="heading-row">
        <div>
          <h1>Projects</h1>
          <p className="lede">
            Authorized projects, milestones, work packages, and lifecycle state.
          </p>
        </div>
        <span className="badge">{projects.pagination.total} projects</span>
      </div>

      <section className="panel">
        <h2>Filter projects</h2>
        <form action="/internal/projects" className="form-grid" method="get">
          <label>
            Search
            <input
              name="q"
              defaultValue={params.get("q") ?? ""}
              maxLength={100}
            />
          </label>
          <label>
            State
            <select name="state" defaultValue={params.get("state") ?? ""}>
              <option value="">All states</option>
              {[
                "DRAFT",
                "PLANNED",
                "ACTIVE",
                "ON_HOLD",
                "COMPLETED",
                "CANCELLED",
              ].map((state) => (
                <option key={state} value={state}>
                  {state.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product category
            <select
              name="categoryId"
              defaultValue={params.get("categoryId") ?? ""}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Page size
            <select
              name="pageSize"
              defaultValue={params.get("pageSize") ?? "20"}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <input
            type="hidden"
            name="sort"
            value={params.get("sort") ?? "code"}
          />
          <input
            type="hidden"
            name="direction"
            value={params.get("direction") ?? "asc"}
          />
          <button type="submit">Apply filters</button>
          <Link className="button button--secondary" href="/internal/projects">
            Clear filters
          </Link>
        </form>
      </section>

      <section className="panel">
        <h2>Project directory</h2>
        {projects.data.length === 0 ? (
          <p>No authorized projects match these filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  <Link href={sortLink(params, "code")}>Code</Link>
                </th>
                <th>
                  <Link href={sortLink(params, "name")}>Project</Link>
                </th>
                <th>Category</th>
                <th>
                  <Link href={sortLink(params, "state")}>State</Link>
                </th>
                <th>
                  <Link href={sortLink(params, "plannedStartDate")}>Dates</Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.data.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link href={`/internal/projects/${project.id}`}>
                      {project.code}
                    </Link>
                  </td>
                  <td>{project.name}</td>
                  <td>{project.productCategory.name}</td>
                  <td>
                    <span
                      className={`status status--${project.state.toLowerCase()}`}
                    >
                      {project.state.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {formatDate(project.plannedStartDate)} –{" "}
                    {formatDate(project.plannedEndDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <nav className="pagination" aria-label="Project pages">
          {projects.pagination.page > 1 ? (
            <Link href={pageLink(params, projects.pagination.page - 1)}>
              Previous
            </Link>
          ) : (
            <span>Previous</span>
          )}
          <span>
            Page {projects.pagination.page} of{" "}
            {Math.max(1, projects.pagination.totalPages)}
          </span>
          {projects.pagination.page < projects.pagination.totalPages ? (
            <Link href={pageLink(params, projects.pagination.page + 1)}>
              Next
            </Link>
          ) : (
            <span>Next</span>
          )}
        </nav>
      </section>

      {canWrite && writeMembership ? (
        <>
          <section className="panel" id="create-project">
            <h2>Create project</h2>
            <form action={createProject} className="form-grid form-grid--wide">
              <input
                type="hidden"
                name="organizationId"
                value={writeMembership.organization.id}
              />
              <label>
                Project code
                <input
                  name="code"
                  required
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Project name
                <input name="name" required maxLength={200} />
              </label>
              <label>
                Product category
                <select name="productCategoryId" required>
                  {categories
                    .filter(({ active }) => active)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Planned start
                <input type="date" name="plannedStartDate" required />
              </label>
              <label>
                Planned end
                <input type="date" name="plannedEndDate" required />
              </label>
              <label className="span-all">
                Description
                <textarea name="description" maxLength={2000} rows={3} />
              </label>
              <button type="submit">Create project</button>
            </form>
          </section>

          <section className="panel">
            <h2>Product categories</h2>
            <form action={createProductCategory} className="form-grid">
              <label>
                Code
                <input
                  name="code"
                  required
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Name
                <input name="name" required maxLength={150} />
              </label>
              <label>
                Description
                <input name="description" maxLength={500} />
              </label>
              <button type="submit">Add category</button>
            </form>
            <div className="stack">
              {categories.map((category) => (
                <details key={category.id}>
                  <summary>
                    {category.code} — {category.name} (
                    {category.active ? "Active" : "Inactive"})
                  </summary>
                  <form action={updateProductCategory} className="form-grid">
                    <input
                      type="hidden"
                      name="categoryId"
                      value={category.id}
                    />
                    <input
                      type="hidden"
                      name="expectedVersion"
                      value={category.version}
                    />
                    <label>
                      Code
                      <input
                        name="code"
                        defaultValue={category.code}
                        required
                      />
                    </label>
                    <label>
                      Name
                      <input
                        name="name"
                        defaultValue={category.name}
                        required
                      />
                    </label>
                    <label>
                      Description
                      <input
                        name="description"
                        defaultValue={category.description}
                      />
                    </label>
                    <label>
                      Status
                      <select
                        name="active"
                        defaultValue={String(category.active)}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </label>
                    <button type="submit">Save category</button>
                  </form>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
````

## File: docs/ITEM_MASTER_API.md
````markdown
# Phase 3A item-master API

All item-master endpoints use the authenticated server-managed session below `/api/v1`. The catalog is global across active internal organizations. It is not supplier-visible and is not partitioned by organization; the qualifying actor membership supplies the organization recorded on audit evidence.

Unsafe commands require the session-bound `X-CSRF-Token`. Versioned edits and item deactivation carry `expectedVersion`; stale versions return `CONCURRENT_MODIFICATION` without a partial business write or audit event. Request identifiers, safe errors, UUID validation, unknown-property rejection, and UTC timestamps follow `API_CONVENTIONS.md`.

## Permissions

- `item.read` allows internal category, unit, item-list, and item-detail reads.
- `item.write` allows internal category, unit, specification-definition, item, and deactivation commands.
- `item.export` allows the bounded filtered CSV export.

Each permission also requires an active membership in an active `INTERNAL` organization. Supplier and reserved customer roles receive no item permission. `SYSTEM_ADMIN` remains subject to authentication, active membership, CSRF, optimistic concurrency, validation, and audit requirements.

## Item categories and specification definitions

- `GET /item-categories` returns all categories and their ordered specification-attribute definitions to an internal principal with `item.read`.
- `POST /item-categories` creates a versioned category with normalized uppercase `code`, `name`, and optional `description`.
- `PATCH /item-categories/{categoryId}` edits `code`, `name`, `description`, and `active` using `expectedVersion`. Deactivation is rejected while an active item references the category.
- `POST /item-categories/{categoryId}/specification-attributes` creates an ordered typed definition in an active category.
- `PATCH /item-categories/{categoryId}/specification-attributes/{attributeId}` edits the definition using `expectedVersion`; the route pair prevents moving a definition between categories.

Category codes are globally unique. Attribute codes are unique within their category. Codes are normalized to uppercase and retained when a record is deactivated, so an inactive record continues to reserve its code.

Definitions use `TEXT`, `NUMBER`, or `BOOLEAN`. They also carry `required`, `sortOrder`, `active`, optional description, and a version. Numeric definitions require decimal precision from zero through six and may reference an active unit; their precision cannot exceed the unit's precision. Text and boolean definitions cannot have a unit or decimal precision. A required definition cannot be added after active category items exist, and a definition cannot become required/active while an active item lacks its value. Once any value uses a definition, its data type, unit, and precision are immutable.

## Units of measure

- `GET /units-of-measure` returns all units to an internal principal with `item.read`.
- `POST /units-of-measure` creates `code`, `name`, `symbol`, and `decimalPrecision`.
- `PATCH /units-of-measure/{unitId}` edits those fields and `active` using `expectedVersion`.

Unit codes are globally unique and normalized to uppercase. Decimal precision is an integer from zero through six. Reducing unit precision is rejected if an active specification definition needs greater precision. Deactivation is rejected while an active item or active specification definition references the unit.

## Items and search

- `GET /items` supports `q`, `categoryId`, `unitOfMeasureId`, `active`, `sort`, `direction`, `page`, and `pageSize` with a maximum page size of 100. Search is case-insensitive over item code and name. Sort fields are `code`, `name`, and `updatedAt`. The response contains `data`, `pagination`, and `meta.requestId`.
- `POST /items` creates an active item from `code`, `name`, optional `description`, `itemCategoryId`, `unitOfMeasureId`, and the full `specificationValues` array.
- `GET /items/{itemId}` returns category, base unit, version, status, and typed specification values. A nonexistent item uses the generic not-found response.
- `PATCH /items/{itemId}` edits an active item's code, name, description, base unit, and full specification-value set using `expectedVersion`. `itemCategoryId` is deliberately absent: category is immutable after item creation.
- `POST /items/{itemId}/deactivate` requires `expectedVersion` and a reason of 5â€“500 characters. It changes only an active item to inactive and increments the version.

Item codes are globally unique and normalized to uppercase. Item creation and editing require active category/unit references. Every supplied attribute must be active and belong to the immutable item category; duplicate attribute IDs, unknown/inactive definitions, missing required values, empty values, and type mismatches are rejected. Numeric values cross JSON as strings, are stored as PostgreSQL decimal values, and cannot exceed the definition's decimal precision. The full value set is replaced atomically on edit.

Inactive items remain readable for traceability but are read-only. There is no `DELETE` route, foreign keys are restrictive, and a PostgreSQL trigger rejects direct item deletion.

## CSV export

`GET /items/export.csv` requires `item.export` and accepts the same `q`, `categoryId`, `unitOfMeasureId`, `active`, `sort`, and `direction` filters as the item list. Pagination parameters are not accepted. The operation rejects a result larger than 10,000 rows rather than silently truncating it.

The UTF-8 attachment is named `items.csv` and uses fixed columns: Code, Name, Description, Category code, Category name, Unit code, Unit symbol, Unit decimal precision, Status, and Specifications. Every cell is quoted and embedded quotes are doubled. Cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return are prefixed with an apostrophe before CSV escaping to prevent spreadsheet formula execution.

An `ITEMS_EXPORTED` audit event is committed before the export is returned. It records actor, actor organization, request/correlation identifiers, row count, and a non-sensitive filter summary. It does not record the CSV or search text.

## Audit, concurrency, and asynchronous work

Mutations write one of `ITEM_CATEGORY_CREATED`, `ITEM_CATEGORY_UPDATED`, `UNIT_OF_MEASURE_CREATED`, `UNIT_OF_MEASURE_UPDATED`, `SPECIFICATION_ATTRIBUTE_CREATED`, `SPECIFICATION_ATTRIBUTE_UPDATED`, `ITEM_CREATED`, `ITEM_UPDATED`, or `ITEM_DEACTIVATED` in the same transaction as the business change. Changes are redacted to identifiers and relevant before/after fields; specification contents are not copied into audit records. Audit write failure fails the business transaction.

Expected-version predicates protect edits and deactivation. Reference-master operations lock rows when concurrent reference creation or deactivation could violate an invariant. Phase 3A starts no asynchronous work, so these transactions create no outbox event.

## Internal interfaces and exclusions

The internal list is `/internal/items`; item detail is `/internal/items/{itemId}`. URL-backed filters, sorting, and pagination survive navigation. The UI exposes create/edit/reference-master controls only with `item.write`, export only with `item.export`, and no supplier item route.

Phase 3A does not implement BOMs, BOM or item revisions, spreadsheet import, procurement, supplier item collaboration, or readiness behavior.
````

## File: docs/PROJECTS_API.md
````markdown
# Phase 2 projects API

All endpoints use the authenticated server-managed session below `/api/v1`. Unsafe commands also require the session-bound `X-CSRF-Token`. Protected nonexistent and out-of-scope project identifiers use the same `RESOURCE_NOT_FOUND` response. Editable commands carry `expectedVersion`; stale versions return `CONCURRENT_MODIFICATION` without a partial write or audit event.

## Product categories and projects

- `GET /product-categories` lists categories. Supplier-only principals receive active categories only.
- `POST /product-categories` and `PATCH /product-categories/{categoryId}` require an internal `project.write` grant. Category edits are versioned and audited.
- `GET /projects` supports `q`, `state`, `categoryId`, `sort`, `direction`, `page`, and `pageSize` (maximum 100). The response contains `data`, `pagination`, and `meta.requestId`.
- `POST /projects` creates a `DRAFT` project within the actor's active internal organization and assigns the creator's membership as `PROJECT_MANAGER`.
- `GET /projects/{projectId}` returns the authorized project overview. Supplier responses omit project-member identity and transition-history fields.
- `PATCH /projects/{projectId}` edits category, code, name, description, and planned dates. `state` is deliberately not accepted.
- `POST /projects/{projectId}/transitions` accepts `expectedVersion`, `targetState`, and a required reason. It atomically changes state, increments the version, writes immutable transition history, and writes an audit event.

## Members, milestones, and work packages

- `GET /projects/{projectId}/member-candidates` and member commands require `project.membership.manage` plus writable project scope.
- `POST /projects/{projectId}/members` adds an active membership. Internal members must belong to the owning organization; supplier members use the `SUPPLIER` project role and receive explicit read scope only.
- `PATCH /projects/{projectId}/members/{memberId}` changes role/status with an expected version. The final active project manager cannot be removed or demoted.
- `POST` and versioned `PATCH` routes below `/projects/{projectId}/milestones` create/edit milestones. Target dates must fall within project dates.
- `POST` and versioned `PATCH` routes below `/projects/{projectId}/work-packages` create/edit work packages. Dates must be ordered and within project dates; any milestone link must belong to the same project.

Completed and cancelled projects are read-only. No normal transition leaves either terminal state; reopening a completed project requires a future separately authorized command and is not part of Phase 2.
````

## File: packages/database/prisma/migrations/20260716010000_phase_2_projects_milestones/migration.sql
````sql
CREATE TYPE "ProjectState" AS ENUM ('DRAFT', 'PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProjectMemberRole" AS ENUM ('PROJECT_MANAGER', 'CONTRIBUTOR', 'VIEWER', 'SUPPLIER');
CREATE TYPE "ProjectMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "product_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_categories_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "product_categories_code_key" ON "product_categories"("code");
CREATE INDEX "product_categories_active_name_idx" ON "product_categories"("active", "name");

CREATE TABLE "projects" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "productCategoryId" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000) NOT NULL DEFAULT '',
  "state" "ProjectState" NOT NULL DEFAULT 'DRAFT',
  "plannedStartDate" DATE NOT NULL,
  "plannedEndDate" DATE NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT,
  CONSTRAINT "projects_productCategoryId_fkey" FOREIGN KEY ("productCategoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT,
  CONSTRAINT "projects_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "projects_date_order_check" CHECK ("plannedEndDate" >= "plannedStartDate"),
  CONSTRAINT "projects_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "projects_organizationId_code_key" ON "projects"("organizationId", "code");
CREATE INDEX "projects_organizationId_state_updatedAt_idx" ON "projects"("organizationId", "state", "updatedAt");
CREATE INDEX "projects_productCategoryId_state_idx" ON "projects"("productCategoryId", "state");

CREATE TABLE "project_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "membershipId" UUID NOT NULL,
  "role" "ProjectMemberRole" NOT NULL,
  "status" "ProjectMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "addedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "project_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_members_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_members_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_members_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "project_members_projectId_membershipId_key" ON "project_members"("projectId", "membershipId");
CREATE INDEX "project_members_membershipId_status_idx" ON "project_members"("membershipId", "status");

CREATE TABLE "milestones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(1000) NOT NULL DEFAULT '',
  "targetDate" DATE NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "milestones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
  CONSTRAINT "milestones_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "milestones_projectId_code_key" ON "milestones"("projectId", "code");
CREATE INDEX "milestones_projectId_targetDate_idx" ON "milestones"("projectId", "targetDate");

CREATE TABLE "work_packages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "milestoneId" UUID,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(1000) NOT NULL DEFAULT '',
  "plannedStartDate" DATE NOT NULL,
  "plannedEndDate" DATE NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "work_packages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_packages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
  CONSTRAINT "work_packages_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE RESTRICT,
  CONSTRAINT "work_packages_date_order_check" CHECK ("plannedEndDate" >= "plannedStartDate"),
  CONSTRAINT "work_packages_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "work_packages_projectId_code_key" ON "work_packages"("projectId", "code");
CREATE INDEX "work_packages_projectId_plannedStartDate_idx" ON "work_packages"("projectId", "plannedStartDate");
CREATE INDEX "work_packages_milestoneId_idx" ON "work_packages"("milestoneId");

CREATE TABLE "project_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "sourceState" "ProjectState" NOT NULL,
  "targetState" "ProjectState" NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_transitions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_transitions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_transitions_state_change_check" CHECK ("sourceState" <> "targetState")
);
CREATE INDEX "project_transitions_projectId_occurredAt_idx" ON "project_transitions"("projectId", "occurredAt");

CREATE FUNCTION prevent_project_transition_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'project transitions are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER project_transitions_immutable_update BEFORE UPDATE ON "project_transitions" FOR EACH ROW EXECUTE FUNCTION prevent_project_transition_mutation();
CREATE TRIGGER project_transitions_immutable_delete BEFORE DELETE ON "project_transitions" FOR EACH ROW EXECUTE FUNCTION prevent_project_transition_mutation();
````

## File: packages/database/prisma/migrations/20260716020000_phase_3a_item_master/migration.sql
````sql
CREATE TYPE "SpecificationDataType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN');

CREATE TABLE "item_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "item_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "item_categories_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "item_categories_code_key" ON "item_categories"("code");
CREATE INDEX "item_categories_active_name_idx" ON "item_categories"("active", "name");

CREATE TABLE "units_of_measure" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(30) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "symbol" VARCHAR(20) NOT NULL,
  "decimalPrecision" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "units_of_measure_precision_check" CHECK ("decimalPrecision" BETWEEN 0 AND 6),
  CONSTRAINT "units_of_measure_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "units_of_measure_code_key" ON "units_of_measure"("code");
CREATE INDEX "units_of_measure_active_name_idx" ON "units_of_measure"("active", "name");

CREATE TABLE "specification_attribute_definitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "itemCategoryId" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',
  "dataType" "SpecificationDataType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "unitOfMeasureId" UUID,
  "decimalPrecision" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "specification_attribute_definitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "specification_attribute_definitions_itemCategoryId_fkey" FOREIGN KEY ("itemCategoryId") REFERENCES "item_categories"("id") ON DELETE RESTRICT,
  CONSTRAINT "specification_attribute_definitions_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT,
  CONSTRAINT "specification_attribute_definitions_shape_check" CHECK (
    ("dataType" = 'NUMBER' AND "decimalPrecision" BETWEEN 0 AND 6)
    OR
    ("dataType" IN ('TEXT', 'BOOLEAN') AND "unitOfMeasureId" IS NULL AND "decimalPrecision" IS NULL)
  ),
  CONSTRAINT "specification_attribute_definitions_sort_order_check" CHECK ("sortOrder" BETWEEN 0 AND 10000),
  CONSTRAINT "specification_attribute_definitions_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "specification_attribute_definitions_itemCategoryId_code_key" ON "specification_attribute_definitions"("itemCategoryId", "code");
CREATE INDEX "specification_attribute_definitions_itemCategoryId_active_sortOrder_idx" ON "specification_attribute_definitions"("itemCategoryId", "active", "sortOrder");
CREATE INDEX "specification_attribute_definitions_unitOfMeasureId_idx" ON "specification_attribute_definitions"("unitOfMeasureId");

CREATE TABLE "items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000) NOT NULL DEFAULT '',
  "itemCategoryId" UUID NOT NULL,
  "unitOfMeasureId" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "items_itemCategoryId_fkey" FOREIGN KEY ("itemCategoryId") REFERENCES "item_categories"("id") ON DELETE RESTRICT,
  CONSTRAINT "items_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT,
  CONSTRAINT "items_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "items_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "items_code_key" ON "items"("code");
CREATE INDEX "items_active_code_idx" ON "items"("active", "code");
CREATE INDEX "items_itemCategoryId_active_idx" ON "items"("itemCategoryId", "active");
CREATE INDEX "items_unitOfMeasureId_active_idx" ON "items"("unitOfMeasureId", "active");

CREATE TABLE "item_specification_values" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "itemId" UUID NOT NULL,
  "attributeDefinitionId" UUID NOT NULL,
  "textValue" VARCHAR(1000),
  "numericValue" DECIMAL(30,6),
  "booleanValue" BOOLEAN,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "item_specification_values_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "item_specification_values_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT,
  CONSTRAINT "item_specification_values_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "specification_attribute_definitions"("id") ON DELETE RESTRICT,
  CONSTRAINT "item_specification_values_single_value_check" CHECK (num_nonnulls("textValue", "numericValue", "booleanValue") = 1)
);
CREATE UNIQUE INDEX "item_specification_values_itemId_attributeDefinitionId_key" ON "item_specification_values"("itemId", "attributeDefinitionId");
CREATE INDEX "item_specification_values_attributeDefinitionId_idx" ON "item_specification_values"("attributeDefinitionId");

CREATE FUNCTION validate_item_specification_value() RETURNS trigger AS $$
DECLARE
  definition_category_id UUID;
  definition_data_type "SpecificationDataType";
  item_category_id UUID;
BEGIN
  SELECT "itemCategoryId", "dataType"
    INTO definition_category_id, definition_data_type
    FROM "specification_attribute_definitions"
    WHERE "id" = NEW."attributeDefinitionId";
  SELECT "itemCategoryId"
    INTO item_category_id
    FROM "items"
    WHERE "id" = NEW."itemId";

  IF definition_category_id IS NULL OR item_category_id IS NULL OR definition_category_id <> item_category_id THEN
    RAISE EXCEPTION 'item specification definition does not belong to the item category';
  END IF;
  IF definition_data_type = 'TEXT' AND NEW."textValue" IS NULL THEN
    RAISE EXCEPTION 'item specification value type does not match TEXT definition';
  END IF;
  IF definition_data_type = 'NUMBER' AND NEW."numericValue" IS NULL THEN
    RAISE EXCEPTION 'item specification value type does not match NUMBER definition';
  END IF;
  IF definition_data_type = 'BOOLEAN' AND NEW."booleanValue" IS NULL THEN
    RAISE EXCEPTION 'item specification value type does not match BOOLEAN definition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER item_specification_values_validate_insert BEFORE INSERT ON "item_specification_values" FOR EACH ROW EXECUTE FUNCTION validate_item_specification_value();
CREATE TRIGGER item_specification_values_validate_update BEFORE UPDATE ON "item_specification_values" FOR EACH ROW EXECUTE FUNCTION validate_item_specification_value();

CREATE FUNCTION prevent_item_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'items must be deactivated and cannot be deleted';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER items_no_hard_delete BEFORE DELETE ON "items" FOR EACH ROW EXECUTE FUNCTION prevent_item_delete();
````

## File: packages/database/src/phase-three-a-seed.ts
````typescript
import type { PrismaClient } from "../generated/prisma/client.js";
import { localFixtures, shouldSeedLocalFixtures } from "./phase-one-seed.js";

const phaseThreeAFixtures = {
  demoItemCategoryId: "90000000-0000-4000-8000-000000000001",
  eachUnitId: "90000000-0000-4000-8000-000000000002",
  millimetreUnitId: "90000000-0000-4000-8000-000000000003",
  gradeAttributeId: "90000000-0000-4000-8000-000000000004",
  thicknessAttributeId: "90000000-0000-4000-8000-000000000005",
  demoItemId: "90000000-0000-4000-8000-000000000006",
  gradeValueId: "90000000-0000-4000-8000-000000000007",
  thicknessValueId: "90000000-0000-4000-8000-000000000008",
} as const;

export async function applyPhaseThreeASeed(
  database: PrismaClient,
): Promise<void> {
  if (!shouldSeedLocalFixtures(process.env.APP_ENV)) return;

  await database.$transaction(async (transaction) => {
    await transaction.itemCategory.createMany({
      data: {
        code: "RAW-MATERIAL",
        description: "Fictional local raw-material item category",
        id: phaseThreeAFixtures.demoItemCategoryId,
        name: "Raw material",
      },
      skipDuplicates: true,
    });
    await transaction.itemCategory.updateMany({
      data: {
        active: true,
        description: "Fictional local raw-material item category",
        name: "Raw material",
      },
      where: { id: phaseThreeAFixtures.demoItemCategoryId },
    });

    await transaction.unitOfMeasure.createMany({
      data: [
        {
          code: "EA",
          decimalPrecision: 0,
          id: phaseThreeAFixtures.eachUnitId,
          name: "Each",
          symbol: "ea",
        },
        {
          code: "MM",
          decimalPrecision: 3,
          id: phaseThreeAFixtures.millimetreUnitId,
          name: "Millimetre",
          symbol: "mm",
        },
      ],
      skipDuplicates: true,
    });
    await transaction.unitOfMeasure.updateMany({
      data: { active: true, decimalPrecision: 0, name: "Each", symbol: "ea" },
      where: { id: phaseThreeAFixtures.eachUnitId },
    });
    await transaction.unitOfMeasure.updateMany({
      data: {
        active: true,
        decimalPrecision: 3,
        name: "Millimetre",
        symbol: "mm",
      },
      where: { id: phaseThreeAFixtures.millimetreUnitId },
    });

    await transaction.specificationAttributeDefinition.createMany({
      data: [
        {
          code: "GRADE",
          dataType: "TEXT",
          description: "Material grade or alloy designation",
          id: phaseThreeAFixtures.gradeAttributeId,
          itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
          name: "Grade",
          required: true,
          sortOrder: 10,
        },
        {
          code: "THICKNESS",
          dataType: "NUMBER",
          decimalPrecision: 3,
          description: "Nominal material thickness",
          id: phaseThreeAFixtures.thicknessAttributeId,
          itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
          name: "Thickness",
          required: true,
          sortOrder: 20,
          unitOfMeasureId: phaseThreeAFixtures.millimetreUnitId,
        },
      ],
      skipDuplicates: true,
    });
    await transaction.specificationAttributeDefinition.updateMany({
      data: {
        active: true,
        description: "Material grade or alloy designation",
        name: "Grade",
        required: true,
        sortOrder: 10,
      },
      where: { id: phaseThreeAFixtures.gradeAttributeId },
    });
    await transaction.specificationAttributeDefinition.updateMany({
      data: {
        active: true,
        decimalPrecision: 3,
        description: "Nominal material thickness",
        name: "Thickness",
        required: true,
        sortOrder: 20,
        unitOfMeasureId: phaseThreeAFixtures.millimetreUnitId,
      },
      where: { id: phaseThreeAFixtures.thicknessAttributeId },
    });

    await transaction.item.createMany({
      data: {
        code: "PLATE-SS304-6MM",
        createdByUserId: localFixtures.internalAdminUserId,
        description: "Fictional local item-master fixture",
        id: phaseThreeAFixtures.demoItemId,
        itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
        name: "Stainless steel plate 304, 6 mm",
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
      skipDuplicates: true,
    });
    await transaction.item.updateMany({
      data: {
        active: true,
        description: "Fictional local item-master fixture",
        itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
        name: "Stainless steel plate 304, 6 mm",
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
      where: { id: phaseThreeAFixtures.demoItemId },
    });
    await transaction.itemSpecificationValue.upsert({
      create: {
        attributeDefinitionId: phaseThreeAFixtures.gradeAttributeId,
        id: phaseThreeAFixtures.gradeValueId,
        itemId: phaseThreeAFixtures.demoItemId,
        textValue: "SS304",
      },
      update: {
        booleanValue: null,
        numericValue: null,
        textValue: "SS304",
      },
      where: {
        itemId_attributeDefinitionId: {
          attributeDefinitionId: phaseThreeAFixtures.gradeAttributeId,
          itemId: phaseThreeAFixtures.demoItemId,
        },
      },
    });
    await transaction.itemSpecificationValue.upsert({
      create: {
        attributeDefinitionId: phaseThreeAFixtures.thicknessAttributeId,
        id: phaseThreeAFixtures.thicknessValueId,
        itemId: phaseThreeAFixtures.demoItemId,
        numericValue: "6.000",
      },
      update: {
        booleanValue: null,
        numericValue: "6.000",
        textValue: null,
      },
      where: {
        itemId_attributeDefinitionId: {
          attributeDefinitionId: phaseThreeAFixtures.thicknessAttributeId,
          itemId: phaseThreeAFixtures.demoItemId,
        },
      },
    });

    await transaction.systemMetadata.updateMany({
      data: { value: "phase-3a", version: { increment: 1 } },
      where: { key: "seed.version", NOT: { value: "phase-3a" } },
    });
  });
}

export { phaseThreeAFixtures };
````

## File: packages/database/src/phase-two-seed.ts
````typescript
import type { PrismaClient } from "../generated/prisma/client.js";
import { localFixtures, shouldSeedLocalFixtures } from "./phase-one-seed.js";

const phaseTwoFixtures = {
  demoCategoryId: "40000000-0000-4000-8000-000000000001",
  demoProjectId: "50000000-0000-4000-8000-000000000001",
  demoProjectMemberId: "60000000-0000-4000-8000-000000000001",
  demoMilestoneId: "70000000-0000-4000-8000-000000000001",
  demoWorkPackageId: "80000000-0000-4000-8000-000000000001",
} as const;

export async function applyPhaseTwoSeed(database: PrismaClient): Promise<void> {
  if (!shouldSeedLocalFixtures(process.env.APP_ENV)) return;

  await database.$transaction(async (transaction) => {
    await transaction.productCategory.createMany({
      data: {
        code: "PROCESS-EQUIPMENT",
        description: "Engineered process equipment and fabrication projects",
        id: phaseTwoFixtures.demoCategoryId,
        name: "Process equipment",
      },
      skipDuplicates: true,
    });
    await transaction.productCategory.updateMany({
      data: {
        active: true,
        description: "Engineered process equipment and fabrication projects",
        name: "Process equipment",
      },
      where: {
        id: phaseTwoFixtures.demoCategoryId,
        OR: [
          { active: { not: true } },
          { name: { not: "Process equipment" } },
          {
            description: {
              not: "Engineered process equipment and fabrication projects",
            },
          },
        ],
      },
    });

    const plannedStartDate = new Date("2026-08-03T00:00:00.000Z");
    const plannedEndDate = new Date("2026-11-27T00:00:00.000Z");
    await transaction.project.createMany({
      data: {
        code: "DEMO-2026",
        createdByUserId: localFixtures.internalAdminUserId,
        description: "Fictional local demonstration project",
        id: phaseTwoFixtures.demoProjectId,
        name: "Demo process equipment project",
        organizationId: localFixtures.internalOrganizationId,
        plannedEndDate,
        plannedStartDate,
        productCategoryId: phaseTwoFixtures.demoCategoryId,
      },
      skipDuplicates: true,
    });
    await transaction.project.updateMany({
      data: {
        description: "Fictional local demonstration project",
        name: "Demo process equipment project",
        plannedEndDate,
        plannedStartDate,
        productCategoryId: phaseTwoFixtures.demoCategoryId,
      },
      where: {
        id: phaseTwoFixtures.demoProjectId,
        OR: [
          { description: { not: "Fictional local demonstration project" } },
          { name: { not: "Demo process equipment project" } },
          { plannedEndDate: { not: plannedEndDate } },
          { plannedStartDate: { not: plannedStartDate } },
          { productCategoryId: { not: phaseTwoFixtures.demoCategoryId } },
        ],
      },
    });

    const membership = await transaction.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.internalOrganizationId,
          userId: localFixtures.internalAdminUserId,
        },
      },
    });
    await transaction.projectMember.createMany({
      data: {
        addedByUserId: localFixtures.internalAdminUserId,
        id: phaseTwoFixtures.demoProjectMemberId,
        membershipId: membership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "PROJECT_MANAGER",
      },
      skipDuplicates: true,
    });

    await transaction.milestone.createMany({
      data: {
        code: "FAB-START",
        description: "Planned fabrication commencement",
        id: phaseTwoFixtures.demoMilestoneId,
        name: "Fabrication start",
        projectId: phaseTwoFixtures.demoProjectId,
        targetDate: new Date("2026-09-14T00:00:00.000Z"),
      },
      skipDuplicates: true,
    });
    await transaction.workPackage.createMany({
      data: {
        code: "WP-001",
        description: "Demo fabrication preparation work package",
        id: phaseTwoFixtures.demoWorkPackageId,
        milestoneId: phaseTwoFixtures.demoMilestoneId,
        name: "Fabrication preparation",
        plannedEndDate: new Date("2026-09-11T00:00:00.000Z"),
        plannedStartDate: new Date("2026-08-03T00:00:00.000Z"),
        projectId: phaseTwoFixtures.demoProjectId,
      },
      skipDuplicates: true,
    });

    await transaction.systemMetadata.updateMany({
      data: { value: "phase-2", version: { increment: 1 } },
      where: { key: "seed.version", NOT: { value: "phase-2" } },
    });
  });
}

export { phaseTwoFixtures };
````

## File: scripts/check-openapi.mjs
````javascript
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const artifact = new URL("../docs/generated/openapi.json", import.meta.url);
const before = readFileSync(artifact, "utf8");
const generated = spawnSync("pnpm openapi:generate", {
  cwd: new URL("..", import.meta.url),
  shell: true,
  stdio: "inherit",
});
if (generated.error) throw generated.error;
if (generated.status !== 0) process.exit(generated.status ?? 1);

const after = readFileSync(artifact, "utf8");
if (after !== before) {
  console.error(
    "OpenAPI artifact drift detected. Run pnpm openapi:generate and commit the result.",
  );
  process.exit(1);
}
````

## File: tests/e2e/items.spec.ts
````typescript
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await page.getByRole("button", { name: "Internal administrator" }).click();
  await expect(
    page.getByRole("heading", { name: "Internal overview" }),
  ).toBeVisible();
}

test("creates, searches, exports, edits, and deactivates an item", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Items", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Items", exact: true }),
  ).toBeVisible();

  const suffix = `${Date.now().toString(36)}${Math.floor(
    Math.random() * 10_000,
  ).toString(36)}`.toUpperCase();
  const unitCode = `U${suffix}`;
  const unitName = `Browser unit ${suffix}`;
  const unitSymbol = `u${suffix.slice(-4).toLowerCase()}`;
  const categoryCode = `C${suffix}`;
  const categoryName = `Browser category ${suffix}`;
  const attributeCode = `A${suffix}`;
  const attributeName = `Browser measure ${suffix}`;
  const itemCode = `I${suffix}`;
  const itemName = `Browser item ${suffix}`;
  const editedName = `Edited browser item ${suffix}`;

  const unitForm = page.getByRole("form", {
    name: "Create unit of measure",
  });
  await unitForm.getByLabel("Unit code").fill(unitCode);
  await unitForm.getByLabel("Unit name").fill(unitName);
  await unitForm.getByLabel("Symbol").fill(unitSymbol);
  await unitForm.getByLabel("Decimal precision").fill("2");
  await unitForm.getByRole("button", { name: "Add unit" }).click();
  await expect(
    page.getByText(`${unitCode} — ${unitName} (${unitSymbol}) — Active`, {
      exact: true,
    }),
  ).toBeVisible();

  const categoryForm = page.getByRole("form", {
    name: "Create item category",
  });
  await categoryForm.getByLabel("Category code").fill(categoryCode);
  await categoryForm.getByLabel("Category name").fill(categoryName);
  await categoryForm
    .getByLabel("Category description")
    .fill("Category created by the Phase 3A browser workflow");
  await categoryForm.getByRole("button", { name: "Add category" }).click();

  await page
    .getByText(`${categoryCode} — ${categoryName} — Active`, { exact: true })
    .click();
  const attributeForm = page.getByRole("form", {
    name: `Add specification attribute to ${categoryName}`,
  });
  await attributeForm.getByLabel("Attribute code").fill(attributeCode);
  await attributeForm.getByLabel("Attribute name").fill(attributeName);
  await attributeForm.getByLabel("Data type").selectOption("NUMBER");
  await attributeForm
    .getByLabel("Number unit (optional)")
    .selectOption({ label: `${unitCode} — ${unitName} (${unitSymbol})` });
  await attributeForm.getByLabel("Number decimal precision").fill("2");
  await attributeForm.getByLabel("Required for items").check();
  await attributeForm
    .getByRole("button", { name: "Add specification attribute" })
    .click();

  await page
    .locator("#create-item")
    .getByText(`${categoryCode} — ${categoryName}`, { exact: true })
    .click();
  const itemForm = page.getByRole("form", {
    name: `New ${categoryName} item`,
  });
  await itemForm.getByLabel("Item code").fill(itemCode);
  await itemForm.getByLabel("Item name").fill(itemName);
  await itemForm
    .getByLabel("Base unit of measure")
    .selectOption({ label: `${unitCode} — ${unitName} (${unitSymbol})` });
  await itemForm
    .getByLabel("Item description")
    .fill("Item created by the Phase 3A browser workflow");
  await itemForm.getByRole("spinbutton", { name: attributeName }).fill("12.34");
  await itemForm.getByRole("button", { name: "Create item" }).click();

  await expect(page.getByRole("heading", { name: itemName })).toBeVisible();
  await expect(page.getByRole("cell", { name: "12.34" })).toBeVisible();
  await page.getByText("Edit item", { exact: true }).click();
  const editForm = page.getByRole("form", { name: `Edit item ${itemCode}` });
  await editForm.getByLabel("Item name").fill(editedName);
  await editForm.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

  await page.getByRole("link", { name: "Items", exact: true }).first().click();
  await page.getByLabel("Search").fill(itemCode);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(new RegExp(`q=${itemCode}`));
  await expect(page.getByRole("link", { name: itemCode })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const csv = await readFile(downloadPath!, "utf8");
  expect(csv).toContain(itemCode);

  await page.getByRole("link", { name: itemCode }).click();
  await page
    .getByLabel("Deactivation reason")
    .fill("Browser workflow duplicate cleanup");
  await page.getByRole("button", { name: "Deactivate item" }).click();
  await expect(
    page.getByText(
      "This item is inactive and retained for historical traceability.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /delete item/i })).toHaveCount(
    0,
  );
});
````

## File: tests/e2e/projects.spec.ts
````typescript
import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await page.getByRole("button", { name: "Internal administrator" }).click();
  await expect(
    page.getByRole("heading", { name: "Internal overview" }),
  ).toBeVisible();
}

test("creates, edits, and explicitly transitions a project", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  const code = `E2E-${suffix}`;
  const originalName = `Browser project ${suffix}`;
  const editedName = `Edited browser project ${suffix}`;
  await page.getByLabel("Project code").fill(code);
  await page.getByLabel("Project name").fill(originalName);
  await page.getByLabel("Planned start").first().fill("2026-08-03");
  await page.getByLabel("Planned end").first().fill("2026-12-18");
  await page
    .getByLabel("Description")
    .first()
    .fill("Created by the Phase 2 browser workflow");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { name: originalName })).toBeVisible();
  await expect(page.getByText("DRAFT", { exact: true })).toBeVisible();

  await page.getByText("Edit project", { exact: true }).click();
  await page.getByLabel("Project name").fill(editedName);
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

  await page.getByLabel("Target state").selectOption("PLANNED");
  await page.getByLabel("Reason").fill("Browser workflow planning approval");
  await page.getByRole("button", { name: "Transition project" }).click();
  await expect(page.getByText("PLANNED", { exact: true })).toBeVisible();
  await expect(page.getByText("DRAFT → PLANNED")).toBeVisible();
  await expect(
    page.getByText("Browser workflow planning approval"),
  ).toBeVisible();
});
````

## File: .githooks/pre-commit
````
#!/bin/sh
pnpm format:check && pnpm lint && pnpm typecheck
````

## File: .github/dependency-review-config.yml
````yaml
fail-on-severity: high
deny-licenses:
  - AGPL-3.0
````

## File: apps/api/src/administration/administration.controller.ts
````typescript
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiCookieAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  AssignRolesDto,
  CreateMembershipDto,
  CreateOrganizationDto,
  UpdateMembershipStatusDto,
} from "./administration.dto.js";
import { AdministrationService } from "./administration.service.js";

@ApiTags("administration")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The active principal lacks permission or internal scope",
})
@Controller("api/v1/administration")
export class AdministrationController {
  constructor(
    @Inject(AdministrationService)
    private readonly administration: AdministrationService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("organizations")
  @ApiOperation({ summary: "List organizations for internal administration" })
  @ApiOkResponse({ description: "Authorized organizations" })
  async organizations(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.administration.listOrganizations(principal),
      meta: requestContext(request),
    };
  }

  @Post("organizations")
  @ApiOperation({ summary: "Create an organization" })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiCreatedResponse({ description: "Organization created" })
  async createOrganization(
    @Req() request: Request,
    @Body() input: CreateOrganizationDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.administration.createOrganization(principal, input);
  }

  @Get("roles")
  @ApiOperation({ summary: "List seeded roles" })
  async roles(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.administration.listRoles(principal),
      meta: requestContext(request),
    };
  }

  @Get("users")
  @ApiOperation({ summary: "List synchronized user profiles" })
  async users(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.administration.listUsers(principal),
      meta: requestContext(request),
    };
  }

  @Get("organizations/:organizationId/memberships")
  @ApiOperation({
    summary: "List organization memberships and role assignments",
  })
  @ApiParam({ format: "uuid", name: "organizationId" })
  async memberships(
    @Req() request: Request,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
  ) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.administration.listMemberships(
        principal,
        organizationId,
      ),
      meta: requestContext(request),
    };
  }

  @Post("organizations/:organizationId/memberships")
  @ApiOperation({ summary: "Create an active organization membership" })
  @ApiParam({ format: "uuid", name: "organizationId" })
  @ApiBody({ type: CreateMembershipDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createMembership(
    @Req() request: Request,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() input: CreateMembershipDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.administration.createMembership(
      principal,
      requestContext(request),
      organizationId,
      input.userId,
    );
  }

  @Patch("organizations/:organizationId/memberships/:membershipId/status")
  @ApiOperation({ summary: "Activate or deactivate a membership" })
  @ApiParam({ format: "uuid", name: "organizationId" })
  @ApiParam({ format: "uuid", name: "membershipId" })
  @ApiBody({ type: UpdateMembershipStatusDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiNotFoundResponse({
    description: "Resource is nonexistent or inaccessible",
  })
  async updateMembershipStatus(
    @Req() request: Request,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("membershipId", new ParseUUIDPipe()) membershipId: string,
    @Body() input: UpdateMembershipStatusDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.administration.updateMembershipStatus(
      principal,
      requestContext(request),
      organizationId,
      membershipId,
      input,
    );
  }

  @Put("organizations/:organizationId/memberships/:membershipId/roles")
  @ApiOperation({ summary: "Replace membership role assignments atomically" })
  @ApiParam({ format: "uuid", name: "organizationId" })
  @ApiParam({ format: "uuid", name: "membershipId" })
  @ApiBody({ type: AssignRolesDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiNotFoundResponse({
    description: "Resource is nonexistent or inaccessible",
  })
  async assignRoles(
    @Req() request: Request,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("membershipId", new ParseUUIDPipe()) membershipId: string,
    @Body() input: AssignRolesDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.administration.assignRoles(
      principal,
      requestContext(request),
      organizationId,
      membershipId,
      input,
    );
  }
}
````

## File: apps/api/src/administration/administration.dto.ts
````typescript
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const organizationTypes = {
  INTERNAL: "INTERNAL",
  SUPPLIER: "SUPPLIER",
} as const;
const membershipStatuses = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" } as const;

export class CreateOrganizationDto {
  @ApiProperty({ example: "SUPPLIER-ABC", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9-]+$/)
  code!: string;

  @ApiProperty({ example: "Supplier ABC", maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ enum: organizationTypes, type: String })
  @IsEnum(organizationTypes)
  type!: "INTERNAL" | "SUPPLIER";
}

export class CreateMembershipDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  userId!: string;
}

export class UpdateMembershipStatusDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ enum: membershipStatuses, type: String })
  @IsEnum(membershipStatuses)
  status!: "ACTIVE" | "INACTIVE";
}

export class AssignRolesDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ example: ["FINANCE_READONLY"], maxItems: 14, type: [String] })
  @IsArray()
  @ArrayMaxSize(14)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  roleCodes!: string[];
}
````

## File: apps/api/src/administration/administration.repository.ts
````typescript
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { createDatabaseClient, type PrismaClient } from "@mecoflow/database";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type { RequestContext } from "../identity/identity.types.js";

@Injectable()
export class AdministrationRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  listOrganizations() {
    return this.database.organization.findMany({ orderBy: { code: "asc" } });
  }

  listRoles() {
    return this.database.role.findMany({ orderBy: { code: "asc" } });
  }

  listUsers() {
    return this.database.userProfile.findMany({
      orderBy: { email: "asc" },
      select: { displayName: true, email: true, id: true, status: true },
    });
  }

  listMemberships(organizationId: string) {
    return this.database.membership.findMany({
      include: {
        roles: { select: { roleCode: true }, orderBy: { roleCode: "asc" } },
        user: {
          select: { displayName: true, email: true, id: true, status: true },
        },
      },
      orderBy: { user: { email: "asc" } },
      where: { organizationId },
    });
  }

  async createOrganization(input: {
    code: string;
    name: string;
    type: "INTERNAL" | "SUPPLIER";
  }) {
    try {
      return await this.database.organization.create({ data: input });
    } catch {
      throw new ConflictException("Organization code already exists");
    }
  }

  async createMembership(input: {
    actorUserId: string;
    context: RequestContext;
    organizationId: string;
    userId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const [organization, user] = await Promise.all([
        transaction.organization.findUnique({
          where: { id: input.organizationId },
        }),
        transaction.userProfile.findUnique({ where: { id: input.userId } }),
      ]);
      if (!organization || !user)
        throw new NotFoundException("Resource not found");
      let membership;
      try {
        membership = await transaction.membership.create({
          data: { organizationId: input.organizationId, userId: input.userId },
        });
      } catch {
        throw new ConflictException("Membership already exists");
      }
      await transaction.auditEvent.create({
        data: {
          action: "MEMBERSHIP_CREATED",
          actorUserId: input.actorUserId,
          changes: {
            status: { from: null, to: "ACTIVE" },
            userId: input.userId,
          },
          correlationId: input.context.correlationId,
          entityId: membership.id,
          entityType: "Membership",
          organizationId: input.organizationId,
          outcome: "SUCCESS",
          requestId: input.context.requestId,
        },
      });
      return membership;
    });
  }

  async updateMembershipStatus(input: {
    actorUserId: string;
    context: RequestContext;
    expectedVersion: number;
    membershipId: string;
    organizationId: string;
    status: "ACTIVE" | "INACTIVE";
  }) {
    return this.database.$transaction(async (transaction) => {
      const current = await transaction.membership.findFirst({
        where: { id: input.membershipId, organizationId: input.organizationId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (current.status === input.status) return current;
      const updated = await transaction.membership.update({
        data: { status: input.status, version: { increment: 1 } },
        where: { id: current.id },
      });
      await transaction.auditEvent.create({
        data: {
          action: "MEMBERSHIP_STATUS_CHANGED",
          actorUserId: input.actorUserId,
          changes: { status: { from: current.status, to: updated.status } },
          correlationId: input.context.correlationId,
          entityId: current.id,
          entityType: "Membership",
          organizationId: input.organizationId,
          outcome: "SUCCESS",
          requestId: input.context.requestId,
        },
      });
      return updated;
    });
  }

  async assignRoles(input: {
    actorUserId: string;
    context: RequestContext;
    expectedVersion: number;
    membershipId: string;
    organizationId: string;
    roleCodes: readonly string[];
  }) {
    return this.database.$transaction(async (transaction) => {
      const membership = await transaction.membership.findFirst({
        include: { organization: true, roles: true },
        where: { id: input.membershipId, organizationId: input.organizationId },
      });
      if (!membership) throw new NotFoundException("Resource not found");
      if (membership.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const uniqueRoleCodes = [...new Set(input.roleCodes)].sort();
      const roles = await transaction.role.findMany({
        where: { code: { in: uniqueRoleCodes } },
      });
      if (roles.length !== uniqueRoleCodes.length)
        throw new UnprocessableEntityException("Invalid role assignment");
      if (
        roles.some(
          (role) =>
            role.scope !== "ANY" && role.scope !== membership.organization.type,
        )
      )
        throw new UnprocessableEntityException("Invalid role assignment");
      const before = membership.roles.map(({ roleCode }) => roleCode).sort();
      const added = uniqueRoleCodes.filter((code) => !before.includes(code));
      const removed = before.filter((code) => !uniqueRoleCodes.includes(code));
      if (added.length === 0 && removed.length === 0) return membership;
      const versionUpdate = await transaction.membership.updateMany({
        data: { version: { increment: 1 } },
        where: { id: membership.id, version: input.expectedVersion },
      });
      if (versionUpdate.count !== 1)
        throw new ConflictException("Concurrent modification");
      if (removed.length > 0)
        await transaction.membershipRole.deleteMany({
          where: { membershipId: membership.id, roleCode: { in: removed } },
        });
      if (added.length > 0)
        await transaction.membershipRole.createMany({
          data: added.map((roleCode) => ({
            assignedByUserId: input.actorUserId,
            membershipId: membership.id,
            roleCode,
          })),
        });
      await transaction.auditEvent.create({
        data: {
          action: "MEMBERSHIP_ROLES_CHANGED",
          actorUserId: input.actorUserId,
          changes: { added, removed },
          correlationId: input.context.correlationId,
          entityId: membership.id,
          entityType: "Membership",
          organizationId: input.organizationId,
          outcome: "SUCCESS",
          requestId: input.context.requestId,
        },
      });
      return transaction.membership.findUniqueOrThrow({
        include: { roles: { select: { roleCode: true } } },
        where: { id: membership.id },
      });
    });
  }
}
````

## File: apps/api/src/administration/administration.service.ts
````typescript
import { Inject, Injectable } from "@nestjs/common";
import { AuthorizationPolicy } from "../authorization/authorization.policy.js";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { AdministrationRepository } from "./administration.repository.js";

@Injectable()
export class AdministrationService {
  constructor(
    @Inject(AuthorizationPolicy)
    private readonly authorization: AuthorizationPolicy,
    @Inject(AdministrationRepository)
    private readonly repository: AdministrationRepository,
  ) {}

  listOrganizations(principal: AuthenticatedPrincipal) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(principal, "organization.read");
    return this.repository.listOrganizations();
  }

  listRoles(principal: AuthenticatedPrincipal) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(principal, "role.read");
    return this.repository.listRoles();
  }

  listUsers(principal: AuthenticatedPrincipal) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(principal, "user.read");
    return this.repository.listUsers();
  }

  listMemberships(principal: AuthenticatedPrincipal, organizationId: string) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(
      principal,
      "membership.read",
      organizationId,
    );
    return this.repository.listMemberships(organizationId);
  }

  createOrganization(
    principal: AuthenticatedPrincipal,
    input: { code: string; name: string; type: "INTERNAL" | "SUPPLIER" },
  ) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(principal, "organization.write");
    return this.repository.createOrganization(input);
  }

  createMembership(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    organizationId: string,
    userId: string,
  ) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(
      principal,
      "membership.write",
      organizationId,
    );
    return this.repository.createMembership({
      actorUserId: principal.user.id,
      context,
      organizationId,
      userId,
    });
  }

  updateMembershipStatus(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    organizationId: string,
    membershipId: string,
    input: { expectedVersion: number; status: "ACTIVE" | "INACTIVE" },
  ) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(
      principal,
      "membership.write",
      organizationId,
    );
    return this.repository.updateMembershipStatus({
      actorUserId: principal.user.id,
      context,
      membershipId,
      organizationId,
      ...input,
    });
  }

  assignRoles(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    organizationId: string,
    membershipId: string,
    input: { expectedVersion: number; roleCodes: string[] },
  ) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(
      principal,
      "role.assign",
      organizationId,
    );
    return this.repository.assignRoles({
      actorUserId: principal.user.id,
      context,
      membershipId,
      organizationId,
      ...input,
    });
  }
}
````

## File: apps/api/src/authorization/authorization.policy.authorization.test.ts
````typescript
import { describe, expect, it } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { AuthorizationPolicy } from "./authorization.policy.js";
import type {
  ProjectScopePolicy,
  ProjectScopeResolver,
} from "./project-scope.policy.js";

function principal(membership: PrincipalMembership): AuthenticatedPrincipal {
  return {
    memberships: [membership],
    sessionId: "session",
    user: {
      displayName: "Test User",
      email: "user@example.test",
      id: "user",
      locale: "en",
    },
  };
}

const internalReadonly = principal({
  id: "membership-internal",
  organization: {
    code: "MECO",
    id: "org-internal",
    name: "MECO",
    type: "INTERNAL",
  },
  permissions: new Set(["organization.read", "project.read"]),
  roles: ["FINANCE_READONLY"],
});

const supplierAdmin = principal({
  id: "membership-supplier",
  organization: {
    code: "SUPPLIER-A",
    id: "org-supplier",
    name: "Supplier A",
    type: "SUPPLIER",
  },
  permissions: new Set(["supplier.membership.write", "project.read"]),
  roles: ["SUPPLIER_ADMIN"],
});

describe("server-side authorization policy", () => {
  const policy = new AuthorizationPolicy();

  it("allows an explicitly granted read permission", () => {
    expect(
      policy.hasPermission(
        internalReadonly,
        "organization.read",
        "org-internal",
      ),
    ).toBe(true);
  });

  it("denies write access to a read-only role", () => {
    expect(() =>
      policy.requirePermission(internalReadonly, "organization.write"),
    ).toThrow(ForbiddenException);
  });

  it("denies supplier access to internal administration", () => {
    expect(() => policy.requireInternalAdministration(supplierAdmin)).toThrow(
      ForbiddenException,
    );
  });

  it("uses not-found semantics for an organization outside the principal scope", () => {
    expect(() =>
      policy.requireOrganizationScope(supplierAdmin, "org-other"),
    ).toThrow(NotFoundException);
  });

  it("exposes Phase 2 project scope only as deny-capable interfaces", () => {
    const resolver: ProjectScopeResolver = {
      canAccessProject: async () => false,
    };
    const projectPolicy: ProjectScopePolicy = {
      requireProjectRead: async () => Promise.reject(new ForbiddenException()),
      requireProjectWrite: async () => Promise.reject(new ForbiddenException()),
    };
    expect(resolver.canAccessProject).toBeTypeOf("function");
    expect(projectPolicy.requireProjectWrite).toBeTypeOf("function");
  });
});
````

## File: apps/api/src/authorization/authorization.policy.ts
````typescript
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";

@Injectable()
export class AuthorizationPolicy {
  hasPermission(
    principal: AuthenticatedPrincipal,
    permission: string,
    organizationId?: string,
  ): boolean {
    return principal.memberships.some((membership) => {
      const systemAdministrator =
        membership.organization.type === "INTERNAL" &&
        membership.roles.includes("SYSTEM_ADMIN");
      const inScope =
        !organizationId ||
        membership.organization.id === organizationId ||
        systemAdministrator;
      return inScope && membership.permissions.has(permission);
    });
  }

  requirePermission(
    principal: AuthenticatedPrincipal,
    permission: string,
    organizationId?: string,
  ): void {
    if (!this.hasPermission(principal, permission, organizationId))
      throw new ForbiddenException("Access denied");
  }

  requireInternalAdministration(principal: AuthenticatedPrincipal): void {
    const allowed = principal.memberships.some(
      (membership) =>
        membership.organization.type === "INTERNAL" &&
        membership.permissions.has("administration.access"),
    );
    if (!allowed) throw new ForbiddenException("Access denied");
  }

  requireOrganizationScope(
    principal: AuthenticatedPrincipal,
    organizationId: string,
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) => candidate.organization.id === organizationId,
    );
    if (!membership) throw new NotFoundException("Resource not found");
    return membership;
  }
}
````

## File: apps/api/src/authorization/identity.authorization.integration.test.ts
````typescript
import { randomBytes, createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { INestApplication } from "@nestjs/common";
import { createApplication } from "../bootstrap.js";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 1 authorization integration", () => {
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

  async function authenticated(userId: string) {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    sessionHashes.push(tokenHash);
    await database.session.create({
      data: {
        csrfTokenHash: hash(csrf),
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash,
        userId,
      },
    });
    return {
      csrf,
      headers: { cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}` },
    };
  }

  it("returns /me for an active user with an active membership", async () => {
    const auth = await authenticated(localFixtures.internalAdminUserId);
    const response = await fetch(`${baseUrl}/api/v1/me`, {
      headers: auth.headers,
    });
    expect(response.status).toBe(200);
    expect((await response.json()) as object).toMatchObject({
      shell: "INTERNAL",
    });
  });

  it("denies an inactive user", async () => {
    const auth = await authenticated(localFixtures.inactiveUserId);
    const response = await fetch(`${baseUrl}/api/v1/me`, {
      headers: auth.headers,
    });
    expect(response.status).toBe(403);
  });

  it("denies an inactive membership", async () => {
    const auth = await authenticated(localFixtures.inactiveMembershipUserId);
    const response = await fetch(`${baseUrl}/api/v1/me`, {
      headers: auth.headers,
    });
    expect(response.status).toBe(403);
  });

  it("denies supplier access to internal administration with equivalent safe responses for object IDs", async () => {
    const auth = await authenticated(localFixtures.supplierAdminUserId);
    const paths = [
      `/api/v1/administration/organizations/${localFixtures.internalOrganizationId}/memberships`,
      `/api/v1/administration/organizations/${localFixtures.supplierOrganizationId}/memberships`,
      "/api/v1/administration/organizations/ffffffff-ffff-4fff-8fff-ffffffffffff/memberships",
    ];
    const statuses = await Promise.all(
      paths.map(
        async (path) =>
          (await fetch(`${baseUrl}${path}`, { headers: auth.headers })).status,
      ),
    );
    expect(statuses).toEqual([403, 403, 403]);
  });

  it("denies writes by a read-only role", async () => {
    const auth = await authenticated(localFixtures.internalReadonlyUserId);
    const response = await fetch(
      `${baseUrl}/api/v1/administration/organizations`,
      {
        body: JSON.stringify({
          code: "DENIED",
          name: "Denied organization",
          type: "INTERNAL",
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "POST",
      },
    );
    expect(response.status).toBe(403);
  });

  it("denies unsafe administration requests without the session CSRF proof", async () => {
    const auth = await authenticated(localFixtures.internalAdminUserId);
    const response = await fetch(
      `${baseUrl}/api/v1/administration/organizations`,
      {
        body: JSON.stringify({
          code: "NO-CSRF",
          name: "Rejected organization",
          type: "INTERNAL",
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
        },
        method: "POST",
      },
    );
    expect(response.status).toBe(403);
  });

  it("writes an immutable audit event in the same role-change operation", async () => {
    const auth = await authenticated(localFixtures.internalAdminUserId);
    const membership = await database.membership.findUniqueOrThrow({
      include: { roles: true },
      where: {
        userId_organizationId: {
          organizationId: localFixtures.internalOrganizationId,
          userId: localFixtures.internalReadonlyUserId,
        },
      },
    });
    const originalRoles = membership.roles.map(({ roleCode }) => roleCode);
    const changedRoles = originalRoles.includes("MECO_MANAGEMENT")
      ? ["FINANCE_READONLY"]
      : ["MECO_MANAGEMENT"];
    const changeResponse = await fetch(
      `${baseUrl}/api/v1/administration/organizations/${membership.organizationId}/memberships/${membership.id}/roles`,
      {
        body: JSON.stringify({
          expectedVersion: membership.version,
          roleCodes: changedRoles,
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "PUT",
      },
    );
    expect(changeResponse.status).toBe(200);
    const auditEvent = await database.auditEvent.findFirstOrThrow({
      orderBy: { occurredAt: "desc" },
      where: { action: "MEMBERSHIP_ROLES_CHANGED", entityId: membership.id },
    });
    expect(auditEvent.actorUserId).toBe(localFixtures.internalAdminUserId);
    expect(auditEvent.changes).toMatchObject({
      added: expect.any(Array),
      removed: expect.any(Array),
    });
    await expect(
      database.$executeRaw`UPDATE audit_events SET outcome = 'ALTERED' WHERE id = ${auditEvent.id}::uuid`,
    ).rejects.toThrow(/immutable/i);

    const updated = await database.membership.findUniqueOrThrow({
      where: { id: membership.id },
    });
    const restoreResponse = await fetch(
      `${baseUrl}/api/v1/administration/organizations/${membership.organizationId}/memberships/${membership.id}/roles`,
      {
        body: JSON.stringify({
          expectedVersion: updated.version,
          roleCodes: originalRoles,
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "PUT",
      },
    );
    expect(restoreResponse.status).toBe(200);
  });
});
````

## File: apps/api/src/authorization/project-scope.policy.ts
````typescript
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";

export interface ProjectScope {
  organizationId: string;
  projectId: string;
}

export interface ProjectScopeResolver {
  canAccessProject(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<boolean>;
}

export interface ProjectScopePolicy {
  requireProjectRead(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void>;
  requireProjectWrite(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void>;
}
````

## File: apps/api/src/health/health.controller.test.ts
````typescript
import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";

describe("HealthController dependency metadata", () => {
  it("declares its dependency explicitly for development transpilers", () => {
    const dependencies = Reflect.getMetadata(
      "self:paramtypes",
      HealthController,
    ) as Array<{ index: number; param: unknown }> | undefined;

    expect(dependencies).toEqual([{ index: 0, param: HealthService }]);
  });
});
````

## File: apps/api/src/identity/auth.controller.ts
````typescript
import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Redirect,
  Req,
  Res,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { IdentityService } from "./identity.service.js";

@ApiTags("authentication")
@Controller("api/v1/auth")
export class AuthController {
  constructor(
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("login")
  @Redirect()
  @ApiOperation({ summary: "Begin OIDC authorization code flow with PKCE" })
  @ApiQuery({ name: "returnTo", required: false })
  async login(
    @Query("returnTo") returnTo: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    return { url: await this.identity.beginLogin(returnTo, response) };
  }

  @Get("callback")
  @Redirect()
  @ApiOperation({ summary: "Complete the OIDC authorization callback" })
  @ApiQuery({ name: "code", required: true, type: String })
  @ApiQuery({ name: "state", required: true, type: String })
  async callback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!code || !state)
      return {
        url: this.identity.webUrl("/login?error=authentication_failed"),
      };
    try {
      const returnTo = await this.identity.completeLogin(
        code,
        state,
        request,
        response,
      );
      return { url: this.identity.webUrl(returnTo) };
    } catch {
      return {
        url: this.identity.webUrl("/login?error=authentication_failed"),
      };
    }
  }

  @Post("logout")
  @ApiCookieAuth("session")
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiOperation({ summary: "Revoke the current server-side session" })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.identity.logout(request, response);
    return { loggedOut: true };
  }
}
````

## File: apps/api/src/identity/crypto.ts
````typescript
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
````

## File: apps/api/src/identity/identity.repository.ts
````typescript
import { Inject, Injectable } from "@nestjs/common";
import { createDatabaseClient, type PrismaClient } from "@mecoflow/database";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type { AuthenticatedPrincipal } from "./identity.types.js";

interface OidcIdentity {
  displayName: string;
  email: string;
  issuer: string;
  locale: string;
  subject: string;
}

@Injectable()
export class IdentityRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  async createAuthTransaction(input: {
    codeVerifier: string;
    expiresAt: Date;
    nonce: string;
    returnTo: string;
    stateHash: string;
  }): Promise<void> {
    await this.database.oidcAuthTransaction.create({ data: input });
  }

  async consumeAuthTransaction(stateHash: string) {
    return this.database.$transaction(async (transaction) => {
      const authTransaction = await transaction.oidcAuthTransaction.findUnique({
        where: { stateHash },
      });
      if (!authTransaction) return null;
      await transaction.oidcAuthTransaction.delete({ where: { stateHash } });
      return authTransaction;
    });
  }

  async synchronizeIdentity(identity: OidcIdentity): Promise<string> {
    const profile = await this.database.userProfile.upsert({
      create: {
        displayName: identity.displayName,
        email: identity.email,
        issuer: identity.issuer,
        lastLoginAt: new Date(),
        locale: identity.locale,
        subject: identity.subject,
      },
      update: {
        displayName: identity.displayName,
        email: identity.email,
        lastLoginAt: new Date(),
        locale: identity.locale,
        version: { increment: 1 },
      },
      where: {
        issuer_subject: { issuer: identity.issuer, subject: identity.subject },
      },
    });
    return profile.id;
  }

  async createSession(input: {
    csrfTokenHash: string;
    expiresAt: Date;
    tokenHash: string;
    userId: string;
  }): Promise<void> {
    await this.database.session.create({ data: input });
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.database.session.updateMany({
      data: { revokedAt: new Date() },
      where: { tokenHash, revokedAt: null },
    });
  }

  async findPrincipal(tokenHash: string): Promise<
    | { kind: "INVALID" }
    | { kind: "INACTIVE_USER" }
    | { kind: "NO_ACTIVE_MEMBERSHIP" }
    | {
        kind: "ACTIVE";
        principal: AuthenticatedPrincipal;
        csrfTokenHash: string;
      }
  > {
    const session = await this.database.session.findUnique({
      include: {
        user: {
          include: {
            memberships: {
              include: {
                organization: true,
                roles: {
                  include: {
                    role: {
                      include: { permissions: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: { tokenHash },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date())
      return { kind: "INVALID" };
    if (session.user.status !== "ACTIVE") return { kind: "INACTIVE_USER" };

    const memberships = session.user.memberships
      .filter(
        (membership) =>
          membership.status === "ACTIVE" && membership.organization.active,
      )
      .map((membership) => ({
        id: membership.id,
        organization: {
          code: membership.organization.code,
          id: membership.organization.id,
          name: membership.organization.name,
          type: membership.organization.type,
        },
        permissions: new Set(
          membership.roles.flatMap(({ role }) =>
            role.permissions.map(({ permissionCode }) => permissionCode),
          ),
        ),
        roles: membership.roles.map(({ roleCode }) => roleCode).sort(),
      }));
    if (memberships.length === 0) return { kind: "NO_ACTIVE_MEMBERSHIP" };

    return {
      csrfTokenHash: session.csrfTokenHash,
      kind: "ACTIVE",
      principal: {
        memberships,
        sessionId: session.id,
        user: {
          displayName: session.user.displayName,
          email: session.user.email,
          id: session.user.id,
          locale: session.user.locale,
        },
      },
    };
  }
}
````

## File: apps/api/src/identity/identity.service.ts
````typescript
import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import {
  constantTimeEqual,
  pkceChallenge,
  randomToken,
  sha256,
} from "./crypto.js";
import { IdentityRepository } from "./identity.repository.js";
import type { AuthenticatedPrincipal } from "./identity.types.js";
import { OidcService } from "./oidc.service.js";

const sessionCookie = "mecoflow_session";
const csrfCookie = "mecoflow_csrf";
const oidcStateCookie = "mecoflow_oidc_state";

function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name)
      return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return undefined;
}

function safeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 500);
}

@Injectable()
export class IdentityService {
  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
    @Inject(IdentityRepository)
    private readonly repository: IdentityRepository,
    @Inject(OidcService) private readonly oidc: OidcService,
  ) {}

  async beginLogin(
    returnTo: string | undefined,
    response: Response,
  ): Promise<string> {
    const state = randomToken();
    const nonce = randomToken();
    const codeVerifier = randomToken(64);
    await this.repository.createAuthTransaction({
      codeVerifier,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      nonce,
      returnTo: safeReturnTo(returnTo),
      stateHash: sha256(state),
    });
    const secure = this.environment.NODE_ENV === "production" ? "; Secure" : "";
    response.append(
      "Set-Cookie",
      `${oidcStateCookie}=${encodeURIComponent(state)}; Path=/api/v1/auth/callback; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
    );
    const authorizationUrl = new URL(await this.oidc.authorizationEndpoint());
    authorizationUrl.search = new URLSearchParams({
      client_id: this.environment.OIDC_CLIENT_ID,
      code_challenge: pkceChallenge(codeVerifier),
      code_challenge_method: "S256",
      nonce,
      redirect_uri: this.environment.OIDC_REDIRECT_URI,
      response_type: "code",
      scope: "openid profile email",
      state,
    }).toString();
    return authorizationUrl.toString();
  }

  async completeLogin(
    code: string,
    state: string,
    request: Request,
    response: Response,
  ): Promise<string> {
    const browserState = readCookie(request, oidcStateCookie);
    if (!browserState || !constantTimeEqual(browserState, state))
      throw new UnauthorizedException("Authentication could not be completed");
    const transaction = await this.repository.consumeAuthTransaction(
      sha256(state),
    );
    if (!transaction || transaction.expiresAt <= new Date())
      throw new UnauthorizedException("Authentication could not be completed");
    const identity = await this.oidc.exchangeAndValidate({
      code,
      codeVerifier: transaction.codeVerifier,
      nonce: transaction.nonce,
    });
    const userId = await this.repository.synchronizeIdentity(identity);
    const sessionToken = randomToken();
    const csrfToken = randomToken();
    const expiresAt = new Date(
      Date.now() + this.environment.SESSION_TTL_SECONDS * 1000,
    );
    await this.repository.createSession({
      csrfTokenHash: sha256(csrfToken),
      expiresAt,
      tokenHash: sha256(sessionToken),
      userId,
    });
    const secure = this.environment.NODE_ENV === "production" ? "; Secure" : "";
    response.append(
      "Set-Cookie",
      `${sessionCookie}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${this.environment.SESSION_TTL_SECONDS}${secure}`,
    );
    response.append(
      "Set-Cookie",
      `${csrfCookie}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Strict; Max-Age=${this.environment.SESSION_TTL_SECONDS}${secure}`,
    );
    response.append(
      "Set-Cookie",
      `${oidcStateCookie}=; Path=/api/v1/auth/callback; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    );
    return transaction.returnTo;
  }

  async principal(
    request: Request,
    requireCsrf = false,
  ): Promise<AuthenticatedPrincipal> {
    const token = readCookie(request, sessionCookie);
    if (!token) throw new UnauthorizedException("Authentication required");
    const result = await this.repository.findPrincipal(sha256(token));
    if (result.kind === "INVALID")
      throw new UnauthorizedException("Authentication required");
    if (
      result.kind === "INACTIVE_USER" ||
      result.kind === "NO_ACTIVE_MEMBERSHIP"
    )
      throw new ForbiddenException("Access denied");
    if (requireCsrf) {
      const csrfToken = readCookie(request, csrfCookie);
      const csrfHeader = request.headers["x-csrf-token"];
      if (
        !csrfToken ||
        typeof csrfHeader !== "string" ||
        !constantTimeEqual(sha256(csrfToken), result.csrfTokenHash) ||
        !constantTimeEqual(csrfToken, csrfHeader)
      )
        throw new ForbiddenException("Access denied");
    }
    return result.principal;
  }

  async logout(request: Request, response: Response): Promise<void> {
    await this.principal(request, true);
    const token = readCookie(request, sessionCookie);
    if (token) await this.repository.revokeSession(sha256(token));
    const secure = this.environment.NODE_ENV === "production" ? "; Secure" : "";
    response.append(
      "Set-Cookie",
      `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    );
    response.append(
      "Set-Cookie",
      `${csrfCookie}=; Path=/; SameSite=Strict; Max-Age=0${secure}`,
    );
  }

  webUrl(path: string): string {
    return new URL(path, this.environment.WEB_BASE_URL).toString();
  }
}
````

## File: apps/api/src/identity/identity.types.ts
````typescript
export type OrganizationKind = "INTERNAL" | "SUPPLIER";

export interface PrincipalMembership {
  id: string;
  organization: {
    id: string;
    code: string;
    name: string;
    type: OrganizationKind;
  };
  permissions: ReadonlySet<string>;
  roles: readonly string[];
}

export interface AuthenticatedPrincipal {
  sessionId: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    locale: string;
  };
  memberships: readonly PrincipalMembership[];
}

export interface RequestContext {
  correlationId: string;
  requestId: string;
}
````

## File: apps/api/src/identity/me.controller.ts
````typescript
import { Controller, Get, Inject, Req } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "./identity.service.js";

@ApiTags("identity")
@ApiCookieAuth("session")
@Controller("api/v1")
export class MeController {
  constructor(
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("me")
  @ApiOperation({ summary: "Return the active user and authorization context" })
  @ApiOkResponse({
    description: "Active profile, memberships, roles, and permissions",
  })
  @ApiUnauthorizedResponse({ description: "No valid server-side session" })
  async me(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    const internal = principal.memberships.some(
      (membership) => membership.organization.type === "INTERNAL",
    );
    return {
      memberships: principal.memberships.map((membership) => ({
        id: membership.id,
        organization: membership.organization,
        permissions: [...membership.permissions].sort(),
        roles: membership.roles,
      })),
      shell: internal ? "INTERNAL" : "SUPPLIER",
      user: principal.user,
    };
  }
}
````

## File: apps/api/src/identity/oidc.service.ts
````typescript
import { createPublicKey, verify } from "node:crypto";
import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";

interface DiscoveryDocument {
  authorization_endpoint: string;
  issuer: string;
  jwks_uri: string;
  token_endpoint: string;
}

interface IdTokenClaims {
  aud: string | string[];
  email?: string;
  exp: number;
  iat: number;
  iss: string;
  locale?: string;
  name?: string;
  nonce: string;
  preferred_username?: string;
  sub: string;
}

function decodePart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

@Injectable()
export class OidcService {
  private discoveryPromise: Promise<DiscoveryDocument> | undefined;

  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
  ) {}

  async authorizationEndpoint(): Promise<string> {
    return (await this.discovery()).authorization_endpoint;
  }

  async exchangeAndValidate(input: {
    code: string;
    codeVerifier: string;
    nonce: string;
  }): Promise<{
    displayName: string;
    email: string;
    issuer: string;
    locale: string;
    subject: string;
  }> {
    try {
      const discovery = await this.discovery();
      const body = new URLSearchParams({
        client_id: this.environment.OIDC_CLIENT_ID,
        code: input.code,
        code_verifier: input.codeVerifier,
        grant_type: "authorization_code",
        redirect_uri: this.environment.OIDC_REDIRECT_URI,
      });
      const response = await fetch(discovery.token_endpoint, {
        body,
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error("token exchange rejected");
      const tokenResponse = (await response.json()) as { id_token?: unknown };
      if (typeof tokenResponse.id_token !== "string")
        throw new Error("missing ID token");
      const claims = await this.validateIdToken(
        tokenResponse.id_token,
        input.nonce,
      );
      const email = claims.email ?? claims.preferred_username;
      if (!email) throw new Error("missing identity email");
      return {
        displayName: claims.name ?? email,
        email: email.toLowerCase(),
        issuer: claims.iss,
        locale: claims.locale === "id" ? "id" : "en",
        subject: claims.sub,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new UnauthorizedException("Authentication could not be completed");
    }
  }

  private async discovery(): Promise<DiscoveryDocument> {
    this.discoveryPromise ??= (async () => {
      try {
        const response = await fetch(
          `${this.environment.OIDC_ISSUER}/.well-known/openid-configuration`,
          { signal: AbortSignal.timeout(5_000) },
        );
        if (!response.ok) throw new Error("discovery rejected");
        const document = (await response.json()) as Partial<DiscoveryDocument>;
        if (
          document.issuer !== this.environment.OIDC_ISSUER ||
          !document.authorization_endpoint ||
          !document.token_endpoint ||
          !document.jwks_uri
        )
          throw new Error("invalid discovery document");
        return document as DiscoveryDocument;
      } catch {
        this.discoveryPromise = undefined;
        throw new BadGatewayException("Identity provider is unavailable");
      }
    })();
    return this.discoveryPromise;
  }

  private async validateIdToken(
    token: string,
    expectedNonce: string,
  ): Promise<IdTokenClaims> {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("invalid token");
    const [encodedHeader, encodedPayload, encodedSignature] = parts as [
      string,
      string,
      string,
    ];
    const header = decodePart<{ alg?: string; kid?: string }>(encodedHeader);
    if (header.alg !== "RS256" || !header.kid)
      throw new Error("invalid signing algorithm");
    const discovery = await this.discovery();
    const jwksResponse = await fetch(discovery.jwks_uri, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!jwksResponse.ok) throw new Error("JWKS unavailable");
    const jwks = (await jwksResponse.json()) as {
      keys?: Array<JsonWebKey & { kid?: string }>;
    };
    const jwk = jwks.keys?.find((candidate) => candidate.kid === header.kid);
    if (!jwk) throw new Error("unknown signing key");
    const validSignature = verify(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      createPublicKey({ format: "jwk", key: jwk }),
      Buffer.from(encodedSignature, "base64url"),
    );
    if (!validSignature) throw new Error("invalid signature");
    const claims = decodePart<IdTokenClaims>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (
      claims.iss !== this.environment.OIDC_ISSUER ||
      !audiences.includes(this.environment.OIDC_CLIENT_ID) ||
      claims.exp <= now ||
      claims.iat > now + 60 ||
      claims.nonce !== expectedNonce ||
      !claims.sub
    )
      throw new Error("invalid claims");
    return claims;
  }
}
````

## File: apps/api/src/generate-openapi.ts
````typescript
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createApplication } from "./bootstrap.js";

const { app, openApiDocument } = await createApplication();
const outputDirectory = resolve(process.cwd(), "../../docs/generated");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, "openapi.json"),
  `${JSON.stringify(openApiDocument, null, 2)}\n`,
);
await app.close();
````

## File: apps/api/src/logger.ts
````typescript
import type { LoggerService } from "@nestjs/common";
import pino, { type Logger } from "pino";

const redactedPaths = [
  "authorization",
  "cookie",
  "*.authorization",
  "*.cookie",
  "*.password",
  "*.token",
  "*.secret",
  "*.accessKey",
  "*.storageKey",
];

export class JsonLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(service: string, environment: string, level: string) {
    this.logger = pino({
      base: { environment, service },
      level,
      redact: { paths: redactedPaths, censor: "[REDACTED]" },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  log(message: unknown, context?: string): void {
    this.logger.info({ context }, this.toMessage(message));
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.logger.error(
      { context, errorClassification: "unexpected_internal_error", trace },
      this.toMessage(message),
    );
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn({ context }, this.toMessage(message));
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug({ context }, this.toMessage(message));
  }

  verbose(message: unknown, context?: string): void {
    this.logger.trace({ context }, this.toMessage(message));
  }

  info(fields: Record<string, unknown>, message: string): void {
    this.logger.info(fields, message);
  }

  private toMessage(value: unknown): string {
    if (value instanceof Error) return value.message;
    return typeof value === "string" ? value : "Application event";
  }
}
````

## File: apps/api/src/main.ts
````typescript
import { createApplication } from "./bootstrap.js";

const { app, environment } = await createApplication();
await app.listen(environment.API_PORT, "0.0.0.0");
````

## File: apps/api/src/request-context.ts
````typescript
import type { Request } from "express";
import type { RequestContext } from "./identity/identity.types.js";

export function requestContext(request: Request): RequestContext {
  const locals = request.res?.locals as
    { correlationId?: unknown; requestId?: unknown } | undefined;
  return {
    correlationId:
      typeof locals?.correlationId === "string"
        ? locals.correlationId
        : "unknown",
    requestId:
      typeof locals?.requestId === "string" ? locals.requestId : "unknown",
  };
}
````

## File: apps/api/src/request-logging.ts
````typescript
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { JsonLogger } from "./logger.js";

const safeIdentifier = /^[A-Za-z0-9._:-]{1,128}$/;

function headerIdentifier(
  value: string | string[] | undefined,
): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && safeIdentifier.test(candidate) ? candidate : undefined;
}

export function requestLogging(logger: JsonLogger) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = performance.now();
    const requestId =
      headerIdentifier(request.headers["x-request-id"]) ?? randomUUID();
    const correlationId =
      headerIdentifier(request.headers["x-correlation-id"]) ?? requestId;

    response.removeHeader("X-Powered-By");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'",
    );
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Request-Id", requestId);
    response.locals.requestId = requestId;
    response.locals.correlationId = correlationId;

    response.once("finish", () => {
      logger.info(
        {
          correlationId,
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
          httpStatus: response.statusCode,
          method: request.method,
          requestId,
          route: request.path,
        },
        "HTTP request completed",
      );
    });

    next();
  };
}
````

## File: apps/api/src/safe-api-exception.filter.ts
````typescript
import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";

const errors: Record<number, { code: string; message: string }> = {
  [HttpStatus.BAD_REQUEST]: {
    code: "VALIDATION_FAILED",
    message: "The request is invalid",
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: "AUTHENTICATION_REQUIRED",
    message: "Authentication required",
  },
  [HttpStatus.FORBIDDEN]: { code: "ACCESS_DENIED", message: "Access denied" },
  [HttpStatus.NOT_FOUND]: {
    code: "RESOURCE_NOT_FOUND",
    message: "Resource not found",
  },
  [HttpStatus.CONFLICT]: {
    code: "CONCURRENT_MODIFICATION",
    message: "The resource changed; reload and try again",
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    code: "VALIDATION_FAILED",
    message: "The request is invalid",
  },
  [HttpStatus.BAD_GATEWAY]: {
    code: "IDENTITY_PROVIDER_UNAVAILABLE",
    message: "Identity provider is unavailable",
  },
};

@Catch()
export class SafeApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    if (!request.path.startsWith("/api/v1")) {
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      response
        .status(status)
        .json(
          exception instanceof HttpException
            ? exception.getResponse()
            : { message: "Internal server error" },
        );
      return;
    }
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const safe = errors[status] ?? {
      code: "INTERNAL_ERROR",
      message: "The request could not be completed",
    };
    const requestId =
      typeof response.locals.requestId === "string"
        ? response.locals.requestId
        : "unknown";
    response.status(status).json({ error: safe, requestId });
  }
}
````

## File: apps/api/src/tokens.ts
````typescript
export const SERVICE_ENVIRONMENT = Symbol("SERVICE_ENVIRONMENT");
````

## File: apps/api/tsconfig.build.json
````json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": false,
    "sourceMap": true
  }
}
````

## File: apps/api/vitest.authorization.config.ts
````typescript
import { config as loadEnvironment } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

loadEnvironment({
  path: resolve(import.meta.dirname, "../../.env"),
  quiet: true,
});

export default defineConfig({
  test: {
    include: [
      "src/**/*.authorization.test.ts",
      "src/**/*.authorization.integration.test.ts",
    ],
    testTimeout: 20_000,
  },
});
````

## File: apps/api/vitest.config.ts
````typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { exclude: ["**/*.integration.test.ts", "**/node_modules/**"] },
});
````

## File: apps/api/vitest.integration.config.ts
````typescript
import { config as loadEnvironment } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

loadEnvironment({
  path: resolve(import.meta.dirname, "../../.env"),
  quiet: true,
});

export default defineConfig({
  test: { include: ["src/**/*.integration.test.ts"], testTimeout: 20_000 },
});
````

## File: apps/web/app/access-denied/page.tsx
````typescript
export default function AccessDeniedPage() {
  return (
    <main className="centered-page">
      <section className="login-card">
        <p className="eyebrow">Secure boundary</p>
        <h1>Access denied</h1>
        <p>Your active identity does not have permission for this area.</p>
        <a className="button button--secondary" href="/">
          Return to your application
        </a>
      </section>
    </main>
  );
}
````

## File: apps/web/app/internal/administration/memberships/page.tsx
````typescript
import { createMembership, updateMembershipStatus } from "../actions";
import { memberships, organizations, users } from "../data";

export default async function MembershipsPage() {
  const [organizationItems, userItems] = await Promise.all([
    organizations(),
    users(),
  ]);
  const membershipGroups = await Promise.all(
    organizationItems.map(async (organization) => ({
      organization,
      items: await memberships(organization.id),
    })),
  );
  return (
    <main className="workspace">
      <p className="eyebrow">Administration</p>
      <h1>Memberships</h1>
      <section className="panel">
        <h2>Create membership</h2>
        <form action={createMembership} className="form-grid">
          <label>
            Organization
            <select name="organizationId">
              {organizationItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            User
            <select name="userId">
              {userItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.email} ({item.status})
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Create membership</button>
        </form>
      </section>
      {membershipGroups.map(({ organization, items }) => (
        <section className="panel" key={organization.id}>
          <h2>{organization.name}</h2>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Roles</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.user.email}</td>
                  <td>{item.status}</td>
                  <td>
                    {item.roles.map((role) => role.roleCode).join(", ") ||
                      "No roles"}
                  </td>
                  <td>
                    <form action={updateMembershipStatus}>
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organization.id}
                      />
                      <input
                        type="hidden"
                        name="membershipId"
                        value={item.id}
                      />
                      <input
                        type="hidden"
                        name="expectedVersion"
                        value={item.version}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value={item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                      />
                      <button type="submit">
                        {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
````

## File: apps/web/app/internal/administration/organizations/page.tsx
````typescript
import { createOrganization } from "../actions";
import { organizations } from "../data";

export default async function OrganizationsPage() {
  const items = await organizations();
  return (
    <main className="workspace">
      <p className="eyebrow">Administration</p>
      <h1>Organizations</h1>
      <section className="panel">
        <h2>Create organization</h2>
        <form action={createOrganization} className="form-grid">
          <label>
            Code
            <input
              name="code"
              required
              maxLength={50}
              pattern="[A-Za-z0-9-]+"
            />
          </label>
          <label>
            Name
            <input name="name" required maxLength={200} />
          </label>
          <label>
            Type
            <select name="type">
              <option value="INTERNAL">Internal</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </label>
          <button type="submit">Create organization</button>
        </form>
      </section>
      <section className="panel">
        <h2>Organization directory</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
````

## File: apps/web/app/internal/administration/roles/page.tsx
````typescript
import { assignRoles } from "../actions";
import { memberships, organizations, roles } from "../data";

export default async function RoleAssignmentsPage() {
  const [organizationItems, roleItems] = await Promise.all([
    organizations(),
    roles(),
  ]);
  const groups = await Promise.all(
    organizationItems.map(async (organization) => ({
      organization,
      items: await memberships(organization.id),
    })),
  );
  return (
    <main className="workspace">
      <p className="eyebrow">Administration</p>
      <h1>Role assignments</h1>
      {groups.flatMap(({ organization, items }) =>
        items.map((membership) => (
          <section className="panel" key={membership.id}>
            <h2>{membership.user.displayName}</h2>
            <p>
              {organization.name} · {membership.user.email}
            </p>
            <form action={assignRoles} className="role-form">
              <input
                type="hidden"
                name="organizationId"
                value={organization.id}
              />
              <input type="hidden" name="membershipId" value={membership.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={membership.version}
              />
              <fieldset>
                <legend>Seeded roles</legend>
                {roleItems
                  .filter(
                    (role) =>
                      role.scope === "ANY" || role.scope === organization.type,
                  )
                  .map((role) => (
                    <label className="checkbox" key={role.code}>
                      <input
                        type="checkbox"
                        name="roleCodes"
                        value={role.code}
                        defaultChecked={membership.roles.some(
                          (assigned) => assigned.roleCode === role.code,
                        )}
                      />
                      {role.name}
                    </label>
                  ))}
              </fieldset>
              <button type="submit">Save role assignments</button>
            </form>
          </section>
        )),
      )}
    </main>
  );
}
````

## File: apps/web/app/internal/administration/actions.ts
````typescript
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { apiRequest } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function write(
  path: string,
  method: "PATCH" | "POST" | "PUT",
  body: unknown,
): Promise<void> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const response = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-csrf-token": csrf ?? "" },
    method,
  });
  if (!response.ok)
    throw new Error("The authorized change could not be completed");
}

export async function createOrganization(formData: FormData): Promise<void> {
  await write("/api/v1/administration/organizations", "POST", {
    code: field(formData, "code").trim().toUpperCase(),
    name: field(formData, "name").trim(),
    type: field(formData, "type"),
  });
  revalidatePath("/internal/administration/organizations");
}

export async function createMembership(formData: FormData): Promise<void> {
  const organizationId = field(formData, "organizationId");
  await write(
    `/api/v1/administration/organizations/${organizationId}/memberships`,
    "POST",
    {
      userId: field(formData, "userId"),
    },
  );
  revalidatePath("/internal/administration/memberships");
}

export async function assignRoles(formData: FormData): Promise<void> {
  const organizationId = field(formData, "organizationId");
  const membershipId = field(formData, "membershipId");
  await write(
    `/api/v1/administration/organizations/${organizationId}/memberships/${membershipId}/roles`,
    "PUT",
    {
      expectedVersion: Number(field(formData, "expectedVersion")),
      roleCodes: formData
        .getAll("roleCodes")
        .filter((value): value is string => typeof value === "string"),
    },
  );
  revalidatePath("/internal/administration/roles");
}

export async function updateMembershipStatus(
  formData: FormData,
): Promise<void> {
  const organizationId = field(formData, "organizationId");
  const membershipId = field(formData, "membershipId");
  await write(
    `/api/v1/administration/organizations/${organizationId}/memberships/${membershipId}/status`,
    "PATCH",
    {
      expectedVersion: Number(field(formData, "expectedVersion")),
      status: field(formData, "status"),
    },
  );
  revalidatePath("/internal/administration/memberships");
}
````

## File: apps/web/app/internal/administration/data.ts
````typescript
import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export interface Organization {
  active: boolean;
  code: string;
  id: string;
  name: string;
  type: "INTERNAL" | "SUPPLIER";
}

export interface Membership {
  id: string;
  organizationId: string;
  roles: Array<{ roleCode: string }>;
  status: "ACTIVE" | "INACTIVE";
  user: {
    displayName: string;
    email: string;
    id: string;
    status: "ACTIVE" | "INACTIVE";
  };
  version: number;
}

async function data<T>(path: string): Promise<T[]> {
  const response = await apiRequest(path);
  if (response.status === 403) redirect("/access-denied");
  if (!response.ok) throw new Error("Administration data is unavailable");
  return ((await response.json()) as { data: T[] }).data;
}

export const organizations = () =>
  data<Organization>("/api/v1/administration/organizations");
export const roles = () =>
  data<{ code: string; name: string; scope: string }>(
    "/api/v1/administration/roles",
  );
export const users = () =>
  data<{ displayName: string; email: string; id: string; status: string }>(
    "/api/v1/administration/users",
  );
export const memberships = (organizationId: string) =>
  data<Membership>(
    `/api/v1/administration/organizations/${organizationId}/memberships`,
  );
````

## File: apps/web/app/internal/administration/page.tsx
````typescript
export default function AdministrationHomePage() {
  return (
    <main className="workspace">
      <p className="eyebrow">Internal administration</p>
      <h1>Administration</h1>
      <p className="lede">
        Manage organization identity scope and role grants. Every membership and
        role change is audited.
      </p>
      <div className="card-grid">
        <a className="nav-card" href="/internal/administration/organizations">
          <h2>Organizations</h2>
          <p>Review and create internal or supplier organizations.</p>
        </a>
        <a className="nav-card" href="/internal/administration/memberships">
          <h2>Memberships</h2>
          <p>Attach synchronized identities to an organization.</p>
        </a>
        <a className="nav-card" href="/internal/administration/roles">
          <h2>Role assignments</h2>
          <p>Grant only seeded roles valid for the organization type.</p>
        </a>
      </div>
    </main>
  );
}
````

## File: apps/web/app/internal/layout.tsx
````typescript
import type { ReactNode } from "react";
import { requireMe } from "../lib/api";

export default async function InternalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const me = await requireMe("INTERNAL");
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/internal">
          MECO Flow
        </a>
        <p className="shell-label">Internal application</p>
        <nav aria-label="Internal navigation">
          <a href="/internal">Overview</a>
          <a href="/internal/projects">Projects</a>
          {me.memberships.some((membership) =>
            membership.permissions.includes("item.read"),
          ) ? (
            <a href="/internal/items">Items</a>
          ) : null}
          <a href="/internal/administration">Administration</a>
        </nav>
      </aside>
      <div className="shell-content">
        <header className="topbar">
          <div>
            <strong>{me.user.displayName}</strong>
            <span>{me.user.email}</span>
          </div>
          <span className="badge">Internal</span>
        </header>
        {children}
      </div>
    </div>
  );
}
````

## File: apps/web/app/internal/page.tsx
````typescript
import { requireMe } from "../lib/api";

export default async function InternalHomePage() {
  const me = await requireMe("INTERNAL");
  return (
    <main className="workspace">
      <p className="eyebrow">Phase 3A</p>
      <h1>Internal overview</h1>
      <p className="lede">
        Project delivery and the governed internal item master are active.
      </p>
      <section className="panel">
        <h2>Active organization</h2>
        <p>{me.memberships[0]?.organization.name}</p>
      </section>
      <section className="panel">
        <h2>Project workspace</h2>
        <p>
          <a href="/internal/projects">Open the authorized project directory</a>
        </p>
      </section>
      {me.memberships.some((membership) =>
        membership.permissions.includes("item.read"),
      ) ? (
        <section className="panel">
          <h2>Item master</h2>
          <p>
            <a href="/internal/items">
              Search items, specifications, and units of measure
            </a>
          </p>
        </section>
      ) : null}
    </main>
  );
}
````

## File: apps/web/app/lib/api.ts
````typescript
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface MeResponse {
  memberships: Array<{
    id: string;
    organization: {
      code: string;
      id: string;
      name: string;
      type: "INTERNAL" | "SUPPLIER";
    };
    permissions: string[];
    roles: string[];
  }>;
  shell: "INTERNAL" | "SUPPLIER";
  user: { displayName: string; email: string; id: string; locale: string };
}

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function apiRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookieHeader = (await cookies()).toString();
  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: { cookie: cookieHeader, ...init?.headers },
  });
}

export async function requireMe(
  shell?: "INTERNAL" | "SUPPLIER",
): Promise<MeResponse> {
  const response = await apiRequest("/api/v1/me");
  if (response.status === 401) redirect("/login");
  if (!response.ok) redirect("/access-denied");
  const me = (await response.json()) as MeResponse;
  if (shell && me.shell !== shell) redirect("/access-denied");
  return me;
}
````

## File: apps/web/app/login/page.tsx
````typescript
import { apiBaseUrl } from "../lib/api";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error;
  return (
    <main className="centered-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">PT Meco Inoxprima</p>
        <h1 id="login-title">Sign in to MECO Flow</h1>
        <p>
          Use your managed organization identity. Passwords are never stored by
          MECO Flow.
        </p>
        {error ? (
          <p className="error" role="alert">
            Authentication could not be completed. Please try again.
          </p>
        ) : null}
        <a className="button" href={`${apiBaseUrl}/api/v1/auth/login`}>
          Continue to identity provider
        </a>
      </section>
    </main>
  );
}
````

## File: apps/web/app/supplier/layout.tsx
````typescript
import type { ReactNode } from "react";
import { requireMe } from "../lib/api";

export default async function SupplierLayout({
  children,
}: {
  children: ReactNode;
}) {
  const me = await requireMe("SUPPLIER");
  const organization = me.memberships[0]?.organization;
  return (
    <div className="app-shell app-shell--supplier">
      <aside className="sidebar sidebar--supplier">
        <a className="brand" href="/supplier">
          MECO Flow
        </a>
        <p className="shell-label">Supplier portal</p>
        <nav aria-label="Supplier navigation">
          <a href="/supplier">Overview</a>
        </nav>
      </aside>
      <div className="shell-content">
        <header className="topbar">
          <div>
            <strong>{me.user.displayName}</strong>
            <span>{organization?.name}</span>
          </div>
          <span className="badge badge--supplier">Supplier</span>
        </header>
        {children}
      </div>
    </div>
  );
}
````

## File: apps/web/app/supplier/page.tsx
````typescript
export default function SupplierHomePage() {
  return (
    <main className="workspace">
      <p className="eyebrow">Supplier portal</p>
      <h1>Supplier overview</h1>
      <p className="lede">
        Your organization scope is active. Collaboration workflows arrive in
        later approved phases.
      </p>
      <section className="panel">
        <h2>Secure collaboration</h2>
        <p>
          Only records explicitly shared with your supplier organization will
          appear here.
        </p>
      </section>
    </main>
  );
}
````

## File: apps/web/app/api-health-status.tsx
````typescript
"use client";

import { useEffect, useState } from "react";
import { healthResponseSchema } from "@mecoflow/contracts";
import { ServiceStatus } from "@mecoflow/ui";

type Status = "checking" | "available" | "unavailable";

export function ApiHealthStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const controller = new AbortController();
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    void fetch(`${baseUrl}/health/live`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("API health response was not successful");
        healthResponseSchema.parse(await response.json());
        setStatus("available");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  return <ServiceStatus label="API health" state={status} />;
}
````

## File: apps/web/app/layout.tsx
````typescript
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./styles.css";

export const metadata: Metadata = {
  description: "Project material readiness for PT Meco Inoxprima",
  title: "MECO Flow",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
````

## File: apps/web/postcss.config.mjs
````javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
````

## File: apps/web/tsconfig.json
````json
{
  "extends": "@mecoflow/typescript-config/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
````

## File: apps/worker/src/heartbeat.test.ts
````typescript
import { describe, expect, it } from "vitest";
import { heartbeatPayload } from "./heartbeat.js";

describe("heartbeatPayload", () => {
  it("is deterministic for a supplied clock", () => {
    expect(
      heartbeatPayload("0.1.0", new Date("2026-07-15T00:00:00.000Z")),
    ).toBe('{"timestamp":"2026-07-15T00:00:00.000Z","version":"0.1.0"}');
  });
});
````

## File: apps/worker/src/heartbeat.ts
````typescript
export const WORKER_HEARTBEAT_KEY = "mecoflow:worker:heartbeat";
export const WORKER_HEARTBEAT_TTL_SECONDS = 30;

export function heartbeatPayload(version: string, now = new Date()): string {
  return JSON.stringify({ timestamp: now.toISOString(), version });
}
````

## File: apps/worker/tsconfig.build.json
````json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "sourceMap": true }
}
````

## File: apps/worker/tsconfig.json
````json
{
  "extends": "@mecoflow/typescript-config/library.json",
  "compilerOptions": {
    "declaration": false,
    "declarationMap": false,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
````

## File: docs/adr/ADR-0001-modular-monolith.md
````markdown
# ADR-0001: Modular monolith

## Status

Accepted — 2026-07-15

## Context

The platform spans related operational workflows that need strong transactions and consistent policy enforcement.

## Decision

Build cohesive business modules in one deployable API codebase with a separate web process and worker, enforcing intentional module interfaces.

## Alternatives considered

Microservices, event sourcing, and a single unstructured application.

## Consequences

Deployment and transactions stay simple; module boundaries require ongoing tests and review. Modules may be extracted only through a later ADR.

## Security implications

Central policy enforcement reduces gaps; internal module access still cannot bypass authorization.

## Operational implications

Scale API and worker processes independently while deploying one coordinated application version.
````

## File: docs/adr/ADR-0002-pnpm-turborepo.md
````markdown
# ADR-0002: pnpm and Turborepo

## Status

Accepted — 2026-07-15

## Context

Multiple TypeScript applications and shared packages need reproducible dependency and task management.

## Decision

Use a pnpm workspace with exact manifests/lockfile and Turborepo task orchestration.

## Alternatives considered

npm workspaces, Yarn, and independent repositories.

## Consequences

Fast shared installs and consistent task graphs; contributors must use the pinned pnpm and repository scripts.

## Security implications

Frozen lockfiles, controlled build scripts and dependency review limit supply-chain drift.

## Operational implications

CI and local development run the same named tasks; remote cache is optional and must not receive secrets.
````

## File: docs/adr/ADR-0003-nextjs-nestjs.md
````markdown
# ADR-0003: Next.js frontend and NestJS backend

## Status

Accepted — 2026-07-15

## Context

The product needs responsive server-capable UI and a structured REST application layer.

## Decision

Use Next.js App Router for web and NestJS for API; use a small Node worker sharing validated packages.

## Alternatives considered

SPA-only React, monolithic Next.js route handlers, and other backend frameworks.

## Consequences

Clear deployable boundaries and framework conventions at the cost of two runtime processes.

## Security implications

Business authority stays in NestJS; Next.js cannot become an authorization authority.

## Operational implications

Web and API have separate health, scaling and environment settings.
````

## File: docs/adr/ADR-0004-postgresql-prisma.md
````markdown
# ADR-0004: PostgreSQL and Prisma

## Status

Accepted — 2026-07-15

## Context

Operational quantities, workflow history and concurrency require relational integrity and transactions.

## Decision

Use PostgreSQL as source of truth and Prisma behind repositories. All schema changes are immutable committed migrations; decimals, constraints, transactions, UUIDs and versions protect integrity.

## Alternatives considered

Document databases, raw SQL as the primary access layer, and schema push without migrations.

## Consequences

Strong consistency and typed access; advanced locking may need carefully reviewed parameterized SQL/repository extensions.

## Security implications

Central repositories and parameterized access reduce injection and scope mistakes; database credentials stay server-side.

## Operational implications

Deployments run validated migrations, backups and restore checks before application rollout.
````

## File: docs/adr/ADR-0005-keycloak-oidc.md
````markdown
# ADR-0005: Keycloak and OIDC

## Status

Accepted — 2026-07-15

## Context

The platform requires enterprise identity without storing local passwords.

## Decision

Use Keycloak OIDC Authorization Code with PKCE and secure server-managed sessions. Keycloak is identity source; application profiles/memberships remain in PostgreSQL.

## Alternatives considered

Local passwords, social login, and browser-stored bearer tokens.

## Consequences

Central identity and MFA readiness; Keycloak availability/configuration becomes operationally critical.

## Security implications

No tokens in localStorage, production default admins or committed secrets; cookies require Secure/SameSite/CSRF controls.

## Operational implications

Version-controlled local realm seed contains only local credentials; production realms and secrets are managed separately.
````

## File: docs/adr/ADR-0006-redis-outbox.md
````markdown
# ADR-0006: Redis queue and transactional outbox

## Status

Accepted — 2026-07-15

## Context

Notifications, imports and projections need asynchronous work without publishing uncommitted state.

## Decision

Use PostgreSQL transactional outbox records and Redis-backed bounded worker jobs. Workers re-read authoritative state and use deterministic names/idempotency keys, backoff, timeouts and dead-letter states.

## Alternatives considered

Publishing directly inside requests, database polling without queue coordination, and external event streaming.

## Consequences

Reliable commit coupling and replay at the cost of outbox/worker operations and eventual delivery.

## Security implications

Queue payloads contain identifiers/minimal metadata, never secrets, tokens, files or large domain objects.

## Operational implications

Monitor queue depth, heartbeat, retries and dead letters; Redis loss does not replace PostgreSQL state.
````

## File: docs/adr/ADR-0007-s3-storage.md
````markdown
# ADR-0007: S3-compatible object storage

## Status

Accepted — 2026-07-15

## Context

Operational documents must be private, scalable and separate from relational metadata.

## Decision

Use MinIO locally and an S3-compatible abstraction in deployment, private buckets, opaque keys, metadata/checksum in PostgreSQL and authorized short-lived URLs.

## Alternatives considered

Database blobs, public buckets and local application filesystems.

## Consequences

Portable object storage and independent backup; metadata/object consistency and scanning workflows require explicit handling.

## Security implications

Validate type/size/name, quarantine until permitted, never expose keys/credentials, and audit upload/download.

## Operational implications

Back up objects with metadata and monitor capacity, availability, checksums and lifecycle policies.
````

## File: docs/adr/ADR-0008-rest-openapi.md
````markdown
# ADR-0008: REST and OpenAPI

## Status

Accepted — 2026-07-15

## Context

Web, integrations and testing require stable, discoverable contracts.

## Decision

Expose versioned JSON REST below `/api/v1`, explicit command endpoints for transitions, shared schemas and generated OpenAPI checked in CI.

## Alternatives considered

GraphQL, RPC-only contracts and undocumented controllers.

## Consequences

Predictable HTTP semantics and tooling; representation changes require version discipline.

## Security implications

Documented validation/error contracts aid review; OpenAPI must not expose internal-only details or secrets.

## Operational implications

Generate and compare the contract in CI; use request/correlation IDs for support.
````

## File: docs/adr/ADR-0009-authorization-policies.md
````markdown
# ADR-0009: Authorization policy architecture

## Status

Accepted — 2026-07-15

## Context

Role checks alone cannot enforce supplier, organization, project, object, workflow and field scope.

## Decision

Compose authentication, active-profile/membership, permission, organization, project, object, state and field policies in server-side guards/services. Deny by default and make policies independently testable.

## Alternatives considered

UI route hiding, controller role strings and database-wide access per employee.

## Consequences

Explicit secure decisions and stronger tests; every endpoint requires policy design and scoped repository queries.

## Security implications

Inaccessible/not-found equivalence and Supplier A/B negative tests are mandatory.

## Operational implications

Permission and policy changes are reviewed, seeded, migrated where needed and audited.
````

## File: docs/adr/ADR-0010-readiness-calculation.md
````markdown
# ADR-0010: Material-readiness calculation

## Status

Accepted — 2026-07-15

## Context

Management needs an explainable forecast without aggregate scores masking critical failures.

## Decision

Implement a pure, deterministic, versioned calculation over released active requirements using documented stage scores, criticality weights and overriding readiness gates; persist explanations and model version in snapshots.

## Alternatives considered

Opaque single KPI, manually set status and non-versioned database formulas.

## Consequences

Reproducible results and clear blockers; rule changes need tests, documentation, version increment and snapshot recalculation planning.

## Security implications

Readiness inputs/results inherit project and supplier field-level authorization.

## Operational implications

Worker recalculation is idempotent and observable; old snapshot versions remain interpretable.
````

## File: docs/adr/ADR-0011-audit-events.md
````markdown
# ADR-0011: Audit-event strategy

## Status

Accepted — 2026-07-15

## Context

Operational and security-relevant changes require immutable traceability tied to committed business state.

## Decision

Append immutable audit events in the same database transaction as business changes, including actor/scope/action/entity/request/correlation/outcome and redacted changes.

## Alternatives considered

Application logs only, mutable history tables and asynchronous best-effort audit.

## Consequences

Reliable evidence and investigation support; storage and redaction schemas require discipline.

## Security implications

Never record secrets, tokens, full files or unnecessary personal data; normal application code cannot update/delete events.

## Operational implications

Retention, export access and backup are controlled; audit write failure fails the related transaction.
````

## File: docs/adr/ADR-0012-container-deployment.md
````markdown
# ADR-0012: Deployment with containers

## Status

Accepted — 2026-07-15

## Context

Development and deployment need repeatable infrastructure without Kubernetes complexity.

## Decision

Use Docker Compose locally and container images for web/API/worker, with externalized secrets, non-root runtime users, health checks and pinned base-image majors.

## Alternatives considered

Host-level manual installs, Kubernetes and serverless decomposition.

## Consequences

Reproducible environments and simple operations; Compose production sizing/failover is limited and must be documented.

## Security implications

Keep administrative ports private, images minimal/non-root and credentials injected rather than baked.

## Operational implications

Staging-like verification builds images, runs migrations separately and uses durable volumes plus backups.
````

## File: docs/adr/ADR-0013-localization.md
````markdown
# ADR-0013: Localization strategy

## Status

Accepted — 2026-07-15

## Context

English and Indonesian users need consistent terminology and locale-aware presentation.

## Decision

Keep machine enums/error codes stable and English-readable; translate at presentation boundaries with `en` and `id` message catalogs and locale/timezone/number formatting.

## Alternatives considered

Hard-coded UI strings, translated database enums and separate applications per locale.

## Consequences

Translation-ready components and consistent APIs; catalogs require completeness checks and domain glossary ownership.

## Security implications

Authorization/error classification cannot depend on translated labels; localized errors remain safe and non-revealing.

## Operational implications

Default display timezone is Asia/Jakarta and currency IDR, both configurable without changing stored UTC values.
````

## File: docs/adr/ADR-0014-bom-import.md
````markdown
# ADR-0014: BOM import strategy

## Status

Accepted — 2026-07-15

## Context

BOM spreadsheets are untrusted, potentially large, ambiguous and operationally critical.

## Decision

Store uploads privately, parse `.xlsx`/`.csv` asynchronously without executing formulas/macros, produce row-level dry-run results, require confirmation, then create a draft revision transactionally with audit/outbox records.

## Alternatives considered

Synchronous request parsing, direct overwrite of BOMs and silent best-effort row import.

## Consequences

Safe reviewable imports and full error visibility; workflow is multi-step and needs job/status UX.

## Security implications

Validate MIME/extension/size/checksum, quarantine files, reject ZIP/executables and prevent spreadsheet formula injection in exports.

## Operational implications

Jobs use bounded resources, idempotency, retry/dead-letter behavior and cleanup for expired temporary uploads.
````

## File: docs/API_CONVENTIONS.md
````markdown
# API conventions

Business APIs use REST/JSON below `/api/v1`. Operational probes remain `/health/live` and `/health/ready`; generated OpenAPI is served below `/api/docs` in non-production environments and emitted to an artifact in CI.

Use ISO 8601 UTC timestamps, explicit pagination/filtering/sorting, stable response contracts, validated UUIDs/enums/numbers/dates, bounded page sizes, and domain-specific error codes. List responses contain `data`, `pagination`, and `meta.requestId`. Errors contain `error.code`, a safe message, optional field errors, and `requestId`; stack traces and database details never cross the boundary.

Accept or generate `X-Request-Id` and `X-Correlation-Id`, validate them as bounded safe identifiers, return `X-Request-Id`, and include both in structured logs. Sensitive creation/posting commands use idempotency keys. Editable aggregate commands include expected versions and return `CONCURRENT_MODIFICATION` on conflict.

Workflow endpoints are commands such as `POST /boms/{id}/release`; generic arbitrary-status patches are prohibited. Any contract change updates shared schemas, OpenAPI, tests, and documentation.

Phase 2 project routes follow these conventions, including `POST /projects/{id}/transitions` and versioned detail/member/milestone/work-package edits. The complete Phase 2 route and policy summary is in `PROJECTS_API.md`; generated request schemas and paths are in `generated/openapi.json`.

Phase 3A item-master routes use the same conventions. Item categories, units of measure, specification-attribute definitions, and items use uppercase normalized codes and expected versions on edits. Items have an explicit `POST /items/{id}/deactivate` command with a reason; there is no item-delete route. `GET /items` provides bounded filtering, sorting, search, and pagination, while `GET /items/export.csv` applies the same filters without pagination, enforces a 10,000-row ceiling, requires `item.export`, and produces a formula-safe audited CSV. The complete contract and policy summary is in `ITEM_MASTER_API.md`.
````

## File: docs/ARCHITECTURE.md
````markdown
# Architecture

## System shape

MECO Flow is a TypeScript modular monolith in a pnpm/Turborepo workspace. Deployable processes share contracts and infrastructure but remain independently startable:

```text
Browser -> Next.js web -> NestJS REST API -> application services -> policies/domain services -> repositories -> Prisma -> PostgreSQL
                                      |                                                    |
                                      +-> private S3-compatible storage                    +-> transactional outbox
                                                                                                      |
                                                                                               Redis-backed worker
```

`apps/web` is the App Router frontend, `apps/api` owns REST/OpenAPI and synchronous application behavior, and `apps/worker` owns bounded asynchronous work. `packages/contracts` contains transport-neutral schemas, `packages/database` owns Prisma, `packages/config` validates configuration, `packages/ui` contains local shared UI, and `packages/test-utils` contains deterministic fixtures.

## Boundaries

Controllers never access Prisma. The dependency direction is controller → application service → domain service/policy → repository → Prisma. Modules expose intentional public interfaces and may not import private implementation details from another module. Shared packages remain free of deployable-specific state.

PostgreSQL is the source of truth. Redis is coordination/queue infrastructure, not authoritative storage. MinIO supplies local private object storage. Keycloak is the identity source. Mailpit captures local mail. Asynchronous domain events use a transactional outbox once operational modules begin.

## Runtime foundations

- Strict TypeScript and startup environment validation.
- JSON request logs with request/correlation identifiers and secret redaction.
- `/health/live` reports process liveness; `/health/ready` checks PostgreSQL, Redis, and object storage without exposing credentials or detailed topology.
- REST resources live below `/api/v1`; OpenAPI is generated from the API and checked in CI.
- UTC crosses API and persistence boundaries; presentation uses configured locale and timezone.

## Security boundaries

Browser input, HTTP payloads, identity claims, environment values, files, spreadsheets, queue payloads, database JSON, and external responses are untrusted. Authentication uses Keycloak OIDC Authorization Code with PKCE and secure server-managed sessions in Phase 1. Authorization is permission and policy based, organization and project scoped, deny-by-default, and independently testable.

## Deployment

Local development uses Docker Compose for PostgreSQL, Redis, MinIO, Keycloak, and Mailpit while applications run through pnpm. Container definitions provide a staging-like path. Kubernetes and microservices are explicitly excluded. See `DEPLOYMENT.md` and accepted ADRs.
````

## File: docs/BACKUP_RESTORE.md
````markdown
# Backup and restore

The planned policy is configurable daily PostgreSQL and object-storage backups, 30 daily restore points, longer monthly retention, encrypted off-host copies, Keycloak realm/configuration backup without exposed secrets, and quarterly restore drills. Owners and recovery objectives require business approval.

A valid recovery run restores PostgreSQL into an isolated instance, restores object objects and metadata consistently, imports Keycloak configuration with replacement secrets, runs migrations, verifies checksums and application readiness, and records evidence. A backup is never called successful solely because an archive was produced. Phase 0 documents the procedure boundary; production scripts and a witnessed rehearsal belong to Phase 9.
````

## File: docs/CHANGE_MANAGEMENT.md
````markdown
# Change management

Changes use focused conventional commits and reviewed pull requests. Each change identifies requirement, owner, scope, migration/rollback, authorization, audit, operational and security implications; updates tests and documentation; and records verification evidence. Dependencies require necessity, maintenance and security review plus lockfile update. Architecture changes require an accepted ADR.

Workflow, permission, readiness and data-model changes require product/security owners as appropriate. Applied migrations are immutable. Releases follow semantic versioning, changelog updates, staged verification and explicit rollback criteria. Emergency changes still receive retrospective review and documentation.
````

## File: docs/DATA_IMPORT.md
````markdown
# Data import

BOM imports will accept `.xlsx` and `.csv` through private, validated uploads. The worker calculates checksum, normalizes data, validates required columns/types/reference values, detects duplicates and ambiguous items, and produces row/field error or warning codes with human-readable explanations. A dry run and explicit user confirmation precede transactional draft-BOM creation and audit/outbox events.

Formulas and macros are never executed, invalid rows are never silently discarded, and ambiguous item matches are never automatically merged. Exports sanitize cells beginning with `=`, `+`, `-`, or `@`. Phase 0 establishes worker and object-storage boundaries only; BOM import and revision implementation is Phase 3B work and is not part of Phase 3A item master.
````

## File: docs/OPERATIONS_RUNBOOK.md
````markdown
# Operations runbook

## First response

Check process liveness, readiness, structured logs by request/correlation ID, PostgreSQL, Redis, object storage, worker heartbeat, queue depth and failed jobs. Do not expose dependency configuration through public probes or paste secrets into incidents.

## Common local recovery

- A failed readiness response: inspect the named dependency's container health and safe logs, then retry after recovery.
- Migration failure: stop application rollout, preserve data, inspect the failed migration and restore/test in an isolated environment; never edit an applied migration.
- Repeated job failure: stop retry amplification, retain the dead-letter record and idempotency key, fix the cause, then replay through a controlled procedure.
- Suspected credential exposure: revoke/rotate immediately, preserve audit evidence and follow the security incident channel.

Phase 0 exposes foundations only. Production alert thresholds, on-call ownership, dashboards and recovery rehearsals are Phase 9 deliverables.
````

## File: docs/PILOT_PLAN.md
````markdown
# Pilot plan

The pilot will use fictional/de-identified preparation data, named process owners, trained internal and supplier participants, a documented support route, staged data validation, role/access review, workflow acceptance, recovery rehearsal, and rollback criteria. Candidate measures include critical readiness before fabrication, blocker counts, acknowledgement latency, commitment variance, OTIF, specification conformity, certificate completeness, inspection/NCR lead time, production-start risk and delivery timeliness.

No baseline or improvement value is assumed. A production pilot requires Phase 9 security, authorization, backup/restore, observability, deployment and data-import sign-off. Phase 0 does not authorize a pilot.
````

## File: docs/PRODUCT_REQUIREMENTS.md
````markdown
# Product requirements

## Purpose

MECO Flow is PT Meco Inoxprima's operational project-material-readiness and supplier-collaboration platform. Its primary MVP question is whether every critical material, with the correct specification and required documentation, will be available before fabrication begins.

## Users and outcomes

Internal users include management, project management, engineering, PPIC, purchasing, warehouse, QA/QC, production, finance-readonly, auditors, and administrators. Supplier users collaborate only within their organization. A future customer viewer role is reserved but has no MVP screens.

The MVP covers projects and milestones, work packages, item master, revision-controlled BOMs, requisitions and purchase orders, supplier commitments, shipments, receipts, inspection, documents, NCRs, inventory lots, allocations, deterministic readiness, notifications, reports, supplier scorecards, localization readiness, and immutable audit history.

## Foundational requirements

- PostgreSQL is authoritative; quantities and money use decimal types and timestamps use UTC.
- Business workflow transitions, readiness, quantity integrity, authorization, and field filtering are server decisions.
- Supplier access is organization scoped and must not reveal inaccessible records.
- Files use private S3-compatible storage with opaque keys and validated metadata.
- Business changes that trigger asynchronous work atomically write audit and outbox records.
- Readiness is deterministic, explainable, versioned, and never hides critical blockers behind a score.
- English and Indonesian are the initial locales; default timezone is `Asia/Jakarta`, currency is `IDR`, and units are metric.

## Phase 0 scope

Phase 0 delivers only repository and architecture foundations: monorepo tooling, web/API/worker skeletons, shared packages, local infrastructure, environment validation, health and logging, Prisma migration/seed framework, tests, CI, and documentation. It must not implement identity synchronization, organizations, roles, permissions, audit persistence, or operational business modules.

## MVP exclusions

The MVP excludes accounting, valuation, HR/payroll, native mobile apps, customer portal, IoT, AI, CAD authoring, detailed production scheduling, maintenance, legally binding signatures, banking, full WMS, supplier payments, microservices, Kubernetes, event sourcing, blockchain, GraphQL, public registration, and social login.

## Phase sequence

1. Identity, organizations, authorization, and audit foundation.
2. Projects, milestones, and work packages.
3. Item master and BOM.
4. Procurement and supplier commitments.
5. Shipments, receiving, and documents.
6. Quality, NCR, and allocation.
7. Readiness and dashboards.
8. Notifications, reporting, and scorecards.
9. Hardening and pilot release.

Do not begin a later phase without explicit instruction.
````

## File: docs/UI_UX_SPECIFICATION.md
````markdown
# UI/UX specification

MECO Flow uses a professional, information-dense industrial interface with configurable brand tokens. Internal desktop/tablet layouts use clear navigation, headings, breadcrumbs, environment indication outside production, explicit primary actions and visible blockers. Supplier layouts are mobile responsive and clearly identify the supplier organization.

Status is always text plus color. Controls are keyboard accessible with visible focus, semantic headings, labeled inputs, accessible validation/error summaries, named icon actions, useful loading/empty/error states, and sufficient contrast. Important lists use URL-backed filters, pagination and sorting. Warehouse and QA workflows prioritize tablet ergonomics.

Presentation is localization-ready for `en` and `id`; machine enums and API error codes remain untranslated. Dates/numbers/currency use locale formatting and configured `Asia/Jakarta` display timezone/`IDR` defaults. The current internal shell includes project and item-master workspaces; supplier navigation remains deliberately separate.

## Phase 3A item interfaces

The internal item directory keeps search, category, unit, active status, sort direction, page, and page size in the URL. It exposes sortable code/name/updated columns, bounded pagination, clear empty state, item-detail links, and a filtered CSV action only to principals with `item.export`. Status is visible as text and color. Item-master administration for categories, units, and specification definitions is shown only to principals with `item.write`.

The item detail identifies the immutable category, base unit, versioned edit state, and ordered structured specifications with units and definition status. Editors render text, numeric, and boolean controls from active definitions and use the configured decimal step. Inactive items retain a readable detail and specifications but hide normal edit controls. Deactivation is a separate reasoned action, has no delete equivalent, and explains the historical-retention effect.
````

## File: infra/minio/README.md
````markdown
# MinIO

Local Compose creates one private bucket through the idempotent `minio-init` job. Original filenames are never object keys. Production credentials, lifecycle and backup policy are external configuration.
````

## File: infra/monitoring/README.md
````markdown
# Monitoring

Phase 0 supplies structured logs, dependency probes and a Redis worker heartbeat. Production metrics, queue dashboards, alerts, retention and on-call routing are Phase 9 deliverables.
````

## File: infra/proxy/README.md
````markdown
# Reverse proxy

TLS termination, production hostnames, trusted proxy configuration, request limits and administrative endpoint restrictions are deployment-specific Phase 9 work. No development proxy is required in Phase 0.
````

## File: packages/config/src/index.ts
````typescript
export { parseServiceEnvironment } from "./service-environment.js";
export type { ServiceEnvironment } from "./service-environment.js";
````

## File: packages/config/package.json
````json
{
  "name": "@mecoflow/config",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
    "lint": "eslint src --max-warnings=0",
    "test": "vitest run",
    "test:integration": "vitest run --passWithNoTests",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@mecoflow/typescript-config": "workspace:*"
  }
}
````

## File: packages/config/tsconfig.json
````json
{
  "extends": "@mecoflow/typescript-config/library.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
````

## File: packages/contracts/src/health.test.ts
````typescript
import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./health.js";

describe("healthResponseSchema", () => {
  it("accepts the stable liveness contract", () => {
    expect(
      healthResponseSchema.parse({
        service: "api",
        status: "ok",
        timestamp: "2026-07-15T00:00:00.000Z",
        version: "0.1.0",
      }),
    ).toBeDefined();
  });
});
````

## File: packages/contracts/src/health.ts
````typescript
import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.iso.datetime(),
});

export const readinessResponseSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  checks: z.record(z.string(), z.enum(["up", "down"])),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
````

## File: packages/contracts/src/index.ts
````typescript
export { healthResponseSchema, readinessResponseSchema } from "./health.js";
export type { HealthResponse, ReadinessResponse } from "./health.js";
````

## File: packages/contracts/package.json
````json
{
  "name": "@mecoflow/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
    "lint": "eslint src --max-warnings=0",
    "test": "vitest run",
    "test:integration": "vitest run --passWithNoTests",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@mecoflow/typescript-config": "workspace:*"
  }
}
````

## File: packages/contracts/tsconfig.json
````json
{
  "extends": "@mecoflow/typescript-config/library.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
````

## File: packages/database/prisma/migrations/20260715000000_phase_0_foundation/migration.sql
````sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "system_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "system_metadata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "system_metadata_key_key" ON "system_metadata"("key");
````

## File: packages/database/prisma/migrations/20260716000000_phase_1_identity_authorization/migration.sql
````sql
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "OrganizationType" AS ENUM ('INTERNAL', 'SUPPLIER');
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "RoleScope" AS ENUM ('INTERNAL', 'SUPPLIER', 'ANY');

CREATE TABLE "user_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "issuer" VARCHAR(500) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "displayName" VARCHAR(200) NOT NULL,
  "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastLoginAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_profiles_issuer_subject_key" ON "user_profiles"("issuer", "subject");
CREATE INDEX "user_profiles_email_idx" ON "user_profiles"("email");

CREATE TABLE "organizations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "type" "OrganizationType" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

CREATE TABLE "memberships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "memberships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "memberships_userId_organizationId_key" ON "memberships"("userId", "organizationId");
CREATE INDEX "memberships_organizationId_status_idx" ON "memberships"("organizationId", "status");

CREATE TABLE "roles" (
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  "scope" "RoleScope" NOT NULL,
  "system" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("code")
);
CREATE TABLE "permissions" (
  "code" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("code")
);
CREATE TABLE "role_permissions" (
  "roleCode" VARCHAR(50) NOT NULL,
  "permissionCode" VARCHAR(100) NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleCode", "permissionCode"),
  CONSTRAINT "role_permissions_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "roles"("code") ON DELETE RESTRICT,
  CONSTRAINT "role_permissions_permissionCode_fkey" FOREIGN KEY ("permissionCode") REFERENCES "permissions"("code") ON DELETE RESTRICT
);
CREATE TABLE "membership_roles" (
  "membershipId" UUID NOT NULL,
  "roleCode" VARCHAR(50) NOT NULL,
  "assignedByUserId" UUID,
  "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("membershipId", "roleCode"),
  CONSTRAINT "membership_roles_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT,
  CONSTRAINT "membership_roles_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "roles"("code") ON DELETE RESTRICT,
  CONSTRAINT "membership_roles_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT
);
CREATE INDEX "membership_roles_assignedByUserId_idx" ON "membership_roles"("assignedByUserId");

CREATE TABLE "sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tokenHash" CHAR(64) NOT NULL,
  "csrfTokenHash" CHAR(64) NOT NULL,
  "userId" UUID NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "revokedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");

CREATE TABLE "oidc_auth_transactions" (
  "stateHash" CHAR(64) NOT NULL,
  "codeVerifier" VARCHAR(128) NOT NULL,
  "nonce" VARCHAR(128) NOT NULL,
  "returnTo" VARCHAR(500) NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oidc_auth_transactions_pkey" PRIMARY KEY ("stateHash")
);
CREATE INDEX "oidc_auth_transactions_expiresAt_idx" ON "oidc_auth_transactions"("expiresAt");

CREATE TABLE "audit_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorUserId" UUID,
  "organizationId" UUID,
  "action" VARCHAR(100) NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" VARCHAR(100) NOT NULL,
  "requestId" VARCHAR(128) NOT NULL,
  "correlationId" VARCHAR(128) NOT NULL,
  "outcome" VARCHAR(30) NOT NULL,
  "changes" JSONB NOT NULL,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "audit_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
);
CREATE INDEX "audit_events_organizationId_occurredAt_idx" ON "audit_events"("organizationId", "occurredAt");
CREATE INDEX "audit_events_entityType_entityId_occurredAt_idx" ON "audit_events"("entityType", "entityId", "occurredAt");

CREATE FUNCTION prevent_audit_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit events are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER audit_events_immutable_update BEFORE UPDATE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
CREATE TRIGGER audit_events_immutable_delete BEFORE DELETE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
````

## File: packages/database/prisma/migrations/migration_lock.toml
````toml
provider = "postgresql"
````

## File: packages/database/src/client.ts
````typescript
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
````

## File: packages/database/src/phase-one-seed.test.ts
````typescript
import { describe, expect, it } from "vitest";
import { shouldSeedLocalFixtures } from "./phase-one-seed.js";

describe("Phase 1 seed environment boundary", () => {
  it.each(["local", "development", "test", "ci"])(
    "allows fictional fixtures in %s",
    (environment) => {
      expect(shouldSeedLocalFixtures(environment)).toBe(true);
    },
  );

  it.each([undefined, "staging", "production", "review"])(
    "denies fictional fixtures in %s",
    (environment) => {
      expect(shouldSeedLocalFixtures(environment)).toBe(false);
    },
  );
});
````

## File: packages/database/src/phase-one-seed.ts
````typescript
import type { PrismaClient } from "../generated/prisma/client.js";

const permissions = {
  "administration.access": "Access internal administration",
  "audit.read": "Read authorized audit events",
  "item.export": "Export the internal item master",
  "item.read": "Read the internal item master",
  "item.write": "Create and change internal item-master records",
  "membership.read": "Read organization memberships",
  "membership.write": "Create and change organization memberships",
  "organization.read": "Read organizations",
  "organization.write": "Create and change organizations",
  "project.read": "Read authorized projects when Phase 2 is enabled",
  "project.write": "Change authorized projects when Phase 2 is enabled",
  "project.membership.manage": "Manage project scope when Phase 2 is enabled",
  "role.read": "Read roles and assignments",
  "role.assign": "Change role assignments",
  "supplier.membership.read":
    "Read memberships in the user's supplier organization",
  "supplier.membership.write":
    "Manage memberships in the user's supplier organization",
  "supplier.organization.read": "Read the user's supplier organization",
  "user.read": "Read authorized user profiles",
} as const;

const roles = [
  [
    "SYSTEM_ADMIN",
    "System administrator",
    "Platform identity and organization administration",
    "INTERNAL",
  ],
  [
    "MECO_MANAGEMENT",
    "MECO management",
    "Internal cross-project management oversight",
    "INTERNAL",
  ],
  [
    "PROJECT_MANAGER",
    "Project manager",
    "Assigned project lifecycle management",
    "INTERNAL",
  ],
  [
    "ENGINEERING",
    "Engineering",
    "Assigned project engineering work",
    "INTERNAL",
  ],
  ["PPIC", "PPIC", "Assigned project planning and readiness work", "INTERNAL"],
  ["PURCHASING", "Purchasing", "Internal procurement work", "INTERNAL"],
  [
    "WAREHOUSE",
    "Warehouse",
    "Authorized receipt and inventory work",
    "INTERNAL",
  ],
  ["QA_QC", "QA/QC", "Authorized inspection and quality work", "INTERNAL"],
  ["PRODUCTION", "Production", "Assigned project production work", "INTERNAL"],
  [
    "FINANCE_READONLY",
    "Finance read-only",
    "Read-only authorized commercial view",
    "INTERNAL",
  ],
  [
    "AUDITOR_READONLY",
    "Auditor read-only",
    "Read-only authorized audit view",
    "INTERNAL",
  ],
  [
    "SUPPLIER_ADMIN",
    "Supplier administrator",
    "Own supplier organization administration",
    "SUPPLIER",
  ],
  [
    "SUPPLIER_USER",
    "Supplier user",
    "Own supplier organization collaboration",
    "SUPPLIER",
  ],
  [
    "CUSTOMER_VIEWER",
    "Customer viewer",
    "Reserved role with no MVP application surface",
    "ANY",
  ],
] as const;

const rolePermissions: Record<(typeof roles)[number][0], readonly string[]> = {
  SYSTEM_ADMIN: Object.keys(permissions),
  MECO_MANAGEMENT: [
    "organization.read",
    "user.read",
    "project.read",
    "audit.read",
    "item.read",
    "item.export",
  ],
  PROJECT_MANAGER: [
    "project.read",
    "project.write",
    "project.membership.manage",
    "item.read",
  ],
  ENGINEERING: [
    "project.read",
    "project.write",
    "item.read",
    "item.write",
    "item.export",
  ],
  PPIC: ["project.read", "project.write", "item.read", "item.export"],
  PURCHASING: ["project.read", "project.write", "item.read", "item.export"],
  WAREHOUSE: ["project.read", "project.write", "item.read"],
  QA_QC: ["project.read", "project.write", "item.read", "item.export"],
  PRODUCTION: ["project.read", "item.read"],
  FINANCE_READONLY: ["project.read", "item.read"],
  AUDITOR_READONLY: ["project.read", "audit.read", "item.read", "item.export"],
  SUPPLIER_ADMIN: [
    "supplier.organization.read",
    "supplier.membership.read",
    "supplier.membership.write",
    "project.read",
  ],
  SUPPLIER_USER: ["supplier.organization.read", "project.read"],
  CUSTOMER_VIEWER: [],
};

const localFixtures = {
  internalOrganizationId: "10000000-0000-4000-8000-000000000001",
  supplierOrganizationId: "10000000-0000-4000-8000-000000000002",
  internalAdminUserId: "20000000-0000-4000-8000-000000000001",
  internalReadonlyUserId: "20000000-0000-4000-8000-000000000002",
  supplierAdminUserId: "20000000-0000-4000-8000-000000000003",
  inactiveUserId: "20000000-0000-4000-8000-000000000004",
  inactiveMembershipUserId: "20000000-0000-4000-8000-000000000005",
  mockInternalAdminUserId: "20000000-0000-4000-8000-000000000006",
  mockSupplierAdminUserId: "20000000-0000-4000-8000-000000000007",
  issuer: "http://localhost:8180/realms/mecoflow-local",
  mockIssuer: "http://127.0.0.1:4310",
} as const;

export function shouldSeedLocalFixtures(
  appEnvironment: string | undefined,
): boolean {
  return ["ci", "development", "local", "test"].includes(appEnvironment ?? "");
}

export async function applyPhaseOneSeed(database: PrismaClient): Promise<void> {
  await database.$transaction(async (transaction) => {
    const seedLocalFixtures = shouldSeedLocalFixtures(process.env.APP_ENV);
    for (const [code, description] of Object.entries(permissions)) {
      await transaction.permission.upsert({
        create: { code, description },
        update: { description },
        where: { code },
      });
    }

    for (const [code, name, description, scope] of roles) {
      await transaction.role.upsert({
        create: { code, name, description, scope },
        update: { name, description, scope },
        where: { code },
      });
      const expectedPermissions = [...rolePermissions[code]];
      await transaction.rolePermission.deleteMany({
        where: {
          roleCode: code,
          ...(expectedPermissions.length > 0
            ? { permissionCode: { notIn: expectedPermissions } }
            : {}),
        },
      });
      await transaction.rolePermission.createMany({
        data: expectedPermissions.map((permissionCode) => ({
          roleCode: code,
          permissionCode,
        })),
        skipDuplicates: true,
      });
    }

    const organizations = [
      {
        id: localFixtures.internalOrganizationId,
        code: "MECO",
        name: "PT Meco Inoxprima",
        type: "INTERNAL" as const,
      },
      {
        id: localFixtures.supplierOrganizationId,
        code: "SUPPLIER-ALPHA",
        name: "Supplier Alpha (Local)",
        type: "SUPPLIER" as const,
      },
    ];
    for (const organization of seedLocalFixtures ? organizations : []) {
      await transaction.organization.createMany({
        data: organization,
        skipDuplicates: true,
      });
      await transaction.organization.updateMany({
        data: {
          name: organization.name,
          type: organization.type,
          active: true,
        },
        where: {
          code: organization.code,
          OR: [
            { name: { not: organization.name } },
            { type: { not: organization.type } },
            { active: { not: true } },
          ],
        },
      });
    }

    const users = seedLocalFixtures
      ? [
          {
            id: localFixtures.internalAdminUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000001",
            email: "internal.admin@mecoflow.local",
            displayName: "Internal Administrator",
            status: "ACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "SYSTEM_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.internalReadonlyUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000002",
            email: "finance.readonly@mecoflow.local",
            displayName: "Finance Readonly",
            status: "ACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "FINANCE_READONLY",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.supplierAdminUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000003",
            email: "supplier.admin@mecoflow.local",
            displayName: "Supplier Administrator",
            status: "ACTIVE" as const,
            organizationId: localFixtures.supplierOrganizationId,
            roleCode: "SUPPLIER_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.inactiveUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000004",
            email: "inactive.user@mecoflow.local",
            displayName: "Inactive User",
            status: "INACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "SYSTEM_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.inactiveMembershipUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000005",
            email: "inactive.membership@mecoflow.local",
            displayName: "Inactive Membership",
            status: "ACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "SYSTEM_ADMIN",
            membershipStatus: "INACTIVE" as const,
          },
          {
            id: localFixtures.mockInternalAdminUserId,
            issuer: localFixtures.mockIssuer,
            subject: "mock-internal-admin",
            email: "internal.admin@mecoflow.test",
            displayName: "Internal Administrator",
            status: "ACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "SYSTEM_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.mockSupplierAdminUserId,
            issuer: localFixtures.mockIssuer,
            subject: "mock-supplier-admin",
            email: "supplier.admin@mecoflow.test",
            displayName: "Supplier Administrator",
            status: "ACTIVE" as const,
            organizationId: localFixtures.supplierOrganizationId,
            roleCode: "SUPPLIER_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
        ]
      : [];
    for (const user of users) {
      await transaction.userProfile.createMany({
        data: {
          id: user.id,
          issuer: user.issuer,
          subject: user.subject,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
        },
        skipDuplicates: true,
      });
      await transaction.userProfile.updateMany({
        data: {
          email: user.email,
          displayName: user.displayName,
          issuer: user.issuer,
          status: user.status,
          subject: user.subject,
        },
        where: {
          id: user.id,
          OR: [
            { email: { not: user.email } },
            { displayName: { not: user.displayName } },
            { issuer: { not: user.issuer } },
            { status: { not: user.status } },
            { subject: { not: user.subject } },
          ],
        },
      });
      await transaction.membership.createMany({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          status: user.membershipStatus,
        },
        skipDuplicates: true,
      });
      await transaction.membership.updateMany({
        data: { status: user.membershipStatus },
        where: {
          userId: user.id,
          organizationId: user.organizationId,
          status: { not: user.membershipStatus },
        },
      });
      const membership = await transaction.membership.findUniqueOrThrow({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: user.organizationId,
          },
        },
      });
      await transaction.membershipRole.upsert({
        create: { membershipId: membership.id, roleCode: user.roleCode },
        update: {},
        where: {
          membershipId_roleCode: {
            membershipId: membership.id,
            roleCode: user.roleCode,
          },
        },
      });
    }

    await transaction.systemMetadata.createMany({
      data: { key: "seed.version", value: "phase-1" },
      skipDuplicates: true,
    });
    await transaction.systemMetadata.updateMany({
      data: { value: "phase-1", version: { increment: 1 } },
      where: { key: "seed.version", NOT: { value: "phase-1" } },
    });
  });
}

export { localFixtures, permissions, rolePermissions, roles };
````

## File: packages/database/src/phase-zero-seed.ts
````typescript
import type { PrismaClient } from "../generated/prisma/client.js";

const phaseZeroSeed = {
  key: "seed.version",
  value: "phase-0",
} as const;

export async function applyPhaseZeroSeed(
  database: PrismaClient,
): Promise<void> {
  await database.systemMetadata.createMany({
    data: phaseZeroSeed,
    skipDuplicates: true,
  });
  await database.systemMetadata.updateMany({
    data: { value: phaseZeroSeed.value, version: { increment: 1 } },
    where: { key: phaseZeroSeed.key, NOT: { value: phaseZeroSeed.value } },
  });
}
````

## File: packages/database/package.json
````json
{
  "name": "@mecoflow/database",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/src/index.js",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/src/index.js"
    }
  },
  "scripts": {
    "build": "pnpm db:generate && tsc -p tsconfig.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true});require('fs').rmSync('generated',{recursive:true,force:true})\"",
    "db:deploy": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:reset": "prisma migrate reset --force",
    "db:seed": "prisma db seed",
    "lint": "eslint src prisma prisma.config.ts --max-warnings=0",
    "test": "vitest run -c vitest.config.ts --passWithNoTests",
    "test:integration": "vitest run -c vitest.integration.config.ts",
    "typecheck": "pnpm db:generate && tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@prisma/adapter-pg": "7.8.0",
    "@prisma/client": "7.8.0",
    "pg": "8.22.0"
  },
  "devDependencies": {
    "@mecoflow/typescript-config": "workspace:*",
    "@types/pg": "8.20.0",
    "dotenv": "17.2.3",
    "prisma": "7.8.0",
    "tsx": "4.23.1"
  }
}
````

## File: packages/database/prisma.config.ts
````typescript
import { config as loadEnvironment } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

loadEnvironment({
  path: resolve(import.meta.dirname, "../../.env"),
  quiet: true,
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
````

## File: packages/database/tsconfig.json
````json
{
  "extends": "@mecoflow/typescript-config/library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "."
  },
  "include": [
    "src/**/*.ts",
    "generated/**/*.ts",
    "prisma/**/*.ts",
    "prisma.config.ts"
  ],
  "exclude": [
    "dist",
    "node_modules",
    "**/*.test.ts",
    "**/*.integration.test.ts"
  ]
}
````

## File: packages/database/vitest.config.ts
````typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/*.integration.test.ts", "**/node_modules/**"],
  },
});
````

## File: packages/database/vitest.integration.config.ts
````typescript
import { config as loadEnvironment } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

loadEnvironment({
  path: resolve(import.meta.dirname, "../../.env"),
  quiet: true,
});

export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 15_000,
  },
});
````

## File: packages/eslint-config/base.mjs
````javascript
import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "no-console": "error",
    },
  },
  {
    ...tseslint.configs.disableTypeChecked,
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
  },
  {
    ...tseslint.configs.disableTypeChecked,
    files: ["**/*.config.{js,mjs,ts}", "**/scripts/**/*.{js,mjs,ts}"],
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      "no-console": "off",
    },
  },
);
````

## File: packages/eslint-config/package.json
````json
{
  "name": "@mecoflow/eslint-config",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    "./base": "./base.mjs"
  },
  "dependencies": {
    "@eslint/js": "10.0.1",
    "globals": "17.7.0",
    "typescript-eslint": "8.64.0"
  },
  "peerDependencies": {
    "eslint": ">=10.0.0"
  }
}
````

## File: packages/test-utils/src/index.ts
````typescript
export function fixedClock(): Date {
  return new Date("2026-01-01T00:00:00.000Z");
}
````

## File: packages/test-utils/package.json
````json
{
  "name": "@mecoflow/test-utils",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
    "lint": "eslint src --max-warnings=0",
    "test": "vitest run --passWithNoTests",
    "test:integration": "vitest run --passWithNoTests",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@mecoflow/typescript-config": "workspace:*"
  }
}
````

## File: packages/test-utils/tsconfig.json
````json
{
  "extends": "@mecoflow/typescript-config/library.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
````

## File: packages/typescript-config/base.json
````json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "allowJs": false,
    "esModuleInterop": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "module": "NodeNext",
    "moduleDetection": "force",
    "moduleResolution": "NodeNext",
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2023",
    "verbatimModuleSyntax": true
  }
}
````

## File: packages/typescript-config/library.json
````json
{
  "extends": "./base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
````

## File: packages/typescript-config/nestjs.json
````json
{
  "extends": "./base.json",
  "compilerOptions": {
    "declaration": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "sourceMap": true,
    "verbatimModuleSyntax": false
  }
}
````

## File: packages/typescript-config/nextjs.json
````json
{
  "extends": "./base.json",
  "compilerOptions": {
    "allowJs": true,
    "incremental": true,
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "plugins": [{ "name": "next" }]
  }
}
````

## File: packages/typescript-config/package.json
````json
{
  "name": "@mecoflow/typescript-config",
  "version": "0.1.0",
  "private": true,
  "files": [
    "*.json"
  ]
}
````

## File: packages/ui/src/index.ts
````typescript
export { ServiceStatus } from "./service-status.js";
export type { ServiceStatusProps } from "./service-status.js";
````

## File: packages/ui/src/service-status.tsx
````typescript
export interface ServiceStatusProps {
  label: string;
  state: "checking" | "available" | "unavailable";
}

export function ServiceStatus({ label, state }: ServiceStatusProps) {
  return (
    <p aria-live="polite" className={`service-status service-status--${state}`}>
      <span aria-hidden="true" className="service-status__indicator" />
      <span>{label}</span>
      <strong>{state}</strong>
    </p>
  );
}
````

## File: packages/ui/package.json
````json
{
  "name": "@mecoflow/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
    "lint": "eslint src --max-warnings=0",
    "test": "vitest run --passWithNoTests",
    "test:integration": "vitest run --passWithNoTests",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "peerDependencies": {
    "react": "19.2.7"
  },
  "devDependencies": {
    "@mecoflow/typescript-config": "workspace:*",
    "@types/react": "19.2.17",
    "react": "19.2.7"
  }
}
````

## File: packages/ui/tsconfig.json
````json
{
  "extends": "@mecoflow/typescript-config/library.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.test.tsx"]
}
````

## File: scripts/clean.mjs
````javascript
import { rmSync } from "node:fs";

for (const path of [".turbo", "playwright-report", "test-results"]) {
  rmSync(path, { force: true, recursive: true });
}
````

## File: scripts/prepare.mjs
````javascript
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (existsSync(".git")) {
  const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
    stdio: "inherit",
  });
  if (result.error?.code === "ENOENT") {
    process.stderr.write(
      "[prepare] Git is not available on PATH; skipping local hook configuration.\n",
    );
  } else if (result.error) {
    throw result.error;
  } else if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}
````

## File: tests/e2e/identity-authorization.spec.ts
````typescript
import { expect, test } from "@playwright/test";

async function login(
  page: import("@playwright/test").Page,
  persona: "Internal administrator" | "Supplier administrator",
) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Sign in to MECO Flow" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test identity provider" }),
  ).toBeVisible();
  await page.getByRole("button", { name: persona }).click();
}

test("logs in with OIDC code and PKCE without browser token storage", async ({
  page,
}) => {
  await login(page, "Internal administrator");
  await expect(
    page.getByRole("heading", { name: "Internal overview" }),
  ).toBeVisible();
  expect(await page.evaluate(() => Object.keys(window.localStorage))).toEqual(
    [],
  );
});

test("supports authorized internal navigation", async ({ page }) => {
  await login(page, "Internal administrator");
  await page.getByRole("link", { name: "Administration" }).click();
  await expect(
    page.getByRole("heading", { name: "Administration", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Organizations" }).click();
  await expect(
    page.getByRole("heading", { name: "Organizations" }),
  ).toBeVisible();
});

test("shows the supplier shell and denies internal administration", async ({
  page,
}) => {
  await login(page, "Supplier administrator");
  await expect(
    page.getByRole("heading", { name: "Supplier overview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Supplier navigation" }),
  ).toBeVisible();
  await page.goto("/internal/administration");
  await expect(
    page.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
});
````

## File: tests/fixtures/README.md
````markdown
# Test fixtures

Place deterministic fictional fixtures here. Never include production, customer, employee, supplier or commercial data.
````

## File: tests/security/README.md
````markdown
# Security tests

Phase 1 will add authorization matrix and Supplier A/Supplier B isolation suites here. Phase 0 exposes no business resources.
````

## File: tests/oidc-mock.mjs
````javascript
import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from "node:crypto";
import { createServer } from "node:http";

const issuer = "http://127.0.0.1:4310";
const clientId = "mecoflow-web";
const redirectUri = "http://localhost:3001/api/v1/auth/callback";
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const publicJwk = publicKey.export({ format: "jwk" });
const keyId = "mecoflow-e2e";
const codes = new Map();
const personas = {
  internal: {
    email: "internal.admin@mecoflow.test",
    name: "Internal Administrator",
    sub: "mock-internal-admin",
  },
  supplier: {
    email: "supplier.admin@mecoflow.test",
    name: "Supplier Administrator",
    sub: "mock-supplier-admin",
  },
};

function json(response, status, value) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(value));
}

function jwt(claims) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: keyId, typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    privateKey,
  ).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

async function body(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", issuer);
  if (url.pathname === "/.well-known/openid-configuration") {
    json(response, 200, {
      authorization_endpoint: `${issuer}/authorize`,
      id_token_signing_alg_values_supported: ["RS256"],
      issuer,
      jwks_uri: `${issuer}/jwks`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      token_endpoint: `${issuer}/token`,
    });
    return;
  }
  if (url.pathname === "/jwks") {
    json(response, 200, {
      keys: [{ ...publicJwk, alg: "RS256", kid: keyId, use: "sig" }],
    });
    return;
  }
  if (url.pathname === "/authorize" && request.method === "GET") {
    if (
      url.searchParams.get("client_id") !== clientId ||
      url.searchParams.get("redirect_uri") !== redirectUri ||
      url.searchParams.get("response_type") !== "code" ||
      url.searchParams.get("code_challenge_method") !== "S256"
    ) {
      response.writeHead(400).end("Invalid authorization request");
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      `<!doctype html><html lang="en"><head><title>Test identity provider</title></head><body><main><h1>Test identity provider</h1><p>Select a deterministic test identity.</p><form method="post" action="${url.pathname}${url.search}"><button name="persona" value="internal">Internal administrator</button><button name="persona" value="supplier">Supplier administrator</button></form></main></body></html>`,
    );
    return;
  }
  if (url.pathname === "/authorize" && request.method === "POST") {
    const form = await body(request);
    const persona = personas[form.get("persona")];
    const state = url.searchParams.get("state");
    const nonce = url.searchParams.get("nonce");
    const codeChallenge = url.searchParams.get("code_challenge");
    if (!persona || !state || !nonce || !codeChallenge) {
      response.writeHead(400).end("Invalid authorization request");
      return;
    }
    const code = randomBytes(24).toString("base64url");
    codes.set(code, { codeChallenge, nonce, persona });
    const callback = new URL(redirectUri);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", state);
    response.writeHead(302, { location: callback.toString() }).end();
    return;
  }
  if (url.pathname === "/token" && request.method === "POST") {
    const form = await body(request);
    const code = form.get("code");
    const transaction = code ? codes.get(code) : undefined;
    const verifier = form.get("code_verifier") ?? "";
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    if (
      !code ||
      !transaction ||
      challenge !== transaction.codeChallenge ||
      form.get("client_id") !== clientId ||
      form.get("redirect_uri") !== redirectUri
    ) {
      json(response, 400, { error: "invalid_grant" });
      return;
    }
    codes.delete(code);
    const now = Math.floor(Date.now() / 1000);
    json(response, 200, {
      access_token: randomBytes(24).toString("base64url"),
      expires_in: 300,
      id_token: jwt({
        aud: clientId,
        email: transaction.persona.email,
        exp: now + 300,
        iat: now,
        iss: issuer,
        name: transaction.persona.name,
        nonce: transaction.nonce,
        sub: transaction.persona.sub,
      }),
      token_type: "Bearer",
    });
    return;
  }
  response.writeHead(404).end("Not found");
});

server.listen(4310, "127.0.0.1");
````

## File: .editorconfig
````
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
````

## File: .prettierignore
````
.next
coverage
dist
docs/generated
node_modules
packages/database/generated
pnpm-lock.yaml
test-results
playwright-report
````

## File: AGENTS.md
````markdown
# MECO Flow repository guide

Before changing code, read `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/SECURITY_MODEL.md`, `docs/AUTHORIZATION_MATRIX.md`, `docs/API_CONVENTIONS.md`, `docs/TEST_STRATEGY.md`, `docs/IMPLEMENTATION_STATUS.md`, applicable accepted ADRs, and any nested `AGENTS.md`.

- Use TypeScript strict mode and preserve the modular-monolith boundaries.
- Controllers call application services; application services call policies/domain services and repositories; only repositories access Prisma.
- Validate every trust boundary. Enforce authorization server-side and deny by default.
- Never bypass guards, directly set workflow states, delete audit events, expose secrets, or weaken tests.
- Do not add a dependency without documenting necessity, security, and maintenance impact.
- Add or update tests for every behavior change. Use repository scripts for verification and report commands exactly.
- Update affected documentation and `docs/IMPLEMENTATION_STATUS.md` after meaningful work.
- Report assumptions, security implications, unresolved risks, and limitations.
- Do not begin a later implementation phase unless the user explicitly requests it.

When documentation conflicts, the latest accepted ADR governs architecture, `PRODUCT_REQUIREMENTS.md` governs behavior, and the security model plus authorization matrix govern access control. Report unresolved conflicts.
````

## File: compose.override.yaml
````yaml
services:
  postgres:
    stop_grace_period: 30s
  redis:
    stop_grace_period: 10s
  minio:
    stop_grace_period: 10s
  keycloak:
    stop_grace_period: 30s
````

## File: CONTRIBUTING.md
````markdown
# Contributing

Read `AGENTS.md` and the documents it references before changing code. Create focused changes, use conventional commits, add tests, update documentation, and run `pnpm verify`. Database changes require a new Prisma migration. Never commit `.env`, credentials, tokens, or production realm exports.

Pull requests must describe scope, verification, migration and rollback needs, authorization and audit implications, assumptions, and known limitations.
````

## File: eslint.config.mjs
````javascript
import baseConfig from "@mecoflow/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: [
      "**/.next/**",
      "**/coverage/**",
      "**/dist/**",
      "**/generated/**",
      "**/node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
];
````

## File: LICENSE
````
Copyright (c) 2026 PT Meco Inoxprima. All rights reserved.

This software and associated documentation are proprietary and confidential. No
right to use, copy, modify, distribute, or disclose them is granted without
written authorization from PT Meco Inoxprima.
````

## File: pnpm-workspace.yaml
````yaml
packages:
  - apps/*
  - packages/*

autoInstallPeers: false
engineStrict: true
saveExact: true
strictPeerDependencies: true

overrides:
  "@hono/node-server": 1.19.13
  postcss: 8.5.10

allowBuilds:
  "@prisma/engines": true
  "@scarf/scarf": false
  esbuild: true
  prisma: true
  sharp: true
````

## File: SECURITY.md
````markdown
# Security policy

Report suspected vulnerabilities privately to the designated PT Meco Inoxprima security contact; do not open a public issue. Include reproduction details without live secrets or customer data.

MECO Flow uses Keycloak OIDC, server-side authorization, private object storage, environment-provided secrets, immutable audit records, and deny-by-default policies. Phase 0 establishes boundaries but does not yet implement application authentication or operational authorization; see `docs/IMPLEMENTATION_STATUS.md`.
````

## File: apps/api/src/health/health.controller.ts
````typescript
import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { HealthResponse, ReadinessResponse } from "@mecoflow/contracts";
import { HealthService } from "./health.service.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService,
  ) {}

  @Get("live")
  @ApiOperation({ summary: "Process liveness probe" })
  @ApiOkResponse({ description: "The API process is alive." })
  live(): HealthResponse {
    return this.healthService.liveness();
  }

  @Get("ready")
  @ApiOperation({ summary: "Required dependency readiness probe" })
  @ApiOkResponse({ description: "Required dependencies are available." })
  @ApiServiceUnavailableResponse({
    description: "At least one required dependency is unavailable.",
  })
  async ready(): Promise<ReadinessResponse> {
    const readiness = await this.healthService.readiness();
    if (readiness.status === "not_ready")
      throw new ServiceUnavailableException(readiness);
    return readiness;
  }
}
````

## File: apps/api/src/health/health.service.test.ts
````typescript
import { describe, expect, it, vi } from "vitest";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import {
  createLivenessResponse,
  createObjectStorageReadinessCommand,
} from "./health.service.js";

describe("createLivenessResponse", () => {
  it("returns the stable API liveness shape", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));
    expect(createLivenessResponse("0.1.0")).toEqual({
      service: "api",
      status: "ok",
      timestamp: "2026-07-15T00:00:00.000Z",
      version: "0.1.0",
    });
    vi.useRealTimers();
  });

  it("checks the configured private object-storage bucket", () => {
    const command = createObjectStorageReadinessCommand("mecoflow-private");
    expect(command).toBeInstanceOf(HeadBucketCommand);
    expect(command.input).toEqual({ Bucket: "mecoflow-private" });
  });
});
````

## File: apps/api/src/health/health.service.ts
````typescript
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  type PrismaClient,
} from "@mecoflow/database";
import type { HealthResponse, ReadinessResponse } from "@mecoflow/contracts";
import type { ServiceEnvironment } from "@mecoflow/config";
import { Redis } from "ioredis";
import { SERVICE_ENVIRONMENT } from "../tokens.js";

export function createLivenessResponse(version: string): HealthResponse {
  return {
    service: "api",
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
  };
}

export function createObjectStorageReadinessCommand(
  bucket: string,
): HeadBucketCommand {
  return new HeadBucketCommand({ Bucket: bucket });
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly database: PrismaClient;
  private readonly redis: Redis;
  private readonly objectStorage: S3Client;

  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
  ) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
    this.redis = new Redis(environment.REDIS_URL, {
      connectTimeout: 2_000,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
    });
    this.redis.on("error", () => undefined);
    this.objectStorage = new S3Client({
      credentials: {
        accessKeyId: environment.S3_ACCESS_KEY,
        secretAccessKey: environment.S3_SECRET_KEY,
      },
      endpoint: environment.S3_ENDPOINT,
      forcePathStyle: environment.S3_FORCE_PATH_STYLE,
      region: environment.S3_REGION,
      requestHandler: { requestTimeout: 2_000 },
    });
  }

  liveness(): HealthResponse {
    return createLivenessResponse(this.environment.APP_VERSION);
  }

  async readiness(): Promise<ReadinessResponse> {
    const checks = await Promise.allSettled([
      this.database.$queryRaw`SELECT 1`,
      this.checkRedis(),
      this.objectStorage.send(
        createObjectStorageReadinessCommand(this.environment.S3_BUCKET),
      ),
    ]);
    const names = ["database", "redis", "objectStorage"] as const;
    const statuses = names.reduce<Record<string, "up" | "down">>(
      (result, name, index) => {
        result[name] = checks[index]?.status === "fulfilled" ? "up" : "down";
        return result;
      },
      {},
    );
    const ready = Object.values(statuses).every((status) => status === "up");

    return {
      checks: statuses,
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
    };
  }

  private async checkRedis(): Promise<void> {
    if (this.redis.status === "wait") await this.redis.connect();
    await this.redis.ping();
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
    this.objectStorage.destroy();
    await disconnectDatabaseClient();
  }
}
````

## File: apps/api/src/app.module.ts
````typescript
import { Module } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { HealthController } from "./health/health.controller.js";
import { HealthService } from "./health/health.service.js";
import { SERVICE_ENVIRONMENT } from "./tokens.js";
import { AdministrationController } from "./administration/administration.controller.js";
import { AdministrationRepository } from "./administration/administration.repository.js";
import { AdministrationService } from "./administration/administration.service.js";
import { AuthorizationPolicy } from "./authorization/authorization.policy.js";
import { AuthController } from "./identity/auth.controller.js";
import { IdentityRepository } from "./identity/identity.repository.js";
import { IdentityService } from "./identity/identity.service.js";
import { MeController } from "./identity/me.controller.js";
import { OidcService } from "./identity/oidc.service.js";
import { ProjectsController } from "./projects/projects.controller.js";
import { ProjectAuthorizationPolicy } from "./projects/project-authorization.policy.js";
import { ProjectsRepository } from "./projects/projects.repository.js";
import { ProjectsService } from "./projects/projects.service.js";
import { ItemsController } from "./items/items.controller.js";
import { ItemAuthorizationPolicy } from "./items/item-authorization.policy.js";
import { ItemsRepository } from "./items/items.repository.js";
import { ItemsService } from "./items/items.service.js";

@Module({})
export class AppModule {
  static register(environment: ServiceEnvironment) {
    return {
      module: AppModule,
      controllers: [
        HealthController,
        AuthController,
        MeController,
        AdministrationController,
        ProjectsController,
        ItemsController,
      ],
      providers: [
        HealthService,
        IdentityRepository,
        OidcService,
        IdentityService,
        AuthorizationPolicy,
        AdministrationRepository,
        AdministrationService,
        ProjectsRepository,
        ProjectAuthorizationPolicy,
        ProjectsService,
        ItemsRepository,
        ItemAuthorizationPolicy,
        ItemsService,
        { provide: SERVICE_ENVIRONMENT, useValue: environment },
      ],
    };
  }
}
````

## File: apps/api/src/bootstrap.ts
````typescript
import "reflect-metadata";
import { resolve } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { parseServiceEnvironment } from "@mecoflow/config";
import { config as loadEnvironment } from "dotenv";
import { AppModule } from "./app.module.js";
import { JsonLogger } from "./logger.js";
import { requestLogging } from "./request-logging.js";
import { SafeApiExceptionFilter } from "./safe-api-exception.filter.js";

export async function createApplication() {
  loadEnvironment({
    path: resolve(process.cwd(), "../../.env"),
    quiet: true,
  });
  const environment = parseServiceEnvironment(process.env);
  const logger = new JsonLogger(
    "api",
    environment.APP_ENV,
    environment.LOG_LEVEL,
  );
  const app = await NestFactory.create(AppModule.register(environment), {
    bufferLogs: true,
    logger,
  });

  app.use(requestLogging(logger));
  app.enableCors({
    credentials: true,
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH"],
    origin: environment.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: false,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new SafeApiExceptionFilter());

  const openApiConfig = new DocumentBuilder()
    .setTitle("MECO Flow API")
    .setDescription("Versioned operational API for MECO Flow")
    .setVersion(environment.APP_VERSION)
    .addCookieAuth(
      "mecoflow_session",
      { in: "cookie", type: "apiKey" },
      "session",
    )
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  if (environment.NODE_ENV !== "production")
    SwaggerModule.setup("api/docs", app, openApiDocument);

  return { app, environment, openApiDocument };
}
````

## File: apps/api/tsconfig.json
````json
{
  "extends": "@mecoflow/typescript-config/nestjs.json",
  "compilerOptions": {
    "declaration": false,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
````

## File: apps/web/app/page.tsx
````typescript
import { redirect } from "next/navigation";
import { requireMe } from "./lib/api";

export default async function HomePage() {
  const me = await requireMe();
  redirect(me.shell === "INTERNAL" ? "/internal" : "/supplier");
}
````

## File: apps/web/app/styles.css
````css
@import "tailwindcss";

:root {
  color-scheme: light;
  --background: #f3f5f7;
  --surface: #ffffff;
  --text: #17212b;
  --muted: #5c6a76;
  --border: #cbd3da;
  --brand: #123f5a;
  --brand-dark: #0b293b;
  --accent: #d26a22;
  --supplier: #275941;
  --danger: #a02d2d;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--background);
  color: var(--text);
}
a {
  color: inherit;
}
h1,
h2,
p {
  margin-top: 0;
}
h1 {
  margin-bottom: 0.65rem;
  font-size: clamp(2rem, 4vw, 3.25rem);
  letter-spacing: -0.035em;
}
h2 {
  font-size: 1.15rem;
}
.eyebrow,
.shell-label {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.centered-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
}
.login-card {
  width: min(36rem, 100%);
  padding: 2.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 0.4rem solid var(--brand);
  box-shadow: 0 0.75rem 2rem rgb(23 33 43 / 10%);
}
.login-card p,
.lede,
.panel p,
.nav-card p {
  color: var(--muted);
  line-height: 1.6;
}
.button,
button {
  display: inline-block;
  border: 0;
  border-radius: 0.2rem;
  padding: 0.75rem 1rem;
  color: white;
  background: var(--brand);
  font: inherit;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.button--secondary {
  background: #52636e;
}
.button--danger {
  background: var(--danger);
}
.error {
  padding: 0.75rem;
  color: var(--danger) !important;
  border: 1px solid #e2bcbc;
  background: #fff5f5;
}
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 16rem 1fr;
}
.sidebar {
  padding: 1.5rem;
  color: white;
  background: var(--brand-dark);
}
.sidebar--supplier {
  background: #193d2c;
}
.brand {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 1.5rem;
  font-weight: 800;
  text-decoration: none;
}
.shell-label {
  color: #f1ae7e;
}
.sidebar nav {
  display: grid;
  gap: 0.4rem;
  margin-top: 2rem;
}
.sidebar nav a {
  padding: 0.7rem 0.8rem;
  border-radius: 0.2rem;
  text-decoration: none;
}
.sidebar nav a:hover,
.sidebar nav a:focus-visible {
  background: rgb(255 255 255 / 12%);
}
.shell-content {
  min-width: 0;
}
.topbar {
  min-height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 2rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.topbar div {
  display: grid;
  gap: 0.2rem;
}
.topbar span {
  color: var(--muted);
  font-size: 0.85rem;
}
.badge {
  padding: 0.3rem 0.55rem;
  border: 1px solid #9bb5c4;
  color: var(--brand) !important;
  background: #eef6fa;
  font-weight: 700;
}
.badge--supplier {
  color: var(--supplier) !important;
  border-color: #a3c2b2;
  background: #eff8f3;
}
.workspace {
  width: min(76rem, calc(100% - 3rem));
  margin: 0 auto;
  padding: 3rem 0;
}
.lede {
  max-width: 48rem;
}
.panel {
  margin-top: 1.25rem;
  padding: 1.5rem;
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 0.25rem solid var(--brand);
}
.panel--danger {
  border-top-color: var(--danger);
}
.notice {
  padding: 0.75rem;
  border: 1px solid #d4ab73;
  color: #70410f !important;
  background: #fff7e8;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}
.nav-card {
  padding: 1.35rem;
  background: var(--surface);
  border: 1px solid var(--border);
  text-decoration: none;
}
.nav-card:hover,
.nav-card:focus-visible {
  border-color: var(--brand);
  box-shadow: 0 0.35rem 1rem rgb(23 33 43 / 8%);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(10rem, 1fr));
  align-items: end;
  gap: 1rem;
}
label {
  display: grid;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 700;
}
input,
select,
textarea {
  min-height: 2.6rem;
  width: 100%;
  padding: 0.55rem;
  border: 1px solid #98a7b2;
  background: white;
  color: var(--text);
  font: inherit;
}
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 0.2rem solid #e59862;
  outline-offset: 0.15rem;
}
input[readonly] {
  color: var(--muted);
  background: #f3f5f7;
}
.heading-row,
.heading-actions,
.breadcrumbs,
.pagination,
.inline-form {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.heading-row {
  justify-content: space-between;
}
.heading-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.breadcrumbs {
  margin-bottom: 1.5rem;
  color: var(--muted);
}
.pagination {
  justify-content: space-between;
  margin-top: 1.25rem;
}
.pagination span {
  color: var(--muted);
}
.form-grid--wide {
  grid-template-columns: repeat(5, minmax(8rem, 1fr));
}
.span-all {
  grid-column: 1 / -1;
}
.status {
  display: inline-block;
  padding: 0.35rem 0.6rem;
  border: 1px solid #82929e;
  border-radius: 999px;
  color: #33444f;
  background: #edf1f3;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.status--active,
.status--completed {
  color: #14532d;
  border-color: #79a98a;
  background: #ecf8f0;
}
.status--on_hold,
.status--planned {
  color: #70410f;
  border-color: #d4ab73;
  background: #fff7e8;
}
.status--cancelled {
  color: #842727;
  border-color: #d69a9a;
  background: #fff0f0;
}
.status--inactive {
  color: #842727;
  border-color: #d69a9a;
  background: #fff0f0;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: 1.5rem;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--border);
}
.summary-grid div {
  display: grid;
  gap: 0.4rem;
  padding: 1rem;
  background: var(--surface);
}
.summary-grid span,
small {
  display: block;
  color: var(--muted);
  font-size: 0.75rem;
}
.stack {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.25rem;
}
details {
  padding: 0.9rem;
  border: 1px solid var(--border);
  background: #fafbfc;
}
summary {
  cursor: pointer;
  font-weight: 700;
}
details[open] summary {
  margin-bottom: 1rem;
}
.timeline {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.25rem;
}
.timeline article {
  padding-left: 1rem;
  border-left: 0.25rem solid var(--brand);
}
.timeline article span {
  display: block;
  margin: 0.25rem 0;
  color: var(--muted);
  font-size: 0.8rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0.7rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
th {
  color: var(--muted);
  font-size: 0.75rem;
  text-transform: uppercase;
}
.role-form fieldset {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.65rem;
  margin: 1rem 0;
  border: 1px solid var(--border);
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.checkbox input {
  width: 1rem;
  min-height: 1rem;
}
.specification-fields {
  min-width: 0;
  margin: 0;
  padding: 1rem;
  border: 1px solid var(--border);
}
.specification-fields legend {
  padding: 0 0.4rem;
  font-weight: 700;
}
.specification-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(10rem, 1fr));
  gap: 1rem;
}
.specification-checkbox {
  min-height: 2.6rem;
  padding-top: 1.4rem;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 800px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    padding: 1rem;
  }
  .sidebar nav {
    display: flex;
    margin-top: 1rem;
  }
  .topbar {
    padding: 0.8rem 1rem;
  }
  .workspace {
    width: min(100% - 2rem, 76rem);
    padding: 2rem 0;
  }
  .card-grid,
  .form-grid,
  .form-grid--wide,
  .specification-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .heading-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .heading-actions {
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }
}
````

## File: apps/web/next.config.ts
````typescript
import { resolve } from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE === "true"
    ? {
        output: "standalone" as const,
        outputFileTracingRoot: resolve(import.meta.dirname, "../.."),
      }
    : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@mecoflow/contracts", "@mecoflow/ui"],
};

export default nextConfig;
````

## File: apps/web/package.json
````json
{
  "name": "@mecoflow/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "next build",
    "clean": "node -e \"require('fs').rmSync('.next',{recursive:true,force:true})\"",
    "dev": "next dev --hostname 0.0.0.0 --port 3000",
    "lint": "eslint . --max-warnings=0",
    "start": "next start --hostname 0.0.0.0 --port 3000",
    "test": "vitest run --passWithNoTests",
    "test:integration": "vitest run --passWithNoTests",
    "typecheck": "next typegen && tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@mecoflow/contracts": "workspace:*",
    "@mecoflow/ui": "workspace:*",
    "next": "16.2.10",
    "react": "19.2.7",
    "react-dom": "19.2.7"
  },
  "devDependencies": {
    "@mecoflow/typescript-config": "workspace:*",
    "@tailwindcss/postcss": "4.3.2",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "postcss": "8.5.19",
    "tailwindcss": "4.3.2"
  }
}
````

## File: apps/worker/src/main.ts
````typescript
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { parseServiceEnvironment } from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
} from "@mecoflow/database";
import { config as loadEnvironment } from "dotenv";
import { Redis } from "ioredis";
import pino from "pino";
import { resolve } from "node:path";
import {
  heartbeatPayload,
  WORKER_HEARTBEAT_KEY,
  WORKER_HEARTBEAT_TTL_SECONDS,
} from "./heartbeat.js";

loadEnvironment({
  path: resolve(process.cwd(), "../../.env"),
  quiet: true,
});
const environment = parseServiceEnvironment(process.env);
const logger = pino({
  base: { environment: environment.APP_ENV, service: "worker" },
  level: environment.LOG_LEVEL,
  redact: {
    paths: ["*.password", "*.token", "*.secret", "*.accessKey", "*.storageKey"],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
const database = createDatabaseClient(environment.DATABASE_URL);
const redis = new Redis(environment.REDIS_URL, {
  connectTimeout: 2_000,
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 0,
});
redis.on("error", () => undefined);
const objectStorage = new S3Client({
  credentials: {
    accessKeyId: environment.S3_ACCESS_KEY,
    secretAccessKey: environment.S3_SECRET_KEY,
  },
  endpoint: environment.S3_ENDPOINT,
  forcePathStyle: environment.S3_FORCE_PATH_STYLE,
  region: environment.S3_REGION,
  requestHandler: { requestTimeout: 2_000 },
});

await database.$queryRaw`SELECT 1`;
await redis.connect();
await redis.ping();
await objectStorage.send(
  new HeadBucketCommand({ Bucket: environment.S3_BUCKET }),
);

async function writeHeartbeat(): Promise<void> {
  await redis.set(
    WORKER_HEARTBEAT_KEY,
    heartbeatPayload(environment.APP_VERSION),
    "EX",
    WORKER_HEARTBEAT_TTL_SECONDS,
  );
}

await writeHeartbeat();
logger.info(
  { event: "worker.started", version: environment.APP_VERSION },
  "Worker foundation started",
);
const heartbeatTimer = setInterval(() => {
  void writeHeartbeat().catch(() => {
    logger.error(
      { errorClassification: "dependency_failure" },
      "Worker heartbeat failed",
    );
  });
}, 10_000);

async function shutdown(signal: string): Promise<void> {
  clearInterval(heartbeatTimer);
  logger.info(
    { event: "worker.stopping", signal },
    "Worker foundation stopping",
  );
  redis.disconnect();
  objectStorage.destroy();
  await disconnectDatabaseClient();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal).finally(() => process.exit(0));
  });
}
````

## File: apps/worker/package.json
````json
{
  "name": "@mecoflow/worker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
    "dev": "tsx src/main.ts",
    "lint": "eslint src --max-warnings=0",
    "start": "node dist/main.js",
    "test": "vitest run",
    "test:integration": "vitest run --passWithNoTests",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "3.1086.0",
    "@mecoflow/config": "workspace:*",
    "@mecoflow/database": "workspace:*",
    "dotenv": "17.2.3",
    "ioredis": "5.11.1",
    "pino": "10.3.1"
  },
  "devDependencies": {
    "@mecoflow/typescript-config": "workspace:*",
    "tsx": "4.23.1"
  }
}
````

## File: docs/generated/openapi.json
````json
{
  "openapi": "3.0.0",
  "paths": {
    "/health/live": {
      "get": {
        "operationId": "HealthController_live",
        "parameters": [],
        "responses": {
          "200": {
            "description": "The API process is alive."
          }
        },
        "summary": "Process liveness probe",
        "tags": [
          "health"
        ]
      }
    },
    "/health/ready": {
      "get": {
        "operationId": "HealthController_ready",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Required dependencies are available."
          },
          "503": {
            "description": "At least one required dependency is unavailable."
          }
        },
        "summary": "Required dependency readiness probe",
        "tags": [
          "health"
        ]
      }
    },
    "/api/v1/auth/login": {
      "get": {
        "operationId": "AuthController_login",
        "parameters": [
          {
            "name": "returnTo",
            "required": false,
            "in": "query",
            "schema": {}
          }
        ],
        "responses": {
          "200": {
            "description": ""
          }
        },
        "summary": "Begin OIDC authorization code flow with PKCE",
        "tags": [
          "authentication"
        ]
      }
    },
    "/api/v1/auth/callback": {
      "get": {
        "operationId": "AuthController_callback",
        "parameters": [
          {
            "name": "state",
            "required": true,
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "code",
            "required": true,
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": ""
          }
        },
        "summary": "Complete the OIDC authorization callback",
        "tags": [
          "authentication"
        ]
      }
    },
    "/api/v1/auth/logout": {
      "post": {
        "operationId": "AuthController_logout",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "201": {
            "description": ""
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Revoke the current server-side session",
        "tags": [
          "authentication"
        ]
      }
    },
    "/api/v1/me": {
      "get": {
        "operationId": "MeController_me",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Active profile, memberships, roles, and permissions"
          },
          "401": {
            "description": "No valid server-side session"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Return the active user and authorization context",
        "tags": [
          "identity"
        ]
      }
    },
    "/api/v1/administration/organizations": {
      "get": {
        "operationId": "AdministrationController_organizations",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Authorized organizations"
          },
          "403": {
            "description": "The active principal lacks permission or internal scope"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List organizations for internal administration",
        "tags": [
          "administration"
        ]
      },
      "post": {
        "operationId": "AdministrationController_createOrganization",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateOrganizationDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Organization created"
          },
          "403": {
            "description": "The active principal lacks permission or internal scope"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create an organization",
        "tags": [
          "administration"
        ]
      }
    },
    "/api/v1/administration/roles": {
      "get": {
        "operationId": "AdministrationController_roles",
        "parameters": [],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The active principal lacks permission or internal scope"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List seeded roles",
        "tags": [
          "administration"
        ]
      }
    },
    "/api/v1/administration/users": {
      "get": {
        "operationId": "AdministrationController_users",
        "parameters": [],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The active principal lacks permission or internal scope"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List synchronized user profiles",
        "tags": [
          "administration"
        ]
      }
    },
    "/api/v1/administration/organizations/{organizationId}/memberships": {
      "get": {
        "operationId": "AdministrationController_memberships",
        "parameters": [
          {
            "name": "organizationId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The active principal lacks permission or internal scope"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List organization memberships and role assignments",
        "tags": [
          "administration"
        ]
      },
      "post": {
        "operationId": "AdministrationController_createMembership",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "organizationId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateMembershipDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The active principal lacks permission or internal scope"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create an active organization membership",
        "tags": [
          "administration"
        ]
      }
    },
    "/api/v1/administration/organizations/{organizationId}/memberships/{membershipId}/status": {
      "patch": {
        "operationId": "AdministrationController_updateMembershipStatus",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "membershipId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "organizationId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateMembershipStatusDto"
              }
            }
          }
        },
        "responses": {
          "403": {
            "description": "The active principal lacks permission or internal scope"
          },
          "404": {
            "description": "Resource is nonexistent or inaccessible"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Activate or deactivate a membership",
        "tags": [
          "administration"
        ]
      }
    },
    "/api/v1/administration/organizations/{organizationId}/memberships/{membershipId}/roles": {
      "put": {
        "operationId": "AdministrationController_assignRoles",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "membershipId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "organizationId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AssignRolesDto"
              }
            }
          }
        },
        "responses": {
          "403": {
            "description": "The active principal lacks permission or internal scope"
          },
          "404": {
            "description": "Resource is nonexistent or inaccessible"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Replace membership role assignments atomically",
        "tags": [
          "administration"
        ]
      }
    },
    "/api/v1/product-categories": {
      "get": {
        "operationId": "ProjectsController_productCategories",
        "parameters": [],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List product categories",
        "tags": [
          "projects"
        ]
      },
      "post": {
        "operationId": "ProjectsController_createProductCategory",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateProductCategoryDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create a product category",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/product-categories/{categoryId}": {
      "patch": {
        "operationId": "ProjectsController_updateProductCategory",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "categoryId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateProductCategoryDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Edit a product category with an expected version",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects": {
      "get": {
        "operationId": "ProjectsController_listProjects",
        "parameters": [
          {
            "name": "state",
            "required": false,
            "in": "query",
            "schema": {
              "enum": [
                "DRAFT",
                "PLANNED",
                "ACTIVE",
                "ON_HOLD",
                "COMPLETED",
                "CANCELLED"
              ],
              "type": "string"
            }
          },
          {
            "name": "sort",
            "required": false,
            "in": "query",
            "schema": {
              "enum": [
                "code",
                "name",
                "plannedStartDate",
                "state",
                "updatedAt"
              ],
              "type": "string"
            }
          },
          {
            "name": "q",
            "required": false,
            "in": "query",
            "schema": {
              "maxLength": 100,
              "type": "string"
            }
          },
          {
            "name": "pageSize",
            "required": false,
            "in": "query",
            "schema": {
              "minimum": 1,
              "maximum": 100,
              "type": "number"
            }
          },
          {
            "name": "page",
            "required": false,
            "in": "query",
            "schema": {
              "minimum": 1,
              "type": "number"
            }
          },
          {
            "name": "direction",
            "required": false,
            "in": "query",
            "schema": {
              "enum": [
                "asc",
                "desc"
              ],
              "type": "string"
            }
          },
          {
            "name": "categoryId",
            "required": false,
            "in": "query",
            "schema": {
              "format": "uuid",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List authorized projects with filtering, sorting, and pagination",
        "tags": [
          "projects"
        ]
      },
      "post": {
        "operationId": "ProjectsController_createProject",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateProjectDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create a draft project and assign its creator as project manager",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}": {
      "get": {
        "operationId": "ProjectsController_projectOverview",
        "parameters": [
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "403": {
            "description": "The principal lacks project permission"
          },
          "404": {
            "description": "Project is nonexistent or inaccessible"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Read an authorized project overview",
        "tags": [
          "projects"
        ]
      },
      "patch": {
        "operationId": "ProjectsController_updateProject",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateProjectDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Edit project details; state is not patchable",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}/transitions": {
      "post": {
        "operationId": "ProjectsController_transitionProject",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TransitionProjectDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Execute an explicit project-state transition",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}/member-candidates": {
      "get": {
        "operationId": "ProjectsController_memberCandidates",
        "parameters": [
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List active memberships eligible for project assignment",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}/members": {
      "post": {
        "operationId": "ProjectsController_addProjectMember",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AddProjectMemberDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Add an explicit project member",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}/members/{memberId}": {
      "patch": {
        "operationId": "ProjectsController_updateProjectMember",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "memberId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateProjectMemberDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Change a project member role or active status",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}/milestones": {
      "post": {
        "operationId": "ProjectsController_createMilestone",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateMilestoneDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create a project milestone",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}/milestones/{milestoneId}": {
      "patch": {
        "operationId": "ProjectsController_updateMilestone",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "milestoneId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateMilestoneDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Edit a project milestone",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}/work-packages": {
      "post": {
        "operationId": "ProjectsController_createWorkPackage",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateWorkPackageDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create a project work package",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/projects/{projectId}/work-packages/{workPackageId}": {
      "patch": {
        "operationId": "ProjectsController_updateWorkPackage",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "workPackageId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "projectId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateWorkPackageDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks project permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Edit a project work package",
        "tags": [
          "projects"
        ]
      }
    },
    "/api/v1/item-categories": {
      "get": {
        "operationId": "ItemsController_itemCategories",
        "parameters": [],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List item categories and attribute definitions",
        "tags": [
          "item master"
        ]
      },
      "post": {
        "operationId": "ItemsController_createItemCategory",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateItemCategoryDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create an item category",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/item-categories/{categoryId}": {
      "patch": {
        "operationId": "ItemsController_updateItemCategory",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "categoryId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateItemCategoryDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Edit an item category with an expected version",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/item-categories/{categoryId}/specification-attributes": {
      "post": {
        "operationId": "ItemsController_createSpecificationAttribute",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "categoryId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateSpecificationAttributeDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create a structured specification attribute",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/item-categories/{categoryId}/specification-attributes/{attributeId}": {
      "patch": {
        "operationId": "ItemsController_updateSpecificationAttribute",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "attributeId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "categoryId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateSpecificationAttributeDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Edit a structured specification attribute",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/units-of-measure": {
      "get": {
        "operationId": "ItemsController_unitsOfMeasure",
        "parameters": [],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "List units of measure",
        "tags": [
          "item master"
        ]
      },
      "post": {
        "operationId": "ItemsController_createUnitOfMeasure",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateUnitOfMeasureDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create a unit of measure",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/units-of-measure/{unitId}": {
      "patch": {
        "operationId": "ItemsController_updateUnitOfMeasure",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "unitId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateUnitOfMeasureDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Edit a unit of measure with an expected version",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/items/export.csv": {
      "get": {
        "operationId": "ItemsController_exportItems",
        "parameters": [
          {
            "name": "unitOfMeasureId",
            "required": false,
            "in": "query",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "q",
            "required": false,
            "in": "query",
            "schema": {
              "maxLength": 100
            }
          },
          {
            "name": "categoryId",
            "required": false,
            "in": "query",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "active",
            "required": false,
            "in": "query",
            "schema": {
              "enum": [
                "true",
                "false"
              ],
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Export the filtered internal item master as CSV",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/items": {
      "get": {
        "operationId": "ItemsController_listItems",
        "parameters": [
          {
            "name": "unitOfMeasureId",
            "required": false,
            "in": "query",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "sort",
            "required": false,
            "in": "query",
            "schema": {
              "enum": [
                "code",
                "name",
                "updatedAt"
              ],
              "type": "string"
            }
          },
          {
            "name": "q",
            "required": false,
            "in": "query",
            "schema": {
              "maxLength": 100
            }
          },
          {
            "name": "pageSize",
            "required": false,
            "in": "query",
            "schema": {
              "minimum": 1,
              "maximum": 100,
              "type": "number"
            }
          },
          {
            "name": "page",
            "required": false,
            "in": "query",
            "schema": {
              "minimum": 1,
              "type": "number"
            }
          },
          {
            "name": "direction",
            "required": false,
            "in": "query",
            "schema": {
              "enum": [
                "asc",
                "desc"
              ],
              "type": "string"
            }
          },
          {
            "name": "categoryId",
            "required": false,
            "in": "query",
            "schema": {
              "format": "uuid"
            }
          },
          {
            "name": "active",
            "required": false,
            "in": "query",
            "schema": {
              "enum": [
                "true",
                "false"
              ],
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Search and list internal item-master records",
        "tags": [
          "item master"
        ]
      },
      "post": {
        "operationId": "ItemsController_createItem",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateItemDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Create an item with structured specifications",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/items/{itemId}": {
      "get": {
        "operationId": "ItemsController_itemDetail",
        "parameters": [
          {
            "name": "itemId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "403": {
            "description": "The principal lacks the required internal item permission"
          },
          "404": {
            "description": "Item does not exist"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Read an internal item detail",
        "tags": [
          "item master"
        ]
      },
      "patch": {
        "operationId": "ItemsController_updateItem",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "itemId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateItemDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Edit an active item with an expected version",
        "tags": [
          "item master"
        ]
      }
    },
    "/api/v1/items/{itemId}/deactivate": {
      "post": {
        "operationId": "ItemsController_deactivateItem",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "itemId",
            "required": true,
            "in": "path",
            "schema": {
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/DeactivateItemDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": ""
          },
          "403": {
            "description": "The principal lacks the required internal item permission"
          }
        },
        "security": [
          {
            "session": []
          }
        ],
        "summary": "Deactivate an item; hard deletion is unavailable",
        "tags": [
          "item master"
        ]
      }
    }
  },
  "info": {
    "title": "MECO Flow API",
    "description": "Versioned operational API for MECO Flow",
    "version": "0.1.0",
    "contact": {}
  },
  "tags": [],
  "servers": [],
  "components": {
    "securitySchemes": {
      "session": {
        "type": "apiKey",
        "in": "cookie",
        "name": "mecoflow_session"
      }
    },
    "schemas": {
      "CreateOrganizationDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "SUPPLIER-ABC",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "example": "Supplier ABC",
            "maxLength": 200
          },
          "type": {
            "type": "string",
            "enum": [
              "INTERNAL",
              "SUPPLIER"
            ]
          }
        },
        "required": [
          "code",
          "name",
          "type"
        ]
      },
      "CreateMembershipDto": {
        "type": "object",
        "properties": {
          "userId": {
            "type": "string",
            "format": "uuid"
          }
        },
        "required": [
          "userId"
        ]
      },
      "UpdateMembershipStatusDto": {
        "type": "object",
        "properties": {
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "INACTIVE"
            ]
          }
        },
        "required": [
          "expectedVersion",
          "status"
        ]
      },
      "AssignRolesDto": {
        "type": "object",
        "properties": {
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          },
          "roleCodes": {
            "example": [
              "FINANCE_READONLY"
            ],
            "maxItems": 14,
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "expectedVersion",
          "roleCodes"
        ]
      },
      "CreateProductCategoryDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "PROCESS-EQUIPMENT",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 150
          },
          "description": {
            "type": "string",
            "maxLength": 500
          }
        },
        "required": [
          "code",
          "name"
        ]
      },
      "UpdateProductCategoryDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "PROCESS-EQUIPMENT",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 150
          },
          "description": {
            "type": "string",
            "maxLength": 500
          },
          "active": {
            "type": "boolean"
          },
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          }
        },
        "required": [
          "code",
          "name",
          "active",
          "expectedVersion"
        ]
      },
      "CreateProjectDto": {
        "type": "object",
        "properties": {
          "productCategoryId": {
            "type": "string",
            "format": "uuid"
          },
          "code": {
            "type": "string",
            "example": "PRJ-2026-001",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 200
          },
          "description": {
            "type": "string",
            "maxLength": 2000
          },
          "plannedStartDate": {
            "type": "string",
            "example": "2026-08-03"
          },
          "plannedEndDate": {
            "type": "string",
            "example": "2026-11-27"
          },
          "organizationId": {
            "type": "string",
            "format": "uuid"
          }
        },
        "required": [
          "productCategoryId",
          "code",
          "name",
          "plannedStartDate",
          "plannedEndDate",
          "organizationId"
        ]
      },
      "UpdateProjectDto": {
        "type": "object",
        "properties": {
          "productCategoryId": {
            "type": "string",
            "format": "uuid"
          },
          "code": {
            "type": "string",
            "example": "PRJ-2026-001",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 200
          },
          "description": {
            "type": "string",
            "maxLength": 2000
          },
          "plannedStartDate": {
            "type": "string",
            "example": "2026-08-03"
          },
          "plannedEndDate": {
            "type": "string",
            "example": "2026-11-27"
          },
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          }
        },
        "required": [
          "productCategoryId",
          "code",
          "name",
          "plannedStartDate",
          "plannedEndDate",
          "expectedVersion"
        ]
      },
      "TransitionProjectDto": {
        "type": "object",
        "properties": {
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          },
          "reason": {
            "type": "string",
            "maxLength": 500,
            "minLength": 5
          },
          "targetState": {
            "type": "string",
            "enum": [
              "DRAFT",
              "PLANNED",
              "ACTIVE",
              "ON_HOLD",
              "COMPLETED",
              "CANCELLED"
            ]
          }
        },
        "required": [
          "expectedVersion",
          "reason",
          "targetState"
        ]
      },
      "AddProjectMemberDto": {
        "type": "object",
        "properties": {
          "membershipId": {
            "type": "string",
            "format": "uuid"
          },
          "role": {
            "type": "string",
            "enum": [
              "CONTRIBUTOR",
              "PROJECT_MANAGER",
              "SUPPLIER",
              "VIEWER"
            ]
          }
        },
        "required": [
          "membershipId",
          "role"
        ]
      },
      "UpdateProjectMemberDto": {
        "type": "object",
        "properties": {
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          },
          "role": {
            "type": "string",
            "enum": [
              "CONTRIBUTOR",
              "PROJECT_MANAGER",
              "SUPPLIER",
              "VIEWER"
            ]
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "INACTIVE"
            ]
          }
        },
        "required": [
          "expectedVersion",
          "role",
          "status"
        ]
      },
      "CreateMilestoneDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 200
          },
          "description": {
            "type": "string",
            "maxLength": 1000
          },
          "targetDate": {
            "type": "string",
            "example": "2026-09-14"
          }
        },
        "required": [
          "code",
          "name",
          "targetDate"
        ]
      },
      "UpdateMilestoneDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 200
          },
          "description": {
            "type": "string",
            "maxLength": 1000
          },
          "targetDate": {
            "type": "string",
            "example": "2026-09-14"
          },
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          }
        },
        "required": [
          "code",
          "name",
          "targetDate",
          "expectedVersion"
        ]
      },
      "CreateWorkPackageDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 200
          },
          "description": {
            "type": "string",
            "maxLength": 1000
          },
          "milestoneId": {
            "type": "string",
            "format": "uuid",
            "nullable": true
          },
          "plannedStartDate": {
            "type": "string",
            "example": "2026-08-03"
          },
          "plannedEndDate": {
            "type": "string",
            "example": "2026-09-11"
          }
        },
        "required": [
          "code",
          "name",
          "plannedStartDate",
          "plannedEndDate"
        ]
      },
      "UpdateWorkPackageDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 200
          },
          "description": {
            "type": "string",
            "maxLength": 1000
          },
          "milestoneId": {
            "type": "string",
            "format": "uuid",
            "nullable": true
          },
          "plannedStartDate": {
            "type": "string",
            "example": "2026-08-03"
          },
          "plannedEndDate": {
            "type": "string",
            "example": "2026-09-11"
          },
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          }
        },
        "required": [
          "code",
          "name",
          "plannedStartDate",
          "plannedEndDate",
          "expectedVersion"
        ]
      },
      "CreateItemCategoryDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "RAW-MATERIAL",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 150
          },
          "description": {
            "type": "string",
            "maxLength": 500
          }
        },
        "required": [
          "code",
          "name"
        ]
      },
      "UpdateItemCategoryDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "RAW-MATERIAL",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 150
          },
          "description": {
            "type": "string",
            "maxLength": 500
          },
          "active": {
            "type": "boolean"
          },
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          }
        },
        "required": [
          "code",
          "name",
          "active",
          "expectedVersion"
        ]
      },
      "CreateSpecificationAttributeDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "THICKNESS",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 150
          },
          "description": {
            "type": "string",
            "maxLength": 500
          },
          "dataType": {
            "type": "string",
            "enum": [
              "BOOLEAN",
              "NUMBER",
              "TEXT"
            ]
          },
          "required": {
            "type": "boolean"
          },
          "unitOfMeasureId": {
            "type": "string",
            "format": "uuid"
          },
          "decimalPrecision": {
            "type": "number",
            "maximum": 6,
            "minimum": 0
          },
          "sortOrder": {
            "type": "number",
            "maximum": 10000,
            "minimum": 0
          }
        },
        "required": [
          "code",
          "name",
          "dataType",
          "required",
          "sortOrder"
        ]
      },
      "UpdateSpecificationAttributeDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "THICKNESS",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 150
          },
          "description": {
            "type": "string",
            "maxLength": 500
          },
          "dataType": {
            "type": "string",
            "enum": [
              "BOOLEAN",
              "NUMBER",
              "TEXT"
            ]
          },
          "required": {
            "type": "boolean"
          },
          "unitOfMeasureId": {
            "type": "string",
            "format": "uuid"
          },
          "decimalPrecision": {
            "type": "number",
            "maximum": 6,
            "minimum": 0
          },
          "sortOrder": {
            "type": "number",
            "maximum": 10000,
            "minimum": 0
          },
          "active": {
            "type": "boolean"
          },
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          }
        },
        "required": [
          "code",
          "name",
          "dataType",
          "required",
          "sortOrder",
          "active",
          "expectedVersion"
        ]
      },
      "CreateUnitOfMeasureDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "MM",
            "maxLength": 30
          },
          "name": {
            "type": "string",
            "maxLength": 100
          },
          "symbol": {
            "type": "string",
            "maxLength": 20
          },
          "decimalPrecision": {
            "type": "number",
            "maximum": 6,
            "minimum": 0
          }
        },
        "required": [
          "code",
          "name",
          "symbol",
          "decimalPrecision"
        ]
      },
      "UpdateUnitOfMeasureDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "MM",
            "maxLength": 30
          },
          "name": {
            "type": "string",
            "maxLength": 100
          },
          "symbol": {
            "type": "string",
            "maxLength": 20
          },
          "decimalPrecision": {
            "type": "number",
            "maximum": 6,
            "minimum": 0
          },
          "active": {
            "type": "boolean"
          },
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          }
        },
        "required": [
          "code",
          "name",
          "symbol",
          "decimalPrecision",
          "active",
          "expectedVersion"
        ]
      },
      "SpecificationValueDto": {
        "type": "object",
        "properties": {
          "attributeDefinitionId": {
            "type": "string",
            "format": "uuid"
          },
          "value": {
            "oneOf": [
              {
                "type": "string"
              },
              {
                "type": "boolean"
              }
            ]
          }
        },
        "required": [
          "attributeDefinitionId",
          "value"
        ]
      },
      "CreateItemDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "PLATE-SS304-6MM",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 200
          },
          "description": {
            "type": "string",
            "maxLength": 2000
          },
          "unitOfMeasureId": {
            "type": "string",
            "format": "uuid"
          },
          "specificationValues": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SpecificationValueDto"
            }
          },
          "itemCategoryId": {
            "type": "string",
            "format": "uuid"
          }
        },
        "required": [
          "code",
          "name",
          "unitOfMeasureId",
          "specificationValues",
          "itemCategoryId"
        ]
      },
      "UpdateItemDto": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "PLATE-SS304-6MM",
            "maxLength": 50
          },
          "name": {
            "type": "string",
            "maxLength": 200
          },
          "description": {
            "type": "string",
            "maxLength": 2000
          },
          "unitOfMeasureId": {
            "type": "string",
            "format": "uuid"
          },
          "specificationValues": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SpecificationValueDto"
            }
          },
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          }
        },
        "required": [
          "code",
          "name",
          "unitOfMeasureId",
          "specificationValues",
          "expectedVersion"
        ]
      },
      "DeactivateItemDto": {
        "type": "object",
        "properties": {
          "expectedVersion": {
            "type": "number",
            "minimum": 1
          },
          "reason": {
            "type": "string",
            "maxLength": 500,
            "minLength": 5
          }
        },
        "required": [
          "expectedVersion",
          "reason"
        ]
      }
    }
  }
}
````

## File: docs/AUTHORIZATION_MATRIX.md
````markdown
# Authorization matrix

## Phase 1 decision model

Every protected API operation requires a valid opaque server-side session, an active `UserProfile`, at least one active membership in an active organization, the required permission, and the applicable organization/object policy. A role grants permissions but never scope by itself. The API denies by default; web navigation is presentation only.

`SYSTEM_ADMIN` may administer organizations through an active internal membership. It is not exempt from authentication, active-state, CSRF, optimistic-concurrency, or audit controls. Supplier memberships never satisfy the internal-administration policy.

Project and item-master permissions are retained in the cumulative seed catalog, but Phase 1 itself exposes no project or item records, routes, or screens.

## Seeded permission catalog

| Permission                   | Current meaning                                      |
| ---------------------------- | ---------------------------------------------------- |
| `administration.access`      | Enter internal identity/organization administration |
| `organization.read`          | Read organizations through internal administration  |
| `organization.write`         | Create or change organizations                       |
| `membership.read`            | Read organization memberships                        |
| `membership.write`           | Create, activate, or deactivate memberships          |
| `role.read`                  | Read roles and assignments                           |
| `role.assign`                | Replace membership role assignments                  |
| `user.read`                  | Read authorized synchronized profiles                |
| `audit.read`                 | Read authorized audit history                        |
| `supplier.organization.read` | Read the principal's supplier organization           |
| `supplier.membership.read`   | Reserved own-supplier membership read                |
| `supplier.membership.write`  | Reserved own-supplier membership administration      |
| `project.read`               | Read projects allowed by project policy              |
| `project.write`              | Change projects allowed by project policy            |
| `project.membership.manage`  | Manage explicit project scope                        |
| `item.read`                  | Read the global internal item master                 |
| `item.write`                 | Create or change internal item-master records        |
| `item.export`                | Export filtered internal item-master records         |

## Seeded role mapping

| Role               | Organization scope | Seeded permissions                                                                                                                                          |
| ------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SYSTEM_ADMIN`     | Internal           | All seeded permissions; global catalog actions still require an active internal membership and are audited                                                  |
| `MECO_MANAGEMENT`  | Internal           | `organization.read`, `user.read`, `project.read`, `audit.read`, `item.read`, `item.export`                                                                  |
| `PROJECT_MANAGER`  | Internal           | `project.read`, `project.write`, `project.membership.manage`, `item.read`                                                                                   |
| `ENGINEERING`      | Internal           | `project.read`, `project.write`, `item.read`, `item.write`, `item.export`                                                                                   |
| `PPIC`             | Internal           | `project.read`, `project.write`, `item.read`, `item.export`                                                                                                 |
| `PURCHASING`       | Internal           | `project.read`, `project.write`, `item.read`, `item.export`                                                                                                 |
| `WAREHOUSE`        | Internal           | `project.read`, `project.write`, `item.read`                                                                                                                |
| `QA_QC`            | Internal           | `project.read`, `project.write`, `item.read`, `item.export`                                                                                                 |
| `PRODUCTION`       | Internal           | `project.read`, `item.read`                                                                                                                                 |
| `FINANCE_READONLY` | Internal           | `project.read`, `item.read`; no write/export permission                                                                                                     |
| `AUDITOR_READONLY` | Internal           | `project.read`, `audit.read`, `item.read`, `item.export`; no write permission                                                                               |
| `SUPPLIER_ADMIN`   | Own supplier       | `supplier.organization.read`, `supplier.membership.read`, `supplier.membership.write`, `project.read`; no internal administration or item-master permission |
| `SUPPLIER_USER`    | Own supplier       | `supplier.organization.read`, `project.read`; no internal administration or item-master permission                                                         |
| `CUSTOMER_VIEWER`  | Reserved           | None; no MVP application surface                                                                                                                            |

## Phase 1 endpoint policy

| API surface                                                              | Required policy                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `GET /api/v1/me`                                                         | Authenticated, active user, active membership, active organization        |
| `GET /api/v1/administration/organizations`                               | Internal administration + `organization.read`                             |
| `POST /api/v1/administration/organizations`                              | Internal administration + `organization.write` + CSRF                     |
| `GET /api/v1/administration/users`                                       | Internal administration + `user.read`                                     |
| `GET /api/v1/administration/roles`                                       | Internal administration + `role.read`                                     |
| `GET /api/v1/administration/organizations/{organizationId}/memberships`  | Internal administration + `membership.read` + organization scope          |
| `POST /api/v1/administration/organizations/{organizationId}/memberships` | Internal administration + `membership.write` + organization scope + CSRF  |
| `PATCH .../memberships/{membershipId}/status`                            | Internal administration + `membership.write` + scoped object ID + CSRF    |
| `PUT .../memberships/{membershipId}/roles`                               | Internal administration + `role.assign` + scoped object ID + CSRF + audit |

Membership object queries include both membership and organization identifiers. Supplier attempts against real own, real foreign, and nonexistent identifiers return the same safe denial. Internal scoped lookups return generic not-found responses for nonexistent/inaccessible protected objects.

## Mandatory negative evidence

Automated authorization tests cover unauthenticated/inactive principals, inactive memberships, supplier internal-administration denial, read-only write denial, organization identifier manipulation, CSRF enforcement through all write paths, project-policy deny-capable interfaces, and immutable audit persistence for role changes. Phase 2 adds Supplier A/B project-object tests; Phase 3A adds supplier item-master denial plus permission-specific read/write/export evidence.

## Phase 2 project decision model

Project permissions remain necessary but never create project scope. `SYSTEM_ADMIN` can access internal projects for authenticated oversight. `MECO_MANAGEMENT` can read projects in its internal organization. Other internal roles require an active explicit `ProjectMember` assignment. Supplier roles require an active explicit supplier project-member assignment and remain read-only. Inactive assignments, inactive organization memberships, and inactive organizations grant no scope.

| API surface                           | Required policy                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /api/v1/product-categories`      | Active principal + `project.read`; supplier-only results are active-only                       |
| Category `POST`/`PATCH`               | Active internal membership + `project.write` + CSRF + expected version on edit                 |
| `GET /api/v1/projects`                | `project.read` + repository-scoped result query                                                |
| `POST /api/v1/projects`               | Active internal membership in requested organization + `project.write` + CSRF                  |
| Project `GET`                         | `project.read` + project scope; supplier response field filtering                              |
| Project details `PATCH`               | `project.write` + writable project scope + nonterminal state + CSRF + expected version         |
| `POST .../transitions`                | `project.write` + writable project scope + allowed transition + CSRF + expected version        |
| Member candidate/read/write routes    | `project.membership.manage` + writable project scope; CSRF and expected version for changes    |
| Milestone/work-package `POST`/`PATCH` | `project.write` + writable project scope + nonterminal state + CSRF + expected version on edit |

Project identifiers outside scope and nonexistent project identifiers both return generic not-found responses for principals that otherwise hold `project.read`. Supplier responses never expose project member identities or transition history. Browser route visibility remains presentation only.

## Phase 3A item-master decision model

The item master is one global catalog shared across active internal organizations. Organization identity does not partition item/category/unit records; it supplies the actor scope attached to audit events. Every route requires an active internal membership plus the specific item permission. Supplier and customer roles receive no item permission and are denied before item data is disclosed. Web navigation and hidden controls remain presentation only.

| API surface                                                                           | Required policy                                                                                       |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `GET /api/v1/item-categories` and `GET /api/v1/units-of-measure`                      | Active internal membership + `item.read`                                                              |
| Category/unit `POST`                                                                  | Active internal membership + `item.write` + CSRF + same-transaction audit                            |
| Category/unit `PATCH`                                                                 | Active internal membership + `item.write` + CSRF + expected version + reference-integrity validation |
| Specification-attribute `POST`                                                        | Active internal membership + `item.write` + CSRF + active category/unit validation                   |
| Specification-attribute `PATCH`                                                       | Active internal membership + `item.write` + CSRF + expected version + structural-integrity checks    |
| `GET /api/v1/items` and `GET /api/v1/items/{itemId}`                                  | Active internal membership + `item.read`                                                              |
| `POST /api/v1/items`                                                                  | Active internal membership + `item.write` + CSRF + typed specification validation                    |
| `PATCH /api/v1/items/{itemId}`                                                        | Active internal membership + `item.write` + CSRF + expected version + active item                    |
| `POST /api/v1/items/{itemId}/deactivate`                                              | Active internal membership + `item.write` + CSRF + expected version + reason                         |
| `GET /api/v1/items/export.csv`                                                        | Active internal membership + `item.export` + bounded filters + export audit                          |
| `DELETE /api/v1/items/{itemId}`                                                       | Not implemented; database deletion is rejected                                                       |

Supplier attempts against real and nonexistent item identifiers return the same safe denial. Permitted readers receive the generic not-found contract for a nonexistent item. Authorization tests separately prove that read does not imply write or export, export does not imply write, missing CSRF denies every unsafe route, and failed commands do not leave business or success-audit state.
````

## File: docs/DEPLOYMENT.md
````markdown
# Deployment and local setup

## Local topology

Docker Compose runs PostgreSQL on 5432, Redis on 6379, MinIO API/console on 9000/9001, Keycloak on 8180, and Mailpit SMTP/UI on 1025/8025. Applications normally run from pnpm on ports 3000 (web) and 3001 (API); the worker is headless. The non-default Keycloak host port avoids common local port collisions and is configurable through `KEYCLOAK_HTTP_PORT`.

Local Compose ports bind to `127.0.0.1` so development databases and administrative consoles are not exposed on LAN interfaces. Copy `.env.example` to `.env` only when `.env` does not exist and change local credentials as appropriate. Then run:

```text
corepack prepare pnpm@11.13.0 --activate
pnpm install --frozen-lockfile
pnpm compose:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`infra/scripts/setup.ps1` automates the non-blocking initialization sequence through database seed and then tells the developer to run `pnpm dev`. It resolves the repository root from its own location and never overwrites `.env`. Production-mode application startup rejects documented local placeholder values. Production/staging must use an external secret manager or injected secrets, TLS/reverse proxy, non-default Keycloak administrators, durable volumes, backups, monitoring and restricted administrative ports.

## Health

Use `/health/live` only for process liveness. `/health/ready` checks PostgreSQL, Redis and the configured private object-storage bucket and returns 503 when unavailable without credentials or detailed endpoints. Container health checks use service-native probes. No production deployment is authorized or performed by Phase 0.
````

## File: docs/DOMAIN_MODEL.md
````markdown
# Domain model

## Aggregate boundaries

Planned aggregate roots are Organization, UserProfile, Project, Item, BOM, PurchaseRequisition, PurchaseOrder, AdvanceShipmentNotice, GoodsReceipt, ReceivingInspection, InventoryLot, NCR, Document, and ReadinessSnapshot. Important editable roots use UUID identifiers, UTC timestamps, and integer `version` fields. Operational history is corrected, cancelled, superseded, or deactivated rather than hard-deleted.

## Material lifecycle

```text
Project/work package -> released BOM requirement -> requisition -> PO allocation -> supplier commitment
-> ASN/shipment -> posted receipt -> inspection -> traceable inventory lot -> material allocation -> readiness
```

Only released, active BOM requirements affect official readiness. PO lines may supply several BOM lines through explicit allocation. Supplier commitments are append-only revisions. Posted receipts use traceable corrections. Accepted or explicitly conditionally accepted lots alone may be allocated, and allocation must be concurrency safe.

## Quantity invariants

Quantities are positive decimals. Received quantity cannot exceed valid ordered quantity without an authorized recorded override. Accepted plus rejected cannot exceed received. Allocated cannot exceed accepted available quantity. Availability never becomes negative. Idempotency and uniqueness prevent duplicate receipt, commitment, and allocation effects.

## Readiness model

Every released requirement projects ordered, confirmed, shipped, received, accepted, allocated, document-complete and shortage quantities plus dates, stage, risk and blocker explanations. Stage scores are criticality weighted (`CRITICAL=8`, `HIGH=4`, `NORMAL=2`, `LOW=1`). RED/AMBER/GREEN/COMPLETE gates override aggregate percentages when critical conditions require it. Calculations are pure, versioned, deterministic, independently tested, and retain explanations and recommended actions.

## Phase 0 database scope

Phase 0 intentionally creates only `SystemMetadata`, a technical table used to prove migration, connectivity and deterministic seed mechanics. Business entities begin in their designated phases; this avoids creating an unreviewed partial operational schema.

## Phase 1 identity and authorization scope

`UserProfile` mirrors a Keycloak issuer/subject identity without storing passwords. `Organization` and `Membership` establish active internal or supplier scope. Seeded `Role`, `Permission`, `RolePermission`, and `MembershipRole` records provide grants; scope remains a separate policy decision. Opaque `Session` and short-lived `OidcAuthTransaction` records support authentication. `AuditEvent` is append-only and transactionally records membership and role changes. No project aggregate or operational entity is introduced in Phase 1.

## Phase 2 project scope

`Project` is the Phase 2 aggregate root. It belongs to one active internal organization and one product category, owns project-member assignments, milestones, work packages, and immutable transition history, and carries an integer version. Project, category, member, milestone, and work-package edits use optimistic versions. Planned and child dates are stored as PostgreSQL dates; timestamps remain UTC.

Project state is changed only by an explicit transition operation: `DRAFT` to `PLANNED`/`CANCELLED`; `PLANNED` to `ACTIVE`/`ON_HOLD`/`CANCELLED`; `ACTIVE` to `ON_HOLD`/`COMPLETED`/`CANCELLED`; and `ON_HOLD` to `ACTIVE`/`CANCELLED`. `COMPLETED` and `CANCELLED` are terminal and read-only in Phase 2. Each transition stores actor, UTC timestamp, source, target, and reason and is immutable at the database layer.

An active `ProjectMember` links a project to an active organization membership. Internal members must belong to the owning organization. Supplier membership is an explicit read-sharing boundary; assignment never grants supplier write permission. A project always retains at least one active project manager. Milestones fall within project dates. Work-package dates fall within project dates and optional milestone links cannot cross project boundaries.

## Phase 3A item-master scope

`Item` is the Phase 3A aggregate root. The item master is a single global internal catalog shared by active internal organizations rather than partitioned by organization. `ItemCategory`, `UnitOfMeasure`, `SpecificationAttributeDefinition`, and `Item` are versioned. Item-category, unit, and item codes are normalized to uppercase and globally unique; an attribute code is unique within its category. Deactivation retains every record, so a code remains reserved.

An item belongs to exactly one item category for its lifetime and uses one active base unit of measure. Its category association cannot be changed after creation. Categories define ordered `TEXT`, `NUMBER`, or `BOOLEAN` specification attributes. Text and boolean attributes cannot carry a unit or decimal precision. Numeric attributes have precision from zero through six, may reference an active unit, and cannot be more precise than that unit. Item values are stored in typed columns and must match an active definition in the item's category, contain no duplicate attribute, satisfy every active required definition, and respect text and numeric bounds.

Active item and attribute references prevent category or unit deactivation. A used attribute's data type, unit, and precision cannot change; making a definition required is rejected while an active item lacks its value. Items can only move from active to inactive through the explicit versioned deactivation command with a reason. Inactive items are read-only, no normal delete route exists, restrictive foreign keys retain their values, and a PostgreSQL trigger rejects item deletion.

Phase 3A creates no BOM, item revision, import, or procurement aggregate and emits no outbox record because it starts no asynchronous work.
````

## File: infra/docker/README.md
````markdown
# Application containers

Application Dockerfiles live with each deployable. Images use Node 24, non-root runtime users, and multi-stage production outputs: API/worker images contain filtered production dependencies and compiled artifacts, while the web image uses Next.js standalone output. Build tools, source trees, tests, and unrelated workspace applications are not copied into runtime stages. Compose currently starts local dependencies; a staging-like application profile can be added after the foundation is verified.
````

## File: infra/keycloak/mecoflow-local-realm.json
````json
{
  "realm": "mecoflow-local",
  "displayName": "MECO Flow Local Development",
  "enabled": true,
  "registrationAllowed": false,
  "resetPasswordAllowed": false,
  "rememberMe": false,
  "loginWithEmailAllowed": true,
  "sslRequired": "external",
  "clients": [
    {
      "clientId": "mecoflow-web",
      "name": "MECO Flow local web client",
      "enabled": true,
      "publicClient": true,
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": false,
      "serviceAccountsEnabled": false,
      "redirectUris": ["http://localhost:3001/api/v1/auth/callback"],
      "webOrigins": ["http://localhost:3000"],
      "attributes": {
        "pkce.code.challenge.method": "S256",
        "post.logout.redirect.uris": "http://localhost:3000/*"
      }
    }
  ],
  "users": [
    {
      "id": "30000000-0000-4000-8000-000000000001",
      "username": "internal.admin@mecoflow.local",
      "email": "internal.admin@mecoflow.local",
      "firstName": "Internal",
      "lastName": "Administrator",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        { "type": "password", "value": "local-only-admin", "temporary": false }
      ]
    },
    {
      "id": "30000000-0000-4000-8000-000000000002",
      "username": "finance.readonly@mecoflow.local",
      "email": "finance.readonly@mecoflow.local",
      "firstName": "Finance",
      "lastName": "Readonly",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "local-only-readonly",
          "temporary": false
        }
      ]
    },
    {
      "id": "30000000-0000-4000-8000-000000000003",
      "username": "supplier.admin@mecoflow.local",
      "email": "supplier.admin@mecoflow.local",
      "firstName": "Supplier",
      "lastName": "Administrator",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "local-only-supplier",
          "temporary": false
        }
      ]
    },
    {
      "id": "30000000-0000-4000-8000-000000000004",
      "username": "inactive.user@mecoflow.local",
      "email": "inactive.user@mecoflow.local",
      "firstName": "Inactive",
      "lastName": "User",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "local-only-inactive",
          "temporary": false
        }
      ]
    },
    {
      "id": "30000000-0000-4000-8000-000000000005",
      "username": "inactive.membership@mecoflow.local",
      "email": "inactive.membership@mecoflow.local",
      "firstName": "Inactive",
      "lastName": "Membership",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "local-only-inactive",
          "temporary": false
        }
      ]
    }
  ]
}
````

## File: infra/scripts/setup.ps1
````powershell
$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string[]]$ArgumentList
  )

  & $FilePath @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "Command '$FilePath $($ArgumentList -join ' ')' failed with exit code $LASTEXITCODE."
  }
}

Push-Location -LiteralPath $repositoryRoot
try {
  foreach ($command in @('node', 'corepack', 'docker')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
      throw "Required tool '$command' was not found on PATH."
    }
  }

  Invoke-CheckedCommand -FilePath 'docker' -ArgumentList @('compose', 'version')

  if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Write-Output 'Created .env from local-development example. Review credentials before non-local use.'
  } else {
    Write-Output 'Existing .env preserved.'
  }

  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('prepare', 'pnpm@11.13.0', '--activate')
  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('pnpm', 'install', '--frozen-lockfile')
  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('pnpm', 'compose:up')
  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('pnpm', 'db:migrate')
  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('pnpm', 'db:seed')

  Write-Output 'MECO Flow infrastructure and database foundation are ready.'
  Write-Output 'Run pnpm dev to start the web, API, and worker processes:'
  Write-Output '  Web:      http://localhost:3000'
  Write-Output '  API:      http://localhost:3001/health/live'
  Write-Output '  Keycloak: http://localhost:8180'
  Write-Output '  MinIO:    http://localhost:9001'
  Write-Output '  Mailpit:  http://localhost:8025'
} finally {
  Pop-Location
}
````

## File: packages/database/prisma/schema.prisma
````prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model SystemMetadata {
  id        String   @id @default(uuid()) @db.Uuid
  key       String   @unique @db.VarChar(100)
  value     String   @db.VarChar(500)
  version   Int      @default(1)
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)

  @@map("system_metadata")
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum OrganizationType {
  INTERNAL
  SUPPLIER
}

enum MembershipStatus {
  ACTIVE
  INACTIVE
}

enum RoleScope {
  INTERNAL
  SUPPLIER
  ANY
}

enum ProjectState {
  DRAFT
  PLANNED
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
}

enum ProjectMemberRole {
  PROJECT_MANAGER
  CONTRIBUTOR
  VIEWER
  SUPPLIER
}

enum ProjectMemberStatus {
  ACTIVE
  INACTIVE
}

enum SpecificationDataType {
  TEXT
  NUMBER
  BOOLEAN
}

model UserProfile {
  id                  String              @id @default(uuid()) @db.Uuid
  issuer              String              @db.VarChar(500)
  subject             String              @db.VarChar(255)
  email               String              @db.VarChar(320)
  displayName         String              @db.VarChar(200)
  locale              String              @default("en") @db.VarChar(10)
  status              UserStatus          @default(ACTIVE)
  lastLoginAt         DateTime?           @db.Timestamptz(3)
  version             Int                 @default(1)
  createdAt           DateTime            @default(now()) @db.Timestamptz(3)
  updatedAt           DateTime            @updatedAt @db.Timestamptz(3)
  memberships         Membership[]
  sessions            Session[]
  assignedRoles       MembershipRole[]    @relation("RoleAssignedBy")
  auditEvents         AuditEvent[]        @relation("AuditActor")
  createdProjects     Project[]           @relation("ProjectCreatedBy")
  addedProjectMembers ProjectMember[]     @relation("ProjectMemberAddedBy")
  projectTransitions  ProjectTransition[] @relation("ProjectTransitionActor")
  createdItems        Item[]              @relation("ItemCreatedBy")

  @@unique([issuer, subject])
  @@index([email])
  @@map("user_profiles")
}

model Organization {
  id          String           @id @default(uuid()) @db.Uuid
  code        String           @unique @db.VarChar(50)
  name        String           @db.VarChar(200)
  type        OrganizationType
  active      Boolean          @default(true)
  version     Int              @default(1)
  createdAt   DateTime         @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime         @updatedAt @db.Timestamptz(3)
  memberships Membership[]
  auditEvents AuditEvent[]
  projects    Project[]

  @@map("organizations")
}

model Membership {
  id             String           @id @default(uuid()) @db.Uuid
  userId         String           @db.Uuid
  organizationId String           @db.Uuid
  status         MembershipStatus @default(ACTIVE)
  version        Int              @default(1)
  createdAt      DateTime         @default(now()) @db.Timestamptz(3)
  updatedAt      DateTime         @updatedAt @db.Timestamptz(3)
  user           UserProfile      @relation(fields: [userId], references: [id], onDelete: Restrict)
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  roles          MembershipRole[]
  projectMembers ProjectMember[]

  @@unique([userId, organizationId])
  @@index([organizationId, status])
  @@map("memberships")
}

model ProductCategory {
  id          String    @id @default(uuid()) @db.Uuid
  code        String    @unique @db.VarChar(50)
  name        String    @db.VarChar(150)
  description String    @default("") @db.VarChar(500)
  active      Boolean   @default(true)
  version     Int       @default(1)
  createdAt   DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime  @updatedAt @db.Timestamptz(3)
  projects    Project[]

  @@index([active, name])
  @@map("product_categories")
}

model Project {
  id                String              @id @default(uuid()) @db.Uuid
  organizationId    String              @db.Uuid
  productCategoryId String              @db.Uuid
  code              String              @db.VarChar(50)
  name              String              @db.VarChar(200)
  description       String              @default("") @db.VarChar(2000)
  state             ProjectState        @default(DRAFT)
  plannedStartDate  DateTime            @db.Date
  plannedEndDate    DateTime            @db.Date
  version           Int                 @default(1)
  createdByUserId   String              @db.Uuid
  createdAt         DateTime            @default(now()) @db.Timestamptz(3)
  updatedAt         DateTime            @updatedAt @db.Timestamptz(3)
  organization      Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  productCategory   ProductCategory     @relation(fields: [productCategoryId], references: [id], onDelete: Restrict)
  createdBy         UserProfile         @relation("ProjectCreatedBy", fields: [createdByUserId], references: [id], onDelete: Restrict)
  members           ProjectMember[]
  milestones        Milestone[]
  workPackages      WorkPackage[]
  transitions       ProjectTransition[]

  @@unique([organizationId, code])
  @@index([organizationId, state, updatedAt])
  @@index([productCategoryId, state])
  @@map("projects")
}

model ProjectMember {
  id            String              @id @default(uuid()) @db.Uuid
  projectId     String              @db.Uuid
  membershipId  String              @db.Uuid
  role          ProjectMemberRole
  status        ProjectMemberStatus @default(ACTIVE)
  version       Int                 @default(1)
  addedByUserId String              @db.Uuid
  createdAt     DateTime            @default(now()) @db.Timestamptz(3)
  updatedAt     DateTime            @updatedAt @db.Timestamptz(3)
  project       Project             @relation(fields: [projectId], references: [id], onDelete: Restrict)
  membership    Membership          @relation(fields: [membershipId], references: [id], onDelete: Restrict)
  addedBy       UserProfile         @relation("ProjectMemberAddedBy", fields: [addedByUserId], references: [id], onDelete: Restrict)

  @@unique([projectId, membershipId])
  @@index([membershipId, status])
  @@map("project_members")
}

model Milestone {
  id           String        @id @default(uuid()) @db.Uuid
  projectId    String        @db.Uuid
  code         String        @db.VarChar(50)
  name         String        @db.VarChar(200)
  description  String        @default("") @db.VarChar(1000)
  targetDate   DateTime      @db.Date
  version      Int           @default(1)
  createdAt    DateTime      @default(now()) @db.Timestamptz(3)
  updatedAt    DateTime      @updatedAt @db.Timestamptz(3)
  project      Project       @relation(fields: [projectId], references: [id], onDelete: Restrict)
  workPackages WorkPackage[]

  @@unique([projectId, code])
  @@index([projectId, targetDate])
  @@map("milestones")
}

model WorkPackage {
  id               String     @id @default(uuid()) @db.Uuid
  projectId        String     @db.Uuid
  milestoneId      String?    @db.Uuid
  code             String     @db.VarChar(50)
  name             String     @db.VarChar(200)
  description      String     @default("") @db.VarChar(1000)
  plannedStartDate DateTime   @db.Date
  plannedEndDate   DateTime   @db.Date
  version          Int        @default(1)
  createdAt        DateTime   @default(now()) @db.Timestamptz(3)
  updatedAt        DateTime   @updatedAt @db.Timestamptz(3)
  project          Project    @relation(fields: [projectId], references: [id], onDelete: Restrict)
  milestone        Milestone? @relation(fields: [milestoneId], references: [id], onDelete: Restrict)

  @@unique([projectId, code])
  @@index([projectId, plannedStartDate])
  @@index([milestoneId])
  @@map("work_packages")
}

model ProjectTransition {
  id          String       @id @default(uuid()) @db.Uuid
  projectId   String       @db.Uuid
  actorUserId String       @db.Uuid
  sourceState ProjectState
  targetState ProjectState
  reason      String       @db.VarChar(500)
  occurredAt  DateTime     @default(now()) @db.Timestamptz(3)
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Restrict)
  actor       UserProfile  @relation("ProjectTransitionActor", fields: [actorUserId], references: [id], onDelete: Restrict)

  @@index([projectId, occurredAt])
  @@map("project_transitions")
}

model ItemCategory {
  id                      String                             @id @default(uuid()) @db.Uuid
  code                    String                             @unique @db.VarChar(50)
  name                    String                             @db.VarChar(150)
  description             String                             @default("") @db.VarChar(500)
  active                  Boolean                            @default(true)
  version                 Int                                @default(1)
  createdAt               DateTime                           @default(now()) @db.Timestamptz(3)
  updatedAt               DateTime                           @updatedAt @db.Timestamptz(3)
  specificationAttributes SpecificationAttributeDefinition[]
  items                   Item[]

  @@index([active, name])
  @@map("item_categories")
}

model UnitOfMeasure {
  id                      String                             @id @default(uuid()) @db.Uuid
  code                    String                             @unique @db.VarChar(30)
  name                    String                             @db.VarChar(100)
  symbol                  String                             @db.VarChar(20)
  decimalPrecision        Int                                @default(0)
  active                  Boolean                            @default(true)
  version                 Int                                @default(1)
  createdAt               DateTime                           @default(now()) @db.Timestamptz(3)
  updatedAt               DateTime                           @updatedAt @db.Timestamptz(3)
  items                   Item[]
  specificationAttributes SpecificationAttributeDefinition[]

  @@index([active, name])
  @@map("units_of_measure")
}

model SpecificationAttributeDefinition {
  id                  String                   @id @default(uuid()) @db.Uuid
  itemCategoryId      String                   @db.Uuid
  code                String                   @db.VarChar(50)
  name                String                   @db.VarChar(150)
  description         String                   @default("") @db.VarChar(500)
  dataType            SpecificationDataType
  required            Boolean                  @default(false)
  unitOfMeasureId     String?                  @db.Uuid
  decimalPrecision    Int?
  sortOrder           Int                      @default(0)
  active              Boolean                  @default(true)
  version             Int                      @default(1)
  createdAt           DateTime                 @default(now()) @db.Timestamptz(3)
  updatedAt           DateTime                 @updatedAt @db.Timestamptz(3)
  itemCategory        ItemCategory             @relation(fields: [itemCategoryId], references: [id], onDelete: Restrict)
  unitOfMeasure       UnitOfMeasure?           @relation(fields: [unitOfMeasureId], references: [id], onDelete: Restrict)
  specificationValues ItemSpecificationValue[]

  @@unique([itemCategoryId, code])
  @@index([itemCategoryId, active, sortOrder])
  @@index([unitOfMeasureId])
  @@map("specification_attribute_definitions")
}

model Item {
  id                  String                   @id @default(uuid()) @db.Uuid
  code                String                   @unique @db.VarChar(50)
  name                String                   @db.VarChar(200)
  description         String                   @default("") @db.VarChar(2000)
  itemCategoryId      String                   @db.Uuid
  unitOfMeasureId     String                   @db.Uuid
  active              Boolean                  @default(true)
  version             Int                      @default(1)
  createdByUserId     String                   @db.Uuid
  createdAt           DateTime                 @default(now()) @db.Timestamptz(3)
  updatedAt           DateTime                 @updatedAt @db.Timestamptz(3)
  itemCategory        ItemCategory             @relation(fields: [itemCategoryId], references: [id], onDelete: Restrict)
  unitOfMeasure       UnitOfMeasure            @relation(fields: [unitOfMeasureId], references: [id], onDelete: Restrict)
  createdBy           UserProfile              @relation("ItemCreatedBy", fields: [createdByUserId], references: [id], onDelete: Restrict)
  specificationValues ItemSpecificationValue[]

  @@index([active, code])
  @@index([itemCategoryId, active])
  @@index([unitOfMeasureId, active])
  @@map("items")
}

model ItemSpecificationValue {
  id                    String                           @id @default(uuid()) @db.Uuid
  itemId                String                           @db.Uuid
  attributeDefinitionId String                           @db.Uuid
  textValue             String?                          @db.VarChar(1000)
  numericValue          Decimal?                         @db.Decimal(30, 6)
  booleanValue          Boolean?
  createdAt             DateTime                         @default(now()) @db.Timestamptz(3)
  updatedAt             DateTime                         @updatedAt @db.Timestamptz(3)
  item                  Item                             @relation(fields: [itemId], references: [id], onDelete: Restrict)
  attributeDefinition   SpecificationAttributeDefinition @relation(fields: [attributeDefinitionId], references: [id], onDelete: Restrict)

  @@unique([itemId, attributeDefinitionId])
  @@index([attributeDefinitionId])
  @@map("item_specification_values")
}

model Role {
  code        String           @id @db.VarChar(50)
  name        String           @db.VarChar(100)
  description String           @db.VarChar(500)
  scope       RoleScope
  system      Boolean          @default(true)
  permissions RolePermission[]
  memberships MembershipRole[]

  @@map("roles")
}

model Permission {
  code        String           @id @db.VarChar(100)
  description String           @db.VarChar(500)
  roles       RolePermission[]

  @@map("permissions")
}

model RolePermission {
  roleCode       String     @db.VarChar(50)
  permissionCode String     @db.VarChar(100)
  role           Role       @relation(fields: [roleCode], references: [code], onDelete: Restrict)
  permission     Permission @relation(fields: [permissionCode], references: [code], onDelete: Restrict)

  @@id([roleCode, permissionCode])
  @@map("role_permissions")
}

model MembershipRole {
  membershipId     String       @db.Uuid
  roleCode         String       @db.VarChar(50)
  assignedByUserId String?      @db.Uuid
  assignedAt       DateTime     @default(now()) @db.Timestamptz(3)
  membership       Membership   @relation(fields: [membershipId], references: [id], onDelete: Restrict)
  role             Role         @relation(fields: [roleCode], references: [code], onDelete: Restrict)
  assignedBy       UserProfile? @relation("RoleAssignedBy", fields: [assignedByUserId], references: [id], onDelete: Restrict)

  @@id([membershipId, roleCode])
  @@index([assignedByUserId])
  @@map("membership_roles")
}

model Session {
  id            String      @id @default(uuid()) @db.Uuid
  tokenHash     String      @unique @db.Char(64)
  csrfTokenHash String      @db.Char(64)
  userId        String      @db.Uuid
  expiresAt     DateTime    @db.Timestamptz(3)
  revokedAt     DateTime?   @db.Timestamptz(3)
  createdAt     DateTime    @default(now()) @db.Timestamptz(3)
  lastSeenAt    DateTime    @default(now()) @db.Timestamptz(3)
  user          UserProfile @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId, expiresAt])
  @@map("sessions")
}

model OidcAuthTransaction {
  stateHash    String   @id @db.Char(64)
  codeVerifier String   @db.VarChar(128)
  nonce        String   @db.VarChar(128)
  returnTo     String   @db.VarChar(500)
  expiresAt    DateTime @db.Timestamptz(3)
  createdAt    DateTime @default(now()) @db.Timestamptz(3)

  @@index([expiresAt])
  @@map("oidc_auth_transactions")
}

model AuditEvent {
  id             String        @id @default(uuid()) @db.Uuid
  occurredAt     DateTime      @default(now()) @db.Timestamptz(3)
  actorUserId    String?       @db.Uuid
  organizationId String?       @db.Uuid
  action         String        @db.VarChar(100)
  entityType     String        @db.VarChar(100)
  entityId       String        @db.VarChar(100)
  requestId      String        @db.VarChar(128)
  correlationId  String        @db.VarChar(128)
  outcome        String        @db.VarChar(30)
  changes        Json
  actor          UserProfile?  @relation("AuditActor", fields: [actorUserId], references: [id], onDelete: Restrict)
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Restrict)

  @@index([organizationId, occurredAt])
  @@index([entityType, entityId, occurredAt])
  @@map("audit_events")
}
````

## File: packages/database/src/index.ts
````typescript
export { createDatabaseClient, disconnectDatabaseClient } from "./client.js";
export { Prisma } from "../generated/prisma/client.js";
export type { PrismaClient } from "../generated/prisma/client.js";
export { applyPhaseOneSeed, localFixtures } from "./phase-one-seed.js";
export { applyPhaseTwoSeed, phaseTwoFixtures } from "./phase-two-seed.js";
export {
  applyPhaseThreeASeed,
  phaseThreeAFixtures,
} from "./phase-three-a-seed.js";
````

## File: .dockerignore
````
.env*
.corepack
.git
**/.next
**/.turbo
**/coverage*
**/dist
**/node_modules
packages/database/generated
playwright-report
test-results
*.log
````

## File: .gitignore
````
.env
.env.*
!.env.example
.corepack/
.next/
next-env.d.ts
.turbo/
coverage*/
dist/
node_modules/
packages/database/generated/
playwright-report/
test-results/
*.log
*.tsbuildinfo
.idea/
.vscode/
Thumbs.db
.DS_Store
````

## File: compose.yaml
````yaml
name: mecoflow

services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_USER: ${POSTGRES_USER}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 20
    restart: unless-stopped

  redis:
    image: redis:8.2-alpine
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  minio:
    image: quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z
    command: server /data --console-address ':9001'
    environment:
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    volumes:
      - minio-data:/data
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 20
    restart: unless-stopped

  minio-init:
    image: quay.io/minio/mc:RELEASE.2025-08-13T08-35-41Z
    profiles: ["setup"]
    depends_on:
      minio:
        condition: service_healthy
    environment:
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      S3_BUCKET: ${S3_BUCKET}
    entrypoint: /bin/sh
    command:
      - -c
      - >-
        mc alias set local http://minio:9000 "$$MINIO_ROOT_USER" "$$MINIO_ROOT_PASSWORD" &&
        mc mb --ignore-existing "local/$$S3_BUCKET" &&
        mc anonymous set none "local/$$S3_BUCKET"
    restart: "no"

  keycloak:
    image: quay.io/keycloak/keycloak:26.4.7
    command: ["start-dev", "--import-realm"]
    environment:
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
      KC_BOOTSTRAP_ADMIN_USERNAME: ${KEYCLOAK_ADMIN}
      KC_HEALTH_ENABLED: "true"
      KC_METRICS_ENABLED: "true"
    ports:
      - "127.0.0.1:${KEYCLOAK_HTTP_PORT}:8080"
    volumes:
      - ./infra/keycloak/mecoflow-local-realm.json:/opt/keycloak/data/import/mecoflow-local-realm.json:ro
    healthcheck:
      test:
        - CMD-SHELL
        - >-
          exec 3<>/dev/tcp/127.0.0.1/9000 &&
          printf 'GET /health/ready HTTP/1.0\r\nHost: localhost\r\n\r\n' >&3 &&
          grep -q '200 OK' <&3
      interval: 10s
      timeout: 5s
      retries: 30
      start_period: 20s
    restart: unless-stopped

  mailpit:
    image: axllent/mailpit:v1.27.8
    environment:
      MP_DATABASE: /data/mailpit.db
    ports:
      - "127.0.0.1:${MAILPIT_SMTP_PORT}:1025"
      - "127.0.0.1:${MAILPIT_HTTP_PORT}:8025"
    volumes:
      - mailpit-data:/data
    healthcheck:
      test: ["CMD", "/mailpit", "readyz"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
  minio-data:
  mailpit-data:
````

## File: Makefile
````makefile
.PHONY: setup up down dev test verify reset

setup:
	powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/setup.ps1

up:
	pnpm compose:up

down:
	pnpm compose:down

dev:
	pnpm dev

test:
	pnpm test

verify:
	pnpm verify

reset:
	pnpm db:reset
````

## File: apps/api/package.json
````json
{
  "name": "@mecoflow/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
    "dev": "tsx src/main.ts",
    "lint": "eslint src --max-warnings=0",
    "openapi:generate": "tsx src/generate-openapi.ts",
    "start": "node dist/main.js",
    "test": "vitest run -c vitest.config.ts",
    "test:authorization": "vitest run -c vitest.authorization.config.ts",
    "test:integration": "vitest run -c vitest.integration.config.ts --passWithNoTests",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "3.1086.0",
    "@mecoflow/config": "workspace:*",
    "@mecoflow/contracts": "workspace:*",
    "@mecoflow/database": "workspace:*",
    "@nestjs/common": "11.1.28",
    "@nestjs/core": "11.1.28",
    "@nestjs/platform-express": "11.1.28",
    "@nestjs/swagger": "11.4.5",
    "class-transformer": "0.5.1",
    "class-validator": "0.15.1",
    "dotenv": "17.2.3",
    "ioredis": "5.11.1",
    "pino": "10.3.1",
    "reflect-metadata": "0.2.2",
    "rxjs": "7.8.2"
  },
  "devDependencies": {
    "@mecoflow/typescript-config": "workspace:*",
    "@types/express": "5.0.5",
    "tsx": "4.23.1"
  }
}
````

## File: docs/DEPENDENCIES.md
````markdown
# Dependency rationale

Phase 0 uses only stack-required foundations: Next.js/React for the web shell; NestJS, Swagger, RxJS and reflection metadata for REST; Prisma with the PostgreSQL driver adapter; Zod for boundary configuration/contracts; ioredis and AWS S3 client for readiness/integration boundaries; Pino-compatible structured logging; Tailwind/PostCSS for local UI styling; Vitest and Playwright for tests; and ESLint, Prettier, TypeScript, pnpm and Turborepo for workspace quality.

Dependencies are exact in package manifests and lockfile. The application does not add a global client store, alternate ORM, GraphQL layer, microservice framework or generic utility suite. CI performs frozen install, a moderate-or-higher vulnerability audit, and GitHub's dependency diff review on pull requests using the checked-in license/severity policy. Updates require compatibility, security and maintenance evaluation.

Container runtime stages use filtered `--prod` installations and copy compiled/standalone outputs. Repository source, unrelated applications, Playwright, ESLint, Vitest and the wider build toolchain are not shipped in application runtime images. Prisma's published client peer closure currently retains Prisma/TypeScript packages in API and worker images; this is a documented packaging limitation rather than a reason to disable strict peer checks.

TypeScript 6.0.3 is intentionally pinned instead of the newer 7.x release because the selected current `typescript-eslint` release declares support below TypeScript 6.1. Strict peer checking remains enabled; this compatibility pin is preferred to suppressing the warning or weakening lint guarantees.

The S3 client is pinned one stable patch behind the registry head because the head release was less than one day old at initialization and failed pnpm 11's minimum-release-age supply-chain policy. This keeps the policy enabled rather than bypassing it.

Dependency build scripts are deny-by-default. Prisma engines, Prisma, esbuild, and sharp are explicitly allowed because they provide required generated/native runtime artifacts; Scarf's optional install-time analytics script is explicitly ignored.

Phase 1 adds no third-party runtime dependency. OIDC discovery, code exchange, PKCE, and bounded RS256/JWKS verification use Node's built-in `fetch` and `crypto` APIs; the implementation accepts only the documented Keycloak-compatible RS256 profile and validates issuer, audience, signature, expiry, issued-at, nonce, and browser-bound state. This keeps the supply-chain surface unchanged, but any future algorithm/client-authentication expansion requires a security review and may justify a maintained OIDC library.

Workspace overrides require patched minimum versions of `@hono/node-server` 1.19.13 and PostCSS 8.5.10. These are transitive dependencies of Prisma tooling and Next.js respectively; the overrides remediate their published path-traversal/middleware-bypass and CSS-stringification XSS advisories while remaining within the parent packages' compatible ranges.
````

## File: docs/IMPLEMENTATION_STATUS.md
````markdown
# Current phase

Phase 3A — Item master (implemented on 2026-07-16; exact final verification results are reported in the implementation handoff). Work stops before Phase 3B.

# Completed capabilities

- Phase 0 repository/runtime foundations and Phase 1 OIDC, organizations, roles, permission policies, sessions, CSRF, and immutable audit foundation remain intact.
- Versioned product-category administration with active/inactive status and audit events.
- Project creation, scoped reading, and detail editing with organization/category association, planned dates, versions, and transactional audit events.
- Explicit project transition command and immutable history for the accepted `DRAFT`, `PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, and `CANCELLED` graph. Generic project edits cannot accept `state`; completed/cancelled projects are read-only and there is no Phase 2 reopen command.
- Active/inactive project-member assignments with internal-owner scope, explicit supplier sharing, member roles, expected versions, and a final-active-project-manager invariant.
- Versioned milestones and milestone-linked work packages with project/date boundary validation, same-project link validation, and audit events.
- Project-level authorization composes active identity/membership, permission, internal oversight or explicit project assignment, object scope, workflow state, CSRF, and expected version. Repository list queries are scope-filtered. Supplier project responses omit employee/member identities and transition history.
- Internal project directory and overview screens. The directory supports search, state/category filters, sorting, bounded pagination, and URL query persistence. The overview supports project edit/transition plus member, milestone, and work-package operations.
- Date/timestamp presentation uses the configured `APP_TIMEZONE` with `Asia/Jakarta` fallback; PostgreSQL timestamps remain UTC and planned dates use the database `DATE` type.
- Local/test/CI deterministic seed adds a fictional product category, demo project, creator project membership, milestone, and work package. Nonlocal environments receive no Phase 2 demo business data.
- Generated OpenAPI, human API documentation, authorization matrix, domain/security/test documentation, README, unit/integration/authorization/concurrency/browser coverage are updated.
- Global internal item-category and unit-of-measure administration with active/inactive status, optimistic versions, normalized unique uppercase codes, and transactional audit events.
- Ordered `TEXT`, `NUMBER`, and `BOOLEAN` specification-attribute definitions with required-value, unit, data-type, sort-order, active-reference, and zero-to-six decimal-precision validation.
- Versioned item creation, internal detail editing, case-insensitive search, active/category/unit filters, sorting, bounded pagination, and typed structured specification values. An item's category is immutable after creation.
- Explicit reasoned item deactivation. Inactive items are read-only, no delete route exists, restrictive references retain item data, and a database trigger rejects direct item deletion.
- Separate internal `item.read`, `item.write`, and `item.export` permissions. Supplier/customer roles receive none; qualifying internal roles follow the authorization matrix.
- Filtered CSV export with a 10,000-row ceiling, fixed columns, formula-safe cells, and same-transaction `ITEMS_EXPORTED` audit evidence.
- Internal item directory and item-detail screens with URL-backed filters, permission-sensitive controls, structured specification inputs, CSV download, and retained inactive-item detail.
- Local/test/CI deterministic Phase 3A seed adds fictional item categories, units, definitions, an item, and typed values. Nonlocal environments receive no Phase 3A demo business data.

# Partially completed capabilities

- None within the bounded Phase 3A item-master scope.

# Not started

- Phase 3B import/revision functionality, BOMs, and Phase 4–9 procurement, supplier commitments, shipments, receiving, documents, quality, NCR, allocations, readiness, notifications, reporting, and scorecards remain absent.

# Active technical decisions

- ADR-0001 through ADR-0014 remain accepted and governing.
- Project scope is an explicit active project-member assignment. `SYSTEM_ADMIN` has internal-project oversight and `MECO_MANAGEMENT` has read oversight in its internal organization; roles/permissions alone do not grant ordinary project scope.
- Supplier assignment grants project read scope only. Supplier write permissions, employee/member visibility, and transition/audit visibility are not introduced.
- Project state is a command-only field. Terminal-state reopening needs a separately designed and authorized future command; it is not implicitly implemented.
- The Phase 3A item master is a global internal catalog shared by active internal organizations. Item data is not organization-partitioned; the qualifying actor membership supplies audit organization context. Supplier and customer roles have no item-master access.
- Item-category, unit, and item codes are globally unique after uppercase normalization; specification-attribute codes are unique within their category. Retained inactive records continue to reserve their codes.
- Item category is immutable after item creation. Active reference masters cannot be deactivated, used attribute type/unit/precision cannot change, and inactive items cannot be edited or reactivated through Phase 3A routes.
- CSV export is separately permissioned and audited, preserves the active list filters except pagination, rejects more than 10,000 rows, and neutralizes spreadsheet formula prefixes.
- Phase 2 and Phase 3A produce no asynchronous work, so they emit no outbox event. Any future business change that triggers asynchronous processing must write its outbox record in the business transaction under ADR-0006.

# Database migrations

- `20260715000000_phase_0_foundation` remains unchanged.
- `20260716000000_phase_1_identity_authorization` remains unchanged.
- `20260716010000_phase_2_projects_milestones` adds product categories, projects, project members, milestones, work packages, project-transition history, project/member/state enums, uniqueness and scope indexes, date/version checks, restrictive foreign keys, and database triggers rejecting project-transition update/delete.
- `20260716020000_phase_3a_item_master` adds item categories, units of measure, typed specification definitions and values, items, precision/version/type/reference checks, uniqueness/search indexes, restrictive foreign keys, typed-value validation triggers, and an item-delete prevention trigger.
- No production data migration/backfill is included. The migration is additive. Production down-migration is not authorized.

# Test status

- Unit coverage exhaustively checks every project-state source/target pair and the forbidden completed-to-active route.
- Integration coverage checks transition/audit atomicity and immutability, arbitrary-state-patch rejection, concurrent project edits, and Phase 2 seed idempotency.
- Authorization coverage checks Supplier A explicit access, Supplier B/nonexistent equivalence, supplier field filtering, read-only denial, and CSRF enforcement.
- Browser coverage creates, edits, and explicitly transitions a project through accessible controls.
- Phase 3A unit coverage exercises unit/attribute precision, definition shapes, typed/required values, duplicate values, and CSV escaping/formula neutralization.
- Phase 3A integration coverage exercises duplicate codes, active-reference rules, category immutability, full specification replacement, search, CSV limits/audits, optimistic concurrency, reasoned deactivation, inactive read-only behavior, unavailable delete routes, database delete prevention, transactional audit evidence, and seed idempotency.
- Phase 3A authorization coverage exercises internal read/write/export separation, supplier denial, read-only denial, CSRF on unsafe routes, safe item identifiers, and export audit scope.
- Phase 3A browser coverage creates reference masters and a typed item, edits and searches it, downloads filtered CSV, and deactivates it through accessible controls.
- Exact final formatting, lint, type-check, unit, integration, authorization, build, OpenAPI, and browser command results are reported in the implementation handoff; no unrun gate is represented as successful here.

# Known defects

- No documentation-tracked defect is known in the bounded Phase 3A implementation before the final verification handoff. Final command failures, if any, must be reported rather than masked here.

# Security, concurrency, and data integrity

- Controllers call application services; services call policies/domain logic and repositories; only repositories access Prisma.
- Every unsafe Phase 2 route requires the existing session-bound CSRF proof. DTO validation rejects unknown properties, including arbitrary project-state patches.
- Scoped project queries preserve inaccessible/nonexistent equivalence. Supplier A/B negative evidence is automated and supplier responses filter employee/history fields.
- Version predicates are evaluated in database updates. Stale project/category/member/milestone/work-package/transition commands return the safe concurrency response and do not write partial audit evidence.
- Project transitions and audit events are written in the same database transaction as business state. Database triggers prevent transition-history and audit-event mutation/deletion.
- Database and repository validation protect project/work-package date ordering, project child boundaries, same-project milestone links, unique codes, active category use, active member scope, and the last active project manager.
- Item-master policies require active internal membership plus `item.read`, `item.write`, or `item.export`; suppliers are denied before item data is disclosed. All unsafe routes are CSRF protected.
- Version predicates protect every item-master edit and item deactivation. Row locking and transaction-time reference counts prevent concurrent deactivation or structural edits from invalidating active references.
- Item-master mutations and export evidence are atomic with redacted audit events. The audit organization is the qualifying actor membership and does not imply catalog ownership.
- Application validation plus database decimals, checks, unique indexes, restrictive foreign keys, typed-value triggers, and the no-delete trigger protect code, precision, type, category, and retention invariants.
- CSV output is fixed-column, fully quoted, formula-prefix neutralized, separately permissioned, and bounded to 10,000 rows.

# Assumptions and limitations

- The product requirements do not define Phase 2 project/category field catalogs, milestone status, or work-package status. Phase 2 therefore implements only the conservative descriptive and planned-date fields needed by this request; later BOM/readiness state was not anticipated.
- `SYSTEM_ADMIN` and `MECO_MANAGEMENT` oversight follows the seeded role descriptions and remains permission-gated. Other internal roles require explicit project assignment.
- Product requirements did not define the Phase 3A item field catalog, code scope, specification types, role mapping, or decimal bounds. The implementation conservatively uses a global internal catalog, the documented minimal fields, typed `TEXT`/`NUMBER`/`BOOLEAN` definitions, explicit item permissions, and zero-to-six decimal precision. These choices are documented here and in `ITEM_MASTER_API.md`.
- A global catalog means any active internal organization holding an item permission sees the same records. Audit organization identifies the acting membership; it is not tenant ownership. A future organization-partitioning change requires an explicit migration and authorization design.
- The 10,000-row CSV ceiling is a bounded synchronous Phase 3A export decision, not a general reporting limit. Larger/asynchronous exports remain later work.
- Locale message catalogs are still deferred, but all machine enums remain stable and date rendering is timezone-configured. The screens currently use English copy.
- No staging/production deployment, migration rehearsal, or production data backfill is part of this task.
- Phase 3B import/revisions, BOMs, procurement, supplier item access, and item reactivation/revision workflows are explicitly deferred.

# Next recommended task

Stop here. Begin Phase 3B import/revision work, BOMs, or procurement only after explicit user approval and a new bounded implementation request.
````

## File: docs/SECURITY_MODEL.md
````markdown
# Security model

## Principles

MECO Flow denies access by default, validates every trust boundary, minimizes disclosed data, keeps secrets outside source control, and records security-relevant business changes immutably. Inaccessible and nonexistent protected resources must be indistinguishable.

## Authentication and sessions

Keycloak is the sole identity provider. Phase 1 will implement OIDC Authorization Code with PKCE using secure HttpOnly cookies or a backend-for-frontend session; browser local storage must never contain access or refresh tokens. Production has no default administrator credentials, uses Secure cookies and an explicit SameSite/CSRF design, and restricts Keycloak administration.

## Authorization decision

Every protected operation checks authenticated identity, active user, active membership, permission, organization scope, project scope where applicable, object policy, workflow state, and field visibility. Supplier users see only their organization's explicitly addressable/shared records and never internal costs, comments, evaluations, audits, private dispositions, employee data, unrelated projects, or another supplier's records.

## Application and API controls

Validate path/query/body values and reject unknown sensitive-command properties. Bound payloads, strings, pagination and timeouts. Use parameterized Prisma operations, generic production errors, security headers, CORS allowlists, request IDs, correlation IDs, idempotency and optimistic concurrency where required. Logs redact authorization headers, cookies, passwords, tokens, credentials, keys, document contents and unnecessary personal data.

## Files and supply chain

Object storage is private. Uploads use opaque keys, allowlisted extension and verified MIME, size limits, SHA-256, safe filenames, quarantine/scan states and authorization before short-lived downloads. Executables and ZIP are disallowed in MVP. Lockfiles, frozen installs, dependency review, vulnerability review, pinned container majors and non-root application images reduce supply-chain risk.

## Phase 1 status

The API implements Keycloak OIDC Authorization Code with S256 PKCE, one-time database-backed authorization transactions, browser-bound state/nonce verification, RS256 ID-token verification against discovery/JWKS, profile synchronization, and opaque server-side sessions. The session cookie is HttpOnly, `SameSite=Lax`, and Secure in production; access and refresh tokens are neither persisted nor exposed to the web application. Unsafe administration requests require a session-bound CSRF cookie/header pair and an allowed browser origin.

Authorization composes active profile, active membership/organization, permission, internal/supplier organization type, and scoped object identifiers. Supplier principals cannot enter internal administration. Protected API errors are stable and generic. Membership and role changes write redacted audit events in the same transaction, and PostgreSQL triggers reject audit update/delete operations.

Rate limiting and upload/download controls remain later hardening/operational-module work. Production Keycloak realm provisioning, TLS/proxy cookie enforcement, secret injection, and MFA policy are deployment responsibilities and are not proven by local Phase 1 tests.

## Phase 2 project controls

Project list queries are scope-filtered in the repository and never load an unscoped result set for application-side filtering. Internal project workers require both an active explicitly assigned project membership and the relevant permission, except documented internal management/system-administrator oversight. Supplier principals can read only projects explicitly shared with their own active supplier membership; supplier overview responses omit employee/member identities and transition history. Supplier A, Supplier B, nonexistent-ID, read-only-write, and CSRF negative cases are automated.

Project state is excluded from the generic edit DTO and can change only through a validated explicit transition command. Project and child writes are CSRF protected, expected-version checked, constrained to object scope and workflow state, and committed atomically with a redacted audit event. Transition history and audit history have database triggers rejecting update/delete. Completed and cancelled projects are read-only; no reopen command is present in Phase 2.

## Phase 3A item-master controls

The item master is a global internal catalog. Access still requires an active principal, an active membership in an active internal organization, and the operation-specific `item.read`, `item.write`, or `item.export` permission. Supplier and reserved customer roles receive none of these permissions and cannot use the item API or internal screens. The organization stored on an item-master audit event is the qualifying actor membership's organization; it is audit context, not catalog ownership.

Every item-master write requires the existing session-bound CSRF proof. Edits and item deactivation require an expected version, use database predicates and row locking where reference integrity requires it, and write a redacted audit event in the business transaction. Duplicate codes, inactive or mismatched references, required attributes, typed values, unit/attribute precision, and changes that would invalidate active references are validated server-side. Inactive items are read-only; there is no item-delete route and PostgreSQL rejects direct item deletion.

Item search is bounded and case-insensitive over code and name. CSV export is separately permissioned, applies validated filters, rejects results over 10,000 rows, quotes all cells, prefixes cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return, and records `ITEMS_EXPORTED` with a count and non-sensitive filter summary. No Phase 3A change initiates asynchronous processing, so no outbox payload is produced.
````

## File: docs/TEST_STRATEGY.md
````markdown
# Test strategy

## Layers

- Unit tests cover pure configuration validation, policies, calculations, workflows, normalization, validation, sanitization and idempotency.
- Integration tests use isolated disposable PostgreSQL/Redis/object-storage dependencies for repositories, constraints, transactions, audit/outbox effects and operational workflows.
- Authorization tests exercise every protected command and supplier object with negative identifier manipulation.
- Playwright tests use accessible roles/labels for critical browser workflows and include accessibility smoke coverage without arbitrary sleeps.

Tests are deterministic, independent of order, use fictional fixtures, and clean up or isolate their state. A failing test is not weakened to obtain green status. Obsolete expectations require a documented behavior decision first.

## Phase 0 gates

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, Prisma migration/seed, and the Playwright landing-page smoke test form the foundation. `pnpm verify` is the shared local/CI primary quality chain. CI uses frozen installation, service containers, migration validation, checked-in OpenAPI drift detection, production builds, browser smoke, moderate-or-higher dependency audit, pull-request dependency review and container build checks.

## Phase 1 gates

`pnpm test:authorization` runs policy and live-PostgreSQL authorization tests, including inactive profile/membership denial, supplier administration denial, read-only write denial, safe identifier behavior, role-change atomicity, and database-enforced audit immutability. `pnpm test:e2e` runs a deterministic OIDC Authorization Code/PKCE provider and covers login, access denied, internal navigation, supplier navigation, and absence of browser local-storage tokens. The full gate remains `pnpm verify`, followed by `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check`.

Environment-blocked commands are reported with exact cause and residual risk; no command is reported successful unless it completed successfully.

## Phase 2 gates

The full existing gate remains mandatory. Unit tests exhaustively compare every source/target project-state pair with the accepted transition graph, including the forbidden completed-to-active path. Integration tests cover transactional transition/audit evidence, database immutability, arbitrary-state-patch rejection, category/project/child persistence, seed idempotency, and two simultaneous project edits using one expected version (exactly one succeeds). Authorization tests add Supplier A/B project-object isolation, safe nonexistent equivalence, supplier field filtering, read-only denial, and CSRF denial. Playwright creates, edits, and explicitly transitions a project through accessible controls while preserving URL-backed project filters, sorting, and pagination.

## Phase 3A gates

The full existing gate remains mandatory. Unit tests cover unit/attribute decimal precision, definition shapes, required and typed specification values, numeric bounds, duplicate values, and CSV quoting/formula sanitization. Integration tests cover global duplicate category/unit/item codes, per-category attribute-code uniqueness, active-reference and required-value rules, category immutability on item edits, optimistic concurrency, deactivation/read-only behavior, absence of a delete route, database-enforced item-delete rejection, filtered case-insensitive search, the 10,000-row CSV limit, transactional redacted audits, and deterministic Phase 3A seed idempotency.

Authorization tests cover permission-specific read/write/export access, supplier denial, inactive/read-only principal denial, CSRF on every write path, safe item identifiers, and export audit evidence. Playwright creates supporting master data and a typed item through accessible controls, edits and searches it through URL-backed query state, downloads the filtered CSV, and deactivates the item without exposing a delete control. The final gate is `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. Exact command results belong in the implementation handoff; documentation does not represent an unrun command as successful.
````

## File: packages/config/src/service-environment.ts
````typescript
import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const localOnlyValues = new Set([
  "local_only_change_me",
  "local_only_minio_change_me",
  "mecoflow_local",
  "local_only_session_secret_change_me_32_chars",
]);

function hasProtocol(value: string, protocols: readonly string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function decodeUrlComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isHttpsOrigin(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const corsOrigins = z
  .string()
  .min(1)
  .default("http://localhost:3000")
  .superRefine((value, context) => {
    for (const candidate of value.split(",").map((origin) => origin.trim())) {
      try {
        const url = new URL(candidate);
        if (
          candidate.length === 0 ||
          !["http:", "https:"].includes(url.protocol) ||
          url.origin !== candidate
        ) {
          context.addIssue({
            code: "custom",
            message: "CORS origins must be absolute HTTP(S) origins",
          });
          return;
        }
      } catch {
        context.addIssue({
          code: "custom",
          message: "CORS origins must be absolute HTTP(S) origins",
        });
        return;
      }
    }
  });

const serviceEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_ENV: z
      .string()
      .min(1)
      .max(32)
      .regex(/^[A-Za-z0-9._-]+$/)
      .default("local"),
    APP_VERSION: z.string().min(1).max(64).default("0.1.0"),
    APP_TIMEZONE: z.string().min(1).refine(isTimeZone).default("Asia/Jakarta"),
    APP_CURRENCY: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .default("IDR"),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    CORS_ORIGINS: corsOrigins,
    WEB_BASE_URL: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["http:", "https:"]))
      .default("http://localhost:3000"),
    OIDC_ISSUER: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["http:", "https:"]))
      .default("http://localhost:8180/realms/mecoflow-local"),
    OIDC_CLIENT_ID: z.string().min(1).max(200).default("mecoflow-web"),
    OIDC_REDIRECT_URI: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["http:", "https:"]))
      .default("http://localhost:3001/api/v1/auth/callback"),
    SESSION_SECRET: z
      .string()
      .min(32)
      .max(500)
      .default("local_only_session_secret_change_me_32_chars"),
    SESSION_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(300)
      .max(86400)
      .default(28800),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),
    DATABASE_URL: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["postgresql:"])),
    REDIS_URL: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["redis:", "rediss:"])),
    S3_ENDPOINT: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["http:", "https:"])),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET: z
      .string()
      .min(3)
      .max(63)
      .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/)
      .refine((value) => !value.includes("..")),
    S3_FORCE_PATH_STYLE: booleanString.default(true),
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV !== "production") return;

    if (["ci", "development", "local", "test"].includes(environment.APP_ENV))
      context.addIssue({ code: "custom", path: ["APP_ENV"] });

    let databaseUrl: URL | undefined;
    try {
      databaseUrl = new URL(environment.DATABASE_URL);
    } catch {
      context.addIssue({ code: "custom", path: ["DATABASE_URL"] });
    }
    if (
      databaseUrl &&
      (databaseUrl.username.length === 0 ||
        databaseUrl.password.length === 0 ||
        localOnlyValues.has(decodeUrlComponent(databaseUrl.username)) ||
        localOnlyValues.has(decodeUrlComponent(databaseUrl.password)))
    )
      context.addIssue({ code: "custom", path: ["DATABASE_URL"] });

    if (
      environment.CORS_ORIGINS.split(",").some(
        (origin) => !isHttpsOrigin(origin.trim()),
      )
    )
      context.addIssue({ code: "custom", path: ["CORS_ORIGINS"] });

    if (!isHttpsOrigin(environment.WEB_BASE_URL))
      context.addIssue({ code: "custom", path: ["WEB_BASE_URL"] });
    if (!isHttpsOrigin(environment.OIDC_ISSUER))
      context.addIssue({ code: "custom", path: ["OIDC_ISSUER"] });
    if (!isHttpsOrigin(environment.OIDC_REDIRECT_URI))
      context.addIssue({ code: "custom", path: ["OIDC_REDIRECT_URI"] });
    if (localOnlyValues.has(environment.SESSION_SECRET))
      context.addIssue({ code: "custom", path: ["SESSION_SECRET"] });

    if (localOnlyValues.has(environment.S3_ACCESS_KEY))
      context.addIssue({ code: "custom", path: ["S3_ACCESS_KEY"] });
    if (localOnlyValues.has(environment.S3_SECRET_KEY))
      context.addIssue({ code: "custom", path: ["S3_SECRET_KEY"] });
  });

export type ServiceEnvironment = z.infer<typeof serviceEnvironmentSchema>;

export function parseServiceEnvironment(
  input: Record<string, string | undefined>,
): ServiceEnvironment {
  const parsed = serviceEnvironmentSchema.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.issues.map(
      (issue) => issue.path.join(".") || "environment",
    );
    throw new Error(
      `Invalid service environment: ${[...new Set(fields)].join(", ")}`,
    );
  }
  return parsed.data;
}
````

## File: packages/database/prisma/seed.ts
````typescript
import {
  createDatabaseClient,
  disconnectDatabaseClient,
} from "../src/client.js";
import { applyPhaseZeroSeed } from "../src/phase-zero-seed.js";
import { applyPhaseOneSeed } from "../src/phase-one-seed.js";
import { applyPhaseTwoSeed } from "../src/phase-two-seed.js";
import { applyPhaseThreeASeed } from "../src/phase-three-a-seed.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL is required to seed the database");

const database = createDatabaseClient(databaseUrl);

await applyPhaseZeroSeed(database);
await applyPhaseOneSeed(database);
await applyPhaseTwoSeed(database);
await applyPhaseThreeASeed(database);

await disconnectDatabaseClient();
````

## File: packages/database/src/client.integration.test.ts
````typescript
import { afterAll, describe, expect, it } from "vitest";
import { createDatabaseClient, disconnectDatabaseClient } from "./client.js";
import { applyPhaseZeroSeed } from "./phase-zero-seed.js";
import { applyPhaseOneSeed, localFixtures } from "./phase-one-seed.js";
import { applyPhaseTwoSeed, phaseTwoFixtures } from "./phase-two-seed.js";
import {
  applyPhaseThreeASeed,
  phaseThreeAFixtures,
} from "./phase-three-a-seed.js";

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

  it("applies the Phase 0 seed idempotently", async () => {
    const database = createDatabaseClient(databaseUrl!);
    await applyPhaseZeroSeed(database);
    const firstResult = await database.systemMetadata.findUniqueOrThrow({
      where: { key: "seed.version" },
    });

    await applyPhaseZeroSeed(database);
    const secondResult = await database.systemMetadata.findUniqueOrThrow({
      where: { key: "seed.version" },
    });

    expect(secondResult).toEqual(firstResult);
  });

  it("applies the Phase 1 roles and local fixtures idempotently", async () => {
    const database = createDatabaseClient(databaseUrl!);
    await applyPhaseOneSeed(database);
    const firstResult = await Promise.all([
      database.systemMetadata.findUniqueOrThrow({
        where: { key: "seed.version" },
      }),
      database.organization.findUniqueOrThrow({
        where: { id: localFixtures.internalOrganizationId },
      }),
      database.userProfile.findUniqueOrThrow({
        where: { id: localFixtures.internalAdminUserId },
      }),
      database.membership.findUniqueOrThrow({
        where: {
          userId_organizationId: {
            organizationId: localFixtures.internalOrganizationId,
            userId: localFixtures.internalAdminUserId,
          },
        },
      }),
    ]);

    await applyPhaseOneSeed(database);
    const secondResult = await Promise.all([
      database.systemMetadata.findUniqueOrThrow({
        where: { key: "seed.version" },
      }),
      database.organization.findUniqueOrThrow({
        where: { id: localFixtures.internalOrganizationId },
      }),
      database.userProfile.findUniqueOrThrow({
        where: { id: localFixtures.internalAdminUserId },
      }),
      database.membership.findUniqueOrThrow({
        where: {
          userId_organizationId: {
            organizationId: localFixtures.internalOrganizationId,
            userId: localFixtures.internalAdminUserId,
          },
        },
      }),
    ]);
    expect(secondResult).toEqual(firstResult);
  });

  it("applies the Phase 2 demo project idempotently", async () => {
    const database = createDatabaseClient(databaseUrl!);
    await applyPhaseTwoSeed(database);
    const firstResult = await database.project.findUniqueOrThrow({
      include: { members: true, milestones: true, workPackages: true },
      where: { id: phaseTwoFixtures.demoProjectId },
    });

    await applyPhaseTwoSeed(database);
    const secondResult = await database.project.findUniqueOrThrow({
      include: { members: true, milestones: true, workPackages: true },
      where: { id: phaseTwoFixtures.demoProjectId },
    });
    expect(secondResult).toEqual(firstResult);
  });

  it("applies the Phase 3A item-master fixtures idempotently", async () => {
    const database = createDatabaseClient(databaseUrl!);
    await applyPhaseThreeASeed(database);
    const firstResult = await database.item.findUniqueOrThrow({
      include: { specificationValues: true },
      where: { id: phaseThreeAFixtures.demoItemId },
    });

    await applyPhaseThreeASeed(database);
    const secondResult = await database.item.findUniqueOrThrow({
      include: { specificationValues: true },
      where: { id: phaseThreeAFixtures.demoItemId },
    });
    expect(secondResult).toEqual(firstResult);
  });
});
````

## File: CHANGELOG.md
````markdown
# Changelog

## Phase 1 — 2026-07-16

- Added Keycloak OIDC Authorization Code with PKCE, browser-bound state/nonce checks, synchronized profiles, opaque server-side sessions, and `/api/v1/me`.
- Added organizations, memberships, seeded roles/permissions, server-side organization policies, Phase 2 project-policy interfaces, and internal/supplier application shells.
- Added internal organization/membership/role administration, same-transaction immutable audit events, checked OpenAPI, positive/negative authorization tests, and OIDC browser workflows.

All notable changes follow Keep a Changelog and semantic versioning conventions.

## [Unreleased]

### Added

- Phase 0 repository, architecture, infrastructure, application, database, testing, and CI foundations.

### Fixed

- Phase 0 review remediation for safe production configuration validation, configured-bucket readiness, deterministic seeding, loopback-only local infrastructure, reproducible setup/CI commands, generated Next.js type handling, and minimal production runtime stages.
- Explicit API health-controller injection for the metadata-light `pnpm dev` transpiler.
- Reliable cross-platform `pnpm dev` supervision without deprecated Turbo flags or nested API/worker watch processes.
````

## File: package.json
````json
{
  "name": "mecoflow",
  "version": "0.1.0",
  "private": true,
  "description": "MECO Flow project material readiness platform",
  "license": "UNLICENSED",
  "packageManager": "pnpm@11.13.0",
  "engines": {
    "node": ">=24.0.0",
    "pnpm": ">=11.0.0"
  },
  "scripts": {
    "build": "turbo run build",
    "clean": "turbo run clean && node scripts/clean.mjs",
    "compose:down": "docker compose down",
    "compose:up": "docker compose up -d --wait && docker compose --profile setup run --rm minio-init",
    "db:deploy": "pnpm --filter @mecoflow/database db:deploy",
    "db:generate": "pnpm --filter @mecoflow/database db:generate",
    "db:migrate": "pnpm --filter @mecoflow/database db:migrate",
    "db:migrate:dev": "pnpm --filter @mecoflow/database db:migrate:dev",
    "db:reset": "pnpm --filter @mecoflow/database db:reset",
    "db:seed": "pnpm --filter @mecoflow/database db:seed",
    "dev": "turbo run dev",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "turbo run lint",
    "openapi:check": "node scripts/check-openapi.mjs",
    "openapi:generate": "pnpm --filter @mecoflow/api openapi:generate",
    "prepare": "node scripts/prepare.mjs",
    "security:audit": "pnpm audit --audit-level moderate",
    "test": "turbo run test",
    "test:authorization": "turbo run test:authorization",
    "test:e2e": "playwright test",
    "test:integration": "turbo run test:integration",
    "typecheck": "turbo run typecheck",
    "verify": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm build"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@mecoflow/eslint-config": "workspace:*",
    "@playwright/test": "1.61.1",
    "@types/node": "26.1.1",
    "eslint": "10.7.0",
    "globals": "17.7.0",
    "prettier": "3.9.5",
    "turbo": "2.10.5",
    "tsx": "4.23.1",
    "typescript": "6.0.3",
    "typescript-eslint": "8.64.0",
    "vitest": "4.1.10"
  }
}
````

## File: README.md
````markdown
# MECO Flow

MECO Flow is PT Meco Inoxprima's secure project-material-readiness and supplier-collaboration platform. Phase 2 adds product categories, scoped projects and members, milestones, work packages, explicit project-state transitions, optimistic concurrency, immutable audit evidence, and internal project list/overview screens. Phase 3A adds the internal item master: item categories, units of measure, typed specification definitions and values, item search/detail screens, controlled deactivation, and audited CSV export. BOMs, Phase 3B import/revision work, procurement, and later operational modules remain intentionally unavailable.

## Prerequisites

- Node.js 24 LTS
- Corepack and pnpm 11
- Docker Desktop with Compose v2
- Git (for normal source-control and hook setup)
- Optional GNU Make; all Make targets have pnpm/PowerShell equivalents

## Local setup

From the repository root:

```text
corepack prepare pnpm@11.13.0 --activate
Copy-Item .env.example .env
pnpm install --frozen-lockfile
pnpm compose:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Review `.env` before use. Values in `.env.example` are explicitly local-only and must never be used outside local development. Production-mode service startup rejects these known local placeholders. The setup helper performs the same non-destructive initialization steps and does not overwrite an existing `.env`:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/setup.ps1
```

The helper initializes infrastructure and the database, then exits. Run `pnpm dev` afterward to start the web, API, and worker processes.
The web process reloads browser-facing changes automatically. Restart `pnpm dev` after changing API or worker source so their direct development processes reload cleanly on Windows and Unix-like systems.

## Local services

| Service                     | Address                            |
| --------------------------- | ---------------------------------- |
| Web                         | http://localhost:3000              |
| API liveness                | http://localhost:3001/health/live  |
| API readiness               | http://localhost:3001/health/ready |
| OpenAPI UI (non-production) | http://localhost:3001/api/docs     |
| Keycloak                    | http://localhost:8180              |
| MinIO console               | http://localhost:9001              |
| Mailpit                     | http://localhost:8025              |

`/health/live` proves only that the API process runs. `/health/ready` safely checks PostgreSQL, Redis and the configured private object-storage bucket. The worker writes a short-lived Redis heartbeat and performs no Phase 2 or Phase 3A asynchronous jobs. Compose publishes local dependency ports only on `127.0.0.1`.

## Repository structure

```text
apps/
  api/                 NestJS REST, OpenAPI, probes and request logging
  web/                 Next.js App Router foundation screen
  worker/              validated worker/heartbeat foundation
packages/
  config/              startup environment validation
  contracts/           shared trust-boundary schemas
  database/            Prisma client, migration and seed framework
  eslint-config/       shared strict lint rules
  test-utils/          deterministic fixture helpers
  typescript-config/   strict shared compiler settings
  ui/                  local accessible UI primitives
docs/                  requirements, architecture, operations and ADRs
infra/                 local Keycloak, setup and infrastructure guidance
tests/                 Playwright, fixtures and security test roots
```

## Development commands

```text
pnpm dev
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:authorization
pnpm build
pnpm test:e2e
pnpm openapi:generate
pnpm openapi:check
pnpm security:audit
pnpm verify
pnpm compose:down
```

Build before `pnpm test:e2e`; Playwright starts the built API and web processes. `pnpm db:migrate` safely applies committed migrations, while `pnpm db:migrate:dev` is the interactive local command for authoring a new migration. Other database commands are `pnpm db:deploy`, `pnpm db:seed`, and destructive local-only `pnpm db:reset`.

## Architecture and security

Read `AGENTS.md` before changes. The authoritative baseline is in `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/SECURITY_MODEL.md`, `docs/AUTHORIZATION_MATRIX.md`, and accepted records under `docs/adr/`. Secrets, tokens, production realm exports and customer data must not be committed.

## Current status

See `docs/IMPLEMENTATION_STATUS.md`. Work stops after Phase 3A; do not begin Phase 3B, BOM, procurement, or another later phase without explicit instruction.
````

## File: turbo.json
````json
{
  "$schema": "https://turbo.build/schema.json",
  "globalPassThroughEnv": [
    "API_PORT",
    "APP_CURRENCY",
    "APP_ENV",
    "APP_TIMEZONE",
    "APP_VERSION",
    "BUILD_STANDALONE",
    "CORS_ORIGINS",
    "DATABASE_URL",
    "LOG_LEVEL",
    "NEXT_PUBLIC_API_BASE_URL",
    "NODE_ENV",
    "OIDC_CLIENT_ID",
    "OIDC_ISSUER",
    "OIDC_REDIRECT_URI",
    "REDIS_URL",
    "S3_ACCESS_KEY",
    "S3_BUCKET",
    "S3_ENDPOINT",
    "S3_FORCE_PATH_STYLE",
    "S3_REGION",
    "S3_SECRET_KEY",
    "SESSION_SECRET",
    "SESSION_TTL_SECONDS",
    "WEB_BASE_URL"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "cache": false,
      "outputs": []
    },
    "test:authorization": {
      "dependsOn": ["^build"],
      "cache": false,
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
````
