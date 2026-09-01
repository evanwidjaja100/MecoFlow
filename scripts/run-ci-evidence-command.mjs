import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCommandEvidence,
  buildEnvironmentIdentity,
  redactOutput,
  resolveCommandEvidenceDirectory,
  secretValues,
} from "./ci-command-evidence-policy.mjs";
import { evaluateTestOutput } from "./test-output-policy.mjs";

const TEST_COMMAND_FORMATS = new Map([
  ["governance_tests", "node"],
  ["production_policy", "node"],
  ["operations_policy", "node"],
  ["capacity_policy", "node"],
  ["container_policy", "node"],
  ["unit", "vitest"],
  ["integration", "vitest"],
  ["authorization", "vitest"],
  ["e2e", "playwright"],
]);

const [id, separator, ...argv] = process.argv.slice(2);
if (separator !== "--" || argv.length === 0) {
  console.error(
    "Usage: node scripts/run-ci-evidence-command.mjs <id> -- <command> [args...]",
  );
  process.exit(2);
}

const root = process.cwd();
const commandEnvironment = { ...process.env };
const directory = resolveCommandEvidenceDirectory(
  root,
  process.env.PHASE_ZERO_EVIDENCE_DIR ?? ".runtime/evidence",
  process.env.PHASE_ZERO_EVIDENCE_JOB ?? "verify",
);
mkdirSync(directory, { recursive: true });
const startedAt = new Date();
const stdoutChunks = [];
const stderrChunks = [];
let spawnError;
const child = spawn(argv[0], argv.slice(1), {
  cwd: root,
  env: commandEnvironment,
  shell: false,
  windowsHide: true,
  stdio: ["inherit", "pipe", "pipe"],
});
child.stdout.on("data", (chunk) => {
  stdoutChunks.push(Buffer.from(chunk));
});
child.stderr.on("data", (chunk) => {
  stderrChunks.push(Buffer.from(chunk));
});
child.on("error", (error) => {
  spawnError = error;
});
child.on("close", (code, signal) => {
  const secrets = secretValues(commandEnvironment);
  const stdout = redactOutput(
    Buffer.concat(stdoutChunks).toString("utf8"),
    secrets,
  );
  const rawStderr = Buffer.concat(stderrChunks).toString("utf8");
  const stderr = redactOutput(
    spawnError ? `${rawStderr}\n${spawnError.message}\n` : rawStderr,
    secrets,
  );
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  const testFormat = TEST_COMMAND_FORMATS.get(id);
  const testPolicy = testFormat
    ? evaluateTestOutput(`${stdout}\n${stderr}`, testFormat)
    : undefined;
  const effectiveCode =
    code === 0 && testPolicy && !testPolicy.passed ? 1 : code;
  const endedAt = new Date();
  try {
    const evidence = buildCommandEvidence({
      id,
      argv,
      sourceSha: process.env.PHASE_ZERO_SOURCE_SHA ?? "",
      startedAt,
      endedAt,
      exitCode: effectiveCode,
      signal,
      stdout,
      stderr,
      environment: buildEnvironmentIdentity(commandEnvironment),
    });
    if (testPolicy) evidence.testPolicy = testPolicy;
    writeFileSync(join(directory, `${id}.stdout.log`), stdout, { flag: "wx" });
    writeFileSync(join(directory, `${id}.stderr.log`), stderr, { flag: "wx" });
    writeFileSync(
      join(directory, `${id}.json`),
      `${JSON.stringify(evidence, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    );
  } catch (error) {
    console.error(
      `CI command evidence failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
    return;
  }
  if (testPolicy && !testPolicy.passed) {
    console.error(
      `CI test-result policy failed: missing, malformed, or non-passing totals in ${id}`,
    );
  }
  process.exitCode = effectiveCode ?? 1;
});
