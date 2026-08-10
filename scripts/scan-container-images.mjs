import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  collectFindings,
  evaluateFindings,
  expandImage,
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

const appVersion = process.env.APP_VERSION?.trim() || "0.1.0";
const requestedImages = process.env.IMAGE_SCAN_IMAGES?.trim();
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
      image,
    ],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      maxBuffer: 100 * 1024 * 1024,
      windowsHide: true,
    },
  );

  const safeName = `${String(index + 1).padStart(2, "0")}-${image.replaceAll(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const reportPath = path.join(reportDirectory, `${safeName}.json`);
  const logPath = path.join(reportDirectory, `${safeName}.log`);
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

  const findings = collectFindings(report, image);
  const evaluation = evaluateFindings(findings, policy.exceptions);
  results.push({
    image,
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
  result:
    scanFailed || results.some((result) => result.status !== "passed")
      ? "failed"
      : "passed",
  results,
};
const summaryPath = path.join(reportDirectory, "summary.json");
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`Scan evidence: ${path.relative(repositoryRoot, summaryPath)}`);
if (summary.result !== "passed") {
  console.error(
    "Container image gate FAILED. Fix every blocker or obtain a narrow, time-bound approved exception.",
  );
  process.exitCode = 1;
} else {
  console.log("Container image gate PASSED.");
}
