import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import test from "node:test";
import {
  buildCommandEvidence,
  buildEnvironmentIdentity,
} from "./ci-command-evidence-policy.mjs";
import {
  collectFindings,
  candidateBuildTimestamp,
  evaluateFindings,
  expandImage,
  parseAndValidatePhaseZeroScanSummary,
  requireCandidateImageVersion,
  validatePhaseZeroScanEvidence,
  validatePolicy,
  validateRetainedTrivyReport,
} from "./container-scan-policy.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const realPolicy = JSON.parse(
  readFileSync(
    resolve(repositoryRoot, "security/container-scan-policy.json"),
    "utf8",
  ),
);

const approvedException = {
  image: "example/image:1",
  vulnerabilityId: "CVE-2099-0001",
  packageName: "example-package",
  owner: "Security",
  approvedBy: "Security lead",
  expiresOn: "2099-12-31",
  rationale: "No upstream patch exists.",
  compensatingControls: "Network isolation and monitoring.",
  status: "approved",
};

test("policy requires a digest-pinned scanner", () => {
  assert.throws(
    () =>
      validatePolicy({
        schemaVersion: 1,
        scannerImage: "aquasec/trivy:latest",
        images: ["example/image:1"],
        exceptions: [],
      }),
    /pinned by digest/,
  );
});

test("policy requires the exact Phase 0 critical and high severity set", () => {
  const base = {
    schemaVersion: 1,
    scannerImage: "scanner@sha256:abc",
    images: ["example/image:1"],
    exceptions: [],
  };
  assert.doesNotThrow(() =>
    validatePolicy({ ...base, severities: ["HIGH", "CRITICAL"] }),
  );
  assert.throws(
    () => validatePolicy({ ...base, severities: ["CRITICAL"] }),
    /exactly CRITICAL and HIGH/u,
  );
});

test("expired exceptions fail policy validation", () => {
  assert.throws(
    () =>
      validatePolicy(
        {
          schemaVersion: 1,
          scannerImage: "scanner@sha256:abc",
          severities: ["CRITICAL", "HIGH"],
          images: ["example/image:1"],
          exceptions: [{ ...approvedException, expiresOn: "2025-01-01" }],
        },
        new Date("2026-01-01T00:00:00Z"),
      ),
    /expired/,
  );
});

test("exceptions match image, vulnerability, and package exactly", () => {
  const finding = {
    image: "example/image:1",
    vulnerabilityId: "CVE-2099-0001",
    packageName: "example-package",
    target: "example",
  };
  assert.equal(
    evaluateFindings([finding], [approvedException]).accepted.length,
    1,
  );
  assert.equal(
    evaluateFindings(
      [{ ...finding, packageName: "different-package" }],
      [approvedException],
    ).blocking.length,
    1,
  );
});

test("Trivy results are normalized and unexcepted findings block", () => {
  const findings = collectFindings(
    {
      Results: [
        {
          Target: "usr/local/bin/example",
          Class: "lang-pkgs",
          Type: "gobinary",
          Vulnerabilities: [
            {
              VulnerabilityID: "CVE-2099-0002",
              PkgName: "stdlib",
              InstalledVersion: "1.0.0",
              FixedVersion: "1.0.1",
              Severity: "HIGH",
            },
          ],
        },
      ],
    },
    "example/image:1",
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].target, "usr/local/bin/example");
  assert.equal(evaluateFindings(findings, []).blocking.length, 1);
});

test("application-version placeholders expand exactly", () => {
  assert.equal(
    expandImage("mecoflow/api:${APP_VERSION}", "1.2.3"),
    "mecoflow/api:1.2.3",
  );
});

test("release image versions are exactly bound to the candidate SHA", () => {
  const sha = "a".repeat(40);
  assert.equal(requireCandidateImageVersion(sha, sha), sha);
  assert.throws(
    () => requireCandidateImageVersion("ci", sha),
    /must exactly equal GITHUB_SHA/u,
  );
  assert.throws(
    () => requireCandidateImageVersion(sha, "abc"),
    /full 40-character/u,
  );
});

test("candidate image build timestamps are deterministic commit timestamps", () => {
  assert.equal(
    candidateBuildTimestamp("2026-08-11T07:08:09+07:00"),
    "2026-08-11T00:08:09Z",
  );
  assert.throws(() => candidateBuildTimestamp("now"), /valid ISO timestamp/u);
});

