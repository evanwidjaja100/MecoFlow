import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import process from "node:process";
import { validatePhaseZeroExternalEvidence } from "./phase-zero-external-evidence-policy.mjs";

const root = process.cwd();
const closure = JSON.parse(
  readFileSync(join(root, "docs/readiness/phase-zero-closure.json"), "utf8"),
);
const approvals = JSON.parse(
  readFileSync(join(root, "docs/readiness/approvals.json"), "utf8"),
);
const governance = readFileSync(
  join(root, "docs/readiness/governance.md"),
  "utf8",
);

function fail(message) {
  throw new Error(message);
}

function gh(args, { binary = false, maxBuffer = 20 * 1024 * 1024 } = {}) {
  return execFileSync("gh", args, {
    cwd: root,
    encoding: binary ? null : "utf8",
    maxBuffer,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function api(endpoint, { bytes = false } = {}) {
  return gh(
    [
      "api",
      "-H",
      "Accept: application/vnd.github+json",
      "-H",
      "X-GitHub-Api-Version: 2022-11-28",
      endpoint,
    ],
    { binary: bytes },
  );
}

function apiJson(endpoint) {
  return JSON.parse(api(endpoint));
}

function safeRepository(value) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(value ?? "")) {
    fail("closure evidence requires a safe owner/repository identity");
  }
  return value;
}

function safeId(value, label) {
  const id = String(value ?? "");
  if (!/^\d+$/u.test(id)) fail(`${label} must be a numeric GitHub ID`);
  return id;
}

function evidenceApiUri(value, repository) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail("approval/control evidence must use the canonical GitHub API");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "api.github.com" ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    !parsed.pathname.startsWith(`/repos/${repository}/`)
  ) {
    fail(
      "approval/control evidence must use the candidate repository GitHub API namespace",
    );
  }
  return parsed.href;
}

function independentReviewerRoster(markdown) {
  const requiredRoles = new Set([
    "INDEPENDENT-SECURITY",
    "INDEPENDENT-DATA-RELEASE",
  ]);
  return markdown
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("|"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.replaceAll("`", "").trim()),
    )
    .filter((cells) => requiredRoles.has(cells[1]))
    .map((cells) => ({ roleId: cells[1], identity: cells[3] }));
}

function filesUnder(directory) {
  const files = [];
  const pending = [directory];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isSymbolicLink())
        fail("artifact downloads must not contain symbolic links");
      if (entry.isDirectory()) pending.push(path);
      else if (entry.isFile()) files.push(path);
      if (files.length > 50_000)
        fail("artifact download contains too many files");
    }
  }
  return files;
}

function uniqueFile(files, suffix, label) {
  const normalizedSuffix = suffix.replaceAll("\\", "/");
  const matches = files.filter((file) =>
    file.replaceAll("\\", "/").endsWith(normalizedSuffix),
  );
  if (matches.length !== 1) fail(`${label}: expected exactly one ${suffix}`);
  const size = statSync(matches[0]).size;
  if (size <= 0 || size > 100 * 1024 * 1024) {
    fail(`${label}: required evidence file has an unsafe size`);
  }
  return matches[0];
}

function evidenceFile(files, candidates, label) {
  for (const candidate of candidates) {
    const matches = files.filter((file) =>
      file.replaceAll("\\", "/").endsWith(candidate),
    );
    if (matches.length === 1) return uniqueFile(files, candidate, label);
    if (matches.length > 1) fail(`${label}: duplicate ${candidate} files`);
  }
  fail(`${label}: required evidence file is missing`);
}

