import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  phaseZeroClosureFiles,
  validatePhaseZeroClosure,
} from "./phase-zero-closure-policy.mjs";

const candidateSha = "a".repeat(40);
const currentHead = "b".repeat(40);
const digest = `sha256:${"c".repeat(64)}`;
const fixtureLockfile = "lockfileVersion: '9.0'\n";
const fixtureContainerPolicy = JSON.stringify({
  images: [`redis:8@sha256:${"2".repeat(64)}`],
});
const fixtureLockfileSha256 = createHash("sha256")
  .update(fixtureLockfile)
  .digest("hex");
const fixtureContainerPolicySha256 = createHash("sha256")
  .update(fixtureContainerPolicy)
  .digest("hex");
const rosterRoleIds = [
  "SE-OWNER",
  "SEC-OWNER",
  "DATA-OWNER",
  "PRODUCT-OWNER",
  "QA-OWNER",
  "QAQC-BUSINESS-OWNER",
  "PURCHASING-OWNER",
  "WAREHOUSE-OWNER",
  "PROJECT-MGMT-OWNER",
  "ENGINEERING-DOMAIN-OWNER",
  "PPIC-OWNER",
  "PRODUCTION-OWNER",
  "FINANCE-READONLY-OWNER",
  "MANAGEMENT-OWNER",
  "IDENTITY-OWNER",
  "PLATFORM-OWNER",
  "SRE-OWNER",
  "PRIVACY-OWNER",
  "REL-MANAGER",
  "BUSINESS-SPONSOR",
  "INDEPENDENT-SECURITY",
  "INDEPENDENT-DATA-RELEASE",
  "REPO-ADMIN",
  "PROCUREMENT-OWNER",
  "A11Y-REVIEWER",
  "IMPLEMENTATION-OPERATOR",
];

function rosterPerson(roleId) {
  const index = rosterRoleIds.indexOf(roleId);
  return {
    name: `Human ${index}`,
    identity: `human-${index}`,
    roleId,
  };
}

function approval(id, subject, scope, roleCoverage) {
  const roleApprovals = roleCoverage.map(rosterPerson);
  return {
    id,
    subject,
    approver: roleApprovals[0],
    approvedAt: "2026-08-11",
    reviewedSourceSha: candidateSha,
    scope,
    evidenceUri: `https://example.com/approvals/${id}`,
    evidenceSha256: "9".repeat(64),
    independentReviewer: rosterPerson("INDEPENDENT-SECURITY"),
    findingsOrConditions: "No unrecorded conditions",
    decision: "APPROVED",
    roleApprovals,
  };
}

