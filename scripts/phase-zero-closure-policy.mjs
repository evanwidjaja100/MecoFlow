import { createHash } from "node:crypto";
import { GITHUB_REMOTE_CONTROL_PROJECTION_SCHEMA } from "./github-remote-control-evidence.mjs";

const SHA_1 = /^[0-9a-f]{40}$/u;
const SHA_256 = /^(?:sha256:)?[0-9a-f]{64}$/u;
const APPROVAL_ID = /^APR-[A-Z0-9][A-Z0-9-]{1,}$/u;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/u;
const HTTPS_URI = /^https:\/\/\S+$/u;
const ROLE_IDS = new Set([
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
  "REPO-ADMIN",
  "PROCUREMENT-OWNER",
  "A11Y-REVIEWER",
  "IMPLEMENTATION-OPERATOR",
  "INDEPENDENT-SECURITY",
  "INDEPENDENT-DATA-RELEASE",
]);
const ALLOWED_POST_CANDIDATE_PATHS = new Set([
  "IMPLEMENTATION_STATUS.md",
  "PRODUCTION_READINESS_MASTER_PLAN.md",
  "docs/readiness/approvals.json",
  "docs/readiness/blockers.md",
  "docs/readiness/ci-governance.md",
  "docs/readiness/decision-log.md",
  "docs/readiness/defect-ledger.md",
  "docs/readiness/endpoint-matrix.md",
  "docs/readiness/evidence-index.md",
  "docs/readiness/governance.md",
  "docs/readiness/phase-zero-closure.json",
  "docs/readiness/phase-zero-requirements.md",
  "docs/readiness/original-draft-disposition.json",
  "docs/readiness/risk-register.md",
  "docs/readiness/supported-versions.md",
  "docs/readiness/traceability.md",
  "docs/readiness/worktree-reconciliation.md",
]);

const CONSERVATIVE_DRAFT_SCOPE = Object.freeze([
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
]);

const APPROVAL_BINDINGS = Object.freeze({
  candidateOwner: {
    subject: "phase-zero:candidate",
    scope: "Phase 0 candidate baseline",
    requiredRoleIds: ["REPO-ADMIN", "REL-MANAGER"],
  },
  originalDraftDisposition: {
    subject: "phase-zero:original-draft-disposition",
    scope: "Original readiness draft disposition",
    requiredRoleIds: ["REPO-ADMIN", "REL-MANAGER"],
  },
  governanceRoster: {
    subject: "phase-zero:governance-roster",
    scope: "Phase 0 accountability and reviewer roster",
    requiredRoleIds: ["BUSINESS-SPONSOR", "REL-MANAGER"],
  },
  worktreeReconciliation: {
    subject: "phase-zero:worktree-reconciliation",
    scope: "Phase 0 worktree attribution and preservation",
    requiredRoleIds: ["REPO-ADMIN", "REL-MANAGER"],
  },
  traceabilityAndDeferrals: {
    subject: "phase-zero:traceability-and-deferrals",
    scope: "Phase 0 finding routing and later-phase deferrals",
    requiredRoleIds: ["SE-OWNER", "SEC-OWNER", "REL-MANAGER"],
  },
  supportedVersions: {
    subject: "phase-zero:supported-versions",
    scope: "Phase 0 supported runtime and client versions",
    requiredRoleIds: ["SE-OWNER", "QA-OWNER", "SRE-OWNER"],
  },
  riskRegister: {
    subject: "phase-zero:risk-register",
    scope: "Phase 0 risk register",
    requiredRoleIds: ["SEC-OWNER", "REL-MANAGER"],
  },
  ciGovernance: {
    subject: "phase-zero:ci-governance",
    scope: "Phase 0 repository and CI governance",
    requiredRoleIds: ["REPO-ADMIN", "SEC-OWNER", "REL-MANAGER"],
  },
  independentReproduction: {
    subject: "phase-zero:independent-reproduction",
    scope: "Independent reproduction of the Phase 0 baseline",
    requiredRoleIds: ["QA-OWNER", "REL-MANAGER"],
  },
  endpointMatrix: {
    subject: "phase-zero:endpoint-matrix",
    scope: "Phase 0 production endpoint matrix",
    requiredRoleIds: [
      "SE-OWNER",
      "SEC-OWNER",
      "IDENTITY-OWNER",
      "PLATFORM-OWNER",
      "REL-MANAGER",
    ],
  },
  authoritativeEvidence: {
    subject: "phase-zero:authoritative-evidence",
    scope: "Phase 0 authoritative CI evidence",
    requiredRoleIds: ["QA-OWNER", "REL-MANAGER"],
  },
});

const DECISION_ROLE_COVERAGE = Object.freeze({
  "D-01": ["PRODUCT-OWNER", "SRE-OWNER", "BUSINESS-SPONSOR"],
  "D-02": [
    "DATA-OWNER",
    "PRODUCT-OWNER",
    "SRE-OWNER",
    "PRIVACY-OWNER",
    "BUSINESS-SPONSOR",
  ],
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
  "D-09": [
    "SEC-OWNER",
    "DATA-OWNER",
    "PLATFORM-OWNER",
    "PRIVACY-OWNER",
    "PROCUREMENT-OWNER",
  ],
  "D-10": [
    "SE-OWNER",
    "SEC-OWNER",
    "IDENTITY-OWNER",
    "PLATFORM-OWNER",
    "REL-MANAGER",
  ],
});

const DECISION_FIELDS = Object.freeze({
  "D-01": [
    "availabilityPercent",
    "latencyP95Ms",
    "latencyP99Ms",
    "maxErrorPercent",
    "measurementWindow",
    "scope",
    "exclusions",
    "errorBudgetPolicy",
  ],
  "D-02": [
    "rpoHours",
    "rtoHours",
    "recoveryScope",
    "completeSetDefinition",
    "verificationOwnerRoleId",
  ],
  "D-03": [
    "auditEvidenceDays",
    "monitoringDays",
    "documentDays",
    "notificationDays",
    "backupDays",
    "privacyErasureDays",
    "legalHoldPolicy",
  ],
  "D-04": [
    "minimumHeadroomPercent",
    "maximumQueueRecoverySeconds",
    "peakNamedUsers",
    "peakConcurrentSessions",
    "projects",
    "itemsAndBomLines",
    "documentCount",
    "documentStorageGb",
    "reportConcurrency",
    "jobsPerMinute",
    "maximumQueuedJobs",
    "annualGrowthPercent",
    "planningHorizonMonths",
    "peakSeasonalityMultiplier",
  ],
  "D-05": ["locales", "timezone", "currency", "units", "supportOwnerRoleId"],
  "D-06": [
    "supportedVersionsRef",
    "phoneViewport",
    "tabletViewport",
    "desktopMinimumWidth",
    "inputModes",
    "zoomPercent",
    "forcedColors",
    "reducedMotion",
  ],
  "D-07": [
    "wcag",
    "generalTargetPx",
    "warehouseQaTargetMinPx",
    "warehouseQaTargetMaxPx",
  ],
  "D-08": [
    "product",
    "distribution",
    "version",
    "hostingModel",
    "regionsAndHa",
    "supportTierAndSla",
    "patchCadence",
    "supportOwnerRoleId",
    "procurementReference",
    "procurementStatus",
    "procurementStartedAt",
    "procurementEvidenceUri",
    "procurementEvidenceSha256",
    "exitStrategy",
    "realmClientClaimContract",
    "mfaRecoveryBreakGlassContract",
    "keyRotationRevocationBackupContract",
  ],
  "D-09": [
    "provider",
    "productAndTier",
    "s3Compatible",
    "minioDevelopmentOnly",
    "accountRegionEndpoint",
    "supportTierAndSla",
    "supportOwnerRoleId",
    "procurementReference",
    "procurementStatus",
    "procurementStartedAt",
    "procurementEvidenceUri",
    "procurementEvidenceSha256",
    "exitStrategy",
    "kmsAndPrivatePolicyContract",
    "retentionVersioningLegalHoldContract",
    "malwareScanningContract",
    "replicationAndRecoveryContract",
  ],
  "D-10": ["endpointMatrixRef"],
});