function downloadArtifact({ repository, runId, runAttempt, name, jobName }) {
  const directory = mkdtempSync(
    join(tmpdir(), "mecoflow-phase-zero-artifact-"),
  );
  try {
    gh([
      "run",
      "download",
      runId,
      "--repo",
      repository,
      "--name",
      name,
      "--dir",
      directory,
    ]);
    const files = filesUnder(directory);
    const manifestPath = evidenceFile(
      files,
      [
        `.runtime/evidence/${jobName}/manifest.json`,
        `evidence/${jobName}/manifest.json`,
        "/manifest.json",
      ],
      name,
    );
    const stepsPath = evidenceFile(
      files,
      [
        `.runtime/evidence/${jobName}/steps.json`,
        `evidence/${jobName}/steps.json`,
        "/steps.json",
      ],
      name,
    );
    const result = {
      manifest: readFileSync(manifestPath),
      steps: readFileSync(stepsPath),
    };
    if (jobName === "container-security") {
      const steps = JSON.parse(result.steps);
      const scanPath = String(steps.scanSummaryPath ?? "");
      if (
        !scanPath.startsWith(".runtime/security-scans/") ||
        basename(scanPath) !== "summary.json"
      ) {
        fail(`${name}: container evidence has an unsafe scan summary path`);
      }
      result.scanSummary = readFileSync(
        uniqueFile(files, scanPath.slice(".runtime/".length), name),
      );
    }
    return result;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

try {
  if (closure.schemaVersion !== 1 || closure.status !== "COMPLETE") {
    fail(
      "phase-zero-closure.json must be COMPLETE before external evidence verification",
    );
  }
  const authoritative = closure.authoritativeEvidence;
  const reproduction = closure.independentReproduction;
  const repositoryName = safeRepository(authoritative?.repository);
  if (reproduction?.repository !== repositoryName) {
    fail("authoritative and independent evidence must use one repository");
  }
  const repository = apiJson(`repos/${repositoryName}`);
  const runs = new Map();
  const jobs = new Map();
  const artifacts = new Map();
  const artifactFiles = new Map();

  for (const claim of [authoritative, reproduction]) {
    const runId = safeId(claim.runId, "workflow run ID");
    const runAttempt = safeId(claim.runAttempt, "workflow run attempt");
    runs.set(
      runId,
      apiJson(
        `repos/${repositoryName}/actions/runs/${runId}/attempts/${runAttempt}`,
      ),
    );
    jobs.set(
      runId,
      apiJson(
        `repos/${repositoryName}/actions/runs/${runId}/attempts/${runAttempt}/jobs?per_page=100`,
      ),
    );
    for (const [claimName, jobClaim] of Object.entries(claim.jobs ?? {})) {
      const artifactId = safeId(jobClaim.artifactId, "artifact ID");
      const live = apiJson(
        `repos/${repositoryName}/actions/artifacts/${artifactId}`,
      );
      artifacts.set(artifactId, live);
      const prefix =
        claimName === "verify" ? "phase-zero-verify" : "phase-zero-container";
      artifactFiles.set(
        artifactId,
        downloadArtifact({
          repository: repositoryName,
          runId,
          runAttempt,
          name: `${prefix}-${runId}-${runAttempt}`,
          jobName: claimName === "verify" ? "verify" : "container-security",
        }),
      );
    }
  }

  const resources = new Map();
  const evidenceUris = new Set([
    ...(approvals.records ?? []).map((record) => record.evidenceUri),
    ...Object.values(closure.remoteControls ?? {}).map(
      (control) => control.evidenceUri,
    ),
  ]);
  for (const uri of evidenceUris) {
    const safeUri = evidenceApiUri(uri, repositoryName);
    const bytes = api(safeUri, { bytes: true });
    resources.set(uri, { bytes, json: JSON.parse(bytes) });
  }

  const inputDigests = Object.fromEntries(
    [
      ["workflow", ".github/workflows/ci.yml"],
      ["endpointMatrix", "docs/readiness/endpoint-matrix.json"],
      ["decisions", "docs/readiness/decisions.json"],
      ["supportedVersions", "docs/readiness/supported-versions.json"],
    ].map(([name, path]) => [
      name,
      createHash("sha256")
        .update(readFileSync(join(root, path)))
        .digest("hex"),
    ]),
  );
  const endpointMatrix = JSON.parse(
    readFileSync(join(root, "docs/readiness/endpoint-matrix.json"), "utf8"),
  );

  const errors = validatePhaseZeroExternalEvidence({
    closure,
    approvals,
    repository,
    runs,
    jobs,
    artifacts,
    artifactFiles,
    resources,
    inputDigests,
    independentReviewerRoster: independentReviewerRoster(governance),
    expectedPublicApiBaseUrl: endpointMatrix.build?.nextPublicApiBaseUrl,
  });
  if (errors.length > 0) {
    console.error("Phase 0 external evidence check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Phase 0 external evidence check passed for ${repository.full_name} at ${closure.candidate.sourceSha}.`,
    );
  }
} catch (error) {
  const stderr = error?.stderr?.toString?.().trim();
  console.error(
    `Phase 0 external evidence check failed: ${error instanceof Error ? error.message : String(error)}${stderr ? ` (${stderr})` : ""}`,
  );
  process.exitCode = 1;
}
