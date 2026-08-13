import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildCommandEvidence } from "./ci-command-evidence-policy.mjs";
import {
  requiredCiSteps,
  requiredCommandEvidenceIds,
} from "./ci-step-outcome-policy.mjs";

const sourceSha = "a".repeat(40);
const testCommands = new Set([
  "governance_tests",
  "unit",
  "integration",
  "authorization",
  "e2e",
  "production_policy",
  "operations_policy",
  "capacity_policy",
]);
const script = join(
  dirname(fileURLToPath(import.meta.url)),
  "verify-ci-step-outcomes.mjs",
);

function fixture({ omit, fail } = {}) {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-step-evidence-"));
  const commandDirectory = join(
    root,
    ".runtime",
    "evidence",
    "verify",
    "commands",
  );
  mkdirSync(commandDirectory, { recursive: true });
  const commands = new Map(requiredCiSteps);
  const endpointStepIndex = requiredCiSteps.findIndex(
    ([id]) => id === "endpoint_environment",
  );
  for (const [commandIndex, id] of requiredCommandEvidenceIds.entries()) {
    if (id === omit) continue;
    const stdout = `${id} output\n`;
    const stderr = id === fail ? `${id} failed\n` : "";
    const evidence = buildCommandEvidence({
      id,
      argv: commands.get(id).split(" "),
      sourceSha,
      startedAt: "2026-08-11T00:00:00.000Z",
      endedAt: "2026-08-11T00:00:01.000Z",
      exitCode: id === fail ? 1 : 0,
      stdout,
      stderr,
      environment: {
        appEnv: "ci",
        database: { host: "localhost", name: "mecoflow_ci" },
        publicApiBaseUrl:
          commandIndex < endpointStepIndex
            ? "http://127.0.0.1:3001"
            : "https://api.example.test",
      },
    });
    if (testCommands.has(id)) {
      evidence.testPolicy = {
        passed: true,
        format: "fixture",
        totals: { total: 1, passed: 1, failed: 0, skipped: 0, todo: 0 },
        parseErrors: [],
        violations: [],
      };
    }
    writeFileSync(join(commandDirectory, `${id}.stdout.log`), stdout);
    writeFileSync(join(commandDirectory, `${id}.stderr.log`), stderr);
    writeFileSync(
      join(commandDirectory, `${id}.json`),
      `${JSON.stringify(evidence)}\n`,
    );
  }
  const env = {
    ...process.env,
    GITHUB_SHA: sourceSha,
    APP_ENV: "ci",
    DATABASE_URL: "postgresql://user:password@localhost:5432/mecoflow_ci",
    PHASE_ZERO_TEST_API_BASE_URL: "http://127.0.0.1:3001",
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
    ...Object.fromEntries(
      requiredCiSteps.map(([id]) => [
        `PHASE_ZERO_STEP_${id.toUpperCase()}`,
        id === fail ? "failure" : "success",
      ]),
    ),
  };
  return { root, env };
}

test("aggregator binds every retained command file and fails when one is missing", () => {
  const complete = fixture();
  const passed = spawnSync(process.execPath, [script], {
    cwd: complete.root,
    env: complete.env,
    encoding: "utf8",
  });
  assert.equal(passed.status, 0, passed.stderr);

  const incomplete = fixture({ omit: "integration" });
  const failed = spawnSync(process.execPath, [script], {
    cwd: incomplete.root,
    env: incomplete.env,
    encoding: "utf8",
  });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /integration.*missing/u);
});

test("aggregator rejects a dependency audit baseline failure", () => {
  const diagnostic = fixture({ fail: "dependency_audit" });
  const result = spawnSync(process.execPath, [script], {
    cwd: diagnostic.root,
    env: diagnostic.env,
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /dependency_audit/u);
});