function phaseZeroFixture(status = "blocked") {
  const image = "example/image:ci";
  return {
    policy: {
      schemaVersion: 1,
      scannerImage: "scanner@sha256:abc",
      severities: ["CRITICAL", "HIGH"],
      images: ["example/image:${APP_VERSION}"],
      exceptions: [],
    },
    summary: {
      schemaVersion: 1,
      scannerImage: "scanner@sha256:abc",
      appVersion: "ci",
      diagnosticMode: false,
      result: status === "blocked" ? "failed" : "passed",
      results: [
        {
          image,
          resolvedIdentity: `sha256:${"1".repeat(64)}`,
          repoDigests: [],
          status,
          findingCount: status === "blocked" ? 1 : 0,
          acceptedCount: 0,
          blockingCount: status === "blocked" ? 1 : 0,
          reportPath: ".runtime/security-scans/run/01.json",
          logPath: ".runtime/security-scans/run/01.log",
        },
      ],
    },
  };
}

const candidateSha = "a".repeat(40);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function copyHarnessFile(fixtureRoot, path) {
  const destination = resolve(fixtureRoot, path);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(resolve(repositoryRoot, path), destination);
}

function childEnvironment(overrides = {}) {
  return Object.fromEntries(
    Object.entries({
      PATH: process.env.PATH,
      PATHEXT: process.env.PATHEXT,
      SystemRoot: process.env.SystemRoot,
      ComSpec: process.env.ComSpec,
      TEMP: process.env.TEMP,
      TMP: process.env.TMP,
      APP_ENV: "test",
      APP_VERSION: candidateSha,
      PHASE_ZERO_SOURCE_SHA: candidateSha,
      ...overrides,
    }).filter(([, value]) => value !== undefined),
  );
}

function buildVerifierFixture(fixtureRoot) {
  for (const path of [
    "scripts/verify-phase-zero-container-scan.mjs",
    "scripts/container-scan-policy.mjs",
    "scripts/ci-command-evidence-policy.mjs",
    "security/container-scan-policy.json",
  ]) {
    copyHarnessFile(fixtureRoot, path);
  }

  const environment = childEnvironment({
    PHASE_ZERO_CONTAINER_ENDPOINT_OUTCOME: "success",
    PHASE_ZERO_CONTAINER_POLICY_OUTCOME: "success",
    PHASE_ZERO_CONTAINER_RELEASE_IMAGES_OUTCOME: "success",
    PHASE_ZERO_CONTAINER_MONITORING_OUTCOME: "success",
    PHASE_ZERO_CONTAINER_SCAN_OUTCOME: "failure",
    PHASE_ZERO_TEST_API_BASE_URL: "http://127.0.0.1:3001",
  });
  const commands = [
    {
      id: "endpoint_environment",
      argv: ["node", "scripts/export-phase-zero-endpoint-environment.mjs"],
      exitCode: 0,
    },
    {
      id: "container_policy",
      argv: ["node", "--test", "scripts/container-scan-policy.test.mjs"],
      exitCode: 0,
    },
    {
      id: "release_images",
      argv: ["node", "scripts/build-phase-zero-release-images.mjs"],
      exitCode: 0,
    },
    {
      id: "monitoring_validation",
      argv: ["node", "scripts/validate-monitoring-config.mjs"],
      exitCode: 0,
    },
    {
      id: "image_scan",
      argv: ["node", "scripts/scan-container-images.mjs"],
      exitCode: 1,
    },
  ];
  const commandEvidence = new Map();
  for (const command of commands) {
    const commandEnvironment =
      command.id === "endpoint_environment"
        ? {
            ...environment,
            NEXT_PUBLIC_API_BASE_URL: environment.PHASE_ZERO_TEST_API_BASE_URL,
          }
        : environment;
    const metadata = buildCommandEvidence({
      ...command,
      sourceSha: candidateSha,
      startedAt: "2026-08-20T00:00:00Z",
      endedAt: "2026-08-20T00:00:01Z",
      stdout: "",
      stderr: "",
      environment: buildEnvironmentIdentity(commandEnvironment),
    });
    if (command.id === "container_policy") {
      metadata.testPolicy = { passed: true, totals: { total: 1 } };
    }
    commandEvidence.set(command.id, metadata);
  }

  const reports = new Map();
  const logs = new Map();
  const results = realPolicy.images.map((policyImage, index) => {
    const image = expandImage(policyImage, candidateSha);
    const blocked = index === 0;
    const reportPath = join(
      ".runtime",
      "security-scans",
      "fixture",
      `${String(index + 1).padStart(2, "0")}.json`,
    );
    const logPath = reportPath.replace(/\.json$/u, ".log");
    reports.set(reportPath, {
      Results: [
        {
          Target: image,
          Class: "os-pkgs",
          Type: "alpine",
          Vulnerabilities: blocked
            ? [
                {
                  VulnerabilityID: "CVE-2099-0001",
                  PkgName: "blocked-package",
                  InstalledVersion: "1.0.0",
                  FixedVersion: "1.0.1",
                  Severity: "HIGH",
                },
              ]
            : [],
        },
      ],
    });
    logs.set(logPath, "");
    return {
      image,
      resolvedIdentity: `sha256:${sha256(image)}`,
      repoDigests: [],
      status: blocked ? "blocked" : "passed",
      findingCount: blocked ? 1 : 0,
      acceptedCount: 0,
      blockingCount: blocked ? 1 : 0,
      reportPath,
      logPath,
    };
  });
  const summary = {
    schemaVersion: 1,
    scannerImage: realPolicy.scannerImage,
    appVersion: candidateSha,
    diagnosticMode: false,
    result: "failed",
    results,
  };
  return {
    commandEvidence,
    environment,
    logs,
    reports,
    summary,
  };
}

