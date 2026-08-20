import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  validateActionReferences,
  validateCiWorkflowStructure,
  validateExternalImages,
  validatePhaseZeroFinalizationWorkflow,
  validatePhaseZeroRequirementMatrix,
  validateRepository,
  validateSecretExposureEntries,
  validateTraceability,
  validateWorktreeInventory,
  validateWorkflowSecurity,
} from "./repository-governance-policy.mjs";

test("accepts a full-SHA Action and rejects mutable Action tags", () => {
  assert.deepEqual(
    validateActionReferences(
      "ci.yml",
      "- uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262",
    ),
    [],
  );
  assert.equal(
    validateActionReferences("ci.yml", "- uses: actions/checkout@v4").length,
    1,
  );
});

test("accepts digest-pinned external images and rejects mutable image tags", () => {
  const digest = "a".repeat(64);
  assert.deepEqual(
    validateExternalImages(
      "compose.yml",
      `  image: postgres:18@sha256:${digest}`,
    ),
    [],
  );
  assert.equal(
    validateExternalImages("compose.yml", "  image: postgres:18").length,
    1,
  );
  assert.equal(
    validateExternalImages(
      "compose.yml",
      "  image: mecoflow/api:${APP_VERSION}",
    ).length,
    1,
  );
  assert.equal(
    validateExternalImages("Dockerfile", "FROM ubuntu", { dockerfile: true })
      .length,
    1,
  );
  assert.deepEqual(
    validateExternalImages(
      "Dockerfile",
      `FROM ubuntu@sha256:${digest} AS base\nFROM base`,
      {
        dockerfile: true,
      },
    ),
    [],
  );
});

test("requires project services to receive fail-closed immutable candidate references", () => {
  assert.deepEqual(
    validateExternalImages(
      "compose.yml",
      "services:\n  api:\n    image: ${MECOFLOW_API_IMAGE:?required}\n",
    ),
    [],
  );
  assert.equal(
    validateExternalImages(
      "compose.yml",
      "services:\n  api:\n    image: mecoflow/api:${APP_VERSION}\n",
    ).length,
    1,
  );
});

test("rejects mutable docker Actions", () => {
  assert.equal(
    validateActionReferences("ci.yml", "- uses: docker://alpine:3.23").length,
    1,
  );
});

test("rejects broad or elevated workflow permission forms", () => {
  assert.equal(
    validateWorkflowSecurity("ci.yml", "permissions: write-all").length,
    1,
  );
  assert.equal(
    validateWorkflowSecurity("ci.yml", "permissions: read-all").length,
    1,
  );
  assert.equal(
    validateWorkflowSecurity(
      "ci.yml",
      "permissions: { contents: read, packages: write }",
    ).length,
    1,
  );
  assert.equal(
    validateWorkflowSecurity("ci.yml", "permissions:\n  contents: write")
      .length,
    1,
  );
});

test("enforces the supported runner and checkout credential isolation", () => {
  const checkout =
    "- uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262";
  assert.equal(
    validateWorkflowSecurity("ci.yml", `runs-on: ubuntu-latest\n${checkout}`)
      .length,
    2,
  );
  assert.deepEqual(
    validateWorkflowSecurity(
      "ci.yml",
      `runs-on: ubuntu-24.04\n${checkout}\n  with:\n    persist-credentials: false`,
    ),
    [],
  );
});

test("validates executable CI steps rather than comment markers", () => {
  const fake = `  verify:\n    steps:\n      # - name: not executable\n      #   id: workspace\n      #   continue-on-error: true\n  container-security:\n    steps: []`;
  const errors = validateCiWorkflowStructure(fake);
  assert.ok(errors.some((error) => error.includes("workspace")));
  assert.ok(errors.some((error) => error.includes("retained artifact")));
});

test("requires hidden Phase 0 evidence directories to be retained", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.deepEqual(validateCiWorkflowStructure(workflow), []);
  const withoutHiddenEvidence = workflow.replace(
    "          include-hidden-files: true\n",
    "",
  );
  assert.ok(
    validateCiWorkflowStructure(withoutHiddenEvidence).some((error) =>
      error.includes("verify retained artifact"),
    ),
  );
});

