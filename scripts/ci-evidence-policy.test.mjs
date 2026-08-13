import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildCiEvidence, resolveEvidencePath } from "./ci-evidence-policy.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-ci-evidence-"));
  mkdirSync(join(root, "security"));
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  mkdirSync(join(root, "docs", "readiness"), { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ packageManager: "pnpm@11.13.0" }),
  );
  writeFileSync(join(root, ".github/workflows/ci.yml"), "name: CI\n");
  for (const file of [
    "endpoint-matrix.json",
    "decisions.json",
    "supported-versions.json",
  ]) {
    writeFileSync(join(root, "docs/readiness", file), "{}\n");
  }
  writeFileSync(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  writeFileSync(
    join(root, "security/container-scan-policy.json"),
    '{"images":[]}\n',
  );
  return root;
}

function environment() {
  return {
    GITHUB_REPOSITORY: "example/mecoflow",
    GITHUB_REPOSITORY_ID: "9876",
    GITHUB_SHA: "a".repeat(40),
    PHASE_ZERO_SOURCE_REF: "main",
    PHASE_ZERO_SOURCE_SHA: "a".repeat(40),
    GITHUB_REF: "refs/heads/main",
    GITHUB_EVENT_NAME: "push",
    GITHUB_ACTOR: "reviewer",
    GITHUB_ACTOR_ID: "1234",
    GITHUB_TRIGGERING_ACTOR: "reviewer",
    GITHUB_WORKFLOW_REF:
      "example/mecoflow/.github/workflows/ci.yml@refs/heads/main",
    GITHUB_WORKFLOW_SHA: "a".repeat(40),
    GITHUB_RUN_ID: "1234",
    GITHUB_RUN_ATTEMPT: "2",
    GITHUB_WORKFLOW: "CI",
    PHASE_ZERO_JOB: "verify",
    PHASE_ZERO_JOB_STATUS: "failure",
    RUNNER_OS: "Linux",
    RUNNER_ARCH: "X64",
    RUNNER_NAME: "GitHub Actions 1",
  };
}

test("builds a secret-free source and input-bound CI evidence manifest", () => {
  const evidence = buildCiEvidence({
    root: fixture(),
    env: { ...environment(), SESSION_SECRET: "must-not-leak" },
    now: new Date("2026-08-11T00:00:00.000Z"),
    runtimeVersion: "v24.18.0",
  });

  assert.equal(evidence.source.sha, "a".repeat(40));
  assert.equal(evidence.run.status, "failure");
  assert.deepEqual(evidence.run.trigger, {
    event: "push",
    actor: { login: "reviewer", id: "1234" },
    triggeringActor: { login: "reviewer" },
  });
  assert.equal(evidence.source.repositoryId, "9876");
  assert.equal(evidence.source.workflowSha, "a".repeat(40));
  assert.match(evidence.inputs.lockfile.sha256, /^[0-9a-f]{64}$/u);
  assert.match(evidence.inputs.containerScanPolicy.sha256, /^[0-9a-f]{64}$/u);
  assert.match(evidence.inputs.workflow.sha256, /^[0-9a-f]{64}$/u);
  assert.match(evidence.inputs.endpointMatrix.sha256, /^[0-9a-f]{64}$/u);
  assert.match(evidence.inputs.decisions.sha256, /^[0-9a-f]{64}$/u);
  assert.match(evidence.inputs.supportedVersions.sha256, /^[0-9a-f]{64}$/u);
  assert.equal(JSON.stringify(evidence).includes("must-not-leak"), false);
});

test("fails closed for incomplete attribution or an invalid job status", () => {
  const root = fixture();
  assert.throws(
    () =>
      buildCiEvidence({
        root,
        env: { ...environment(), PHASE_ZERO_SOURCE_SHA: "abc" },
      }),
    /full 40-character/u,
  );
  assert.throws(
    () =>
      buildCiEvidence({
        root,
        env: { ...environment(), PHASE_ZERO_JOB_STATUS: "unknown" },
      }),
    /must be success, failure, or cancelled/u,
  );
  assert.throws(
    () =>
      buildCiEvidence({
        root,
        env: { ...environment(), GITHUB_ACTOR_ID: "unstable" },
      }),
    /stable numeric identity/u,
  );
  assert.throws(
    () =>
      buildCiEvidence({
        root,
        env: { ...environment(), GITHUB_EVENT_NAME: "schedule" },
      }),
    /approved CI evidence event/u,
  );
});

test("keeps generated evidence inside the repository", () => {
  const root = fixture();
  assert.match(
    resolveEvidencePath(root, ".runtime/evidence", "verify"),
    /\.runtime[\\/]evidence[\\/]verify$/u,
  );
  assert.throws(
    () => resolveEvidencePath(root, "../outside", "verify"),
    /must be a child/u,
  );
});
