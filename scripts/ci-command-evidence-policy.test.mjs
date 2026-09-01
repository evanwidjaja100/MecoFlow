import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  buildCommandEvidence,
  buildEnvironmentIdentity,
  redactOutput,
  resolveCommandEvidenceDirectory,
  secretValues,
} from "./ci-command-evidence-policy.mjs";

test("builds source-bound command timing, exit, and output-hash evidence", () => {
  const environment = buildEnvironmentIdentity({
    APP_ENV: "CI",
    DATABASE_URL:
      "postgresql://mecoflow:never-retain-this@LOCALHOST:5432/MecoFlow_Verify_123?schema=public",
  });
  const evidence = buildCommandEvidence({
    id: "integration",
    argv: ["pnpm", "test:integration"],
    sourceSha: "a".repeat(40),
    startedAt: "2026-08-11T00:00:00.000Z",
    endedAt: "2026-08-11T00:00:01.250Z",
    exitCode: 1,
    stdout: "output\n",
    stderr: "failure\n",
    environment,
  });
  assert.equal(evidence.durationMs, 1250);
  assert.equal(evidence.exitCode, 1);
  assert.match(evidence.stdout.sha256, /^[0-9a-f]{64}$/u);
  assert.deepEqual(evidence.environment, {
    appEnv: "ci",
    database: { host: "localhost", name: "MecoFlow_Verify_123" },
    publicApiBaseUrl: null,
  });
  assert.equal(JSON.stringify(evidence).includes("never-retain-this"), false);
});

test("fails closed for unsafe environment identities without retaining credentials", () => {
  assert.deepEqual(buildEnvironmentIdentity({ APP_ENV: "ci" }), {
    appEnv: "ci",
    database: null,
    publicApiBaseUrl: null,
  });
  assert.deepEqual(
    buildEnvironmentIdentity({
      APP_ENV: "ci",
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
    }),
    {
      appEnv: "ci",
      database: null,
      publicApiBaseUrl: "https://api.example.test",
    },
  );
  for (const url of [
    "https://user:password@api.example.test",
    "https://api.example.test?token=value",
    "https://api.example.test#fragment",
  ]) {
    assert.throws(
      () =>
        buildEnvironmentIdentity({
          APP_ENV: "ci",
          NEXT_PUBLIC_API_BASE_URL: url,
        }),
      /public API URL is unsafe/u,
    );
  }
  assert.throws(
    () =>
      buildEnvironmentIdentity({
        APP_ENV: "ci\nsecret",
        DATABASE_URL: "postgresql://user:password@localhost:5432/mecoflow",
      }),
    /safe APP_ENV/u,
  );
  assert.throws(
    () =>
      buildEnvironmentIdentity({
        APP_ENV: "ci",
        DATABASE_URL: "mysql://user:password@localhost/mecoflow",
      }),
    /must use PostgreSQL/u,
  );
  assert.throws(
    () =>
      buildEnvironmentIdentity({
        APP_ENV: "ci",
        DATABASE_URL: "postgresql://user:password@localhost/unsafe%2Fname",
      }),
    /host\/name identity is invalid/u,
  );
});

test("redacts secret values and prevents evidence path/identity escape", () => {
  const values = secretValues({
    SESSION_SECRET: "top-secret-value",
    NORMAL: "not-secret",
  });
  assert.equal(redactOutput("x top-secret-value y", values), "x [REDACTED] y");
  const root = mkdtempSync(join(tmpdir(), "mecoflow-command-evidence-"));
  assert.match(
    resolveCommandEvidenceDirectory(root, ".runtime/evidence"),
    /verify[\\/]commands$/u,
  );
  assert.match(
    resolveCommandEvidenceDirectory(
      root,
      ".runtime/evidence",
      "container-security",
    ),
    /container-security[\\/]commands$/u,
  );
  assert.throws(
    () =>
      resolveCommandEvidenceDirectory(root, ".runtime/evidence", "../escape"),
    /job identity is invalid/u,
  );
  assert.throws(
    () => resolveCommandEvidenceDirectory(root, "../outside"),
    /inside the repository/u,
  );
  assert.throws(
    () =>
      buildCommandEvidence({
        id: "../escape",
        argv: ["command"],
        sourceSha: "a".repeat(40),
        startedAt: new Date(),
        endedAt: new Date(),
        exitCode: 0,
        stdout: "",
        stderr: "",
      }),
    /ID is invalid/u,
  );
});

test("redacts secrets split across output chunks before console emission", () => {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-live-redaction-"));
  const script = resolve(import.meta.dirname, "run-ci-evidence-command.mjs");
  const secret = "cross-chunk-secret-value";
  const childCode =
    "process.stdout.write(process.env.SESSION_SECRET.slice(0, 8)); setTimeout(() => process.stdout.write(process.env.SESSION_SECRET.slice(8)), 10)";
  const result = spawnSync(
    process.execPath,
    [script, "redaction_probe", "--", process.execPath, "-e", childCode],
    {
      cwd: root,
      env: {
        ...process.env,
        APP_ENV: "ci",
        PHASE_ZERO_SOURCE_SHA: "a".repeat(40),
        SESSION_SECRET: secret,
      },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "[REDACTED]");
  assert.equal(result.stdout.includes(secret), false);
  const retained = readFileSync(
    join(root, ".runtime/evidence/verify/commands/redaction_probe.stdout.log"),
    "utf8",
  );
  assert.equal(retained, "[REDACTED]");
});

test("retains endpoint-command evidence when endpoint approval fails", () => {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-endpoint-evidence-"));
  const script = resolve(import.meta.dirname, "run-ci-evidence-command.mjs");
  const result = spawnSync(
    process.execPath,
    [
      script,
      "endpoint_environment",
      "--",
      process.execPath,
      "-e",
      "process.stderr.write('approval missing'); process.exit(1)",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        APP_ENV: "ci",
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:3001",
        PHASE_ZERO_SOURCE_SHA: "a".repeat(40),
      },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 1);
  const retained = JSON.parse(
    readFileSync(
      join(root, ".runtime/evidence/verify/commands/endpoint_environment.json"),
      "utf8",
    ),
  );
  assert.equal(retained.exitCode, 1);
});
