import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateNoSkipTodo,
  evaluateTestOutput,
} from "./test-output-policy.mjs";

test("accepts explicit zero skip/todo test output", () => {
  assert.equal(
    evaluateNoSkipTodo("ℹ skipped 0\nℹ todo 0\nTests 15 passed").passed,
    true,
  );
});

test("parses exact node:test totals", () => {
  const result = evaluateTestOutput(
    "\u2139 tests 32\n\u2139 pass 32\n\u2139 fail 0\n\u2139 skipped 0\n\u2139 todo 0\n",
    "node",
  );
  assert.equal(result.passed, true);
  assert.deepEqual(result.totals, {
    total: 32,
    passed: 32,
    failed: 0,
    skipped: 0,
    todo: 0,
  });
});

test("aggregates exact Vitest summaries from Turborepo output", () => {
  const result = evaluateTestOutput(
    [
      "@mecoflow/api:test:  Tests  12 passed (12)",
      "@mecoflow/config:test:  Tests  3 passed (3)",
    ].join("\n"),
    "vitest",
  );
  assert.equal(result.passed, true);
  assert.deepEqual(result.totals, {
    total: 15,
    passed: 15,
    failed: 0,
    skipped: 0,
    todo: 0,
  });
});

test("parses Playwright totals and rejects any failed or skipped result", () => {
  const result = evaluateTestOutput(
    "  1 failed\n  2 skipped\n  12 passed (1.2m)\n",
    "playwright",
  );
  assert.equal(result.passed, false);
  assert.deepEqual(result.totals, {
    total: 15,
    passed: 12,
    failed: 1,
    skipped: 2,
    todo: 0,
  });
});

test("fails closed for missing or internally inconsistent summaries", () => {
  const missing = evaluateTestOutput("command completed", "vitest");
  assert.equal(missing.passed, false);
  assert.match(missing.parseErrors[0], /no exact test summary/u);

  const malformed = evaluateTestOutput("Tests  2 passed (3)", "vitest");
  assert.equal(malformed.passed, false);
  assert.match(malformed.parseErrors[0], /does not equal/u);

  const flaky = evaluateTestOutput("1 flaky\n14 passed (1m)", "playwright");
  assert.equal(flaky.passed, false);
  assert.match(flaky.parseErrors[0], /unsupported non-passing/u);
});

test("rejects nonzero skipped or todo results including ANSI output", () => {
  const result = evaluateNoSkipTodo(
    "\u001b[33mTest Files 1 skipped\u001b[0m\nTests 2 todo",
  );
  assert.equal(result.passed, false);
  assert.deepEqual(
    result.violations.map((item) => item.count),
    [1, 2],
  );
});
