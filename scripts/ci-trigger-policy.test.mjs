import assert from "node:assert/strict";
import test from "node:test";
import { validateCiTrigger } from "./ci-trigger-policy.mjs";

const sha = "a".repeat(40);
const base = {
  GITHUB_EVENT_NAME: "push",
  GITHUB_SHA: sha,
  GITHUB_REF: "refs/heads/main",
  GITHUB_ACTOR: "reviewer",
  GITHUB_ACTOR_ID: "1234",
};

test("accepts attributed push and exact main-branch dispatch contexts", () => {
  assert.deepEqual(validateCiTrigger(base), []);
  assert.deepEqual(
    validateCiTrigger({
      ...base,
      GITHUB_EVENT_NAME: "workflow_dispatch",
      PHASE_ZERO_DISPATCH_CANDIDATE_SHA: sha,
    }),
    [],
  );
});

test("fails closed for a mismatched dispatch SHA, ref, or actor", () => {
  const errors = validateCiTrigger({
    ...base,
    GITHUB_EVENT_NAME: "workflow_dispatch",
    GITHUB_REF: "refs/heads/feature",
    GITHUB_ACTOR_ID: "",
    PHASE_ZERO_DISPATCH_CANDIDATE_SHA: "b".repeat(40),
  });
  assert.equal(errors.length, 3);
});
