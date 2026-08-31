import assert from "node:assert/strict";
import test from "node:test";
import { validateDependencyAudit } from "./dependency-audit-policy.mjs";

const expected = [];
function fixture() {
  return {
    advisories: {},
    metadata: {
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 },
    },
  };
}
test("accepts only the exact recorded dependency advisory baseline", () => {
  assert.deepEqual(validateDependencyAudit(fixture()), []);
  const drift = {
    advisories: {
      0: {
        github_advisory_id: "GHSA-test",
        module_name: "test-pkg",
        severity: "high",
        findings: [{ version: "1.0.0", paths: ["workspace>dependency"] }],
      },
    },
    metadata: {
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0 },
    },
  };
  assert.ok(validateDependencyAudit(drift).length > 0);
});

test("rejects incomplete findings and changed severity totals", () => {
  const drift = {
    advisories: {
      0: {
        github_advisory_id: "GHSA-test2",
        module_name: "test-pkg2",
        severity: "high",
        findings: [{ version: "1.0.0", paths: [] }],
      },
    },
    metadata: {
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 1 },
    },
  };
  const errors = validateDependencyAudit(drift);
  assert.ok(errors.length >= 2);
});