const REMOTE_CONTROL_BINDINGS = Object.freeze({
  branchProtection: {
    subject: "phase-zero:remote-control:branch-protection",
    scope: "Protected candidate branch controls",
    requiredRoleIds: ["REPO-ADMIN", "SEC-OWNER", "REL-MANAGER"],
  },
  protectedEnvironment: {
    subject: "phase-zero:remote-control:protected-environment",
    scope: "Protected production environment controls",
    requiredRoleIds: ["REPO-ADMIN", "PLATFORM-OWNER", "REL-MANAGER"],
  },
  restrictedActions: {
    subject: "phase-zero:remote-control:restricted-actions",
    scope: "Restricted and SHA-pinned GitHub Actions",
    requiredRoleIds: ["REPO-ADMIN", "SEC-OWNER"],
  },
  independentReviewerAccess: {
    subject: "phase-zero:remote-control:independent-reviewer-access",
    scope: "Independent reviewer repository access",
    requiredRoleIds: ["REPO-ADMIN", "REL-MANAGER"],
  },
  releaseLabels: {
    subject: "phase-zero:remote-control:release-labels",
    scope: "Phase 0 defect and release labels",
    requiredRoleIds: ["REPO-ADMIN", "REL-MANAGER"],
  },
  repositoryVisibility: {
    subject: "phase-zero:remote-control:repository-visibility",
    scope: "Repository visibility and source exposure",
    requiredRoleIds: ["REPO-ADMIN", "SEC-OWNER", "REL-MANAGER"],
  },
});

const RISK_ROLE_COVERAGE = Object.freeze({
  "R-12": ["SRE-OWNER", "BUSINESS-SPONSOR", "SEC-OWNER", "REL-MANAGER"],
});

function decisionBinding(id) {
  return {
    subject: `phase-zero:decision:${id}`,
    scope: `Phase 0 decision ${id}`,
    requiredRoleIds: DECISION_ROLE_COVERAGE[id],
  };
}

function riskBinding(id) {
  return {
    subject: `phase-zero:risk:${id}`,
    scope: `Phase 0 risk ${id}`,
    requiredRoleIds: RISK_ROLE_COVERAGE[id] ?? ["SEC-OWNER", "REL-MANAGER"],
  };
}

function parseJson(documents, file, errors) {
  try {
    return JSON.parse(documents[file]);
  } catch {
    errors.push(`${file}: valid JSON is required`);
    return undefined;
  }
}

function sha256(value) {
  return createHash("sha256")
    .update(value ?? "")
    .digest("hex");
}

function sourceBaseline(documents, errors) {
  const rootPackage = parseJson(documents, "package.json", errors);
  const databasePackage = parseJson(
    documents,
    "packages/database/package.json",
    errors,
  );
  const containerPolicy = parseJson(
    documents,
    "security/container-scan-policy.json",
    errors,
  );
  const lockfile = documents["pnpm-lock.yaml"];
  const postgresImage = documents["infra/docker/postgres.Dockerfile"]?.match(
    /^FROM\s+(postgres:[^\s]+@sha256:[0-9a-f]{64})/mu,
  )?.[1];
  const redisImage = containerPolicy?.images?.find((image) =>
    image.startsWith("redis:"),
  );
  if (
    !rootPackage ||
    !databasePackage ||
    !containerPolicy ||
    typeof lockfile !== "string" ||
    !postgresImage ||
    !redisImage
  ) {
    errors.push(
      "candidate source inputs for supported versions and evidence digests are incomplete",
    );
  }
  return {
    lockfileSha256: sha256(lockfile),
    containerPolicySha256: sha256(
      documents["security/container-scan-policy.json"],
    ),
    application: {
      node: rootPackage?.engines?.node,
      pnpm: rootPackage?.engines?.pnpm,
      typescript: rootPackage?.devDependencies?.typescript,
      turborepo: rootPackage?.devDependencies?.turbo,
      prisma: databasePackage?.devDependencies?.prisma,
      playwright: rootPackage?.devDependencies?.["@playwright/test"],
    },
    data: { postgresImage, redisImage },
  };
}

function markdownCells(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.replaceAll("`", "").trim());
}

function rows(text, prefix) {
  return text
    .split(/\r?\n/u)
    .filter((line) => line.startsWith(`| ${prefix}`))
    .map(markdownCells);
}

function validateGovernanceRoster(text, errors) {
  const rosterSection = text.match(
    /## Accountability and reviewer roster([\s\S]*?)## Canonical role IDs/u,
  )?.[1];
  const rows = rosterSection
    ? rosterSection
        .split(/\r?\n/u)
        .filter((line) => /^\| [^|-].+ \|/u.test(line))
        .map(markdownCells)
        .filter((cells) => cells.length === 5 && cells[0] !== "Role")
    : [];
  const roster = new Map(rows.map((cells) => [cells[1], cells]));
  if (
    rows.length !== ROLE_IDS.size ||
    roster.size !== ROLE_IDS.size ||
    [...ROLE_IDS].some((roleId) => !roster.has(roleId)) ||
    rows.some(
      (cells) =>
        !cells[2] ||
        cells[2] === "Unassigned" ||
        !cells[3] ||
        cells[3] === "Unassigned" ||
        cells[4] !== "APPROVED",
    )
  ) {
    errors.push(
      "governance roster must name and approve every required human role",
    );
  }
  const implementationIdentity = roster.get("IMPLEMENTATION-OPERATOR")?.[3];
  const independentIdentities = [
    roster.get("INDEPENDENT-SECURITY")?.[3],
    roster.get("INDEPENDENT-DATA-RELEASE")?.[3],
  ];
  if (
    independentIdentities.some(
      (identity) =>
        !identity ||
        identity.trim().toLowerCase() ===
          implementationIdentity?.trim().toLowerCase(),
    ) ||
    independentIdentities[0]?.trim().toLowerCase() ===
      independentIdentities[1]?.trim().toLowerCase()
  ) {
    errors.push(
      "governance roster must keep both independent reviewers distinct from each other and the implementation operator",
    );
  }
  return roster;
}

function personMatchesRoster(person, roster) {
  const entry = roster.get(person?.roleId);
  return entry && person?.name === entry[2] && person?.identity === entry[3];
}

function hasCanonicalOwner(owner, roster) {
  return ROLE_IDS.has(owner) && roster.has(owner);
}

function exactKeys(value, keys) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\n") === [...keys].sort().join("\n")
  );
}

const PRODUCTION_HOST =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;
const INTERNAL_SERVICE =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/u;
const PLACEHOLDER_HOST =
  /(?:^|\.)(?:example|invalid|localhost|local|test)(?:\.|$)/u;