test("preserves the raw container scan failure and final verifier gate", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

  const strictImageScan = workflow.replace(
    /(?<scan> {6}- name: Scan every release image\n {8}id: image_scan\n {8}if: always\(\)\n) {8}continue-on-error: true\n/u,
    "$<scan>",
  );
  assert.ok(
    validateCiWorkflowStructure(strictImageScan).some((error) =>
      error.includes("retained container command is invalid: image_scan"),
    ),
  );

  const permissiveVerifier = workflow.replace(
    /(?<verifier> {6}- name: Verify complete Phase 0 container baseline evidence\n {8}if: always\(\)\n)/u,
    "$<verifier>        continue-on-error: true\n",
  );
  assert.ok(
    validateCiWorkflowStructure(permissiveVerifier).some((error) =>
      error.includes("complete container baseline evidence verification"),
    ),
  );

  const conditionalVerifier = workflow.replace(
    /(?<verifier> {6}- name: Verify complete Phase 0 container baseline evidence\n) {8}if: always\(\)\n/u,
    "$<verifier>",
  );
  assert.ok(
    validateCiWorkflowStructure(conditionalVerifier).some((error) =>
      error.includes("complete container baseline evidence verification"),
    ),
  );

  const unboundOutcome = workflow.replace(
    "PHASE_ZERO_CONTAINER_SCAN_OUTCOME: ${{ steps.image_scan.outcome }}",
    "PHASE_ZERO_CONTAINER_SCAN_OUTCOME: failure",
  );
  assert.ok(
    validateCiWorkflowStructure(unboundOutcome).some((error) =>
      error.includes("complete container baseline evidence verification"),
    ),
  );
});

test("accepts the source-bound Phase Zero finalization workflow", () => {
  const workflow = readFileSync(
    ".github/workflows/phase-zero-finalize.yml",
    "utf8",
  );
  assert.deepEqual(validatePhaseZeroFinalizationWorkflow(workflow), []);
});

test("rejects missing or mismatched finalization source bindings", () => {
  const workflow = readFileSync(
    ".github/workflows/phase-zero-finalize.yml",
    "utf8",
  );
  const missingSourceSha = workflow.replace(
    "      PHASE_ZERO_SOURCE_SHA: ${{ inputs.closure_sha }}",
    "",
  );
  assert.ok(
    validatePhaseZeroFinalizationWorkflow(missingSourceSha).some((error) =>
      error.includes("PHASE_ZERO_SOURCE_SHA"),
    ),
  );

  const mismatchedDispatch = workflow.replace(
    "      PHASE_ZERO_DISPATCH_CANDIDATE_SHA: ${{ inputs.closure_sha }}",
    "      PHASE_ZERO_DISPATCH_CANDIDATE_SHA: ${{ github.sha }}",
  );
  assert.ok(
    validatePhaseZeroFinalizationWorkflow(mismatchedDispatch).some((error) =>
      error.includes("PHASE_ZERO_DISPATCH_CANDIDATE_SHA"),
    ),
  );
});

test("rejects a finalization checkout not bound to closure_sha", () => {
  const workflow = readFileSync(
    ".github/workflows/phase-zero-finalize.yml",
    "utf8",
  ).replace(
    "          ref: ${{ inputs.closure_sha }}",
    "          ref: ${{ github.sha }}",
  );
  assert.ok(
    validatePhaseZeroFinalizationWorkflow(workflow).some((error) =>
      error.includes("checkout"),
    ),
  );
});

test("rejects the wrong finalization branch or trigger", () => {
  const workflow = readFileSync(
    ".github/workflows/phase-zero-finalize.yml",
    "utf8",
  );
  const wrongBranch = workflow.replace(
    "      PHASE_ZERO_SOURCE_REF: main",
    "      PHASE_ZERO_SOURCE_REF: feature/closure",
  );
  assert.ok(
    validatePhaseZeroFinalizationWorkflow(wrongBranch).some((error) =>
      error.includes("PHASE_ZERO_SOURCE_REF"),
    ),
  );

  const extraTrigger = workflow.replace(
    "  workflow_dispatch:",
    "  push:\n    branches: [main]\n  workflow_dispatch:",
  );
  assert.ok(
    validatePhaseZeroFinalizationWorkflow(extraTrigger).some((error) =>
      error.includes("only trigger"),
    ),
  );
});