function executeVerifierFixture(mutate = () => {}) {
  const fixtureRoot = mkdtempSync(
    join(tmpdir(), "mecoflow-container-verifier-"),
  );
  try {
    const fixture = buildVerifierFixture(fixtureRoot);
    mutate(fixture);

    const commandDirectory = resolve(
      fixtureRoot,
      ".runtime/evidence/container-security/commands",
    );
    mkdirSync(commandDirectory, { recursive: true });
    for (const [id, metadata] of fixture.commandEvidence) {
      writeFileSync(
        resolve(commandDirectory, `${id}.json`),
        `${JSON.stringify(metadata, null, 2)}\n`,
      );
      writeFileSync(resolve(commandDirectory, `${id}.stdout.log`), "");
      writeFileSync(resolve(commandDirectory, `${id}.stderr.log`), "");
    }
    for (const [path, report] of fixture.reports) {
      const destination = resolve(fixtureRoot, path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
    }
    for (const [path, log] of fixture.logs) {
      const destination = resolve(fixtureRoot, path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, log);
    }
    writeFileSync(
      resolve(fixtureRoot, ".runtime/security-scans/fixture/summary.json"),
      `${JSON.stringify(fixture.summary, null, 2)}\n`,
    );

    const execution = spawnSync(
      process.execPath,
      [resolve(fixtureRoot, "scripts/verify-phase-zero-container-scan.mjs")],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
        env: fixture.environment,
        windowsHide: true,
      },
    );
    const stepsPath = resolve(
      fixtureRoot,
      ".runtime/evidence/container-security/steps.json",
    );
    return {
      execution,
      steps: existsSync(stepsPath)
        ? JSON.parse(readFileSync(stepsPath, "utf8"))
        : null,
    };
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
}

function executeDirectScanWithFakeDocker() {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "mecoflow-container-scan-"));
  try {
    for (const path of [
      "scripts/scan-container-images.mjs",
      "scripts/container-scan-policy.mjs",
      "security/container-scan-policy.json",
    ]) {
      copyHarnessFile(fixtureRoot, path);
    }
    const fakeBin = resolve(fixtureRoot, "fake-bin");
    mkdirSync(fakeBin, { recursive: true });
    const fakeDockerScript = resolve(fakeBin, "fake-docker.cjs");
    writeFileSync(
      fakeDockerScript,
      `const { readFileSync, writeFileSync } = require("node:fs");
const { basename, resolve } = require("node:path");
const launchedAsDocker = basename(process.argv0).toLowerCase() === "docker.exe" || basename(process.execPath).toLowerCase() === "docker.exe" || basename(process.argv[1] ?? "") === "fake-docker.cjs";
if (launchedAsDocker) {
const counterPath = resolve(__dirname, "counter.txt");
let invocation = 0;
try { invocation = Number(readFileSync(counterPath, "utf8")); } catch {}
invocation += 1;
writeFileSync(counterPath, String(invocation));
const digest = "1".repeat(64);
if (invocation % 2 === 1) {
  process.stdout.write(\`sha256:\${digest}|fake/image@sha256:\${digest}\\n\`);
} else {
  process.stdout.write(JSON.stringify({ Results: [{ Target: "fake-image", Class: "os-pkgs", Type: "alpine", Vulnerabilities: [{ VulnerabilityID: "CVE-2099-0001", PkgName: "blocked-package", InstalledVersion: "1.0.0", FixedVersion: "1.0.1", Severity: "HIGH" }] }] }));
}
process.exit(0);
}
`,
    );
    if (process.platform === "win32") {
      cpSync(process.execPath, resolve(fakeBin, "docker.exe"));
    } else {
      const posixDocker = resolve(fakeBin, "docker");
      writeFileSync(
        posixDocker,
        '#!/bin/sh\nexec "$NODE_UNDER_TEST" "$(dirname "$0")/fake-docker.cjs"\n',
      );
      chmodSync(posixDocker, 0o755);
    }

    const execution = spawnSync(
      process.execPath,
      [resolve(fixtureRoot, "scripts/scan-container-images.mjs")],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
        env: childEnvironment({
          NODE_UNDER_TEST: process.execPath,
          ...(process.platform === "win32"
            ? {
                NODE_OPTIONS: `--require="${fakeDockerScript.replaceAll("\\", "/")}"`,
              }
            : undefined),
          PATH: `${fakeBin}${delimiter}${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ""}`,
        }),
        windowsHide: true,
      },
    );
    const scanRoot = resolve(fixtureRoot, ".runtime/security-scans");
    assert.ok(existsSync(scanRoot), execution.stderr || execution.stdout);
    const scanDirectories = readdirSync(scanRoot, {
      withFileTypes: true,
    }).filter((entry) => entry.isDirectory());
    assert.equal(scanDirectories.length, 1);
    const summary = JSON.parse(
      readFileSync(
        resolve(scanRoot, scanDirectories[0].name, "summary.json"),
        "utf8",
      ),
    );
    return { execution, summary };
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
}

