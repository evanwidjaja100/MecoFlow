import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { requiredCiSteps } from "./ci-step-outcome-policy.mjs";

const FULL_SHA = /^[0-9a-f]{40}$/u;
const DIGEST = /@sha256:[0-9a-f]{64}(?:\s|$)/u;

const requiredFiles = [
  ".github/workflows/ci.yml",
  ".github/workflows/phase-zero-finalize.yml",
  "AGENTS.md",
  "PRODUCTION_READINESS_MASTER_PLAN.md",
  "IMPLEMENTATION_STATUS.md",
  "docs/PRODUCT_REQUIREMENTS.md",
  "docs/ARCHITECTURE.md",
  "docs/DOMAIN_MODEL.md",
  "docs/SECURITY_MODEL.md",
  "docs/AUTHORIZATION_MATRIX.md",
  "docs/API_CONVENTIONS.md",
  "docs/TEST_STRATEGY.md",
  "docs/readiness/blockers.md",
  "docs/readiness/approvals.json",
  "docs/readiness/ci-governance.md",
  "docs/readiness/command-prerequisites.md",
  "docs/readiness/decision-log.md",
  "docs/readiness/decisions.json",
  "docs/readiness/defect-ledger.md",
  "docs/readiness/evidence-index.md",
  "docs/readiness/endpoint-matrix.md",
  "docs/readiness/endpoint-matrix.json",
  "docs/readiness/governance.md",
  "docs/readiness/phase-zero-closure.json",
  "docs/readiness/phase-zero-requirements.md",
  "docs/readiness/original-draft-disposition.json",
  "docs/readiness/risk-register.md",
  "docs/readiness/supported-versions.md",
  "docs/readiness/supported-versions.json",
  "docs/readiness/traceability.md",
  "docs/readiness/worktree-reconciliation.md",
  "security/container-scan-policy.json",
  "scripts/ci-evidence-policy.mjs",
  "scripts/ci-evidence-policy.test.mjs",
  "scripts/ci-command-evidence-policy.mjs",
  "scripts/ci-command-evidence-policy.test.mjs",
  "scripts/ci-step-outcome-policy.mjs",
  "scripts/ci-step-outcome-policy.test.mjs",
  "scripts/ci-step-evidence-integration.test.mjs",
  "scripts/ci-trigger-policy.mjs",
  "scripts/ci-trigger-policy.test.mjs",
  "scripts/dependency-audit-policy.mjs",
  "scripts/dependency-audit-policy.test.mjs",
  "scripts/build-ci-application-images.mjs",
  "scripts/build-phase-zero-release-images.mjs",
  "scripts/export-phase-zero-endpoint-environment.mjs",
  "scripts/start-ci-storage.mjs",
  "scripts/phase-zero-closure-policy.mjs",
  "scripts/phase-zero-closure-policy.test.mjs",
  "scripts/phase-zero-external-evidence-policy.mjs",
  "scripts/phase-zero-external-evidence-policy.test.mjs",
  "scripts/repository-governance-policy.mjs",
  "scripts/repository-governance-policy.test.mjs",
  "scripts/run-ci-evidence-command.mjs",
  "scripts/run-dependency-audit-baseline.mjs",
  "scripts/verify-ci-trigger-context.mjs",
  "scripts/verify-dependency-audit-baseline.mjs",
  "scripts/verify-phase-zero-closure.mjs",
  "scripts/verify-phase-zero-external-evidence.mjs",
  "scripts/verify-repository-governance.mjs",
  "scripts/verify-ci-step-outcomes.mjs",
  "scripts/verify-ci-workspace-clean.mjs",
  "scripts/verify-phase-zero-container-scan.mjs",
  "scripts/write-ci-evidence.mjs",
  "scripts/test-prerequisite-policy.mjs",
  "scripts/test-prerequisite-policy.test.mjs",
  "scripts/test-output-policy.mjs",
  "scripts/test-output-policy.test.mjs",
  "scripts/verify-test-prerequisites.mjs",
  "tests/required-suites.json",
];

function lines(text) {
  return text.split(/\r?\n/u);
}

