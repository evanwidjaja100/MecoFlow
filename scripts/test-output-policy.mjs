const ANSI = /\u001b\[[0-9;]*m/gu;
const TOTAL_KEYS = Object.freeze(["passed", "failed", "skipped", "todo"]);

function emptyTotals() {
  return { total: 0, passed: 0, failed: 0, skipped: 0, todo: 0 };
}

function addTotals(target, values) {
  for (const key of TOTAL_KEYS) target[key] += values[key] ?? 0;
  target.total += values.total;
}

function validateTotals(values, label) {
  const classified = TOTAL_KEYS.reduce((sum, key) => sum + values[key], 0);
  if (values.total !== classified) {
    throw new Error(
      `${label} summary total ${values.total} does not equal classified total ${classified}`,
    );
  }
}

function parseNodeTest(text) {
  const values = {};
  for (const key of ["tests", "pass", "fail", "skipped", "todo"]) {
    const matches = [
      ...text.matchAll(
        new RegExp(
          `^(?:[^:\\r\\n]+:)*\\s*(?:\\u2139|#)?\\s*${key}\\s+(\\d+)\\s*$`,
          "gimu",
        ),
      ),
    ];
    if (matches.length !== 1) {
      throw new Error(`node:test summary requires exactly one ${key} total`);
    }
    values[key] = Number(matches[0][1]);
  }
  const totals = {
    total: values.tests,
    passed: values.pass,
    failed: values.fail,
    skipped: values.skipped,
    todo: values.todo,
  };
  validateTotals(totals, "node:test");
  return totals;
}

function parseVitest(text) {
  const totals = emptyTotals();
  let summaries = 0;
  for (const line of text.split(/\r?\n/u)) {
    const match = line.match(/(?:^|:)\s*Tests\s+(.+?)\s+\((\d+)\)\s*$/u);
    if (!match) continue;
    const values = { ...emptyTotals(), total: Number(match[2]) };
    for (const item of match[1].matchAll(
      /(\d+)\s+(passed|failed|skipped|todo)\b/gu,
    )) {
      values[item[2]] += Number(item[1]);
    }
    validateTotals(values, "Vitest");
    addTotals(totals, values);
    summaries += 1;
  }
  if (summaries === 0) {
    throw new Error("Vitest output contains no exact test summary");
  }
  return totals;
}

function parsePlaywright(text) {
  const totals = emptyTotals();
  let observations = 0;
  for (const line of text.split(/\r?\n/u)) {
    if (/^\s*\d+\s+(?:flaky|interrupted|timed out)\b/u.test(line)) {
      throw new Error(
        "Playwright output contains an unsupported non-passing total",
      );
    }
    const match = line.match(
      /^\s*(\d+)\s+(passed|failed|skipped|todo)(?:\s+\([^\r\n]*\))?\s*$/u,
    );
    if (!match) continue;
    totals[match[2]] += Number(match[1]);
    observations += 1;
  }
  if (observations === 0) {
    throw new Error("Playwright output contains no exact test summary");
  }
  totals.total = TOTAL_KEYS.reduce((sum, key) => sum + totals[key], 0);
  return totals;
}

export function evaluateTestOutput(output, format) {
  const text = output.replace(ANSI, "");
  try {
    const totals =
      format === "node"
        ? parseNodeTest(text)
        : format === "vitest"
          ? parseVitest(text)
          : format === "playwright"
            ? parsePlaywright(text)
            : (() => {
                throw new Error(`unsupported test output format: ${format}`);
              })();
    const violations = TOTAL_KEYS.filter(
      (key) => key !== "passed" && totals[key] > 0,
    ).map((kind) => ({ kind, count: totals[kind] }));
    return {
      passed: totals.total > 0 && violations.length === 0,
      format,
      totals,
      parseErrors: [],
      violations,
    };
  } catch (error) {
    return {
      passed: false,
      format,
      totals: null,
      parseErrors: [error instanceof Error ? error.message : String(error)],
      violations: [],
    };
  }
}

export function evaluateNoSkipTodo(output) {
  const text = output.replace(ANSI, "");
  const observations = [];
  for (const pattern of [
    /\b(\d+)\s+(skipped|todo)\b/giu,
    /\b(skipped|todo)\s*[:=]?\s*(\d+)\b/giu,
  ]) {
    for (const match of text.matchAll(pattern)) {
      const count = Number(match[1].match(/^\d+$/u) ? match[1] : match[2]);
      const kind = match[1].match(/^\d+$/u) ? match[2] : match[1];
      observations.push({ kind: kind.toLowerCase(), count });
    }
  }
  const violations = observations.filter((item) => item.count > 0);
  return {
    passed: violations.length === 0,
    observations,
    violations,
  };
}