function productionHttpsUrl(value, label, errors, { origin = false } = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    errors.push(`${label}: an exact HTTPS production URL is required`);
    return undefined;
  }
  const host = parsed.hostname.toLowerCase();
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    !PRODUCTION_HOST.test(host) ||
    PLACEHOLDER_HOST.test(host) ||
    parsed.hash ||
    (origin &&
      (parsed.pathname !== "/" || parsed.search || parsed.origin !== value))
  ) {
    errors.push(`${label}: an exact HTTPS production URL is required`);
    return undefined;
  }
  return parsed;
}

function stringArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim()) &&
    new Set(value).size === value.length
  );
}

function validateEndpointMatrix(matrix, approvalReference, errors) {
  if (
    !exactKeys(matrix, [
      "schemaVersion",
      "status",
      "approvalRecordId",
      "public",
      "identity",
      "proxy",
      "internal",
      "build",
    ]) ||
    matrix.schemaVersion !== 1 ||
    matrix.status !== "APPROVED" ||
    matrix.approvalRecordId !== approvalReference ||
    !exactKeys(matrix.public, [
      "webUrl",
      "apiBaseUrl",
      "dnsNames",
      "dnsZones",
      "corsOrigins",
    ]) ||
    !exactKeys(matrix.identity, ["issuerUrl", "callbackUrls", "hostname"]) ||
    !exactKeys(matrix.proxy, ["chain", "trustedHopCount"]) ||
    !exactKeys(matrix.internal, [
      "apiService",
      "webService",
      "workerAndDependencies",
    ]) ||
    !exactKeys(matrix.build, ["nextPublicApiBaseUrl"])
  ) {
    errors.push(
      "endpoint-matrix.json: exact approved schema and approval reference are required",
    );
    return;
  }

  const web = productionHttpsUrl(
    matrix.public.webUrl,
    "endpoint public.webUrl",
    errors,
    { origin: true },
  );
  const api = productionHttpsUrl(
    matrix.public.apiBaseUrl,
    "endpoint public.apiBaseUrl",
    errors,
    { origin: true },
  );
  const issuer = productionHttpsUrl(
    matrix.identity.issuerUrl,
    "endpoint identity.issuerUrl",
    errors,
  );
  const buildApi = productionHttpsUrl(
    matrix.build.nextPublicApiBaseUrl,
    "endpoint build.nextPublicApiBaseUrl",
    errors,
    { origin: true },
  );
  if (api && buildApi && api.href !== buildApi.href) {
    errors.push(
      "endpoint build-time API URL must equal the public API base URL",
    );
  }
  if (
    issuer &&
    (issuer.search || !/^\/realms\/[A-Za-z0-9._~-]+$/u.test(issuer.pathname))
  ) {
    errors.push(
      "endpoint OIDC issuer must use the exact Keycloak /realms/{realm} URL without a query",
    );
  }

  const callbacks = stringArray(matrix.identity.callbackUrls)
    ? matrix.identity.callbackUrls.map((value, index) =>
        productionHttpsUrl(
          value,
          `endpoint identity.callbackUrls[${index}]`,
          errors,
        ),
      )
    : (errors.push("endpoint callback URL set must be non-empty and unique"),
      []);
  if (
    callbacks.some(
      (callback) =>
        callback &&
        (callback.pathname !== "/api/v1/auth/callback" ||
          callback.search ||
          (api && callback.origin !== api.origin)),
    )
  ) {
    errors.push(
      "every endpoint callback must use the exact public API origin and /api/v1/auth/callback path without a query",
    );
  }
  if (
    !stringArray(matrix.public.corsOrigins) ||
    matrix.public.corsOrigins.some(
      (value, index) =>
        !productionHttpsUrl(
          value,
          `endpoint public.corsOrigins[${index}]`,
          errors,
          { origin: true },
        ),
    ) ||
    (web && !matrix.public.corsOrigins.includes(web.origin))
  ) {
    errors.push("endpoint CORS origins must be exact unique HTTPS origins");
  }

  const hostname = String(matrix.identity.hostname ?? "").toLowerCase();
  if (
    !PRODUCTION_HOST.test(hostname) ||
    PLACEHOLDER_HOST.test(hostname) ||
    (issuer && hostname !== issuer.hostname.toLowerCase())
  ) {
    errors.push("endpoint identity hostname must match the OIDC issuer");
  }
  const requiredDnsNames = [web, api, issuer, ...callbacks]
    .filter(Boolean)
    .map((url) => url.hostname.toLowerCase());
  if (
    !stringArray(matrix.public.dnsNames) ||
    matrix.public.dnsNames.some(
      (name) =>
        name !== name.toLowerCase() ||
        !PRODUCTION_HOST.test(name) ||
        PLACEHOLDER_HOST.test(name),
    ) ||
    requiredDnsNames.some((name) => !matrix.public.dnsNames.includes(name)) ||
    !stringArray(matrix.public.dnsZones) ||
    matrix.public.dnsZones.some(
      (zone) =>
        zone !== zone.toLowerCase() ||
        !PRODUCTION_HOST.test(zone) ||
        PLACEHOLDER_HOST.test(zone),
    ) ||
    requiredDnsNames.some(
      (name) =>
        !matrix.public.dnsZones.some(
          (zone) => name === zone || name.endsWith(`.${zone}`),
        ),
    )
  ) {
    errors.push("endpoint DNS names/zones must cover every public hostname");
  }

  if (
    !Array.isArray(matrix.proxy.chain) ||
    matrix.proxy.chain.some(
      (hop) => typeof hop !== "string" || !INTERNAL_SERVICE.test(hop),
    ) ||
    !Number.isInteger(matrix.proxy.trustedHopCount) ||
    matrix.proxy.trustedHopCount < 0 ||
    matrix.proxy.trustedHopCount !== matrix.proxy.chain.length
  ) {
    errors.push("endpoint proxy chain must exactly match trustedHopCount");
  }
  const proxyNames = Array.isArray(matrix.proxy.chain)
    ? matrix.proxy.chain
    : [];
  const workerNames = Array.isArray(matrix.internal.workerAndDependencies)
    ? matrix.internal.workerAndDependencies
    : [];
  const internalNames = [
    ...proxyNames,
    matrix.internal.apiService,
    matrix.internal.webService,
    ...workerNames,
  ];
  if (
    !INTERNAL_SERVICE.test(matrix.internal.apiService ?? "") ||
    !INTERNAL_SERVICE.test(matrix.internal.webService ?? "") ||
    !stringArray(matrix.internal.workerAndDependencies) ||
    matrix.internal.workerAndDependencies.some(
      (name) => !INTERNAL_SERVICE.test(name),
    ) ||
    new Set(internalNames).size !== internalNames.length
  ) {
    errors.push(
      "endpoint proxy and internal service names must be globally unique",
    );
  }
}

export function resolveApprovedBuildApiBaseUrl(matrix) {
  const errors = [];
  validateEndpointMatrix(matrix, matrix?.approvalRecordId, errors);
  if (!APPROVAL_ID.test(matrix?.approvalRecordId ?? "")) {
    errors.push("endpoint matrix requires an APR-* approval record");
  }
  if (errors.length > 0) {
    throw new Error(
      `Approved endpoint matrix is invalid: ${errors.join("; ")}`,
    );
  }
  return matrix.build.nextPublicApiBaseUrl;
}

