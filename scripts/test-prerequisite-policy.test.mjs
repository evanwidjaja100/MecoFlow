import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  validateDatabaseUrl,
  validateRequiredSuite,
  validateTestEnvironment,
} from "./test-prerequisite-policy.mjs";

test("required database URL is explicit and local verification database is isolated", () => {
  assert.equal(validateDatabaseUrl(undefined).length, 1);
  assert.equal(
    validateDatabaseUrl("postgresql://u:p@localhost:5432/mecoflow").length,
    1,
  );
  assert.equal(
    validateDatabaseUrl("postgresql://u:p@localhost:5432/mecoflow_staging")
      .length,
    1,
  );
  assert.equal(
    validateDatabaseUrl(
      "postgresql://u:p@prod.example:5432/mecoflow_verify_phase0",
    ).length,
    1,
  );
  assert.deepEqual(
    validateDatabaseUrl(
      "postgresql://u:p@localhost:5432/mecoflow_verify_phase0",
    ),
    [],
  );
});

test("GitHub Actions accepts only its ephemeral localhost service database", () => {
  assert.deepEqual(
    validateDatabaseUrl("postgresql://u:p@localhost:5432/mecoflow", {
      githubActions: true,
    }),
    [],
  );
  assert.equal(
    validateDatabaseUrl("postgresql://u:p@db.example/mecoflow", {
      githubActions: true,
    }).length,
    1,
  );
});

test("database-backed suites require their exact CI environment and isolated services", () => {
  const valid = {
    APP_ENV: "ci",
    REDIS_URL: "redis://127.0.0.1:6379",
    S3_ENDPOINT: "http://localhost:9000",
    S3_REGION: "us-east-1",
    S3_ACCESS_KEY: "test-access-key",
    S3_SECRET_KEY: "test-secret-key",
    S3_BUCKET: "mecoflow-test",
  };
  assert.deepEqual(validateTestEnvironment("integration", valid), []);
  assert.deepEqual(validateTestEnvironment("authorization", valid), []);
  assert.deepEqual(validateTestEnvironment("e2e", {}), []);

  const missing = validateTestEnvironment("integration", {});
  assert.ok(missing.some((error) => error.includes("APP_ENV")));
  assert.ok(missing.some((error) => error.includes("REDIS_URL")));
  assert.ok(missing.some((error) => error.includes("S3_ENDPOINT")));
  assert.ok(missing.some((error) => error.includes("S3_SECRET_KEY")));

  assert.ok(
    validateTestEnvironment("authorization", {
      ...valid,
      APP_ENV: "test",
      REDIS_URL: "redis://shared.example:6379",
      S3_ENDPOINT: "https://objects.example",
    }).some((error) => error.includes("APP_ENV")),
  );
  assert.ok(
    validateTestEnvironment("integration", {
      ...valid,
      REDIS_URL: "redis://shared.example:6379",
    }).some((error) => error.includes("loopback")),
  );
});

test("required suite manifest fails closed when absent", () => {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-suite-"));
  try {
    assert.equal(validateRequiredSuite(root, "integration").length, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("required suite manifest fails closed when a named test file disappears", () => {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-suite-"));
  try {
    mkdirSync(join(root, "tests"));
    writeFileSync(
      join(root, "tests", "required-suites.json"),
      JSON.stringify({ unit: ["missing.test.ts"] }),
    );
    assert.equal(validateRequiredSuite(root, "unit").length, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("required suite manifest fails closed when a discovered test is unlisted", () => {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-suite-"));
  try {
    mkdirSync(join(root, "tests"));
    mkdirSync(join(root, "apps", "sample"), { recursive: true });
    writeFileSync(join(root, "apps", "sample", "listed.test.ts"), "");
    writeFileSync(join(root, "apps", "sample", "unlisted.test.ts"), "");
    writeFileSync(
      join(root, "tests", "required-suites.json"),
      JSON.stringify({ unit: ["apps/sample/listed.test.ts"] }),
    );
    assert.ok(
      validateRequiredSuite(root, "unit").some((error) =>
        error.includes("unlisted.test.ts"),
      ),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("required suite manifest rejects duplicate and non-test entries", () => {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-suite-"));
  try {
    mkdirSync(join(root, "tests"));
    mkdirSync(join(root, "apps", "sample"), { recursive: true });
    writeFileSync(join(root, "apps", "sample", "listed.test.ts"), "");
    writeFileSync(join(root, "apps", "sample", "helper.ts"), "");
    writeFileSync(
      join(root, "tests", "required-suites.json"),
      JSON.stringify({
        unit: [
          "apps/sample/listed.test.ts",
          "apps/sample/listed.test.ts",
          "apps/sample/helper.ts",
        ],
      }),
    );
    const errors = validateRequiredSuite(root, "unit");
    assert.ok(errors.some((error) => error.includes("duplicate")));
    assert.ok(errors.some((error) => error.includes("not a discovered")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("current required suite manifests are complete", () => {
  for (const suite of ["unit", "integration", "authorization", "e2e"]) {
    assert.deepEqual(validateRequiredSuite(process.cwd(), suite), []);
  }
});
