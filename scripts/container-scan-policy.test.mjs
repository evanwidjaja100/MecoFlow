import assert from "node:assert/strict";
import test from "node:test";
import {
  collectFindings,
  evaluateFindings,
  expandImage,
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

test("expired exceptions fail policy validation", () => {
  assert.throws(
    () =>
      validatePolicy(
        {
          schemaVersion: 1,
          scannerImage: "scanner@sha256:abc",
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
