import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  collectFindings,
  evaluateFindings,
  expandImage,
  requireCandidateImageVersion,
  validatePolicy,
} from "./container-scan-policy.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const policyPath = path.join(
  repositoryRoot,
  "security",
  "container-scan-policy.json",
);
const policy = JSON.parse(readFileSync(policyPath, "utf8"));
validatePolicy(policy);

const requestedImages = process.env.IMAGE_SCAN_IMAGES?.trim();
const diagnosticMode = Boolean(requestedImages);
const appVersion = process.env.APP_VERSION?.trim();
if (diagnosticMode && process.env.IMAGE_SCAN_MODE !== "diagnostic") {
  throw new Error(
    "IMAGE_SCAN_IMAGES is diagnostic-only; set IMAGE_SCAN_MODE=diagnostic. A subset can never pass the release gate.",
  );
}
if (!diagnosticMode) {
  requireCandidateImageVersion(
    appVersion,
    process.env.PHASE_ZERO_SOURCE_SHA?.trim(),
  );
}
const images = [
  ...new Set(
    (requestedImages
      ? requestedImages.split(",")
      : policy.images.map((image) => expandImage(image, appVersion))
    )
      .map((image) => image.trim())
      .filter(Boolean),
  ),
];

if (images.length === 0) {
  throw new Error("No images were selected for scanning.");
}

const scanId = new Date().toISOString().replaceAll(":", "-");
const reportDirectory = path.join(
  repositoryRoot,
  ".runtime",
  "security-scans",
  scanId,
);
mkdirSync(reportDirectory, { recursive: true });

const results = [];
let scanFailed = false;

for (const [index, image] of images.entries()) {
  console.log(`[${index + 1}/${images.length}] Scanning ${image}`);
  const safeName = `${String(index + 1).padStart(2, "0")}-${image.replaceAll(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const reportPath = path.join(reportDirectory, `${safeName}.json`);
  const logPath = path.join(reportDirectory, `${safeName}.log`);
  const identity = spawnSync(
    "docker",
    [
      "image",
      "inspect",
      "--format",
      '{{.Id}}|{{join .RepoDigests ","}}',
      image,
    ],
    { cwd: repositoryRoot, encoding: "utf8", windowsHide: true },
  );
  if (identity.status !== 0 || !identity.stdout?.trim()) {
    const error =
      "Docker could not resolve the local image ID/digest before scanning.";
    writeFileSync(
      reportPath,
      `${JSON.stringify({ schemaVersion: 1, image, stage: "identity", error }, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(logPath, identity.stderr ?? error, "utf8");
    scanFailed = true;
    results.push({
      image,
      status: "identity-error",
      exitCode: identity.status,
      error,
      reportPath: path.relative(repositoryRoot, reportPath),
      logPath: path.relative(repositoryRoot, logPath),
    });
    console.error("  ERROR: image identity could not be resolved");
    continue;
  }
  const [resolvedIdentity, repoDigestText = ""] = identity.stdout
    .trim()
    .split("|", 2);
  if (!/^sha256:[0-9a-f]{64}$/u.test(resolvedIdentity ?? "")) {
    const error =
      "Docker returned an invalid immutable image ID before scanning.";
    writeFileSync(
      reportPath,
      `${JSON.stringify({ schemaVersion: 1, image, stage: "identity", error }, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(logPath, error, "utf8");
    scanFailed = true;
    results.push({
      image,
      status: "identity-error",
      exitCode: identity.status,
      error,
      reportPath: path.relative(repositoryRoot, reportPath),
      logPath: path.relative(repositoryRoot, logPath),
    });
    console.error("  ERROR: immutable image ID is invalid");
    continue;
  }
  const repoDigests = repoDigestText.split(",").filter(Boolean);
  const scan = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "--volume",
      "/var/run/docker.sock:/var/run/docker.sock",
      "--volume",
      "mecoflow-trivy-cache:/root/.cache/",
      policy.scannerImage,
      "image",
      "--scanners",
      "vuln",
      "--severity",
      policy.severities.join(","),
      "--format",
      "json",
      "--no-progress",
      "--timeout",
      process.env.TRIVY_TIMEOUT?.trim() || "10m",
      resolvedIdentity,
    ],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      maxBuffer: 100 * 1024 * 1024,
      windowsHide: true,
    },
  );

  writeFileSync(logPath, scan.stderr ?? "", "utf8");

  if (scan.status !== 0 || !scan.stdout?.trim()) {
    scanFailed = true;
    results.push({
      image,
      status: "scan-error",
      exitCode: scan.status,
      error: scan.error?.message ?? "Trivy did not return a JSON report.",
      reportPath: path.relative(repositoryRoot, reportPath),
      logPath: path.relative(repositoryRoot, logPath),
    });
    console.error(`  ERROR: scanner exited with ${scan.status ?? "no status"}`);
    continue;
  }

  writeFileSync(reportPath, scan.stdout, "utf8");
  let report;
  try {
    report = JSON.parse(scan.stdout);
  } catch (error) {
    scanFailed = true;
    results.push({
      image,
      status: "scan-error",
      exitCode: scan.status,
      error: `Invalid Trivy JSON: ${error.message}`,
      reportPath: path.relative(repositoryRoot, reportPath),
      logPath: path.relative(repositoryRoot, logPath),
    });
    console.error("  ERROR: scanner returned invalid JSON");
    continue;
  }

  if (!Array.isArray(report.Results) || report.Results.length === 0) {
    scanFailed = true;
    results.push({
      image,
      resolvedIdentity,
      repoDigests,
      status: "scan-error",
      exitCode: scan.status,
      error: "Trivy JSON did not contain a non-empty Results array.",
      reportPath: path.relative(repositoryRoot, reportPath),
      logPath: path.relative(repositoryRoot, logPath),
    });
    console.error("  ERROR: scanner returned no result targets");
    continue;
  }
  const findings = collectFindings(report, image);
  const evaluation = evaluateFindings(findings, policy.exceptions);
  results.push({
    image,
    resolvedIdentity,
    repoDigests,
    status: evaluation.blocking.length === 0 ? "passed" : "blocked",
    findingCount: findings.length,
    acceptedCount: evaluation.accepted.length,
    blockingCount: evaluation.blocking.length,
    blockingFindings: evaluation.blocking,
    acceptedFindings: evaluation.accepted,
    reportPath: path.relative(repositoryRoot, reportPath),
    logPath: path.relative(repositoryRoot, logPath),
  });
  console.log(
    `  ${evaluation.blocking.length === 0 ? "PASS" : "BLOCK"}: ${findings.length} finding(s), ${evaluation.accepted.length} approved exception(s), ${evaluation.blocking.length} blocker(s)`,
  );
}

const summary = {
  schemaVersion: 1,
  scanId,
  generatedAt: new Date().toISOString(),
  scannerImage: policy.scannerImage,
  severities: policy.severities,
  appVersion,
  diagnosticMode,
  result: diagnosticMode
    ? "diagnostic"
    : scanFailed || results.some((result) => result.status !== "passed")
      ? "failed"
      : "passed",
  results,
};
const summaryPath = path.join(reportDirectory, "summary.json");
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`Scan evidence: ${path.relative(repositoryRoot, summaryPath)}`);
if (diagnosticMode) {
  console.error(
    "Container image scan completed in DIAGNOSTIC mode; subset results never pass the release gate.",
  );
  process.exitCode = 2;
} else if (summary.result !== "passed") {
  console.error(
    "Container image gate FAILED. Fix every blocker or obtain a narrow, time-bound approved exception.",
  );
  process.exitCode = 1;
} else {
  console.log("Container image gate PASSED.");
}