function validateSupportedVersions(
  versions,
  approvalReference,
  authoritativeEvidence,
  baseline,
  errors,
) {
  const exactSchema =
    exactKeys(versions, [
      "schemaVersion",
      "status",
      "approvalRecordId",
      "lockfileSha256",
      "application",
      "data",
      "browsers",
      "operatingSystems",
      "deployment",
    ]) &&
    exactKeys(versions.application, [
      "node",
      "pnpm",
      "typescript",
      "turborepo",
      "prisma",
      "playwright",
    ]) &&
    exactKeys(versions.data, ["postgresImage", "redisImage"]) &&
    exactKeys(versions.browsers, [
      "chromeMajor",
      "edgeMajor",
      "firefoxMajor",
      "safariVersion",
    ]) &&
    exactKeys(versions.operatingSystems, [
      "windows",
      "macos",
      "ios",
      "ipados",
      "android",
    ]) &&
    exactKeys(versions.deployment, ["platform", "tool", "version"]);
  if (
    !exactSchema ||
    versions.schemaVersion !== 1 ||
    versions.status !== "APPROVED" ||
    versions.approvalRecordId !== approvalReference
  ) {
    errors.push(
      "supported-versions.json: exact approved schema and approval reference are required",
    );
    return;
  }
  const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;
  if (
    Object.values(versions.application).some(
      (value) => typeof value !== "string" || !semver.test(value),
    )
  ) {
    errors.push("supported application versions must be exact semver values");
  }
  if (
    Object.values(versions.data).some(
      (value) =>
        typeof value !== "string" || !/@sha256:[0-9a-f]{64}$/u.test(value),
    )
  ) {
    errors.push("supported data images must use exact sha256 references");
  }
  if (
    !SHA_256.test(versions.lockfileSha256 ?? "") ||
    versions.lockfileSha256.replace(/^sha256:/u, "") !==
      authoritativeEvidence?.lockfileSha256?.replace(/^sha256:/u, "")
  ) {
    errors.push(
      "supported version lockfile digest must match authoritative evidence",
    );
  }
  if (
    versions.lockfileSha256.replace(/^sha256:/u, "") !==
      baseline.lockfileSha256 ||
    Object.entries(baseline.application).some(
      ([name, value]) => versions.application[name] !== value,
    ) ||
    Object.entries(baseline.data).some(
      ([name, value]) => versions.data[name] !== value,
    )
  ) {
    errors.push(
      "supported versions must exactly match candidate package manifests, lockfile, and image sources",
    );
  }
  if (
    [
      versions.browsers.chromeMajor,
      versions.browsers.edgeMajor,
      versions.browsers.firefoxMajor,
    ].some((value) => !/^[1-9]\d{1,2}$/u.test(value ?? "")) ||
    !/^\d+(?:\.\d+){1,2}$/u.test(versions.browsers.safariVersion ?? "")
  ) {
    errors.push("supported browser majors/versions must be exact");
  }
  const exactProductValue = (value) =>
    typeof value === "string" &&
    value.trim().length >= 2 &&
    !/(?:BLOCKED|TBD|TODO|Unassigned|placeholder)/iu.test(value);
  if (
    Object.values(versions.operatingSystems).some(
      (value) => !exactProductValue(value),
    ) ||
    Object.values(versions.deployment).some(
      (value) => !exactProductValue(value),
    )
  ) {
    errors.push(
      "supported OS and production deployment platform/tool/version must be exact",
    );
  }
  if (
    /(?:\bk8s\b|kubernetes|openshift|\beks\b|\bgke\b|\baks\b)/iu.test(
      versions.deployment.platform ?? "",
    ) ||
    /(?:\bhelm\b|\bkubectl\b|\bkustomize\b|\bkubeadm\b)/iu.test(
      `${versions.deployment.tool ?? ""} ${versions.deployment.version ?? ""}`,
    )
  ) {
    errors.push(
      "supported production deployment must preserve the non-Kubernetes container architecture",
    );
  }
}

function validateDecisionRecord(record, approvalReferences, errors) {
  const decisionIds = Object.keys(DECISION_FIELDS);
  if (
    !exactKeys(record, [
      "schemaVersion",
      "status",
      "approvalRecordIds",
      "decisions",
    ]) ||
    record.schemaVersion !== 1 ||
    record.status !== "APPROVED" ||
    !exactKeys(record.approvalRecordIds, decisionIds) ||
    !exactKeys(record.decisions, decisionIds) ||
    decisionIds.some(
      (id) => record.approvalRecordIds[id] !== approvalReferences?.[id],
    )
  ) {
    errors.push(
      "decisions.json: exact approved D-01 through D-10 schema and approval references are required",
    );
    return;
  }

  const placeholder = /(?:BLOCKED|TBD|TODO|Unassigned|placeholder)/iu;
  let decisionShapesValid = true;
  for (const id of decisionIds) {
    const decision = record.decisions[id];
    if (!exactKeys(decision, DECISION_FIELDS[id])) {
      errors.push(`${id}: exact typed decision fields are required`);
      decisionShapesValid = false;
      continue;
    }
    for (const [field, value] of Object.entries(decision)) {
      const valid =
        typeof value === "boolean" ||
        (typeof value === "number" && Number.isFinite(value) && value >= 0) ||
        (typeof value === "string" &&
          value.trim().length >= 2 &&
          !placeholder.test(value)) ||
        (Array.isArray(value) &&
          (field === "exclusions" || value.length > 0) &&
          value.every(
            (item) =>
              (typeof item === "string" &&
                item.trim().length > 0 &&
                !placeholder.test(item)) ||
              (typeof item === "number" && Number.isFinite(item) && item >= 0),
          ) &&
          new Set(value).size === value.length);
      if (!valid)
        errors.push(`${id}.${field}: an exact approved value is required`);
    }
  }
  if (!decisionShapesValid) return;

  const d01 = record.decisions["D-01"];
  if (
    !(d01.availabilityPercent >= 99.5 && d01.availabilityPercent <= 100) ||
    !(d01.latencyP95Ms > 0 && d01.latencyP95Ms <= 1000) ||
    !(d01.latencyP99Ms >= d01.latencyP95Ms && d01.latencyP99Ms <= 2000) ||
    !(d01.maxErrorPercent >= 0 && d01.maxErrorPercent <= 1)
  ) {
    errors.push(
      "D-01: SLOs must preserve at least 99.5% availability, p95 <=1000ms, p99 <=2000ms, and errors <=1%",
    );
  }
  const d02 = record.decisions["D-02"];
  if (
    !(d02.rpoHours > 0 && d02.rpoHours <= 4) ||
    !(d02.rtoHours > 0 && d02.rtoHours <= 8)
  ) {
    errors.push("D-02: RPO must be <=4 hours and RTO must be <=8 hours");
  }
  const d03 = record.decisions["D-03"];
  if (
    [
      "auditEvidenceDays",
      "monitoringDays",
      "documentDays",
      "notificationDays",
      "backupDays",
      "privacyErasureDays",
    ].some((field) => !(d03[field] > 0))
  ) {
    errors.push("D-03: every retention period must be a positive exact value");
  }
  const d04 = record.decisions["D-04"];
  if (
    !(d04.minimumHeadroomPercent >= 30) ||
    !(d04.maximumQueueRecoverySeconds > 0) ||
    d04.maximumQueueRecoverySeconds > 300 ||
    ![
      "peakNamedUsers",
      "peakConcurrentSessions",
      "projects",
      "itemsAndBomLines",
      "documentCount",
      "documentStorageGb",
      "reportConcurrency",
      "jobsPerMinute",
      "maximumQueuedJobs",
      "annualGrowthPercent",
      "peakSeasonalityMultiplier",
    ].every((field) => d04[field] > 0) ||
    d04.peakConcurrentSessions > d04.peakNamedUsers ||
    !(d04.planningHorizonMonths > 0)
  ) {
    errors.push(
      "D-04: positive capacity, growth, horizon, headroom, and recovery values must preserve the baseline",
    );
  }
  const d05 = record.decisions["D-05"];
  if (
    d05.locales.join(",") !== "en,id" ||
    d05.timezone !== "Asia/Jakarta" ||
    d05.currency !== "IDR" ||
    d05.units !== "metric" ||
    !ROLE_IDS.has(d05.supportOwnerRoleId)
  ) {
    errors.push(
      "D-05: locale/time/currency/unit requirements must be preserved",
    );
  }
  const d06 = record.decisions["D-06"];
  if (
    d06.supportedVersionsRef !== "docs/readiness/supported-versions.json" ||
    d06.phoneViewport !== "390x844" ||
    d06.tabletViewport !== "768x1024" ||
    d06.desktopMinimumWidth < 1280 ||
    !d06.inputModes.includes("keyboard") ||
    !d06.inputModes.includes("touch") ||
    !d06.zoomPercent.includes(200) ||
    !d06.zoomPercent.includes(400) ||
    d06.forcedColors !== true ||
    d06.reducedMotion !== true
  ) {
    errors.push("D-06: browser/device/access-mode baseline is incomplete");
  }
  const d07 = record.decisions["D-07"];
  if (
    d07.wcag !== "2.2 AA" ||
    d07.generalTargetPx !== 44 ||
    d07.warehouseQaTargetMinPx !== 48 ||
    d07.warehouseQaTargetMaxPx !== 52
  ) {
    errors.push(
      "D-07: the WCAG 2.2 AA baseline and stricter product targets require 44px general and 48-52px warehouse/QA controls",
    );
  }
  const d08 = record.decisions["D-08"];
  if (
    d08.product !== "Keycloak" ||
    !/^\d+\.\d+\.\d+$/u.test(d08.version ?? "") ||
    !ROLE_IDS.has(d08.supportOwnerRoleId) ||
    !/^[A-Z][A-Z0-9-]{2,}$/u.test(d08.procurementReference ?? "") ||
    !new Set(["STARTED", "COMPLETED"]).has(d08.procurementStatus) ||
    !ISO_DATE.test(d08.procurementStartedAt ?? "") ||
    !HTTPS_URI.test(d08.procurementEvidenceUri ?? "") ||
    !SHA_256.test(d08.procurementEvidenceSha256 ?? "")
  ) {
    errors.push(
      "D-08: supported Keycloak distribution/version/owner and started procurement evidence are required",
    );
  }
  const d09 = record.decisions["D-09"];
  if (
    d09.s3Compatible !== true ||
    d09.minioDevelopmentOnly !== true ||
    /minio/iu.test(`${d09.provider} ${d09.productAndTier}`) ||
    !ROLE_IDS.has(d09.supportOwnerRoleId) ||
    !/^[A-Z][A-Z0-9-]{2,}$/u.test(d09.procurementReference ?? "") ||
    !new Set(["STARTED", "COMPLETED"]).has(d09.procurementStatus) ||
    !ISO_DATE.test(d09.procurementStartedAt ?? "") ||
    !HTTPS_URI.test(d09.procurementEvidenceUri ?? "") ||
    !SHA_256.test(d09.procurementEvidenceSha256 ?? "")
  ) {
    errors.push(
      "D-09: supported non-MinIO production storage contract and started procurement evidence are required",
    );
  }
  if (
    record.decisions["D-10"].endpointMatrixRef !==
    "docs/readiness/endpoint-matrix.json"
  ) {
    errors.push("D-10: typed endpoint matrix reference is required");
  }
}