test("accepts complete blocked scans as retained Phase 2 diagnostics", () => {
  const fixture = phaseZeroFixture();
  assert.deepEqual(
    validatePhaseZeroScanEvidence({
      ...fixture,
      appVersion: "ci",
      stepOutcome: "failure",
    }),
    [],
  );
});

test("parses a retained scan summary before validating blocked evidence", () => {
  const fixture = phaseZeroFixture();
  const validation = parseAndValidatePhaseZeroScanSummary(
    JSON.stringify(fixture.summary),
    {
      policy: fixture.policy,
      appVersion: "ci",
      stepOutcome: "failure",
    },
  );
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.summary.results[0].status, "blocked");
  assert.throws(
    () =>
      parseAndValidatePhaseZeroScanSummary("not JSON", {
        policy: fixture.policy,
        appVersion: "ci",
        stepOutcome: "failure",
      }),
    SyntaxError,
  );
});

test("executable verifier accepts a complete blocked real image inventory", () => {
  assert.equal(realPolicy.images.length, 14);
  const { execution, steps } = executeVerifierFixture();
  assert.equal(execution.status, 0, execution.stderr);
  assert.equal(steps.result, "passed");
  assert.equal(steps.scanStepOutcome, "failure");
  assert.equal(steps.scanGateResult, "failed");
  assert.equal(steps.results.length, 14);
  assert.ok(steps.results.some((result) => result.status === "blocked"));
  assert.equal(
    steps.commandEvidence.find((entry) => entry.id === "image_scan")?.outcome,
    "failure",
  );
});

