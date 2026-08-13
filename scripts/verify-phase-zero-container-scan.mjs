import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import {
  collectFindings,
  evaluateFindings,
  requireCandidateImageVersion,
  validatePhaseZeroScanEvidence,
  validatePolicy,
} from "./container-scan-policy.mjs";
import { buildEnvironmentIdentity } from "./ci-command-evidence-policy.mjs";

const root = resolve(import.meta.dirname, "..");
const scanRoot = resolve(root, ".runtime/security-scans");
const evidenceDirectory = resolve(root, ".runtime/evidence/container-security");
const commandDirectory = resolve(evidenceDirectory, "commands");
const policy = JSON.parse(
  readFileSync(resolve(root, "security/container-scan-policy.json"), "utf8"),
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sourceSha = process.env.PHASE_ZERO_SOURCE_SHA?.trim() ?? "";
const appVersion = process.env.APP_VERSION?.trim() ?? "";
const stepOutcome = process.env.PHASE_ZERO_CONTAINER_SCAN_OUTCOME?.trim() ?? "";
const errors = [];
const requiredCommands = [
  {
    id: "endpoint_environment",
    command: "node scripts/export-phase-zero-endpoint-environment.mjs",
    outcome: process.env.PHASE_ZERO_CONTAINER_ENDPOINT_OUTCOME?.trim() ?? "",
    allowFailure: false,
  },
  {
    id: "container_policy",
    command: "node --test scripts/container-scan-policy.test.mjs",
    outcome: process.env.PHASE_ZERO_CONTAINER_POLICY_OUTCOME?.trim() ?? "",
    allowFailure: false,
  },
  {
    id: "release_images",
    command: "node scripts/build-phase-zero-release-images.mjs",
    outcome:
      process.env.PHASE_ZERO_CONTAINER_RELEASE_IMAGES_OUTCOME?.trim() ?? "",
    allowFailure: false,
  },
  {
    id: "monitoring_validation",
    command: "node scripts/validate-monitoring-config.mjs",
    outcome: process.env.PHASE_ZERO_CONTAINER_MONITORING_OUTCOME?.trim() ?? "",
    allowFailure: false,
  },
  {
    id: "image_scan",
    command: "node scripts/scan-container-images.mjs",
    outcome: stepOutcome,
    allowFailure: true,
  },
];

try {
  validatePolicy(policy);
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}
if (!/^[0-9a-f]{40}$/u.test(sourceSha)) {
  errors.push("PHASE_ZERO_SOURCE_SHA must be a full 40-character commit SHA");
}
try {
  requireCandidateImageVersion(appVersion, sourceSha);
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

const commandEvidence = [];
for (const expected of requiredCommands) {
  const jsonPath = resolve(commandDirectory, `${expected.id}.json`);
  const stdoutPath = resolve(commandDirectory, `${expected.id}.stdout.log`);
  const stderrPath = resolve(commandDirectory, `${expected.id}.stderr.log`);
  if (![jsonPath, stdoutPath, stderrPath].every(existsSync)) {
    errors.push(`${expected.id}: retained command evidence files are missing`);
    continue;
  }
  try {
    const jsonText = readFileSync(jsonPath, "utf8");
    const metadata = JSON.parse(jsonText);
    const stdout = readFileSync(stdoutPath);
    const stderr = readFileSync(stderrPath);
    const commandEnvironment = { ...process.env };
    if (expected.id === "endpoint_environment") {
      commandEnvironment.NEXT_PUBLIC_API_BASE_URL =
        process.env.PHASE_ZERO_TEST_API_BASE_URL;
    }
    if (
      metadata.id !== expected.id ||
      metadata.sourceSha !== sourceSha ||
      metadata.argv?.join(" ") !== expected.command ||
      metadata.stdout?.sha256 !== sha256(stdout) ||
      metadata.stderr?.sha256 !== sha256(stderr) ||
      JSON.stringify(metadata.environment) !==
        JSON.stringify(buildEnvironmentIdentity(commandEnvironment)) ||
      !["success", "failure"].includes(expected.outcome) ||
      (expected.outcome === "success" && metadata.exitCode !== 0) ||
      (expected.outcome === "failure" && metadata.exitCode === 0) ||
      (!expected.allowFailure && expected.outcome !== "success") ||
      (expected.id === "container_policy" &&
        (metadata.testPolicy?.passed !== true ||
          !(metadata.testPolicy?.totals?.total > 0)))
    ) {
      errors.push(
        `${expected.id}: command evidence does not match source, argv, output, or required outcome`,
      );
      continue;
    }
    commandEvidence.push({
      id: expected.id,
      outcome: expected.outcome,
      metadataSha256: sha256(jsonText),
      stdoutSha256: metadata.stdout.sha256,
      stderrSha256: metadata.stderr.sha256,
      ...(metadata.testPolicy
        ? { testPolicy: metadata.testPolicy }
        : undefined),
    });
  } catch {
    errors.push(`${expected.id}: retained command evidence is invalid`);
  }
}

const summaries = existsSync(scanRoot)
  ? readdirSync(scanRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => resolve(scanRoot, entry.name, "summary.json"))
      .filter(existsSync)
  : [];
if (summaries.length !== 1) {
  errors.push(
    `exactly one complete container scan summary is required; found ${summaries.length}`,
  );
}

let summary;
let summaryText;
const summaryPath = summaries[0];
if (summaryPath) {
  if (["passed", "blocked"].includes(result.status))
    try {
      summaryText = readFileSync(summaryPath, "utf8");
      summary = JSON.parse(summaryText);
      errors.push(
        ...validatePhaseZeroScanEvidence({
          summary,
          policy,
          appVersion,
          stepOutcome,
        }),
      );
    } catch (error) {
      errors.push(
        `container scan summary is invalid: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
}

const retainedResults = [];
const retainedPaths = new Set();
for (const result of summary?.results ?? []) {
  const retained = {
    image: result.image,
    resolvedIdentity: result.resolvedIdentity,
    repoDigests: result.repoDigests,
    status: result.status,
    findingCount: result.findingCount,
    acceptedCount: result.acceptedCount,
    blockingCount: result.blockingCount,
  };
  for (const [field, path] of [
    ["reportSha256", result.reportPath],
    ["logSha256", result.logPath],
  ]) {
    const absolutePath = resolve(root, String(path ?? ""));
    const relativePath = relative(scanRoot, absolutePath);
    if (
      !path ||
      isAbsolute(relativePath) ||
      relativePath.startsWith("..") ||
      !existsSync(absolutePath)
    ) {
      errors.push(
        `${result.image}: retained ${field} input is missing or unsafe`,
      );
    } else {
      if (retainedPaths.has(absolutePath)) {
        errors.push(`${result.image}: retained evidence path is reused`);
      }
      retainedPaths.add(absolutePath);
      retained[field] = sha256(readFileSync(absolutePath));
    }
  }
  try {
    const reportPath = resolve(root, String(result.reportPath ?? ""));
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    if (!Array.isArray(report.Results) || report.Results.length === 0) {
      throw new Error("Trivy report has no result targets");
    }
    const findings = collectFindings(report, result.image);
    const evaluation = evaluateFindings(findings, policy.exceptions);
    const expectedStatus =
      evaluation.blocking.length === 0 ? "passed" : "blocked";
    if (
      result.findingCount !== findings.length ||
      result.acceptedCount !== evaluation.accepted.length ||
      result.blockingCount !== evaluation.blocking.length ||
      result.status !== expectedStatus
    ) {
      errors.push(
        `${result.image}: retained Trivy report contradicts the scan summary`,
      );
    }
  } catch (error) {
    errors.push(
      `${result.image}: retained Trivy report cannot be independently evaluated: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  retainedResults.push(retained);
}

const evidence = {
  schemaVersion: 1,
  recordedAt: new Date().toISOString(),
  sourceSha,
  result: errors.length === 0 ? "passed" : "failed",
  scanStepOutcome: stepOutcome,
  scanGateResult: summary?.result ?? "missing",
  scanSummaryPath: summaryPath
    ? relative(root, summaryPath).replaceAll("\\", "/")
    : null,
  scanSummarySha256: summaryText ? sha256(summaryText) : null,
  environment: buildEnvironmentIdentity(process.env),
  policySha256: sha256(
    readFileSync(resolve(root, "security/container-scan-policy.json")),
  ),
  commandEvidence,
  results: retainedResults,
  errors,
};
mkdirSync(evidenceDirectory, { recursive: true });
const evidencePath = resolve(evidenceDirectory, "steps.json");
writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, {
  encoding: "utf8",
  flag: "wx",
});
console.log(
  `Phase 0 container evidence written to ${relative(root, evidencePath).replaceAll("\\", "/")}`,
);
if (errors.length > 0) {
  console.error(`Phase 0 container evidence failed: ${errors.join("; ")}`);
  process.exitCode = 1;
}
