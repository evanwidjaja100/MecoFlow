import assert from "node:assert/strict";
import test from "node:test";
import { validateDependencyAudit } from "./dependency-audit-policy.mjs";

const expected = [
  ["GHSA-7p8r-x3mc-p8w7", "fast-uri", "3.1.4"],
  ["GHSA-rgw5-rvv9-x895", "brace-expansion", "5.0.8"],
  ["GHSA-5p4m-2wfm-xmqj", "js-yaml", "4.3.0"],
  ["GHSA-2v37-7h3g-55p8", "nanoid", "3.3.16"],
  ["GHSA-ggr8-5vv4-36mx", "deepmerge-ts", "7.1.5"],
];
function fixture() {
  return {
    advisories: Object.fromEntries(
      expected.map(([id, module, version], index) => [
        String(index),
        {
          github_advisory_id: id,
          module_name: module,
          severity: "high",
          findings: [{ version, paths: ["workspace>dependency"] }],
        },
      ]),
    ),
    metadata: {
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 5, critical: 0 },
    },
  };
}
test("accepts only the exact recorded dependency advisory baseline", () => {
  assert.deepEqual(validateDependencyAudit(fixture()), []);
  const drift = fixture();
  drift.advisories["0"].github_advisory_id = "GHSA-new-advisory";
  assert.ok(validateDependencyAudit(drift).length > 0);
});

test("rejects incomplete findings and changed severity totals", () => {
  const drift = fixture();
  drift.advisories["0"].findings[0].paths = [];
  drift.metadata.vulnerabilities.critical = 1;
  const errors = validateDependencyAudit(drift);
  assert.equal(errors.length, 2);
});
