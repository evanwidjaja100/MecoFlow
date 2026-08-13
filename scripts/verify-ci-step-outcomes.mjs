import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCiStepSummary,
  requiredCiSteps,
  requiredCommandEvidenceIds,
} from "./ci-step-outcome-policy.mjs";
import { buildEnvironmentIdentity } from "./ci-command-evidence-policy.mjs";

const TEST_COMMAND_IDS = new Set([
  "governance_tests",
  "unit",
  "integration",
  "authorization",
  "e2e",
  "production_policy",
  "operations_policy",
  "capacity_policy",
]);

try {
  const summary = buildCiStepSummary({ env: process.env });
  const directory = resolve(".runtime/evidence/verify");
  const commandDirectory = resolve(directory, "commands");
  const expectedCommands = new Map(requiredCiSteps);
  const outcomeById = new Map(
    summary.steps.map((step) => [step.id, step.outcome]),
  );
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  const commandEvidenceErrors = [];
  const commandEvidence = [];
  const environment = buildEnvironmentIdentity(process.env);
  const endpointStepIndex = requiredCiSteps.findIndex(
    ([id]) => id === "endpoint_environment",
  );

  for (const [commandIndex, id] of requiredCommandEvidenceIds.entries()) {
    const jsonPath = resolve(commandDirectory, `${id}.json`);
    const stdoutPath = resolve(commandDirectory, `${id}.stdout.log`);
    const stderrPath = resolve(commandDirectory, `${id}.stderr.log`);
    if (![jsonPath, stdoutPath, stderrPath].every(existsSync)) {
      commandEvidenceErrors.push(
        `${id}: retained command evidence files are missing`,
      );
      continue;
    }
    try {
      const jsonText = readFileSync(jsonPath, "utf8");
      const evidence = JSON.parse(jsonText);
      const stdout = readFileSync(stdoutPath);
      const stderr = readFileSync(stderrPath);
      const expectedCommand = expectedCommands.get(id);
      const outcome = outcomeById.get(id);
      const commandEnvironment = { ...process.env };
      if (commandIndex <= endpointStepIndex) {
        commandEnvironment.NEXT_PUBLIC_API_BASE_URL =
          process.env.PHASE_ZERO_TEST_API_BASE_URL;
      }
      const expectedEnvironment = buildEnvironmentIdentity(commandEnvironment);
      if (
        evidence.id !== id ||
        evidence.sourceSha !== summary.sourceSha ||
        evidence.argv?.join(" ") !== expectedCommand ||
        evidence.stdout?.sha256 !== digest(stdout) ||
        evidence.stderr?.sha256 !== digest(stderr) ||
        JSON.stringify(evidence.environment) !==
          JSON.stringify(expectedEnvironment) ||
        (outcome === "success" && evidence.exitCode !== 0) ||
        (outcome === "failure" && evidence.exitCode === 0) ||
        (TEST_COMMAND_IDS.has(id) &&
          (outcome === "success"
            ? evidence.testPolicy?.passed !== true ||
              !(evidence.testPolicy?.totals?.total > 0)
            : evidence.testPolicy?.passed !== false))
      ) {
        commandEvidenceErrors.push(
          `${id}: retained evidence does not match command/source/outcome/output`,
        );
        continue;
      }
      commandEvidence.push({
        id,
        metadataSha256: digest(jsonText),
        stdoutSha256: evidence.stdout.sha256,
        stderrSha256: evidence.stderr.sha256,
        ...(evidence.testPolicy
          ? { testPolicy: evidence.testPolicy }
          : undefined),
      });
    } catch {
      commandEvidenceErrors.push(`${id}: retained command evidence is invalid`);
    }
  }

  summary.commandEvidence = commandEvidence;
  summary.environment = environment;
  summary.commandEvidenceErrors = commandEvidenceErrors;
  if (commandEvidenceErrors.length > 0) summary.result = "failed";
  mkdirSync(directory, { recursive: true });
  const path = resolve(directory, "steps.json");
  writeFileSync(path, `${JSON.stringify(summary, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  console.log(`Phase 0 CI step outcomes written to ${path}`);
  if (summary.result !== "passed") {
    console.error(
      `Phase 0 CI gates failed: ${[
        ...summary.failedStepIds,
        ...commandEvidenceErrors,
      ].join(", ")}`,
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    `Phase 0 CI outcome verification failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