function extractComposeImages(text) {
  const projectImageByVariable = new Map([
    ["MECOFLOW_API_IMAGE", "mecoflow/api:${APP_VERSION}"],
    ["MECOFLOW_WORKER_IMAGE", "mecoflow/worker:${APP_VERSION}"],
    ["MECOFLOW_WEB_IMAGE", "mecoflow/web:${APP_VERSION}"],
    ["MECOFLOW_MIGRATIONS_IMAGE", "mecoflow/migrations:${APP_VERSION}"],
    ["MECOFLOW_OPERATIONS_IMAGE", "mecoflow/operations:${APP_VERSION}"],
    ["MECOFLOW_MINIO_IMAGE", "mecoflow/minio:${APP_VERSION}"],
    ["MECOFLOW_CLAMAV_IMAGE", "mecoflow/clamav:${APP_VERSION}"],
    ["MECOFLOW_POSTGRES_IMAGE", "mecoflow/postgres:${APP_VERSION}"],
    ["MECOFLOW_PROXY_IMAGE", "mecoflow/proxy:${APP_VERSION}"],
  ]);
  return lines(text)
    .map((line) => line.match(/^\s*image:\s*["']?([^\s"']+)/u)?.[1])
    .filter(Boolean)
    .map((image) => {
      const variable = image.match(/^\$\{([A-Z0-9_]+):\?required\}$/u)?.[1];
      return (
        projectImageByVariable.get(variable) ??
        image.replace(/\$\{APP_VERSION:-[^}]+\}/gu, "${APP_VERSION}")
      );
    });
}

function read(root, file, errors) {
  const path = join(root, file);
  if (!existsSync(path)) {
    errors.push(`${file}: required file is missing`);
    return undefined;
  }
  return readFileSync(path, "utf8");
}

function collect(root, start, predicate) {
  const base = join(root, start);
  if (!existsSync(base)) return [];
  const results = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (predicate(entry.name, path))
        results.push(relative(root, path).replaceAll("\\", "/"));
    }
  };
  visit(base);
  return results.sort();
}

