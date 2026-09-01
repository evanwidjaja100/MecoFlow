const SHA_1 = /^[0-9a-f]{40}$/u;
const OUTCOMES = new Set(["success", "failure", "cancelled", "skipped"]);

export const requiredCiSteps = Object.freeze([
  ["corepack", "corepack enable"],
  ["install", "pnpm install --frozen-lockfile"],
  ["workspace", "git diff --check"],
  ["db_generate", "pnpm db:generate"],
  ["storage", "node scripts/start-ci-storage.mjs"],
  ["db_migrate", "pnpm db:migrate"],
  ["db_seed", "pnpm db:seed"],
  ["governance_tests", "pnpm governance:test"],
  ["governance_check", "pnpm governance:check"],
  ["format", "pnpm format:check"],
  ["lint", "pnpm lint"],
  ["typecheck", "pnpm typecheck"],
  ["unit", "pnpm test"],
  ["integration", "pnpm test:integration"],
  ["authorization", "pnpm test:authorization"],
  ["openapi", "pnpm openapi:check"],
  ["browser_install", "pnpm exec playwright install --with-deps chromium"],
  ["e2e", "pnpm test:e2e"],
  [
    "endpoint_environment",
    "node scripts/export-phase-zero-endpoint-environment.mjs",
  ],
  ["build", "pnpm build"],
  ["dependency_audit", "node scripts/run-dependency-audit-baseline.mjs"],
  ["production_policy", "pnpm production:preflight:test"],
  ["operations_policy", "pnpm operations:preflight:test"],
  ["capacity_policy", "pnpm capacity:test"],
  ["compose", "docker compose config --quiet"],
  ["application_images", "node scripts/build-ci-application-images.mjs"],
  ["workspace_final", "node scripts/verify-ci-workspace-clean.mjs"],
]);

export const requiredCommandEvidenceIds = Object.freeze(
  requiredCiSteps.map(([id]) => id),
);

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required for CI step evidence`);
  return value;
}

function environmentName(id) {
  return `PHASE_ZERO_STEP_${id.toUpperCase()}`;
}

export function buildCiStepSummary({ env, now = new Date() }) {
  const sourceSha = required(env, "PHASE_ZERO_SOURCE_SHA");
  if (!SHA_1.test(sourceSha)) {
    throw new Error(
      "PHASE_ZERO_SOURCE_SHA must be a full 40-character commit SHA",
    );
  }

  const steps = requiredCiSteps.map(
    ([id, command, disposition = "required"]) => {
      const outcome = required(env, environmentName(id));
      if (!OUTCOMES.has(outcome)) {
        throw new Error(
          `${environmentName(id)} has invalid outcome ${outcome}`,
        );
      }
      return { id, command, disposition, outcome };
    },
  );
  const failed = steps.filter(
    (step) =>
      ["cancelled", "skipped"].includes(step.outcome) ||
      (step.disposition === "required" && step.outcome !== "success"),
  );
  const recordedFailures = steps.filter(
    (step) =>
      step.disposition === "recorded-phase-2-diagnostic" &&
      step.outcome === "failure",
  );

  return {
    schemaVersion: 1,
    recordedAt: now.toISOString(),
    sourceSha,
    result: failed.length === 0 ? "passed" : "failed",
    steps,
    failedStepIds: failed.map((step) => step.id),
    recordedFailureStepIds: recordedFailures.map((step) => step.id),
  };
}