function requiredReference(
  value,
  label,
  records,
  candidateSha,
  binding,
  referenceUse,
  errors,
) {
  if (typeof value !== "string" || !APPROVAL_ID.test(value)) {
    errors.push(`${label}: an APR-* approval reference is required`);
    return;
  }
  const record = records.get(value);
  if (!record) {
    errors.push(`${label}: approval record ${value} does not exist`);
    return undefined;
  }
  if (record.reviewedSourceSha !== candidateSha) {
    errors.push(`${label}: approval record is not bound to the candidate SHA`);
  }
  if (record.subject !== binding.subject || record.scope !== binding.scope) {
    errors.push(
      `${label}: approval subject/scope must be ${binding.subject} / ${binding.scope}`,
    );
  }
  const roleCoverage = new Set(
    (record.roleApprovals ?? []).map((approval) => approval?.roleId),
  );
  const missingRoles = binding.requiredRoleIds.filter(
    (roleId) => !roleCoverage.has(roleId),
  );
  if (missingRoles.length > 0) {
    errors.push(
      `${label}: approval role coverage is missing ${missingRoles.join(", ")}`,
    );
  }
  const priorUse = referenceUse.get(value);
  if (priorUse) {
    errors.push(
      `${label}: approval record ${value} is already bound to ${priorUse}; distinct approval references are required`,
    );
  } else {
    referenceUse.set(value, label);
  }
  return record;
}

function validateApprovalRecords(registry, candidateSha, roster, errors) {
  if (registry?.schemaVersion !== 1 || !Array.isArray(registry.records)) {
    errors.push(
      "docs/readiness/approvals.json: schemaVersion 1 and records[] are required",
    );
    return new Map();
  }
  const records = new Map();
  for (const record of registry.records) {
    const id = record?.id;
    if (typeof id !== "string" || !APPROVAL_ID.test(id)) {
      errors.push("approvals.json: every record requires a stable APR-* ID");
      continue;
    }
    if (records.has(id)) errors.push(`approvals.json: duplicate record ${id}`);
    records.set(id, record);
    if (
      !record.subject ||
      !record.scope ||
      !record.findingsOrConditions ||
      record.decision !== "APPROVED" ||
      !ISO_DATE.test(record.approvedAt ?? "") ||
      record.reviewedSourceSha !== candidateSha ||
      !HTTPS_URI.test(record.evidenceUri ?? "") ||
      !SHA_256.test(record.evidenceSha256 ?? "")
    ) {
      errors.push(
        `${id}: approval subject/scope/date/SHA/evidence/findings/decision are incomplete`,
      );
    }
    const approver = record.approver;
    const reviewer = record.independentReviewer;
    if (
      !approver?.name ||
      !approver?.identity ||
      !ROLE_IDS.has(approver.roleId) ||
      !reviewer?.name ||
      !reviewer?.identity ||
      !ROLE_IDS.has(reviewer.roleId) ||
      approver.identity.trim().toLowerCase() ===
        reviewer.identity.trim().toLowerCase() ||
      !personMatchesRoster(approver, roster) ||
      !personMatchesRoster(reviewer, roster)
    ) {
      errors.push(
        `${id}: named approver and distinct independent reviewer with canonical roles are required`,
      );
    }
    if (
      !Array.isArray(record.roleApprovals) ||
      record.roleApprovals.length === 0 ||
      new Set(record.roleApprovals.map((approval) => approval?.roleId)).size !==
        record.roleApprovals.length ||
      record.roleApprovals.some(
        (approval) =>
          !approval?.name ||
          !approval?.identity ||
          !ROLE_IDS.has(approval.roleId) ||
          !personMatchesRoster(approval, roster),
      ) ||
      !record.roleApprovals.some(
        (approval) =>
          approval.roleId === approver?.roleId &&
          approval.identity === approver?.identity,
      ) ||
      record.roleApprovals.some(
        (approval) =>
          approval.identity.trim().toLowerCase() ===
          reviewer?.identity?.trim().toLowerCase(),
      )
    ) {
      errors.push(
        `${id}: named roleApprovals with unique canonical roles, stable identities, the primary approver, and an independent reviewer are required`,
      );
    }
  }
  return records;
}