test("cross-checks stable canonical/P0 traceability against the master", () => {
  const masterRows = Array.from(
    { length: 44 },
    (_, index) => `| Finding ${index + 1} | ${index % 19} | Phase 17 |`,
  ).join("\n");
  const master = `## 8. Audit finding traceability\n${masterRows}\n## 9. Evidence invalidation rules`;
  const canonical = Array.from(
    { length: 44 },
    (_, index) =>
      `| A-${String(index + 1).padStart(3, "0")} | Finding ${index + 1} | ${index % 19} | Phase 17 | Owner | HIGH | Executable acceptance |`,
  ).join("\n");
  const reconciliation = Array.from(
    { length: 15 },
    (_, index) =>
      `| P0-${String(index + 1).padStart(2, "0")} | Reconciliation ${index + 1} | 0 | Phase 17 | Owner | HIGH | Executable acceptance |`,
  ).join("\n");
  const markers =
    "PRODUCT_REQUIREMENTS.md accepted ADRs Prisma OpenAPI required-suite manifests/tests IMPLEMENTATION_STATUS.md security/data/release review";
  const complete = `${markers}\n${reconciliation}\n${canonical}`;
  assert.deepEqual(validateTraceability(complete, master), []);
  assert.ok(
    validateTraceability(complete.replace("A-044", "A-043"), master).length,
  );
  assert.ok(
    validateTraceability(
      complete.replace(
        "| Finding 1 | 0 | Phase 17 |",
        "| Drift | 0 | Phase 17 |",
      ),
      master,
    ).length,
  );
  assert.ok(
    validateTraceability(
      complete.replace("| 0 | Phase 17 |", "| 1, 2 | Phase 17 |"),
      master,
    ).length,
  );
});

test("the current dirty worktree inventory is exhaustively classified", () => {
  const text = readFileSync(
    "docs/readiness/worktree-reconciliation.md",
    "utf8",
  );
  assert.deepEqual(validateWorktreeInventory(process.cwd(), text), []);
  assert.ok(
    validateWorktreeInventory(
      process.cwd(),
      text.replace("| `intentional product work`", "| `unknown`"),
    ).some((error) => error.includes("invalid classification")),
  );
  assert.ok(
    validateWorktreeInventory(
      process.cwd(),
      text.replace(
        text
          .split(/\r?\n/u)
          .filter((line) => line.startsWith("| `.gitignore`"))
          .at(-1),
        text
          .split(/\r?\n/u)
          .filter((line) => line.startsWith("| `.github/workflows/ci.yml`"))
          .at(-1),
      ),
    ).some((error) => error.includes("unique")),
  );
  assert.ok(
    validateWorktreeInventory(
      process.cwd(),
      text.replace(
        /Entry baseline commit:\s*`[0-9a-f]{40}`/u,
        "Entry baseline commit: missing",
      ),
    ).some((error) => error.includes("entry baseline commit")),
  );
});

test("detects high-confidence secret exposure without returning values", () => {
  const privateKey = "-----BEGIN " + "PRIVATE KEY-----";
  const awsKey = "AKIA" + "A".repeat(16);
  const findings = validateSecretExposureEntries([
    { path: ".env.production", content: "safe" },
    { path: "src/config.ts", content: `${privateKey}\n${awsKey}` },
    { path: ".env.example", content: "PLACEHOLDER=value" },
  ]);
  assert.equal(findings.length, 3);
  assert.equal(JSON.stringify(findings).includes(awsKey), false);
  assert.deepEqual(
    validateSecretExposureEntries([
      { path: ".env.example", content: "PLACEHOLDER=value" },
    ]),
    [],
  );
});

test("requires all Phase 0 requirement and exit IDs with explicit statuses", () => {
  const requirements = Array.from(
    { length: 15 },
    (_, index) =>
      `| P0R-${String(index + 1).padStart(2, "0")} | Requirement | \`BLOCKED\` | ${index === 0 ? "70-path comparison" : "Evidence"} | Acceptance |`,
  ).join("\n");
  const exits = Array.from(
    { length: 7 },
    (_, index) =>
      `| P0E-${String(index + 1).padStart(2, "0")} | Exit | \`BLOCKED\` | Evidence |`,
  ).join("\n");
  assert.deepEqual(
    validatePhaseZeroRequirementMatrix(`${requirements}\n${exits}`, 70),
    [],
  );
  assert.ok(
    validatePhaseZeroRequirementMatrix(
      `${requirements.replace("P0R-15", "P0R-14")}\n${exits}`,
    ).length,
  );
  assert.ok(
    validatePhaseZeroRequirementMatrix(`${requirements}\n${exits}`, 69).some(
      (error) => error.includes("69-path comparison"),
    ),
  );
});

test("fails closed when repository prerequisites and required test files are absent", () => {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-governance-"));
  try {
    const errors = validateRepository(root);
    assert.ok(
      errors.some((error) => error.includes("required file is missing")),
    );
    assert.ok(
      errors.some((error) =>
        error.includes("Playwright test files are missing"),
      ),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the current repository satisfies in-repository Phase 0 governance", () => {
  assert.deepEqual(validateRepository(process.cwd()), []);
});