export function validateWorktreeInventory(root, text) {
  if (!existsSync(join(root, ".git"))) return [];
  const errors = [];
  const command = (args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" })
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((path) => path.replaceAll("\\", "/"));
  const baseline = text.match(
    /Entry baseline commit:\s*`([0-9a-f]{40})`/u,
  )?.[1];
  if (!baseline) {
    return [
      "worktree reconciliation: a full entry baseline commit is required",
    ];
  }
  try {
    execFileSync("git", ["cat-file", "-e", `${baseline}^{commit}`], {
      cwd: root,
      stdio: "ignore",
    });
  } catch {
    return ["worktree reconciliation: entry baseline commit is unavailable"];
  }
  const paths = [
    ...new Set([
      ...command(["diff", "--name-only", baseline]),
      ...command(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ].sort();
  const section = text.match(
    /## Phase 0 implementation changes([\s\S]*?)(?:\n## |$)/u,
  )?.[1];
  const allowedClassifications = new Set([
    "intentional product work",
    "generated output",
    "environment-specific material",
    "secret exposure",
    "unrelated work",
  ]);
  const rows = lines(section ?? "")
    .filter((line) => /^\| `[^`]+`\s+\|/u.test(line))
    .map(markdownCells);
  const recordedPaths = rows.map((cells) => cells[0]?.replace(/^`|`$/gu, ""));
  rows.forEach((cells, index) => {
    if (cells.length !== 4 || cells.some((cell) => !cell)) {
      errors.push(
        `worktree reconciliation: inventory row ${index + 1} must have exactly four non-empty fields`,
      );
    }
    const classification = cells[1]?.replaceAll("`", "");
    if (!allowedClassifications.has(classification)) {
      errors.push(
        `worktree reconciliation: inventory row ${index + 1} has an invalid classification`,
      );
    }
  });
  if (new Set(recordedPaths).size !== recordedPaths.length) {
    errors.push("worktree reconciliation: inventory paths must be unique");
  }
  for (const path of paths) {
    if (!recordedPaths.includes(path)) {
      errors.push(
        `worktree reconciliation: baseline-relative path is not classified: ${path}`,
      );
    }
  }
  for (const path of recordedPaths) {
    if (!paths.includes(path)) {
      errors.push(
        `worktree reconciliation: stale path is not present relative to the entry baseline: ${path}`,
      );
    }
  }
  const recordedCount = Number(
    text.match(/reconciled current inventory contains (\d+) paths/u)?.[1],
  );
  if (paths.length > 0 && recordedCount !== paths.length) {
    errors.push(
      `worktree reconciliation: recorded count ${recordedCount || "missing"} does not match ${paths.length}`,
    );
  }
  return errors;
}

export function validateSecretExposureEntries(entries) {
  const findings = [];
  const filenamePattern =
    /(?:^|\/)(?:\.env(?:\.(?!example$|sample$|template$)[^/]+)?|[^/]+\.(?:key|pem|p12|pfx))$/iu;
  const contentPatterns = [
    ["PEM private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u],
    ["AWS access key", /AKIA[0-9A-Z]{16}/u],
    [
      "GitHub token",
      /(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/u,
    ],
    ["Slack token", /xox[baprs]-[A-Za-z0-9-]{20,}/u],
  ];
  for (const entry of entries) {
    const path = entry.path.replaceAll("\\", "/");
    if (filenamePattern.test(path)) {
      findings.push(`secret exposure: sensitive filename detected: ${path}`);
    }
    for (const [label, pattern] of contentPatterns) {
      if (pattern.test(entry.content)) {
        findings.push(
          `secret exposure: ${label} signature detected in ${path}`,
        );
      }
    }
  }
  return findings;
}

function validateRepositorySecretExposure(root) {
  if (!existsSync(join(root, ".git"))) return [];
  const paths = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  )
    .split(/\r?\n/u)
    .filter(Boolean);
  const entries = [];
  for (const path of paths) {
    try {
      const content = readFileSync(join(root, path), "utf8");
      if (!content.includes("\u0000")) entries.push({ path, content });
    } catch {
      // A concurrently removed path cannot be secret-scanned and will be caught by inventory drift.
    }
  }
  return validateSecretExposureEntries(entries);
}

export function validatePhaseZeroRequirementMatrix(text, worktreePathCount) {
  const errors = [];
  const parse = (prefix) =>
    lines(text)
      .filter((line) => line.startsWith(`| ${prefix}`))
      .map(markdownCells);
  const requirements = parse("P0R-");
  const exits = parse("P0E-");
  const expectedRequirements = Array.from(
    { length: 15 },
    (_, index) => `P0R-${String(index + 1).padStart(2, "0")}`,
  );
  const expectedExits = Array.from(
    { length: 7 },
    (_, index) => `P0E-${String(index + 1).padStart(2, "0")}`,
  );
  if (
    requirements.map((cells) => cells[0]).join(",") !==
    expectedRequirements.join(",")
  ) {
    errors.push(
      "Phase 0 requirement matrix must contain exact P0R-01 through P0R-15 IDs",
    );
  }
  if (exits.map((cells) => cells[0]).join(",") !== expectedExits.join(",")) {
    errors.push(
      "Phase 0 exit matrix must contain exact P0E-01 through P0E-07 IDs",
    );
  }
  for (const cells of requirements) {
    if (
      cells.length !== 5 ||
      cells.some((cell) => !cell) ||
      !["BLOCKED", "IMPLEMENTED-UNCOMMITTED", "RECORDED", "COMPLETE"].includes(
        cells[2].replaceAll("`", ""),
      )
    ) {
      errors.push(`${cells[0] ?? "P0R row"}: invalid requirement record`);
    }
  }
  for (const cells of exits) {
    if (
      cells.length !== 4 ||
      cells.some((cell) => !cell) ||
      !["BLOCKED", "COMPLETE"].includes(cells[2].replaceAll("`", ""))
    ) {
      errors.push(`${cells[0] ?? "P0E row"}: invalid exit record`);
    }
  }
  if (Number.isInteger(worktreePathCount)) {
    const inventory = requirements.find((cells) => cells[0] === "P0R-01");
    if (!inventory?.[3].includes(`${worktreePathCount}-path comparison`)) {
      errors.push(
        `P0R-01: evidence must cite the executable ${worktreePathCount}-path comparison`,
      );
    }
  }
  return errors;
}

export function validateActionReferences(file, text) {
  const errors = [];
  lines(text).forEach((line, index) => {
    const match = line.match(/^\s*-?\s*uses:\s*([^\s#]+)\s*(?:#.*)?$/u);
    if (!match || match[1].startsWith("./")) return;
    if (match[1].startsWith("docker://")) {
      if (!DIGEST.test(`${match[1].slice("docker://".length)} `)) {
        errors.push(
          `${file}:${index + 1}: docker Action must use a sha256 digest`,
        );
      }
      return;
    }
    const at = match[1].lastIndexOf("@");
    const revision = at >= 0 ? match[1].slice(at + 1) : "";
    if (!FULL_SHA.test(revision)) {
      errors.push(
        `${file}:${index + 1}: third-party Action must use a full 40-character commit SHA`,
      );
    }
  });
  return errors;
}

export function validateWorkflowSecurity(file, text) {
  const errors = [];
  const workflowLines = lines(text);

  workflowLines.forEach((line, index) => {
    const runner = line.match(/^\s*runs-on:\s*([^\s#]+)\s*(?:#.*)?$/u)?.[1];
    if (runner && runner !== "ubuntu-24.04") {
      errors.push(
        `${file}:${index + 1}: CI jobs must use the supported ubuntu-24.04 runner`,
      );
    }
    if (/^\s*permissions:\s*(?:write-all|read-all)\s*$/u.test(line)) {
      errors.push(
        `${file}:${index + 1}: broad workflow permissions are prohibited by Phase 0 least privilege`,
      );
    }
    if (/^\s*permissions:\s*\{[^}]*:\s*(?:write|admin)(?:[,}\s])/u.test(line)) {
      errors.push(
        `${file}:${index + 1}: elevated inline workflow permission is prohibited by Phase 0 least privilege`,
      );
    }
    if (/^\s+[a-z][a-z-]*:\s+(?:write|admin)\s*$/iu.test(line)) {
      errors.push(
        `${file}:${index + 1}: elevated workflow permission is prohibited by Phase 0 least privilege`,
      );
    }
  });

  workflowLines.forEach((line, index) => {
    if (!/uses:\s*actions\/checkout@[0-9a-f]{40}/u.test(line)) return;
    const block = workflowLines.slice(index + 1, index + 6).join("\n");
    if (!/^\s+persist-credentials:\s*false\s*$/mu.test(block)) {
      errors.push(
        `${file}:${index + 1}: checkout must disable credential persistence`,
      );
    }
  });

  return errors;
}

function workflowJob(text, name) {
  const lines = text.split(/\r?\n/u);
  const start = lines.findIndex((line) => line === `  ${name}:`);
  if (start === -1) return undefined;

  const relativeEnd = lines
    .slice(start + 1)
    .findIndex((line) => /^  [a-zA-Z0-9_-]+:/u.test(line));
  const end = relativeEnd === -1 ? lines.length : start + 1 + relativeEnd;
  return lines.slice(start, end).join("\n");
}

function namedStepBlocks(job) {
  if (!job) return [];

  const lines = job.split(/\r?\n/u);
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^      - name:/u.test(lines[index])) continue;

    const relativeEnd = lines
      .slice(index + 1)
      .findIndex((line) => /^      - /u.test(line));
    const end = relativeEnd === -1 ? lines.length : index + 1 + relativeEnd;
    blocks.push(lines.slice(index, end).join("\n"));
  }
  return blocks;
}

export function validateCiWorkflowStructure(text) {
  const errors = [];
  const verify = workflowJob(text, "verify");
  const container = workflowJob(text, "container-security");
  if (!verify) errors.push("CI workflow: verify job is missing");
  if (!container) errors.push("CI workflow: container-security job is missing");
  if (!verify || !container) return errors;

  for (const [jobName, job] of [
    ["verify", verify],
    ["container-security", container],
  ]) {
    if (
      !job.includes(
        "PHASE_ZERO_SOURCE_SHA: ${{ github.event.pull_request.head.sha || github.sha }}",
      ) ||
      !job.includes(
        "PHASE_ZERO_SOURCE_REF: ${{ github.event.pull_request.head.ref || github.ref_name }}",
      ) ||
      !job.includes("fetch-depth: 0") ||
      !job.includes("ref: ${{ env.PHASE_ZERO_SOURCE_SHA }}")
    ) {
      errors.push(
        `CI workflow: ${jobName} must check out and bind the exact candidate source with full history`,
      );
    }
  }

  const verifySteps = namedStepBlocks(verify);
  for (const [id] of requiredCiSteps) {
    const step = verifySteps.find((block) =>
      new RegExp(`^        id: ${id}$`, "mu").test(block),
    );
    if (!step) {
      errors.push(`CI workflow: executable verify step is missing: ${id}`);
      continue;
    }
    if (!/^        if: always\(\)$/mu.test(step)) {
      errors.push(`CI workflow: ${id} must execute with if: always()`);
    }
    if (!/^        continue-on-error: true$/mu.test(step)) {
      errors.push(`CI workflow: ${id} must retain failure and continue`);
    }
    if (
      !new RegExp(
        `^        run:.*run-ci-evidence-command\\.mjs ${id} --`,
        "mu",
      ).test(step) &&
      !new RegExp(
        `^          node scripts/run-ci-evidence-command\\.mjs ${id} --`,
        "mu",
      ).test(step)
    ) {
      errors.push(`CI workflow: ${id} must use the command-evidence wrapper`);
    }
  }
  const openapi = verifySteps.find((block) =>
    new RegExp("^        id: openapi$", "mu").test(block),
  );
  if (!openapi?.includes("APP_VERSION: 0.1.0")) {
    errors.push(
      "CI workflow: OpenAPI drift check must use the canonical artifact version",
    );
  }

  const containerSteps = namedStepBlocks(container);
  const containerCommands = new Map([
    ["container_policy", "node --test scripts/container-scan-policy.test.mjs"],
    ["release_images", "node scripts/build-phase-zero-release-images.mjs"],
    ["monitoring_validation", "node scripts/validate-monitoring-config.mjs"],
    ["image_scan", "node scripts/scan-container-images.mjs"],
  ]);
  for (const [id, command] of containerCommands) {
    const step = containerSteps.find((block) =>
      new RegExp(`^        id: ${id}$`, "mu").test(block),
    );
    if (
      !step ||
      !/^        if: always\(\)$/mu.test(step) ||
      !/^        continue-on-error: true$/mu.test(step) ||
      !step.includes(
        `run: node scripts/run-ci-evidence-command.mjs ${id} -- ${command}`,
      )
    ) {
      errors.push(`CI workflow: retained container command is invalid: ${id}`);
    }
  }
  const containerEvidence = containerSteps.find((block) =>
    block.includes("Verify complete Phase 0 container baseline evidence"),
  );
  if (
    !containerEvidence ||
    !/^        if: always\(\)$/mu.test(containerEvidence) ||
    !containerEvidence.includes(
      "PHASE_ZERO_CONTAINER_SCAN_OUTCOME: ${{ steps.image_scan.outcome }}",
    ) ||
    !containerEvidence.includes(
      "PHASE_ZERO_CONTAINER_POLICY_OUTCOME: ${{ steps.container_policy.outcome }}",
    ) ||
    !containerEvidence.includes(
      "PHASE_ZERO_CONTAINER_RELEASE_IMAGES_OUTCOME: ${{ steps.release_images.outcome }}",
    ) ||
    !containerEvidence.includes(
      "PHASE_ZERO_CONTAINER_MONITORING_OUTCOME: ${{ steps.monitoring_validation.outcome }}",
    ) ||
    !/^        run: node scripts\/verify-phase-zero-container-scan\.mjs$/mu.test(
      containerEvidence,
    )
  ) {
    errors.push(
      "CI workflow: complete container baseline evidence verification is missing",
    );
  }

  const aggregate = verifySteps.find((block) =>
    block.includes("Enforce complete Phase 0 command outcomes"),
  );
  if (
    !aggregate ||
    !/^        if: always\(\)$/mu.test(aggregate) ||
    !/^        run: node scripts\/verify-ci-step-outcomes\.mjs$/mu.test(
      aggregate,
    )
  ) {
    errors.push(
      "CI workflow: always-run aggregate outcome enforcement is missing",
    );
  }
  for (const [id] of requiredCiSteps) {
    const marker = `PHASE_ZERO_STEP_${id.toUpperCase()}: \${{ steps.${id}.outcome }}`;
    if (!aggregate?.includes(marker)) {
      errors.push(`CI workflow: aggregate outcome binding is missing: ${id}`);
    }
  }

  for (const [jobName, job] of [
    ["verify", verify],
    ["container-security", container],
  ]) {
    const upload = namedStepBlocks(job).find((block) =>
      block.includes(
        "uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
      ),
    );
    if (
      !upload ||
      !/^        if: always\(\)$/mu.test(upload) ||
      !/^          include-hidden-files: true$/mu.test(upload) ||
      !/^          if-no-files-found: error$/mu.test(upload) ||
      !/^          retention-days: 90$/mu.test(upload)
    ) {
      errors.push(
        `CI workflow: ${jobName} retained artifact step is incomplete`,
      );
    }
  }
  return errors;
}

export function validateExternalImages(
  file,
  text,
  { dockerfile = false } = {},
) {
  const errors = [];
  const stageAliases = new Set(
    dockerfile
      ? lines(text)
          .map(
            (line) =>
              line.match(
                /^FROM\s+(?:--platform=\S+\s+)?\S+\s+AS\s+(\S+)/iu,
              )?.[1],
          )
          .filter(Boolean)
      : [],
  );
  lines(text).forEach((line, index) => {
    const match = dockerfile
      ? line.match(/^FROM\s+(?:--platform=\S+\s+)?(\S+)/u)
      : line.match(/^\s*image:\s*["']?([^\s"']+)/u);
    if (!match) return;
    const image = match[1];
    if (dockerfile && (image === "scratch" || stageAliases.has(image))) return;
    if (
      !dockerfile &&
      /^\$\{MECOFLOW_[A-Z0-9_]+_IMAGE:\?required\}$/u.test(image)
    )
      return;
    if (!DIGEST.test(`${image} `)) {
      errors.push(
        `${file}:${index + 1}: external image must be pinned by sha256 digest`,
      );
    }
  });
  return errors;
}

function markdownCells(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

export function validateTraceability(text, masterText) {
  const errors = [];
  const canonicalRows = lines(text)
    .filter((line) => /^\| A-\d{3} \|/u.test(line))
    .map(markdownCells);
  const phaseZeroRows = lines(text)
    .filter((line) => /^\| P0-\d{2} \|/u.test(line))
    .map(markdownCells);
  const expectedCanonicalIds = Array.from(
    { length: 44 },
    (_, index) => `A-${String(index + 1).padStart(3, "0")}`,
  );
  const expectedPhaseZeroIds = Array.from(
    { length: 15 },
    (_, index) => `P0-${String(index + 1).padStart(2, "0")}`,
  );
  const masterSection = masterText?.match(
    /## 8\. Audit finding traceability([\s\S]*?)## 9\. Evidence invalidation rules/u,
  )?.[1];
  const masterRows = masterSection
    ? lines(masterSection)
        .filter((line) => /^\| .+ \| \d+\s+\| .+ \|$/u.test(line))
        .map(markdownCells)
        .filter((cells) => cells.length === 3)
    : [];

  canonicalRows.forEach((cells, index) => {
    if (cells.length !== 7) {
      errors.push(
        `traceability canonical row ${index + 1}: expected exactly 7 fields`,
      );
      return;
    }
    const [id, finding, phase, downstream, owner, severity, acceptance] = cells;
    if (!/^\d{1,2}$/u.test(phase) || Number(phase) > 18) {
      errors.push(
        `${id}: primary phase must be exactly one phase from 0 through 18`,
      );
    }
    if (!finding || !downstream || !owner || !acceptance) {
      errors.push(
        `${id}: finding, downstream revalidation, owner, and executable acceptance are required`,
      );
    }
    if (!/^(?:CRITICAL|HIGH|MEDIUM|LOW)$/u.test(severity)) {
      errors.push(`${id}: severity is invalid`);
    }
    const master = masterRows[index];
    if (
      master &&
      (finding !== master[0] || phase !== master[1] || downstream !== master[2])
    ) {
      errors.push(
        `${id}: finding/phase/downstream must exactly match master-plan section 8`,
      );
    }
  });

  const observedCanonicalIds = canonicalRows.map((cells) => cells[0]);
  if (new Set(observedCanonicalIds).size !== observedCanonicalIds.length) {
    errors.push("traceability: canonical finding IDs must be unique");
  }
  if (observedCanonicalIds.join(",") !== expectedCanonicalIds.join(",")) {
    errors.push(
      "traceability: canonical IDs must be the complete stable A-001 through A-044 set",
    );
  }
  if (masterRows.length !== 44) {
    errors.push(
      "traceability: master-plan section 8 must contain exactly 44 findings",
    );
  }

  const observedPhaseZeroIds = phaseZeroRows.map((cells) => cells[0]);
  if (observedPhaseZeroIds.join(",") !== expectedPhaseZeroIds.join(",")) {
    errors.push(
      "traceability: reconciliation IDs must be the complete stable P0-01 through P0-15 set",
    );
  }
  for (const cells of phaseZeroRows) {
    if (cells.length !== 7) {
      errors.push(`${cells[0] ?? "P0 row"}: expected exactly 7 fields`);
      continue;
    }
    const [id, finding, phase, downstream, owner, severity, acceptance] = cells;
    if (!/^\d{1,2}$/u.test(phase) || Number(phase) > 18) {
      errors.push(
        `${id}: primary phase must be exactly one phase from 0 through 18`,
      );
    }
    if (!finding || !downstream || !owner || !acceptance) {
      errors.push(`${id}: required reconciliation fields are missing`);
    }
    if (!/^(?:CRITICAL|HIGH|MEDIUM|LOW)$/u.test(severity)) {
      errors.push(`${id}: severity is invalid`);
    }
  }
  for (const marker of [
    "PRODUCT_REQUIREMENTS.md",
    "accepted ADRs",
    "Prisma",
    "OpenAPI",
    "required-suite manifests/tests",
    "IMPLEMENTATION_STATUS.md",
    "security/data/release review",
  ]) {
    if (!text.includes(marker)) {
      errors.push(
        `traceability: reconciliation evidence marker is missing: ${marker}`,
      );
    }
  }
  return errors;
}

export function validateRepository(root) {
  const errors = [];
  for (const file of requiredFiles) read(root, file, errors);
  errors.push(...validateRepositorySecretExposure(root));

  const traceabilityText = read(root, "docs/readiness/traceability.md", errors);
  const masterPlanText = read(
    root,
    "PRODUCTION_READINESS_MASTER_PLAN.md",
    errors,
  );
  if (traceabilityText && masterPlanText) {
    errors.push(...validateTraceability(traceabilityText, masterPlanText));
  }
  const worktreeText = read(
    root,
    "docs/readiness/worktree-reconciliation.md",
    errors,
  );
  if (worktreeText) {
    errors.push(...validateWorktreeInventory(root, worktreeText));
  }
  const defectLedgerText = read(
    root,
    "docs/readiness/defect-ledger.md",
    errors,
  );
  if (defectLedgerText) {
    for (let index = 1; index <= 15; index += 1) {
      const id = `P0-${String(index).padStart(2, "0")}`;
      if (!defectLedgerText.includes(id)) {
        errors.push(`defect ledger: reconciled finding is not linked: ${id}`);
      }
    }
  }
  const phaseZeroRequirementText = read(
    root,
    "docs/readiness/phase-zero-requirements.md",
    errors,
  );
  if (phaseZeroRequirementText) {
    const worktreePathCount = Number(
      worktreeText?.match(
        /reconciled current inventory contains (\d+) paths/u,
      )?.[1],
    );
    errors.push(
      ...validatePhaseZeroRequirementMatrix(
        phaseZeroRequirementText,
        worktreePathCount,
      ),
    );
  }

  const packageText = read(root, "package.json", errors);
  if (packageText) {
    let manifest;
    try {
      manifest = JSON.parse(packageText);
    } catch {
      errors.push("package.json: invalid JSON");
    }
    if (manifest) {
      const requiredScripts = [
        "build",
        "format:check",
        "governance:check",
        "governance:test",
        "lint",
        "openapi:check",
        "phase0:closure",
        "test",
        "test:authorization",
        "test:e2e",
        "test:integration",
        "typecheck",
        "verify",
      ];
      for (const name of requiredScripts) {
        if (!manifest.scripts?.[name])
          errors.push(`package.json: required script ${name} is missing`);
      }
      if (manifest.packageManager !== "pnpm@11.13.0") {
        errors.push(
          "package.json: packageManager must be exactly pnpm@11.13.0",
        );
      }
      if (
        manifest.engines?.node !== "24.18.0" ||
        manifest.engines?.pnpm !== "11.13.0"
      ) {
        errors.push(
          "package.json: Node and pnpm engines must match the Phase 0 supported versions exactly",
        );
      }
      if (
        !manifest.scripts?.["test:e2e"]?.includes(
          "verify-test-prerequisites.mjs e2e",
        )
      ) {
        errors.push(
          "package.json: test:e2e must run the fail-closed prerequisite check",
        );
      }
      if (
        !manifest.scripts?.test?.includes("verify-test-prerequisites.mjs unit")
      ) {
        errors.push(
          "package.json: test must run the required unit-suite manifest check",
        );
      }
      if (
        manifest.scripts?.["phase0:closure"] !==
          "pnpm phase0:closure:local && pnpm phase0:closure:external" ||
        manifest.scripts?.["phase0:closure:external"] !==
          "node scripts/verify-phase-zero-external-evidence.mjs"
      ) {
        errors.push(
          "package.json: Phase 0 closure must run local and authenticated external verification",
        );
      }
    }
  }

  const workflows = collect(root, ".github/workflows", (name) =>
    /\.ya?ml$/u.test(name),
  );
  if (workflows.length === 0)
    errors.push(".github/workflows: at least one workflow is required");
  for (const file of workflows) {
    const text = read(root, file, errors);
    if (!text) continue;
    errors.push(...validateActionReferences(file, text));
    errors.push(...validateExternalImages(file, text));
    errors.push(...validateWorkflowSecurity(file, text));
    if (file === ".github/workflows/ci.yml") {
      errors.push(...validateCiWorkflowStructure(text));
    }
    if (/pull_request_target\s*:/u.test(text)) {
      errors.push(
        `${file}: pull_request_target is prohibited for repository gates`,
      );
    }
  }

  for (const file of collect(root, ".github/actions", (name) =>
    /^action\.ya?ml$/u.test(name),
  )) {
    const text = read(root, file, errors);
    if (text) errors.push(...validateActionReferences(file, text));
  }

  const ciText = read(root, ".github/workflows/ci.yml", errors);
  if (ciText) {
    for (const marker of [
      "permissions:\n  contents: read",
      "pnpm install --frozen-lockfile",
      "git diff --check",
      "pnpm db:generate",
      "pnpm test:authorization",
      "pnpm test:e2e",
      "pnpm openapi:check",
      'TURBO_FORCE: "true"',
      "continue-on-error: true",
      "node scripts/verify-ci-step-outcomes.mjs",
      "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
      "include-hidden-files: true",
      "if-no-files-found: error",
      "retention-days: 90",
      "PHASE_ZERO_JOB_STATUS: ${{ job.status }}",
      ".runtime/evidence/verify/**",
      "playwright-report/**",
      ".runtime/evidence/container-security/**",
      ".runtime/security-scans/**",
    ]) {
      if (!ciText.replaceAll("\r\n", "\n").includes(marker)) {
        errors.push(
          `.github/workflows/ci.yml: required fail-closed marker is missing: ${marker.replaceAll("\n", " / ")}`,
        );
      }
    }
    for (const [id] of requiredCiSteps) {
      const marker = `PHASE_ZERO_STEP_${id.toUpperCase()}: \${{ steps.${id}.outcome }}`;
      if (!ciText.includes(marker)) {
        errors.push(
          `.github/workflows/ci.yml: required aggregate outcome is missing: ${id}`,
        );
      }
      if (
        !["storage", "application_images"].includes(id) &&
        !ciText.includes(`run-ci-evidence-command.mjs ${id} --`)
      ) {
        errors.push(
          `.github/workflows/ci.yml: retained command evidence wrapper is missing: ${id}`,
        );
      }
    }
  }

  const finalizationText = read(
    root,
    ".github/workflows/phase-zero-finalize.yml",
    errors,
  );
  if (finalizationText) {
    for (const marker of [
      "name: Phase Zero Finalization",
      "workflow_dispatch:",
      "actions: read",
      "contents: read",
      "node scripts/verify-ci-trigger-context.mjs",
      "pnpm install --frozen-lockfile",
      "pnpm phase0:closure",
    ]) {
      if (!finalizationText.includes(marker)) {
        errors.push(
          `.github/workflows/phase-zero-finalize.yml: required authenticated closure marker is missing: ${marker}`,
        );
      }
    }
  }

  for (const file of collect(root, "apps", (name) => name === "Dockerfile")) {
    const text = read(root, file, errors);
    if (text)
      errors.push(...validateExternalImages(file, text, { dockerfile: true }));
  }
  for (const file of collect(root, "infra/docker", (name) =>
    name.endsWith(".Dockerfile"),
  )) {
    const text = read(root, file, errors);
    if (text)
      errors.push(...validateExternalImages(file, text, { dockerfile: true }));
  }
  for (const file of readdirSync(root)
    .filter((name) => /^compose(?:\..+)?\.ya?ml$/u.test(name))
    .sort()) {
    const text = read(root, file, errors);
    if (text) errors.push(...validateExternalImages(file, text));
  }

  const policyText = read(root, "security/container-scan-policy.json", errors);
  if (policyText) {
    try {
      const policy = JSON.parse(policyText);
      for (const image of policy.images ?? []) {
        if (!image.startsWith("mecoflow/") && !DIGEST.test(`${image} `)) {
          errors.push(
            "security/container-scan-policy.json: every external policy image must use a sha256 digest",
          );
        }
      }
      if ((policy.images ?? []).length !== 14) {
        errors.push(
          "security/container-scan-policy.json: release inventory must contain exactly 14 unique images",
        );
      }
      const releaseComposeImages = new Set();
      for (const file of ["compose.staging.yaml", "compose.monitoring.yaml"]) {
        const composeText = read(root, file, errors);
        if (composeText) {
          for (const image of extractComposeImages(composeText))
            releaseComposeImages.add(image);
        }
      }
      const policyImages = new Set(policy.images ?? []);
      for (const image of releaseComposeImages) {
        if (!policyImages.has(image))
          errors.push(
            `security/container-scan-policy.json: release Compose image is missing: ${image}`,
          );
      }
      for (const image of policyImages) {
        if (!releaseComposeImages.has(image))
          errors.push(
            `security/container-scan-policy.json: stale policy image is absent from release Compose: ${image}`,
          );
      }
      if (!DIGEST.test(`${policy.scannerImage ?? ""} `)) {
        errors.push(
          "security/container-scan-policy.json: scanner image must use a sha256 digest",
        );
      }
    } catch {
      errors.push("security/container-scan-policy.json: invalid JSON");
    }
  }

  const unitTests = collect(root, "apps", (name) =>
    /\.(?:test|spec)\.tsx?$/u.test(name),
  );
  const packageTests = collect(root, "packages", (name) =>
    /\.(?:test|spec)\.tsx?$/u.test(name),
  );
  const browserTests = collect(root, "tests/e2e", (name) =>
    /\.spec\.ts$/u.test(name),
  );
  if (unitTests.length + packageTests.length === 0)
    errors.push("required unit/integration test files are missing");
  if (browserTests.length === 0)
    errors.push("required Playwright test files are missing");

  for (const packageFile of [
    "apps/api/package.json",
    "apps/worker/package.json",
    "packages/database/package.json",
  ]) {
    const text = read(root, packageFile, errors);
    if (!text) continue;
    try {
      const manifest = JSON.parse(text);
      const integration = manifest.scripts?.["test:integration"] ?? "";
      if (
        !integration.includes("verify-test-prerequisites.mjs integration") ||
        integration.includes("passWithNoTests")
      ) {
        errors.push(
          `${packageFile}: required integration script must fail closed through the prerequisite check`,
        );
      }
      if (packageFile === "apps/api/package.json") {
        const authorization = manifest.scripts?.["test:authorization"] ?? "";
        if (
          !authorization.includes(
            "verify-test-prerequisites.mjs authorization",
          ) ||
          authorization.includes("passWithNoTests")
        ) {
          errors.push(
            `${packageFile}: authorization script must fail closed through the prerequisite check`,
          );
        }
      }
    } catch {
      errors.push(`${packageFile}: invalid JSON`);
    }
  }

  return [...new Set(errors)].sort();
}

export const phaseZeroRequiredFiles = Object.freeze([...requiredFiles]);
