import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const SHA_1 = /^[0-9a-f]{40}$/u;
const BRANCH = /^(?![./])(?!.*(?:\.\.|\/\/|@\{))[A-Za-z0-9._/-]+(?<![./])$/u;
const JOB_STATUSES = new Set(["success", "failure", "cancelled"]);
const EVENT_NAMES = new Set(["pull_request", "push", "workflow_dispatch"]);

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required for CI evidence`);
  return value;
}

export function buildCiEvidence({
  root,
  env,
  now = new Date(),
  runtimeVersion = process.version,
}) {
  const repository = required(env, "GITHUB_REPOSITORY");
  const repositoryId = required(env, "GITHUB_REPOSITORY_ID");
  const sourceSha = required(env, "PHASE_ZERO_SOURCE_SHA");
  const sourceBranch = required(env, "PHASE_ZERO_SOURCE_REF");
  const runId = required(env, "GITHUB_RUN_ID");
  const runAttempt = required(env, "GITHUB_RUN_ATTEMPT");
  const job = required(env, "PHASE_ZERO_JOB");
  const jobStatus = required(env, "PHASE_ZERO_JOB_STATUS");
  const eventName = required(env, "GITHUB_EVENT_NAME");
  const actorLogin = required(env, "GITHUB_ACTOR");
  const actorId = required(env, "GITHUB_ACTOR_ID");
  const triggeringActor = required(env, "GITHUB_TRIGGERING_ACTOR");

  if (!SHA_1.test(sourceSha)) {
    throw new Error(
      "PHASE_ZERO_SOURCE_SHA must be a full 40-character commit SHA",
    );
  }
  if (!BRANCH.test(sourceBranch)) {
    throw new Error("PHASE_ZERO_SOURCE_REF must be an unqualified branch name");
  }
  if (!JOB_STATUSES.has(jobStatus)) {
    throw new Error(
      "PHASE_ZERO_JOB_STATUS must be success, failure, or cancelled",
    );
  }
  if (!EVENT_NAMES.has(eventName)) {
    throw new Error("GITHUB_EVENT_NAME is not an approved CI evidence event");
  }
  if (!/^\d+$/u.test(actorId)) {
    throw new Error("GITHUB_ACTOR_ID must be a stable numeric identity");
  }
  if (!/^\d+$/u.test(repositoryId)) {
    throw new Error("GITHUB_REPOSITORY_ID must be a stable numeric identity");
  }

  const packageManifest = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  );

  const stepSummaryPath = resolve(root, ".runtime/evidence", job, "steps.json");
  let executionEnvironment;
  const inputs = {
    lockfile: {
      path: "pnpm-lock.yaml",
      sha256: sha256(resolve(root, "pnpm-lock.yaml")),
    },
    containerScanPolicy: {
      path: "security/container-scan-policy.json",
      sha256: sha256(resolve(root, "security/container-scan-policy.json")),
    },
    workflow: {
      path: ".github/workflows/ci.yml",
      sha256: sha256(resolve(root, ".github/workflows/ci.yml")),
    },
    endpointMatrix: {
      path: "docs/readiness/endpoint-matrix.json",
      sha256: sha256(resolve(root, "docs/readiness/endpoint-matrix.json")),
    },
    decisions: {
      path: "docs/readiness/decisions.json",
      sha256: sha256(resolve(root, "docs/readiness/decisions.json")),
    },
    supportedVersions: {
      path: "docs/readiness/supported-versions.json",
      sha256: sha256(resolve(root, "docs/readiness/supported-versions.json")),
    },
  };
  if (existsSync(stepSummaryPath)) {
    const stepSummary = JSON.parse(readFileSync(stepSummaryPath, "utf8"));
    if (
      stepSummary?.schemaVersion !== 1 ||
      stepSummary?.sourceSha !== sourceSha
    ) {
      throw new Error(
        "CI step summary must be schemaVersion 1 and source-bound",
      );
    }
    inputs.phaseZeroStepSummary = {
      path: relative(root, stepSummaryPath).replaceAll("\\", "/"),
      sha256: sha256(stepSummaryPath),
    };
    executionEnvironment = stepSummary.environment;
  }

  return {
    schemaVersion: 1,
    recordedAt: now.toISOString(),
    source: {
      repository,
      repositoryId,
      sha: sourceSha,
      ref: `refs/heads/${sourceBranch}`,
      workflow: required(env, "GITHUB_WORKFLOW"),
      workflowRef: `${repository}/.github/workflows/ci.yml@refs/heads/${sourceBranch}`,
      workflowSha: sourceSha,
    },
    run: {
      id: runId,
      attempt: runAttempt,
      job,
      status: jobStatus,
      url: `https://github.com/${repository}/actions/runs/${runId}`,
      trigger: {
        event: eventName,
        actor: { login: actorLogin, id: actorId },
        triggeringActor: { login: triggeringActor },
      },
    },
    runner: {
      os: required(env, "RUNNER_OS"),
      architecture: required(env, "RUNNER_ARCH"),
      name: required(env, "RUNNER_NAME"),
    },
    toolchain: {
      node: runtimeVersion.replace(/^v/u, ""),
      packageManager: packageManifest.packageManager,
    },
    executionEnvironment,
    inputs,
  };
}

export function resolveEvidencePath(root, requestedDirectory, job) {
  const directory = resolve(root, requestedDirectory, job);
  const relativePath = relative(resolve(root), directory);
  if (relativePath.startsWith("..") || relativePath === "") {
    throw new Error("CI evidence output must be a child of the repository");
  }
  return directory;
}
