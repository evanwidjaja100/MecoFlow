import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCiStepSummary,
  requiredCiSteps,
} from "./ci-step-outcome-policy.mjs";

function environment(outcome = "success") {
  return Object.fromEntries([
    ["GITHUB_SHA", "a".repeat(40)],
    ...requiredCiSteps.map(([id]) => [
      `PHASE_ZERO_STEP_${id.toUpperCase()}`,
      outcome,
    ]),
  ]);
}

test("records every required CI command and passes only when all succeed", () => {
  const summary = buildCiStepSummary({
    env: environment(),
    now: new Date("2026-08-11T00:00:00.000Z"),
  });
  assert.equal(summary.result, "passed");
  assert.equal(summary.steps.length, requiredCiSteps.length);
  assert.deepEqual(summary.failedStepIds, []);
});

test("fails closed for failed, skipped, missing, or unattributed outcomes", () => {
  const failed = environment();
  failed.PHASE_ZERO_STEP_INTEGRATION = "failure";
  assert.deepEqual(buildCiStepSummary({ env: failed }).failedStepIds, [
    "integration",
  ]);

  const skipped = environment();
  skipped.PHASE_ZERO_STEP_E2E = "skipped";
  assert.equal(buildCiStepSummary({ env: skipped }).result, "failed");

  const missing = environment();
  delete missing.PHASE_ZERO_STEP_BUILD;
  assert.throws(() => buildCiStepSummary({ env: missing }), /BUILD.*required/u);
  assert.throws(
    () =>
      buildCiStepSummary({ env: { ...environment(), GITHUB_SHA: "short" } }),
    /full 40-character/u,
  );
});

test("requires the strict Phase 0 advisory-baseline verifier to succeed", () => {
  const auditFailure = environment();
  auditFailure.PHASE_ZERO_STEP_DEPENDENCY_AUDIT = "failure";
  const summary = buildCiStepSummary({ env: auditFailure });
  assert.equal(summary.result, "failed");
  assert.deepEqual(summary.failedStepIds, ["dependency_audit"]);
  assert.deepEqual(summary.recordedFailureStepIds, []);

  const skippedAudit = environment();
  skippedAudit.PHASE_ZERO_STEP_DEPENDENCY_AUDIT = "skipped";
  assert.equal(buildCiStepSummary({ env: skippedAudit }).result, "failed");
});