test("executable verifier rejects incomplete or contradictory scan evidence", async (t) => {
  const cases = [
    {
      name: "missing image",
      mutate: ({ summary }) => summary.results.pop(),
      expected: /exact policy image inventory/u,
    },
    {
      name: "identity error",
      mutate: ({ summary }) => {
        summary.results[1].status = "identity-error";
      },
      expected: /scan did not complete/u,
    },
    {
      name: "scan error",
      mutate: ({ summary }) => {
        summary.results[1].status = "scan-error";
      },
      expected: /scan did not complete/u,
    },
    {
      name: "tampered raw report",
      mutate: ({ reports, summary }) => {
        reports.set(summary.results[0].reportPath, {
          Results: [
            {
              Target: summary.results[0].image,
              Class: "os-pkgs",
              Type: "alpine",
              Vulnerabilities: [],
            },
          ],
        });
      },
      expected: /retained Trivy report contradicts the scan summary/u,
    },
    {
      name: "step outcome mismatch",
      mutate: ({ commandEvidence, environment }) => {
        environment.PHASE_ZERO_CONTAINER_SCAN_OUTCOME = "success";
        commandEvidence.get("image_scan").exitCode = 0;
      },
      expected: /scan step outcome must be failure/u,
    },
  ];

  for (const fixtureCase of cases) {
    await t.test(fixtureCase.name, () => {
      const { execution, steps } = executeVerifierFixture(fixtureCase.mutate);
      assert.notEqual(execution.status, 0);
      assert.equal(steps.result, "failed");
      assert.ok(
        steps.errors.some((error) => fixtureCase.expected.test(error)),
        steps.errors.join("; "),
      );
    });
  }
});

test("direct full-inventory scans still fail on unexcepted blockers without Docker", () => {
  const { execution, summary } = executeDirectScanWithFakeDocker();
  assert.equal(execution.status, 1, execution.stderr);
  assert.equal(summary.diagnosticMode, false);
  assert.equal(summary.result, "failed");
  assert.equal(summary.results.length, 14);
  assert.deepEqual(
    summary.results.map((result) => result.image).sort(),
    realPolicy.images.map((image) => expandImage(image, candidateSha)).sort(),
  );
  assert.ok(
    summary.results.every((result) => result.status === "blocked"),
    JSON.stringify(
      summary.results.map((result) => ({
        image: result.image,
        status: result.status,
        error: result.error,
      })),
    ),
  );
  assert.match(execution.stderr, /Container image gate FAILED/u);
});

test("recomputes completed Trivy reports but preserves incomplete diagnostics", () => {
  const fixture = phaseZeroFixture("passed");
  const result = fixture.summary.results[0];
  assert.deepEqual(
    validateRetainedTrivyReport({
      reportText: JSON.stringify({
        schemaVersion: 1,
        stage: "identity",
        error: "image identity could not be resolved",
      }),
      result: { ...result, status: "identity-error" },
      exceptions: [],
    }),
    [],
  );
  assert.match(
    validateRetainedTrivyReport({
      reportText: JSON.stringify({ Results: [] }),
      result,
      exceptions: [],
    })[0],
    /no result targets/u,
  );
  assert.deepEqual(
    validateRetainedTrivyReport({
      reportText: JSON.stringify({ Results: [{ Target: "image" }] }),
      result,
      exceptions: [],
    }),
    [],
  );
});

test("rejects incomplete scans and mismatched step outcomes", () => {
  const fixture = phaseZeroFixture();
  fixture.summary.results[0].status = "scan-error";
  const errors = validatePhaseZeroScanEvidence({
    ...fixture,
    appVersion: "ci",
    stepOutcome: "success",
  });
  assert.ok(errors.some((error) => error.includes("did not complete")));
  assert.ok(errors.some((error) => error.includes("outcome must be failure")));
});

test("rejects tag-like or composite resolved scan identities", () => {
  const fixture = phaseZeroFixture("passed");
  fixture.summary.results[0].resolvedIdentity =
    "sha256:123|example/image@sha256:456";
  const errors = validatePhaseZeroScanEvidence({
    ...fixture,
    appVersion: "ci",
    stepOutcome: "success",
  });
  assert.ok(
    errors.some((error) => error.includes("immutable sha256 image ID")),
  );
});

test("rejects inconsistent counts, reused paths, and invalid digest mappings", () => {
  const fixture = phaseZeroFixture("passed");
  fixture.summary.results[0].findingCount = 1;
  fixture.summary.results[0].repoDigests = ["example/image:mutable"];
  fixture.summary.results.push({ ...fixture.summary.results[0] });
  const errors = validatePhaseZeroScanEvidence({
    ...fixture,
    appVersion: "ci",
    stepOutcome: "success",
  });
  assert.ok(errors.some((error) => error.includes("finding counts")));
  assert.ok(errors.some((error) => error.includes("digest mapping")));
  assert.ok(errors.some((error) => error.includes("paths must be unique")));
});
