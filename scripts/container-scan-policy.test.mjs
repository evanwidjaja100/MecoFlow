import assert from "node:assert/strict";
import test from "node:test";
import {
  collectFindings,
  candidateBuildTimestamp,
  evaluateFindings,
  expandImage,
  parseAndValidatePhaseZeroScanSummary,
  requireCandidateImageVersion,
  validatePhaseZeroScanEvidence,
  validatePolicy,
} from "./container-scan-policy.mjs";

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