function completeFixture() {
  const decisionRoles = {
    "D-01": ["PRODUCT-OWNER", "SRE-OWNER", "BUSINESS-SPONSOR"],
    "D-02": ["DATA-OWNER", "PRODUCT-OWNER", "SRE-OWNER", "BUSINESS-SPONSOR"],
    "D-03": ["DATA-OWNER", "PRODUCT-OWNER", "SRE-OWNER", "PRIVACY-OWNER"],
    "D-04": ["PRODUCT-OWNER", "SRE-OWNER", "BUSINESS-SPONSOR"],
    "D-05": ["PRODUCT-OWNER", "BUSINESS-SPONSOR"],
    "D-06": ["PRODUCT-OWNER", "QA-OWNER", "BUSINESS-SPONSOR"],
    "D-07": ["PRODUCT-OWNER", "QA-OWNER", "A11Y-REVIEWER"],
    "D-08": [
      "SEC-OWNER",
      "IDENTITY-OWNER",
      "PLATFORM-OWNER",
      "PROCUREMENT-OWNER",
    ],
    "D-09": ["SEC-OWNER", "DATA-OWNER", "PLATFORM-OWNER", "PROCUREMENT-OWNER"],
    "D-10": [
      "SE-OWNER",
      "SEC-OWNER",
      "IDENTITY-OWNER",
      "PLATFORM-OWNER",
      "REL-MANAGER",
    ],
  };
  const decisionIds = Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => {
      const decision = `D-${String(index + 1).padStart(2, "0")}`;
      return [decision, `APR-${decision.replace("-", "")}`];
    }),
  );
  const references = {
    originalDraftDisposition: "APR-DRAFT",
    governanceRoster: "APR-ROSTER",
    worktreeReconciliation: "APR-WORKTREE",
    traceabilityAndDeferrals: "APR-TRACE",
    supportedVersions: "APR-VERSIONS",
    riskRegister: "APR-RISK",
    ciGovernance: "APR-CI",
    independentReproduction: "APR-INDEPENDENT",
    decisions: decisionIds,
    endpointMatrix: "APR-ENDPOINT",
  };
  const approvalFixtures = [
    approval(
      "APR-OWNER",
      "phase-zero:candidate",
      "Phase 0 candidate baseline",
      ["REPO-ADMIN", "REL-MANAGER"],
    ),
    approval(
      references.originalDraftDisposition,
      "phase-zero:original-draft-disposition",
      "Original readiness draft disposition",
      ["REPO-ADMIN", "REL-MANAGER"],
    ),
    approval(
      references.governanceRoster,
      "phase-zero:governance-roster",
      "Phase 0 accountability and reviewer roster",
      ["BUSINESS-SPONSOR", "REL-MANAGER"],
    ),
    approval(
      references.worktreeReconciliation,
      "phase-zero:worktree-reconciliation",
      "Phase 0 worktree attribution and preservation",
      ["REPO-ADMIN", "REL-MANAGER"],
    ),
    approval(
      references.traceabilityAndDeferrals,
      "phase-zero:traceability-and-deferrals",
      "Phase 0 finding routing and later-phase deferrals",
      ["SE-OWNER", "SEC-OWNER", "REL-MANAGER"],
    ),
    approval(
      references.supportedVersions,
      "phase-zero:supported-versions",
      "Phase 0 supported runtime and client versions",
      ["SE-OWNER", "QA-OWNER", "SRE-OWNER"],
    ),
    approval(
      references.riskRegister,
      "phase-zero:risk-register",
      "Phase 0 risk register",
      ["SEC-OWNER", "REL-MANAGER"],
    ),
    approval(
      references.ciGovernance,
      "phase-zero:ci-governance",
      "Phase 0 repository and CI governance",
      ["REPO-ADMIN", "SEC-OWNER", "REL-MANAGER"],
    ),
    approval(
      references.independentReproduction,
      "phase-zero:independent-reproduction",
      "Independent reproduction of the Phase 0 baseline",
      ["QA-OWNER", "REL-MANAGER"],
    ),
    approval(
      references.endpointMatrix,
      "phase-zero:endpoint-matrix",
      "Phase 0 production endpoint matrix",
      [
        "SE-OWNER",
        "SEC-OWNER",
        "IDENTITY-OWNER",
        "PLATFORM-OWNER",
        "REL-MANAGER",
      ],
    ),
    ...Object.entries(decisionIds).map(([decision, id]) =>
      approval(
        id,
        `phase-zero:decision:${decision}`,
        `Phase 0 decision ${decision}`,
        decisionRoles[decision],
      ),
    ),
    approval(
      "APR-EVIDENCE",
      "phase-zero:authoritative-evidence",
      "Phase 0 authoritative CI evidence",
      ["QA-OWNER", "REL-MANAGER"],
    ),
    approval("APR-RISK-R02", "phase-zero:risk:R-02", "Phase 0 risk R-02", [
      "SEC-OWNER",
      "REL-MANAGER",
    ]),
  ];
  const remoteSpecs = {
    branchProtection: [
      "APR-CONTROL-BRANCH",
      "phase-zero:remote-control:branch-protection",
      "Protected candidate branch controls",
      ["REPO-ADMIN", "SEC-OWNER", "REL-MANAGER"],
    ],
    protectedEnvironment: [
      "APR-CONTROL-ENVIRONMENT",
      "phase-zero:remote-control:protected-environment",
      "Protected production environment controls",
      ["REPO-ADMIN", "PLATFORM-OWNER", "REL-MANAGER"],
    ],
    restrictedActions: [
      "APR-CONTROL-ACTIONS",
      "phase-zero:remote-control:restricted-actions",
      "Restricted and SHA-pinned GitHub Actions",
      ["REPO-ADMIN", "SEC-OWNER"],
    ],
    independentReviewerAccess: [
      "APR-CONTROL-REVIEWER",
      "phase-zero:remote-control:independent-reviewer-access",
      "Independent reviewer repository access",
      ["REPO-ADMIN", "REL-MANAGER"],
    ],
    releaseLabels: [
      "APR-CONTROL-LABELS",
      "phase-zero:remote-control:release-labels",
      "Phase 0 defect and release labels",
      ["REPO-ADMIN", "REL-MANAGER"],
    ],
    repositoryVisibility: [
      "APR-CONTROL-VISIBILITY",
      "phase-zero:remote-control:repository-visibility",
      "Repository visibility and source exposure",
      ["REPO-ADMIN", "SEC-OWNER", "REL-MANAGER"],
    ],
  };
  const remoteControls = Object.fromEntries(
    Object.entries(remoteSpecs).map(([name, [id, subject, scope, roles]]) => {
      approvalFixtures.push(approval(id, subject, scope, roles));
      return [
        name,
        {
          status: "PASS",
          evidenceUri: `https://example.com/controls/${name}`,
          evidenceSha256: "8".repeat(64),
          checkedAt: "2026-08-11T00:00:00Z",
          candidateSha,
          approvalRecordId: id,
        },
      ];
    }),
  );
  const closure = {
    schemaVersion: 1,
    status: "COMPLETE",
    candidate: {
      branch: "phase-zero",
      sourceSha: candidateSha,
      ownerApprovalRecordId: "APR-OWNER",
      cleanReproductionEvidenceUri:
        "https://github.com/example/mecoflow/actions/runs/5678",
    },
    approvalReferences: references,
    remoteControls,
    authoritativeEvidence: {
      repository: "example/mecoflow",
      sourceSha: candidateSha,
      sourceRef: "refs/heads/phase-zero",
      runId: "1234",
      runAttempt: 1,
      runUri: "https://github.com/example/mecoflow/actions/runs/1234",
      conclusion: "success",
      lockfileSha256: fixtureLockfileSha256,
      containerPolicySha256: fixtureContainerPolicySha256,
      jobs: {
        verify: {
          name: "verify",
          sourceSha: candidateSha,
          conclusion: "success",
          artifactId: "1001",
          artifactDigest: digest,
          manifestSha256: "1".repeat(64),
          stepSummarySha256: "2".repeat(64),
        },
        containerSecurity: {
          name: "container-security",
          sourceSha: candidateSha,
          conclusion: "success",
          artifactId: "1002",
          artifactDigest: `sha256:${"f".repeat(64)}`,
          manifestSha256: "3".repeat(64),
          scanSummarySha256: "4".repeat(64),
        },
      },
      independentReviewerApprovalRecordId: "APR-EVIDENCE",
    },
    independentReproduction: {
      repository: "example/mecoflow",
      sourceSha: candidateSha,
      sourceRef: "refs/heads/phase-zero",
      runId: "5678",
      runAttempt: 1,
      runUri: "https://github.com/example/mecoflow/actions/runs/5678",
      conclusion: "success",
      actor: rosterPerson("INDEPENDENT-DATA-RELEASE"),
      lockfileSha256: fixtureLockfileSha256,
      containerPolicySha256: fixtureContainerPolicySha256,
      jobs: {
        verify: {
          name: "verify",
          sourceSha: candidateSha,
          conclusion: "success",
          artifactId: "2001",
          artifactDigest: `sha256:${"5".repeat(64)}`,
          manifestSha256: "6".repeat(64),
          stepSummarySha256: "7".repeat(64),
        },
        containerSecurity: {
          name: "container-security",
          sourceSha: candidateSha,
          conclusion: "success",
          artifactId: "2002",
          artifactDigest: `sha256:${"8".repeat(64)}`,
          manifestSha256: "9".repeat(64),
          scanSummarySha256: "0".repeat(64),
        },
      },
      approvalRecordId: references.independentReproduction,
    },
  };
  const roster = rosterRoleIds
    .map(
      (roleId, index) =>
        `| Role ${index} | ${roleId} | Human ${index} | human-${index} | \`APPROVED\` |`,
    )
    .join("\n");
  const decisions = Array.from(
    { length: 10 },
    (_, index) =>
      `| D-${String(index + 1).padStart(2, "0")} | Decision | Value | \`APPROVED\` | Approver | 2026-08-11 |`,
  ).join("\n");
  const typedDecisions = {
    "D-01": {
      availabilityPercent: 99.5,
      latencyP95Ms: 1000,
      latencyP99Ms: 2000,
      maxErrorPercent: 1,
      measurementWindow: "rolling 30 days",
      scope: "production application requests",
      exclusions: [],
      errorBudgetPolicy: "Freeze releases after budget exhaustion",
    },
    "D-02": {
      rpoHours: 4,
      rtoHours: 8,
      recoveryScope: "complete coordinated application data set",
      completeSetDefinition: "database, objects, identity, and configuration",
      verificationOwnerRoleId: "DATA-OWNER",
    },
    "D-03": {
      auditEvidenceDays: 365,
      monitoringDays: 30,
      documentDays: 365,
      notificationDays: 90,
      backupDays: 30,
      privacyErasureDays: 30,
      legalHoldPolicy: "Suspend deletion for documented legal holds",
    },
    "D-04": {
      minimumHeadroomPercent: 30,
      maximumQueueRecoverySeconds: 300,
      peakNamedUsers: 1000,
      peakConcurrentSessions: 100,
      projects: 500,
      itemsAndBomLines: 100000,
      documentsAndBytes: "100000 documents / 1 TB",
      reportConcurrency: 20,
      queueRateAndDepth: "100 jobs/minute and 1000 queued",
      annualGrowthPercent: 20,
      planningHorizonMonths: 24,
      seasonality: "2x quarter-end peak",
    },
    "D-05": {
      locales: ["en", "id"],
      timezone: "Asia/Jakarta",
      currency: "IDR",
      units: "metric",
      supportOwnerRoleId: "PRODUCT-OWNER",
    },
    "D-06": {
      supportedVersionsRef: "docs/readiness/supported-versions.json",
      phoneViewport: "390x844",
      tabletViewport: "768x1024",
      desktopMinimumWidth: 1280,
      inputModes: ["keyboard", "touch"],
      zoomPercent: [200, 400],
      forcedColors: true,
      reducedMotion: true,
    },
    "D-07": {
      wcag: "2.2 AA",
      generalTargetPx: 44,
      warehouseQaTargetMinPx: 48,
      warehouseQaTargetMaxPx: 52,
    },
    "D-08": {
      product: "Keycloak",
      distribution: "supported enterprise distribution",
      version: "27.0.1",
      hostingModel: "managed multi-zone service",
      regionsAndHa: "Jakarta primary with multi-zone high availability",
      supportTierAndSla: "24x7 support with 99.9% SLA",
      patchCadence: "monthly and emergency critical patching",
      supportOwnerRoleId: "IDENTITY-OWNER",
      procurementReference: "PROC-1001",
      procurementStatus: "STARTED",
      procurementStartedAt: "2026-08-11",
      procurementEvidenceUri: "https://example.com/procurement/PROC-1001",
      procurementEvidenceSha256: "6".repeat(64),
      exitStrategy: "realm export and tested migration runbook",
      realmClientClaimContract: "documented issuer, audience, azp, and claims",
      mfaRecoveryBreakGlassContract: "MFA, witnessed recovery, and break-glass",
      keyRotationRevocationBackupContract:
        "quarterly rotation, revocation, exports, and restore tests",
    },
    "D-09": {
      provider: "Supported Cloud Storage Vendor",
      productAndTier: "S3-compatible enterprise tier",
      s3Compatible: true,
      minioDevelopmentOnly: true,
      accountRegionEndpoint: "production account in Jakarta region",
      supportTierAndSla: "24x7 support with 99.9% SLA",
      supportOwnerRoleId: "PLATFORM-OWNER",
      procurementReference: "PROC-1002",
      procurementStatus: "STARTED",
      procurementStartedAt: "2026-08-11",
      procurementEvidenceUri: "https://example.com/procurement/PROC-1002",
      procurementEvidenceSha256: "7".repeat(64),
      exitStrategy: "versioned export and provider migration runbook",
      kmsAndPrivatePolicyContract: "customer KMS key and private bucket policy",
      retentionVersioningLegalHoldContract:
        "versioning, retention, deletion, and legal hold",
      malwareScanningContract: "quarantine-before-release scanning",
      replicationAndRecoveryContract: "off-site replication and restore tests",
    },
    "D-10": {
      endpointMatrixRef: "docs/readiness/endpoint-matrix.json",
    },
  };
  const endpoints = Array.from(
    { length: 12 },
    (_, index) =>
      `| Boundary ${index} | https://endpoint${index}.example | \`APPROVED\` | Owner |`,
  ).join("\n");
  const controlUris = Object.values(remoteControls)
    .map((control) => control.evidenceUri)
    .join("\n");
  const documents = {
    "package.json": JSON.stringify({
      engines: { node: "24.18.0", pnpm: "11.13.0" },
      devDependencies: {
        "@playwright/test": "1.61.1",
        turbo: "2.10.5",
        typescript: "6.0.3",
      },
    }),
    "packages/database/package.json": JSON.stringify({
      devDependencies: { prisma: "7.9.0" },
    }),
    "pnpm-lock.yaml": fixtureLockfile,
    "security/container-scan-policy.json": fixtureContainerPolicy,
    "infra/docker/postgres.Dockerfile": `FROM postgres:18@sha256:${"1".repeat(64)}\n`,
    "PRODUCTION_READINESS_MASTER_PLAN.md":
      "**Status:** PHASE 0 COMPLETE\n| 1 | Phase 1 | LOCKED |\n| 2 | Phase 2 | LOCKED |",
    "docs/readiness/approvals.json": JSON.stringify({
      schemaVersion: 1,
      records: approvalFixtures,
    }),
    "docs/readiness/blockers.md":
      "| B-01 | Later | HIGH | 2 | 14 | SE-OWNER | `OPEN` | Later acceptance |\n| B-07 | Phase zero | HIGH | 0 | all | SE-OWNER | `CLOSED` | Acceptance |",
    "docs/readiness/ci-governance.md": controlUris,
    "docs/readiness/decision-log.md": decisions,
    "docs/readiness/decisions.json": JSON.stringify({
      schemaVersion: 1,
      status: "APPROVED",
      approvalRecordIds: decisionIds,
      decisions: typedDecisions,
    }),
    "docs/readiness/defect-ledger.md":
      "| L-01 | A-006 | HIGH | 2 | SE-OWNER | `BLOCKER` | Evidence | Review | Acceptance |\n| L-02 | P0-01 | HIGH | 0 | SE-OWNER | `CLOSED` | Evidence | Review | Acceptance |",
    "docs/readiness/endpoint-matrix.md": endpoints,
    "docs/readiness/endpoint-matrix.json": JSON.stringify({
      schemaVersion: 1,
      status: "APPROVED",
      approvalRecordId: "APR-ENDPOINT",
      public: {
        webUrl: "https://app.mecoflow.company",
        apiBaseUrl: "https://api.mecoflow.company/api/v1",
        dnsNames: [
          "app.mecoflow.company",
          "api.mecoflow.company",
          "id.mecoflow.company",
        ],
        dnsZones: ["mecoflow.company"],
        corsOrigins: ["https://app.mecoflow.company"],
      },
      identity: {
        issuerUrl: "https://id.mecoflow.company/realms/mecoflow",
        callbackUrls: ["https://api.mecoflow.company/api/v1/auth/callback"],
        hostname: "id.mecoflow.company",
      },
      proxy: {
        chain: ["edge.mecoflow.company", "proxy.internal"],
        trustedHopCount: 2,
      },
      internal: {
        apiService: "api",
        webService: "web",
        workerAndDependencies: ["worker", "postgres", "redis"],
      },
      build: {
        nextPublicApiBaseUrl: "https://api.mecoflow.company/api/v1",
      },
    }),
    "docs/readiness/evidence-index.md": `https://example.com/runs/1 artifact-1 ${digest}`,
    "docs/readiness/governance.md": `## Accountability and reviewer roster\n${roster}\n## Canonical role IDs and aliases`,
    "docs/readiness/phase-zero-closure.json": JSON.stringify(closure),
    "docs/readiness/phase-zero-requirements.md": `${Array.from(
      { length: 15 },
      (_, index) =>
        `| P0R-${String(index + 1).padStart(2, "0")} | Requirement | \`COMPLETE\` | Evidence | Acceptance |`,
    ).join("\n")}\n${Array.from(
      { length: 7 },
      (_, index) =>
        `| P0E-${String(index + 1).padStart(2, "0")} | Exit | \`COMPLETE\` | Evidence |`,
    ).join("\n")}`,
    "docs/readiness/original-draft-disposition.json": JSON.stringify({
      schemaVersion: 1,
      status: "APPROVED",
      entryReportedCount: 9,
      exactFilenameSetRecoverable: false,
      exactPreEditBytesRecoverable: false,
      conservativeScope: [
        "docs/readiness/blockers.md",
        "docs/readiness/ci-governance.md",
        "docs/readiness/command-prerequisites.md",
        "docs/readiness/decision-log.md",
        "docs/readiness/defect-ledger.md",
        "docs/readiness/endpoint-matrix.md",
        "docs/readiness/evidence-index.md",
        "docs/readiness/governance.md",
        "docs/readiness/risk-register.md",
        "docs/readiness/supported-versions.md",
        "docs/readiness/traceability.md",
        "docs/readiness/worktree-reconciliation.md",
      ],
      disposition: "SUPERSEDED",
      approvalRecordId: "APR-DRAFT",
    }),
    "docs/readiness/risk-register.md":
      "| R-01 | Later | 2 | SE-OWNER | Control | Phase 2 | `PENDING` | `MISSING` | `OPEN-BLOCKER` |\n| R-02 | Phase zero | 0 | SE-OWNER | Control | Date | `APPROVED` | `APR-RISK-R02` | `ACCEPTED` |",
    "docs/readiness/supported-versions.md":
      "Exact browser versions approved APR-VERSIONS",
    "docs/readiness/supported-versions.json": JSON.stringify({
      schemaVersion: 1,
      status: "APPROVED",
      approvalRecordId: "APR-VERSIONS",
      lockfileSha256: fixtureLockfileSha256,
      application: {
        node: "24.18.0",
        pnpm: "11.13.0",
        typescript: "6.0.3",
        turborepo: "2.10.5",
        prisma: "7.9.0",
        playwright: "1.61.1",
      },
      data: {
        postgresImage: `postgres:18@sha256:${"1".repeat(64)}`,
        redisImage: `redis:8@sha256:${"2".repeat(64)}`,
      },
      browsers: {
        chromeMajor: "140",
        edgeMajor: "140",
        firefoxMajor: "142",
        safariVersion: "18.6",
      },
      operatingSystems: {
        windows: "Windows 11 24H2",
        macos: "macOS 15.6",
        ios: "iOS 18.6",
        ipados: "iPadOS 18.6",
        android: "Android 16",
      },
      deployment: {
        platform: "Managed Kubernetes",
        tool: "Helm",
        version: "3.18.4",
      },
    }),
    "docs/readiness/traceability.md": `${Array.from(
      { length: 15 },
      (_, index) =>
        `| P0-${String(index + 1).padStart(2, "0")} | Finding | 0 | all | SE-OWNER | HIGH | \`pnpm governance:check\` |`,
    ).join("\n")}\n${Array.from(
      { length: 44 },
      (_, index) =>
        `| A-${String(index + 1).padStart(3, "0")} | Finding | 0 | all | SE-OWNER | HIGH | \`pnpm governance:check\` |`,
    ).join("\n")}`,
    "docs/readiness/worktree-reconciliation.md":
      "Original draft disposition: APPROVED APR-DRAFT",
  };
  const evidence = closure.authoritativeEvidence;
  documents["docs/readiness/evidence-index.md"] = [
    evidence.runUri,
    ...Object.values(evidence.jobs).flatMap((job) => Object.values(job)),
    closure.independentReproduction.runUri,
    ...Object.values(closure.independentReproduction.jobs).flatMap((job) =>
      Object.values(job),
    ),
  ].join(" ");
  return { documents, closure };
}

test("accepts only a clean candidate-bound structured closure record", () => {
  const { documents } = completeFixture();
  assert.deepEqual(
    validatePhaseZeroClosure({
      documents,
      gitStatus: "",
      currentHead,
      candidateIsAncestor: true,
      postCandidatePaths: [
        "docs/readiness/approvals.json",
        "docs/readiness/phase-zero-requirements.md",
      ],
    }),
    [],
  );
});

test("allows open later-phase blockers but rejects open Phase 0 records", () => {
  const { documents } = completeFixture();
  const laterOpen = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.deepEqual(laterOpen, []);

  documents["docs/readiness/blockers.md"] = documents[
    "docs/readiness/blockers.md"
  ].replace("| `CLOSED` |", "| `OPEN` |");
  assert.ok(
    validatePhaseZeroClosure({
      documents,
      gitStatus: "",
      currentHead,
      candidateIsAncestor: true,
    }).some((error) => error.includes("primary-Phase-0 blockers")),
  );
});

test("fails closed for placeholders, dirty source, missing review, and bad evidence", () => {
  const { documents, closure } = completeFixture();
  closure.status = "BLOCKED";
  closure.approvalReferences.decisions["D-10"] = null;
  closure.authoritativeEvidence.jobs.verify.artifactDigest = "placeholder";
  documents["docs/readiness/phase-zero-closure.json"] = JSON.stringify(closure);
  const registry = JSON.parse(documents["docs/readiness/approvals.json"]);
  registry.records[0].independentReviewer.identity =
    registry.records[0].approver.identity;
  documents["docs/readiness/approvals.json"] = JSON.stringify(registry);
  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: " M package.json\n",
    currentHead,
    candidateIsAncestor: false,
    postCandidatePaths: ["apps/api/src/main.ts"],
  });
  assert.ok(errors.some((error) => error.includes("worktree must be clean")));
  assert.ok(errors.some((error) => error.includes("status COMPLETE")));
  assert.ok(errors.some((error) => error.includes("D-10")));
  assert.ok(errors.some((error) => error.includes("distinct independent")));
  assert.ok(errors.some((error) => error.includes("jobs.verify")));
  assert.ok(errors.some((error) => error.includes("non-evidence paths")));
});

test("rejects reused or incorrectly scoped approvals and missing role coverage", () => {
  const { documents, closure } = completeFixture();
  closure.approvalReferences.supportedVersions =
    closure.approvalReferences.worktreeReconciliation;
  documents["docs/readiness/phase-zero-closure.json"] = JSON.stringify(closure);
  const registry = JSON.parse(documents["docs/readiness/approvals.json"]);
  const endpointApproval = registry.records.find(
    (record) => record.id === "APR-ENDPOINT",
  );
  endpointApproval.subject = "phase-zero:wrong-subject";
  endpointApproval.roleApprovals = endpointApproval.roleApprovals.slice(0, 1);
  documents["docs/readiness/approvals.json"] = JSON.stringify(registry);

  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(errors.some((error) => error.includes("already bound")));
  assert.ok(errors.some((error) => error.includes("subject/scope")));
  assert.ok(errors.some((error) => error.includes("role coverage is missing")));
});

test("binds approval identities to the roster and separates operators from reviewers", () => {
  const { documents } = completeFixture();
  const registry = JSON.parse(documents["docs/readiness/approvals.json"]);
  registry.records[0].approver.identity = "unrostered-identity";
  documents["docs/readiness/approvals.json"] = JSON.stringify(registry);
  documents["docs/readiness/governance.md"] = documents[
    "docs/readiness/governance.md"
  ].replace(
    "| Role 25 | IMPLEMENTATION-OPERATOR | Human 25 | human-25 |",
    "| Role 25 | IMPLEMENTATION-OPERATOR | Human 25 | human-20 |",
  );

  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(errors.some((error) => error.includes("canonical roles")));
  assert.ok(errors.some((error) => error.includes("implementation operator")));
});

test("requires exact candidate-bound approved remote controls", () => {
  const { documents, closure } = completeFixture();
  closure.remoteControls.branchProtection.candidateSha = "0".repeat(40);
  closure.remoteControls.branchProtection.approvalRecordId = null;
  closure.remoteControls.unrecognizedControl =
    closure.remoteControls.independentReviewerAccess;
  delete closure.remoteControls.independentReviewerAccess;
  documents["docs/readiness/phase-zero-closure.json"] = JSON.stringify(closure);

  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(errors.some((error) => error.includes("exact branchProtection")));
  assert.ok(errors.some((error) => error.includes("candidate-bound PASS")));
  assert.ok(errors.some((error) => error.includes("approvalRecordId")));
});

test("rejects placeholder or internally inconsistent endpoint matrices", () => {
  const { documents } = completeFixture();
  const matrix = JSON.parse(documents["docs/readiness/endpoint-matrix.json"]);
  matrix.public.webUrl = "https://app.example.com";
  matrix.proxy.trustedHopCount = 99;
  matrix.build.nextPublicApiBaseUrl = "https://other.mecoflow.company/api/v1";
  matrix.identity.callbackUrls = [
    "https://api.mecoflow.company/unrelated/api/v1/auth/callback?x=1",
  ];
  documents["docs/readiness/endpoint-matrix.json"] = JSON.stringify(matrix);
  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(errors.some((error) => error.includes("public.webUrl")));
  assert.ok(errors.some((error) => error.includes("trustedHopCount")));
  assert.ok(errors.some((error) => error.includes("build-time API")));
  assert.ok(errors.some((error) => error.includes("exact public API origin")));
});

test("rejects incomplete support matrices or lockfile drift", () => {
  const { documents } = completeFixture();
  const versions = JSON.parse(
    documents["docs/readiness/supported-versions.json"],
  );
  versions.browsers.chromeMajor = "TBD";
  versions.deployment.platform = "placeholder";
  versions.lockfileSha256 = "0".repeat(64);
  documents["docs/readiness/supported-versions.json"] =
    JSON.stringify(versions);
  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(errors.some((error) => error.includes("browser")));
  assert.ok(errors.some((error) => error.includes("deployment")));
  assert.ok(errors.some((error) => error.includes("lockfile digest")));

  const sourceDrift = completeFixture().documents;
  const manifest = JSON.parse(sourceDrift["package.json"]);
  manifest.engines.node = "25.0.0";
  sourceDrift["package.json"] = JSON.stringify(manifest);
  const sourceErrors = validatePhaseZeroClosure({
    documents: sourceDrift,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(
    sourceErrors.some((error) => error.includes("candidate package manifests")),
  );
});

test("rejects status-only decisions with incomplete provider contracts", () => {
  const { documents } = completeFixture();
  const record = JSON.parse(documents["docs/readiness/decisions.json"]);
  record.decisions["D-01"].availabilityPercent = 99;
  record.decisions["D-01"].latencyP95Ms = 5000;
  record.decisions["D-01"].latencyP99Ms = 10000;
  record.decisions["D-01"].maxErrorPercent = 2;
  record.decisions["D-03"].documentDays = null;
  record.decisions["D-08"].version = "TBD";
  record.decisions["D-08"].procurementStatus = "NOT_STARTED";
  record.decisions["D-09"].provider = "MinIO";
  record.decisions["D-09"].procurementEvidenceUri = "not started";
  documents["docs/readiness/decisions.json"] = JSON.stringify(record);
  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(errors.some((error) => error.includes("D-01: SLOs")));
  assert.ok(errors.some((error) => error.includes("D-03.documentDays")));
  assert.ok(errors.some((error) => error.includes("D-08.version")));
  assert.ok(errors.some((error) => error.includes("D-08: supported")));
  assert.ok(errors.some((error) => error.includes("D-09")));
});

test("rejects recovery and accessibility values outside recorded proposal bounds", () => {
  const { documents } = completeFixture();
  const record = JSON.parse(documents["docs/readiness/decisions.json"]);
  record.decisions["D-02"].rpoHours = 5;
  record.decisions["D-02"].rtoHours = 9;
  record.decisions["D-07"].generalTargetPx = 45;
  record.decisions["D-07"].warehouseQaTargetMaxPx = 60;
  documents["docs/readiness/decisions.json"] = JSON.stringify(record);
  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(errors.some((error) => error.includes("RPO must be <=4")));
  assert.ok(errors.some((error) => error.includes("48-52px")));
});

test("requires successful distinct verify and container artifacts bound to the candidate", () => {
  const { documents, closure } = completeFixture();
  closure.authoritativeEvidence.conclusion = "failure";
  closure.authoritativeEvidence.jobs.verify.sourceSha = "0".repeat(40);
  closure.authoritativeEvidence.jobs.containerSecurity.conclusion = "failure";
  closure.authoritativeEvidence.jobs.containerSecurity.artifactId =
    closure.authoritativeEvidence.jobs.verify.artifactId;
  closure.independentReproduction.runId = closure.authoritativeEvidence.runId;
  closure.independentReproduction.runUri = closure.authoritativeEvidence.runUri;
  closure.candidate.cleanReproductionEvidenceUri =
    closure.authoritativeEvidence.runUri;
  closure.independentReproduction.jobs.verify.artifactId =
    closure.authoritativeEvidence.jobs.verify.artifactId;
  documents["docs/readiness/phase-zero-closure.json"] = JSON.stringify(closure);

  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(
    errors.some((error) =>
      error.includes("successful candidate-bound repository"),
    ),
  );
  assert.ok(errors.some((error) => error.includes("jobs.verify")));
  assert.ok(errors.some((error) => error.includes("jobs.containerSecurity")));
  assert.ok(errors.some((error) => error.includes("distinct artifacts")));
  assert.ok(
    errors.some((error) => error.includes("distinct successful reviewer")),
  );
  assert.ok(
    errors.some((error) =>
      error.includes("independentReproduction.jobs.verify"),
    ),
  );
});

test("requires risk approvals to resolve through the registry and Phase 0 defect owners", () => {
  const { documents } = completeFixture();
  documents["docs/readiness/risk-register.md"] = documents[
    "docs/readiness/risk-register.md"
  ].replace("APR-RISK-R02", "APR-UNKNOWN");
  documents["docs/readiness/defect-ledger.md"] = documents[
    "docs/readiness/defect-ledger.md"
  ].replace(
    "| L-02 | P0-01 | HIGH | 0 | SE-OWNER |",
    "| L-02 | P0-01 | HIGH | 0 | `OPEN-OWNER` |",
  );

  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  assert.ok(
    errors.some((error) => error.includes("APR-UNKNOWN does not exist")),
  );
  assert.ok(
    errors.some((error) => error.includes("every defect must resolve")),
  );
});

test("requires canonical owners for later-phase blockers, defects, risks, and findings", () => {
  const { documents } = completeFixture();
  documents["docs/readiness/blockers.md"] = documents[
    "docs/readiness/blockers.md"
  ].replace("| 14 | SE-OWNER |", "| 14 | UNASSIGNED |");
  documents["docs/readiness/defect-ledger.md"] = documents[
    "docs/readiness/defect-ledger.md"
  ].replace("| 2 | SE-OWNER |", "| 2 | UNASSIGNED |");
  documents["docs/readiness/risk-register.md"] = documents[
    "docs/readiness/risk-register.md"
  ].replace("| 2 | SE-OWNER |", "| 2 | UNASSIGNED |");
  documents["docs/readiness/traceability.md"] = documents[
    "docs/readiness/traceability.md"
  ].replace("| all | SE-OWNER |", "| all | UNASSIGNED |");

  const errors = validatePhaseZeroClosure({
    documents,
    gitStatus: "",
    currentHead,
    candidateIsAncestor: true,
  });
  for (const kind of ["blocker", "defect", "risk"]) {
    assert.ok(errors.some((error) => error.includes(`every ${kind}`)));
  }
  assert.ok(errors.some((error) => error.includes("every A-001")));
});

test("the current worktree is not misrepresented as Phase 0 complete", async () => {
  const { readFile } = await import("node:fs/promises");
  const documents = Object.fromEntries(
    await Promise.all(
      phaseZeroClosureFiles.map(async (file) => [
        file,
        await readFile(file, "utf8"),
      ]),
    ),
  );
  assert.ok(
    validatePhaseZeroClosure({
      documents,
      gitStatus: "dirty",
      currentHead: "0".repeat(40),
    }).length > 0,
  );
});