export function validatePhaseZeroClosure({
  documents,
  gitStatus,
  currentHead = "",
  candidateIsAncestor = false,
  postCandidatePaths = [],
}) {
  const errors = [];
  if (gitStatus.trim() !== "")
    errors.push("worktree must be clean for Phase 0 closure");

  const closure = parseJson(
    documents,
    "docs/readiness/phase-zero-closure.json",
    errors,
  );
  const registry = parseJson(
    documents,
    "docs/readiness/approvals.json",
    errors,
  );
  if (!closure || !registry) return errors;
  const baseline = sourceBaseline(documents, errors);
  if (
    !exactKeys(closure, [
      "schemaVersion",
      "status",
      "candidate",
      "approvalReferences",
      "remoteControls",
      "authoritativeEvidence",
      "independentReproduction",
    ]) ||
    closure.schemaVersion !== 2 ||
    closure.status !== "COMPLETE"
  ) {
    errors.push(
      "phase-zero-closure.json: schemaVersion 2 with status COMPLETE is required",
    );
  }

  const candidate = closure.candidate ?? {};
  const candidateSha = candidate.sourceSha ?? "";
  if (
    !exactKeys(candidate, [
      "branch",
      "sourceSha",
      "ownerApprovalRecordId",
      "cleanReproductionEvidenceUri",
    ]) ||
    !candidate.branch ||
    !SHA_1.test(candidateSha)
  ) {
    errors.push(
      "phase-zero-closure.json: candidate branch and full source SHA are required",
    );
  }
  if (!HTTPS_URI.test(candidate.cleanReproductionEvidenceUri ?? "")) {
    errors.push(
      "phase-zero-closure.json: immutable clean-reproduction evidence URI is required",
    );
  }
  if (!SHA_1.test(currentHead) || !candidateIsAncestor) {
    errors.push("candidate SHA must be an ancestor of the clean current HEAD");
  }
  const disallowed = postCandidatePaths.filter(
    (path) => !ALLOWED_POST_CANDIDATE_PATHS.has(path.replaceAll("\\", "/")),
  );
  if (disallowed.length > 0) {
    errors.push(
      `post-candidate changes include non-evidence paths: ${disallowed.join(", ")}`,
    );
  }

  const governance = documents["docs/readiness/governance.md"] ?? "";
  const roster = validateGovernanceRoster(governance, errors);
  const approvalRecords = validateApprovalRecords(
    registry,
    candidateSha,
    roster,
    errors,
  );
  const approvalReferenceUse = new Map();
  requiredReference(
    candidate.ownerApprovalRecordId,
    "candidate owner approval",
    approvalRecords,
    candidateSha,
    APPROVAL_BINDINGS.candidateOwner,
    approvalReferenceUse,
    errors,
  );
  const references = closure.approvalReferences ?? {};
  for (const key of [
    "originalDraftDisposition",
    "governanceRoster",
    "worktreeReconciliation",
    "traceabilityAndDeferrals",
    "supportedVersions",
    "riskRegister",
    "ciGovernance",
    "independentReproduction",
    "endpointMatrix",
  ]) {
    requiredReference(
      references[key],
      `approvalReferences.${key}`,
      approvalRecords,
      candidateSha,
      APPROVAL_BINDINGS[key],
      approvalReferenceUse,
      errors,
    );
  }
  const decisionReferences = references.decisions ?? {};
  for (let index = 1; index <= 10; index += 1) {
    const id = `D-${String(index).padStart(2, "0")}`;
    requiredReference(
      decisionReferences[id],
      `approvalReferences.decisions.${id}`,
      approvalRecords,
      candidateSha,
      decisionBinding(id),
      approvalReferenceUse,
      errors,
    );
  }

  const remoteControls = closure.remoteControls ?? {};
  const remoteControlNames = Object.keys(REMOTE_CONTROL_BINDINGS);
  if (
    Object.keys(remoteControls).sort().join(",") !==
    [...remoteControlNames].sort().join(",")
  ) {
    errors.push(
      "phase-zero-closure.json: exact branchProtection, protectedEnvironment, restrictedActions, independentReviewerAccess, releaseLabels, and repositoryVisibility controls are required",
    );
  }
  for (const name of remoteControlNames) {
    const control = remoteControls[name];
    if (
      !exactKeys(control, [
        "projectionSchema",
        "status",
        "evidenceUri",
        "evidenceSha256",
        "checkedAt",
        "candidateSha",
        "approvalRecordId",
      ]) ||
      control?.projectionSchema !== GITHUB_REMOTE_CONTROL_PROJECTION_SCHEMA ||
      control?.status !== "PASS" ||
      !HTTPS_URI.test(control.evidenceUri ?? "") ||
      !SHA_256.test(control.evidenceSha256 ?? "") ||
      !ISO_DATE.test(control.checkedAt ?? "") ||
      control.candidateSha !== candidateSha
    ) {
      errors.push(
        `remoteControls.${name}: candidate-bound PASS with evidence URI/digest and timestamp is required`,
      );
    }
    requiredReference(
      control?.approvalRecordId,
      `remoteControls.${name}.approvalRecordId`,
      approvalRecords,
      candidateSha,
      REMOTE_CONTROL_BINDINGS[name],
      approvalReferenceUse,
      errors,
    );
  }

  const evidence = closure.authoritativeEvidence ?? {};
  const evidenceJobs = evidence.jobs ?? {};
  const evidenceJobNames = ["verify", "containerSecurity"];
  const evidenceRunId = String(evidence.runId ?? "");
  const expectedRunUri = `https://github.com/${evidence.repository}/actions/runs/${evidenceRunId}`;
  if (
    !exactKeys(evidence, [
      "repository",
      "sourceSha",
      "sourceRef",
      "runId",
      "runAttempt",
      "runUri",
      "conclusion",
      "lockfileSha256",
      "containerPolicySha256",
      "jobs",
      "independentReviewerApprovalRecordId",
    ]) ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(evidence.repository ?? "") ||
    evidence.sourceSha !== candidateSha ||
    evidence.sourceRef !== `refs/heads/${candidate.branch}` ||
    !/^\d+$/u.test(evidenceRunId) ||
    !Number.isInteger(evidence.runAttempt) ||
    evidence.runAttempt < 1 ||
    evidence.conclusion !== "success" ||
    !HTTPS_URI.test(evidence.runUri ?? "") ||
    evidence.runUri !== expectedRunUri ||
    !SHA_256.test(evidence.lockfileSha256 ?? "") ||
    !SHA_256.test(evidence.containerPolicySha256 ?? "") ||
    evidence.lockfileSha256.replace(/^sha256:/u, "") !==
      baseline.lockfileSha256 ||
    evidence.containerPolicySha256.replace(/^sha256:/u, "") !==
      baseline.containerPolicySha256
  ) {
    errors.push(
      "authoritativeEvidence: successful candidate-bound repository/ref/run/input evidence is incomplete",
    );
  }
  if (
    Object.keys(evidenceJobs).sort().join(",") !==
    [...evidenceJobNames].sort().join(",")
  ) {
    errors.push(
      "authoritativeEvidence.jobs: exact verify and containerSecurity jobs are required",
    );
  }
  const artifactIds = new Set();
  for (const name of evidenceJobNames) {
    const job = evidenceJobs[name];
    const summaryField =
      name === "verify" ? "stepSummarySha256" : "scanSummarySha256";
    const expectedJobKeys = [
      "name",
      "sourceSha",
      "conclusion",
      "artifactId",
      "artifactDigest",
      "manifestSha256",
      summaryField,
    ];
    if (
      !exactKeys(job, expectedJobKeys) ||
      job?.name !== (name === "verify" ? "verify" : "container-security") ||
      job?.sourceSha !== candidateSha ||
      job?.conclusion !== "success" ||
      !/^\d+$/u.test(String(job?.artifactId ?? "")) ||
      !SHA_256.test(job?.artifactDigest ?? "") ||
      !SHA_256.test(job?.manifestSha256 ?? "") ||
      !SHA_256.test(job?.[summaryField] ?? "")
    ) {
      errors.push(
        `authoritativeEvidence.jobs.${name}: successful candidate-bound job/artifact/manifest/summary evidence is required`,
      );
    }
    if (job?.artifactId) {
      if (artifactIds.has(String(job.artifactId))) {
        errors.push(
          "authoritativeEvidence.jobs: verify and containerSecurity require distinct artifacts",
        );
      }
      artifactIds.add(String(job.artifactId));
    }
  }
  requiredReference(
    evidence.independentReviewerApprovalRecordId,
    "authoritativeEvidence.independentReviewerApprovalRecordId",
    approvalRecords,
    candidateSha,
    APPROVAL_BINDINGS.authoritativeEvidence,
    approvalReferenceUse,
    errors,
  );

  const reproduction = closure.independentReproduction ?? {};
  const reproductionJobs = reproduction.jobs ?? {};
  const reproductionRunId = String(reproduction.runId ?? "");
  const expectedReproductionUri = `https://github.com/${reproduction.repository}/actions/runs/${reproductionRunId}`;
  if (
    !exactKeys(reproduction, [
      "repository",
      "sourceSha",
      "sourceRef",
      "runId",
      "runAttempt",
      "runUri",
      "conclusion",
      "actor",
      "lockfileSha256",
      "containerPolicySha256",
      "jobs",
      "approvalRecordId",
    ]) ||
    reproduction.repository !== evidence.repository ||
    reproduction.sourceSha !== candidateSha ||
    reproduction.sourceRef !== `refs/heads/${candidate.branch}` ||
    !/^\d+$/u.test(reproductionRunId) ||
    !Number.isInteger(reproduction.runAttempt) ||
    reproduction.runAttempt < 1 ||
    reproduction.conclusion !== "success" ||
    reproduction.runUri !== expectedReproductionUri ||
    reproduction.runUri === evidence.runUri ||
    candidate.cleanReproductionEvidenceUri !== reproduction.runUri ||
    reproduction.lockfileSha256 !== evidence.lockfileSha256 ||
    reproduction.containerPolicySha256 !== evidence.containerPolicySha256 ||
    reproduction.approvalRecordId !== references.independentReproduction ||
    !exactKeys(reproduction.actor, ["name", "identity", "roleId"]) ||
    !new Set(["INDEPENDENT-SECURITY", "INDEPENDENT-DATA-RELEASE"]).has(
      reproduction.actor?.roleId,
    ) ||
    !personMatchesRoster(reproduction.actor, roster)
  ) {
    errors.push(
      "independentReproduction: a distinct successful reviewer-operated candidate run with exact inputs is required",
    );
  }
  if (
    Object.keys(reproductionJobs).sort().join(",") !==
    [...evidenceJobNames].sort().join(",")
  ) {
    errors.push(
      "independentReproduction.jobs: exact verify and containerSecurity jobs are required",
    );
  }
  for (const name of evidenceJobNames) {
    const job = reproductionJobs[name];
    const summaryField =
      name === "verify" ? "stepSummarySha256" : "scanSummarySha256";
    if (
      !exactKeys(job, [
        "name",
        "sourceSha",
        "conclusion",
        "artifactId",
        "artifactDigest",
        "manifestSha256",
        summaryField,
      ]) ||
      job?.name !== (name === "verify" ? "verify" : "container-security") ||
      job?.sourceSha !== candidateSha ||
      job?.conclusion !== "success" ||
      !/^\d+$/u.test(String(job?.artifactId ?? "")) ||
      !SHA_256.test(job?.artifactDigest ?? "") ||
      !SHA_256.test(job?.manifestSha256 ?? "") ||
      !SHA_256.test(job?.[summaryField] ?? "") ||
      artifactIds.has(String(job?.artifactId ?? ""))
    ) {
      errors.push(
        `independentReproduction.jobs.${name}: distinct successful candidate-bound artifact evidence is required`,
      );
    }
    if (job?.artifactId) artifactIds.add(String(job.artifactId));
  }

  const plan = documents["PRODUCTION_READINESS_MASTER_PLAN.md"] ?? "";
  if (!/\*\*Status:\*\* PHASE 0 COMPLETE/u.test(plan)) {
    errors.push("master plan must explicitly mark Phase 0 complete");
  }
  for (const phase of [1, 2]) {
    if (
      !new RegExp(`^\\|\\s+${phase}\\s+\\|.+\\|\\s+LOCKED\\s+\\|$`, "mu").test(
        plan,
      )
    ) {
      errors.push(`master plan must keep Phase ${phase} locked`);
    }
  }

  const decisions = rows(
    documents["docs/readiness/decision-log.md"] ?? "",
    "D-",
  );
  if (
    decisions.length !== 10 ||
    decisions.some((cells) => cells[3] !== "APPROVED")
  ) {
    errors.push("all D-01 through D-10 decisions must have APPROVED status");
  }
  const decisionRecord = parseJson(
    documents,
    "docs/readiness/decisions.json",
    errors,
  );
  if (decisionRecord) {
    validateDecisionRecord(decisionRecord, references.decisions, errors);
  }
  const endpointText = documents["docs/readiness/endpoint-matrix.md"] ?? "";
  const endpointRows = endpointText
    .split(/\r?\n/u)
    .filter((line) => /^\| [^|-].+ \|/u.test(line))
    .map(markdownCells)
    .filter((cells) => cells.length === 4 && cells[0] !== "Boundary");
  if (
    endpointRows.length !== 12 ||
    endpointRows.some(
      (cells) =>
        !cells[1] || cells[1] === "Unassigned" || cells[2] !== "APPROVED",
    )
  ) {
    errors.push(
      "all twelve production endpoint boundaries must have exact APPROVED values",
    );
  }
  const endpointMatrix = parseJson(
    documents,
    "docs/readiness/endpoint-matrix.json",
    errors,
  );
  if (endpointMatrix) {
    validateEndpointMatrix(endpointMatrix, references.endpointMatrix, errors);
  }

  const blockers = rows(documents["docs/readiness/blockers.md"] ?? "", "B-");
  const phaseZeroBlockers = blockers.filter((cells) => cells[3] === "0");
  if (blockers.some((cells) => !hasCanonicalOwner(cells[5], roster))) {
    errors.push(
      "every blocker must resolve to exactly one canonical owner role in the approved roster",
    );
  }
  if (
    phaseZeroBlockers.length === 0 ||
    phaseZeroBlockers.some((cells) => cells[6] !== "CLOSED")
  ) {
    errors.push(
      "all primary-Phase-0 blockers must be CLOSED with named owners",
    );
  }
  const defects = rows(
    documents["docs/readiness/defect-ledger.md"] ?? "",
    "L-",
  );
  const phaseZeroDefects = defects.filter((cells) => cells[3] === "0");
  if (defects.some((cells) => !hasCanonicalOwner(cells[4], roster))) {
    errors.push(
      "every defect must resolve to exactly one canonical owner role in the approved roster",
    );
  }
  if (phaseZeroDefects.some((cells) => cells[5] !== "CLOSED")) {
    errors.push("all primary-Phase-0 defect-ledger rows must be CLOSED");
  }
  const risks = rows(documents["docs/readiness/risk-register.md"] ?? "", "R-");
  const phaseZeroRisks = risks.filter((cells) => cells[2] === "0");
  if (risks.some((cells) => !hasCanonicalOwner(cells[3], roster))) {
    errors.push(
      "every risk must resolve to exactly one canonical owner role in the approved roster",
    );
  }
  if (
    phaseZeroRisks.some(
      (cells) =>
        !["CLOSED", "ACCEPTED"].includes(cells[8]) ||
        cells[6] !== "APPROVED" ||
        !cells[3],
    )
  ) {
    errors.push(
      "all primary-Phase-0 risks must be named, security-reviewed, and CLOSED/ACCEPTED",
    );
  }
  for (const risk of phaseZeroRisks) {
    requiredReference(
      risk[7],
      `risk-register.${risk[0]}.approvalRecordId`,
      approvalRecords,
      candidateSha,
      riskBinding(risk[0]),
      approvalReferenceUse,
      errors,
    );
  }

  const versions = documents["docs/readiness/supported-versions.md"] ?? "";
  if (
    /\bBLOCKED\b/u.test(versions) ||
    !versions.includes(references.supportedVersions ?? "")
  ) {
    errors.push(
      "supported versions must be exact and reference their approval record",
    );
  }
  const supportedVersions = parseJson(
    documents,
    "docs/readiness/supported-versions.json",
    errors,
  );
  if (supportedVersions) {
    validateSupportedVersions(
      supportedVersions,
      references.supportedVersions,
      evidence,
      baseline,
      errors,
    );
  }
  const traceability = documents["docs/readiness/traceability.md"] ?? "";
  const canonicalFindings = rows(traceability, "A-");
  const phaseZeroFindings = rows(traceability, "P0-");
  if (
    canonicalFindings.length !== 44 ||
    phaseZeroFindings.length !== 15 ||
    [...canonicalFindings, ...phaseZeroFindings].some(
      (cells) => !hasCanonicalOwner(cells[4], roster),
    )
  ) {
    errors.push(
      "every A-001 through A-044 and P0-01 through P0-15 finding must resolve to exactly one canonical owner role in the approved roster",
    );
  }
  const requirements =
    documents["docs/readiness/phase-zero-requirements.md"] ?? "";
  const requirementRows = rows(requirements, "P0R-");
  const exitRows = rows(requirements, "P0E-");
  if (
    requirementRows.length !== 15 ||
    exitRows.length !== 7 ||
    [...requirementRows, ...exitRows].some((cells) => cells[2] !== "COMPLETE")
  ) {
    errors.push(
      "all Phase 0 requirement and exit matrix rows must be COMPLETE",
    );
  }
  const worktree = documents["docs/readiness/worktree-reconciliation.md"] ?? "";
  const draftDisposition = parseJson(
    documents,
    "docs/readiness/original-draft-disposition.json",
    errors,
  );
  if (
    !exactKeys(draftDisposition, [
      "schemaVersion",
      "status",
      "entryReportedCount",
      "exactFilenameSetRecoverable",
      "exactPreEditBytesRecoverable",
      "conservativeScope",
      "disposition",
      "approvalRecordId",
    ]) ||
    draftDisposition.schemaVersion !== 1 ||
    draftDisposition.status !== "APPROVED" ||
    draftDisposition.entryReportedCount !== 9 ||
    draftDisposition.approvalRecordId !== references.originalDraftDisposition ||
    !Array.isArray(draftDisposition.conservativeScope) ||
    [...draftDisposition.conservativeScope].sort().join("\n") !==
      [...CONSERVATIVE_DRAFT_SCOPE].sort().join("\n") ||
    !["SUPERSEDED", "RECONCILED"].includes(draftDisposition.disposition) ||
    (draftDisposition.disposition === "SUPERSEDED" &&
      (draftDisposition.exactFilenameSetRecoverable !== false ||
        draftDisposition.exactPreEditBytesRecoverable !== false)) ||
    (draftDisposition.disposition === "RECONCILED" &&
      (draftDisposition.exactFilenameSetRecoverable !== true ||
        draftDisposition.exactPreEditBytesRecoverable !== true))
  ) {
    errors.push(
      "original-draft-disposition.json: exact approved supersession or byte reconciliation is required",
    );
  }
  if (
    !/Original draft disposition:\s*APPROVED/u.test(worktree) ||
    !worktree.includes(references.originalDraftDisposition ?? "")
  ) {
    errors.push(
      "original draft disposition and approval reference are required",
    );
  }
  const evidenceIndex = documents["docs/readiness/evidence-index.md"] ?? "";
  const indexedEvidenceValues = [
    evidence.runUri,
    ...evidenceJobNames.flatMap((name) => {
      const job = evidenceJobs[name] ?? {};
      const summaryField =
        name === "verify" ? "stepSummarySha256" : "scanSummarySha256";
      return [
        String(job.artifactId ?? ""),
        job.artifactDigest,
        job.manifestSha256,
        job[summaryField],
      ];
    }),
    reproduction.runUri,
    ...evidenceJobNames.flatMap((name) => {
      const job = reproductionJobs[name] ?? {};
      const summaryField =
        name === "verify" ? "stepSummarySha256" : "scanSummarySha256";
      return [
        String(job.artifactId ?? ""),
        job.artifactDigest,
        job.manifestSha256,
        job[summaryField],
      ];
    }),
  ];
  for (const value of indexedEvidenceValues) {
    if (!value || !evidenceIndex.includes(value)) {
      errors.push(
        "evidence index must contain the authoritative run and both job artifact/manifest/summary identities",
      );
      break;
    }
  }
  const ciGovernance = documents["docs/readiness/ci-governance.md"] ?? "";
  for (const control of Object.values(closure.remoteControls ?? {})) {
    if (!control?.evidenceUri || !ciGovernance.includes(control.evidenceUri)) {
      errors.push("CI governance must index every remote-control evidence URI");
      break;
    }
  }

  return errors;
}

export const phaseZeroClosureFiles = Object.freeze([
  "package.json",
  "packages/database/package.json",
  "pnpm-lock.yaml",
  "security/container-scan-policy.json",
  "infra/docker/postgres.Dockerfile",
  "PRODUCTION_READINESS_MASTER_PLAN.md",
  "docs/readiness/approvals.json",
  "docs/readiness/blockers.md",
  "docs/readiness/ci-governance.md",
  "docs/readiness/decision-log.md",
  "docs/readiness/decisions.json",
  "docs/readiness/defect-ledger.md",
  "docs/readiness/endpoint-matrix.md",
  "docs/readiness/endpoint-matrix.json",
  "docs/readiness/evidence-index.md",
  "docs/readiness/governance.md",
  "docs/readiness/phase-zero-closure.json",
  "docs/readiness/phase-zero-requirements.md",
  "docs/readiness/original-draft-disposition.json",
  "docs/readiness/risk-register.md",
  "docs/readiness/supported-versions.md",
  "docs/readiness/supported-versions.json",
  "docs/readiness/traceability.md",
  "docs/readiness/worktree-reconciliation.md",
]);
