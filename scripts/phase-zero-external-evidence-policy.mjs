import { createHash } from "node:crypto";
import {
  GITHUB_REMOTE_CONTROL_PROJECTION_SCHEMA,
  canonicalSha256,
  projectGitHubRemoteControlEvidence,
  validateGitHubRemoteControlProjection,
} from "./github-remote-control-evidence.mjs";

const SHA_1 = /^[0-9a-f]{40}$/u;
const SHA_256 = /^(?:sha256:)?[0-9a-f]{64}$/u;
const RUN_ID = /^\d+$/u;
const INDEPENDENT_ROLES = new Set([
  "INDEPENDENT-SECURITY",
  "INDEPENDENT-DATA-RELEASE",
]);
const EXPECTED_WORKFLOW_PATH = ".github/workflows/ci.yml";
const EXPECTED_JOBS = Object.freeze({
  verify: {
    apiName: "verify",
    artifactPrefix: "phase-zero-verify",
    summaryField: "stepSummarySha256",
  },
  containerSecurity: {
    apiName: "container-security",
    artifactPrefix: "phase-zero-container",
    summaryField: "scanSummarySha256",
  },
});

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizedDigest(value) {
  return String(value ?? "")
    .replace(/^sha256:/u, "")
    .toLowerCase();
}

function login(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function identityLogin(value) {
  const identity = login(value);
  if (identity.startsWith("github:")) return identity.slice(7);
  const match = identity.match(/^https:\/\/github\.com\/([a-z0-9-]+)\/?$/u);
  return match?.[1] ?? identity;
}

function json(value, label, errors) {
  try {
    return JSON.parse(value);
  } catch {
    errors.push(`${label}: valid JSON is required`);
    return undefined;
  }
}

function githubApiEvidenceUri(value, repository) {
  try {
    const parsed = new URL(value);
    const repositoryPath = `/repos/${repository}`;
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "api.github.com" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.hash &&
      (parsed.pathname === repositoryPath ||
        parsed.pathname.startsWith(`${repositoryPath}/`))
    );
  } catch {
    return false;
  }
}

function apiPath(value) {
  const parsed = new URL(value);
  return `${parsed.pathname}${parsed.search}`;
}

function approvalAttestations(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    if (Array.isArray(value.comments)) return value.comments;
    if (Array.isArray(value.reviews)) return value.reviews;
    return [value];
  }
  return [];
}

function authenticatesApproval(resource, record) {
  const path = apiPath(record.evidenceUri);
  if (
    !/^\/repos\/[^/]+\/[^/]+\/(?:issues\/comments\/\d+|issues\/\d+\/comments|pulls\/\d+\/reviews(?:\/\d+)?)$/u.test(
      path,
    )
  ) {
    return false;
  }
  const terms = [
    record.id,
    record.subject,
    record.scope,
    record.reviewedSourceSha,
    record.decision,
  ];
  const people = [
    record.approver,
    record.independentReviewer,
    ...(record.roleApprovals ?? []),
  ];
  return people.every((person) => {
    const expectedLogin = identityLogin(person?.identity);
    return approvalAttestations(resource.json).some((attestation) => {
      const body = String(attestation?.body ?? "");
      return (
        login(attestation?.user?.login) === expectedLogin &&
        terms.every((term) => body.includes(term))
      );
    });
  });
}

function validatesControlPath(name, control, repository, candidate) {
  const path = apiPath(control.evidenceUri);
  if (name === "branchProtection") {
    return (
      path ===
      `/repos/${repository.full_name}/branches/${encodeURIComponent(candidate.branch)}/protection`
    );
  }
  if (name === "protectedEnvironment") {
    return path === `/repos/${repository.full_name}/environments/production`;
  }
  if (name === "restrictedActions") {
    return path === `/repos/${repository.full_name}/actions/permissions`;
  }
  if (name === "independentReviewerAccess") {
    return (
      path ===
      `/repos/${repository.full_name}/collaborators?affiliation=all&per_page=100`
    );
  }
  if (name === "releaseLabels") {
    return path === `/repos/${repository.full_name}/labels?per_page=100`;
  }
  if (name === "repositoryVisibility") {
    return path === `/repos/${repository.full_name}`;
  }
  return false;
}

function validateRun({ label, claim, run, repository, candidate, errors }) {
  const expectedUri = `https://github.com/${repository.full_name}/actions/runs/${claim.runId}`;
  if (
    !run ||
    String(run.id) !== String(claim.runId) ||
    run.run_attempt !== claim.runAttempt ||
    run.html_url !== expectedUri ||
    run.path !== EXPECTED_WORKFLOW_PATH ||
    run.head_sha !== candidate.sourceSha ||
    run.head_branch !== candidate.branch ||
    run.head_repository?.id !== repository.id ||
    run.repository?.id !== repository.id ||
    run.status !== "completed" ||
    run.conclusion !== "success" ||
    claim.runUri !== expectedUri ||
    claim.conclusion !== "success"
  ) {
    errors.push(`${label}: live GitHub workflow-run identity is invalid`);
  }
}

function validateJobs({ label, claim, jobs, candidate, errors }) {
  if (!jobs || jobs.total_count !== jobs.jobs?.length) {
    errors.push(`${label}: the complete GitHub job set is required`);
    return;
  }
  for (const [claimName, expected] of Object.entries(EXPECTED_JOBS)) {
    const matches = jobs.jobs.filter((job) => job.name === expected.apiName);
    const live = matches[0];
    if (
      matches.length !== 1 ||
      live?.head_sha !== candidate.sourceSha ||
      live?.status !== "completed" ||
      live?.conclusion !== "success" ||
      !live?.started_at ||
      !live?.completed_at ||
      claim.jobs?.[claimName]?.name !== expected.apiName ||
      claim.jobs?.[claimName]?.sourceSha !== candidate.sourceSha ||
      claim.jobs?.[claimName]?.conclusion !== "success"
    ) {
      errors.push(`${label}.${claimName}: live GitHub job is invalid`);
    }
  }
}

function validateManifest({
  label,
  claim,
  files,
  candidate,
  repository,
  run,
  inputDigests,
  expectedPublicApiBaseUrl,
  errors,
}) {
  const manifestBytes = files?.manifest;
  const stepsBytes = files?.steps;
  if (!Buffer.isBuffer(manifestBytes) || !Buffer.isBuffer(stepsBytes)) {
    errors.push(
      `${label}: downloaded manifest.json and steps.json are required`,
    );
    return;
  }
  if (digest(manifestBytes) !== normalizedDigest(claim.manifestSha256)) {
    errors.push(`${label}: downloaded manifest digest does not match closure`);
  }
  if (
    claim.jobName === "verify" &&
    digest(stepsBytes) !== normalizedDigest(claim.summarySha256)
  ) {
    errors.push(
      `${label}: downloaded step-summary digest does not match closure`,
    );
  }
  const manifest = json(manifestBytes, `${label}.manifest.json`, errors);
  const steps = json(stepsBytes, `${label}.steps.json`, errors);
  if (!manifest || !steps) return;
  if (
    manifest.schemaVersion !== 1 ||
    manifest.source?.repository !== claim.repository ||
    String(manifest.source?.repositoryId) !== String(repository.id) ||
    manifest.source?.sha !== candidate.sourceSha ||
    manifest.source?.ref !== `refs/heads/${candidate.branch}` ||
    manifest.source?.workflow !== "CI" ||
    manifest.source?.workflowRef !==
      `${repository.full_name}/${EXPECTED_WORKFLOW_PATH}@refs/heads/${candidate.branch}` ||
    manifest.source?.workflowSha !== candidate.sourceSha ||
    String(manifest.run?.id) !== String(claim.runId) ||
    String(manifest.run?.attempt) !== String(claim.runAttempt) ||
    manifest.run?.job !== claim.jobName ||
    manifest.run?.status !== "success" ||
    manifest.run?.url !== claim.runUri ||
    manifest.run?.trigger?.event !== run.event ||
    login(manifest.run?.trigger?.actor?.login) !== login(run.actor?.login) ||
    String(manifest.run?.trigger?.actor?.id) !== String(run.actor?.id) ||
    login(manifest.run?.trigger?.triggeringActor?.login) !==
      login(run.triggering_actor?.login) ||
    normalizedDigest(manifest.inputs?.lockfile?.sha256) !==
      normalizedDigest(claim.lockfileSha256) ||
    normalizedDigest(manifest.inputs?.containerScanPolicy?.sha256) !==
      normalizedDigest(claim.containerPolicySha256) ||
    Object.entries(inputDigests).some(
      ([name, expected]) =>
        normalizedDigest(manifest.inputs?.[name]?.sha256) !== expected,
    ) ||
    normalizedDigest(manifest.inputs?.phaseZeroStepSummary?.sha256) !==
      digest(stepsBytes) ||
    manifest.executionEnvironment?.publicApiBaseUrl !==
      expectedPublicApiBaseUrl ||
    steps.schemaVersion !== 1 ||
    steps.sourceSha !== candidate.sourceSha ||
    steps.result !== "passed"
  ) {
    errors.push(
      `${label}: downloaded evidence is not bound to the claimed run and source`,
    );
  }

  if (claim.jobName === "container-security") {
    const scanBytes = files?.scanSummary;
    if (!Buffer.isBuffer(scanBytes)) {
      errors.push(`${label}: downloaded container scan summary is required`);
    } else if (
      digest(scanBytes) !== normalizedDigest(claim.scanSummarySha256) ||
      steps.scanSummarySha256 !== normalizedDigest(claim.scanSummarySha256)
    ) {
      errors.push(
        `${label}: downloaded container scan summary digest is invalid`,
      );
    }
  }
}

function validateArtifact({
  label,
  claim,
  live,
  files,
  repository,
  candidate,
  runClaim,
  run,
  inputDigests,
  expectedPublicApiBaseUrl,
  now,
  errors,
}) {
  const expected = EXPECTED_JOBS[label.split(".").at(-1)];
  const expectedName = `${expected.artifactPrefix}-${runClaim.runId}-${runClaim.runAttempt}`;
  const expiresAt = Date.parse(live?.expires_at ?? "");
  if (
    !live ||
    String(live.id) !== String(claim.artifactId) ||
    live.name !== expectedName ||
    live.expired !== false ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= now.getTime() ||
    !(live.size_in_bytes > 0) ||
    live.workflow_run?.id !== Number(runClaim.runId) ||
    live.workflow_run?.repository_id !== repository.id ||
    live.workflow_run?.head_repository_id !== repository.id ||
    live.workflow_run?.head_sha !== candidate.sourceSha ||
    live.workflow_run?.head_branch !== candidate.branch ||
    normalizedDigest(live.digest) !== normalizedDigest(claim.artifactDigest) ||
    !SHA_256.test(live.digest ?? "")
  ) {
    errors.push(
      `${label}: live GitHub artifact identity/digest/retention is invalid`,
    );
  }
  validateManifest({
    label,
    claim: {
      ...claim,
      repository: repository.full_name,
      runId: runClaim.runId,
      runAttempt: runClaim.runAttempt,
      runUri: runClaim.runUri,
      lockfileSha256: runClaim.lockfileSha256,
      containerPolicySha256: runClaim.containerPolicySha256,
      jobName: expected.apiName,
      summarySha256: claim[expected.summaryField],
      scanSummarySha256: claim.scanSummarySha256,
    },
    files,
    candidate,
    repository,
    run,
    inputDigests,
    expectedPublicApiBaseUrl,
    errors,
  });
}

function validateApprovalResources({
  closure,
  approvals,
  resources,
  repository,
  independentReviewers,
  implementationOperator,
  errors,
}) {
  for (const record of approvals.records ?? []) {
    const resource = resources.get(record.evidenceUri);
    if (
      !githubApiEvidenceUri(record.evidenceUri, repository.full_name) ||
      !resource ||
      digest(resource.bytes) !== normalizedDigest(record.evidenceSha256)
    ) {
      errors.push(
        `${record.id}: authenticated approval evidence is missing or has the wrong digest`,
      );
      continue;
    }
    if (
      !authenticatesApproval(resource, record) ||
      !INDEPENDENT_ROLES.has(record.independentReviewer?.roleId)
    ) {
      errors.push(
        `${record.id}: GitHub evidence does not authenticate the approval payload and signers`,
      );
    }
  }

  for (const [name, control] of Object.entries(closure.remoteControls ?? {})) {
    const resource = resources.get(control.evidenceUri);
    if (
      !githubApiEvidenceUri(control.evidenceUri, repository.full_name) ||
      !resource ||
      !validatesControlPath(name, control, repository, closure.candidate)
    ) {
      errors.push(
        `remoteControls.${name}: authenticated GitHub control readback is missing or uses the wrong API resource`,
      );
      continue;
    }
    if (
      control.projectionSchema !== GITHUB_REMOTE_CONTROL_PROJECTION_SCHEMA ||
      control.candidateSha !== closure.candidate.sourceSha
    ) {
      errors.push(
        `remoteControls.${name}: the canonical projection schema and candidate SHA are required`,
      );
      continue;
    }
    let projection;
    try {
      projection = projectGitHubRemoteControlEvidence({
        name,
        primary: resource.json,
        projectionInputs: resource.projectionInputs,
        repository,
        candidate: closure.candidate,
        independentReviewers,
        implementationOperator,
      });
    } catch {
      errors.push(
        `remoteControls.${name}: the live GitHub response cannot be projected canonically`,
      );
      continue;
    }
    if (
      canonicalSha256(projection) !== normalizedDigest(control.evidenceSha256)
    ) {
      errors.push(
        `remoteControls.${name}: the canonical live GitHub control digest does not match`,
      );
    }
    for (const projectionError of validateGitHubRemoteControlProjection(
      name,
      projection,
    )) {
      errors.push(`remoteControls.${name}: ${projectionError}`);
    }
  }
}

function scanIdentityMap(files, label, errors) {
  const summary = json(files?.scanSummary, `${label}.scanSummary`, errors);
  const results = Array.isArray(summary?.results) ? summary.results : [];
  const identities = results.map((result) => [
    result?.image,
    result?.resolvedIdentity,
    [...(result?.repoDigests ?? [])].sort(),
  ]);
  if (
    identities.length === 0 ||
    identities.some(
      ([image, identity, repoDigests]) =>
        !image ||
        !/^sha256:[0-9a-f]{64}$/u.test(identity ?? "") ||
        !Array.isArray(repoDigests),
    ) ||
    new Set(identities.map(([image]) => image)).size !== identities.length
  ) {
    errors.push(`${label}: exact unique image identities are required`);
  }
  return identities.sort((left, right) => left[0].localeCompare(right[0]));
}

export function validatePhaseZeroExternalEvidence({
  closure,
  approvals,
  repository,
  runs,
  jobs,
  artifacts,
  artifactFiles,
  resources = new Map(),
  inputDigests = {},
  independentReviewerRoster = [],
  implementationOperatorIdentity,
  expectedPublicApiBaseUrl,
  now = new Date(),
}) {
  const errors = [];
  const candidate = closure?.candidate ?? {};
  const authoritative = closure?.authoritativeEvidence ?? {};
  const reproduction = closure?.independentReproduction ?? {};
  const independentReviewers = new Map(
    independentReviewerRoster.map((reviewer) => [
      reviewer?.roleId,
      identityLogin(reviewer?.identity),
    ]),
  );
  const implementationOperator = identityLogin(implementationOperatorIdentity);
  if (
    closure?.schemaVersion !== 2 ||
    closure?.status !== "COMPLETE" ||
    approvals?.schemaVersion !== 1 ||
    !Array.isArray(approvals?.records) ||
    !SHA_1.test(candidate.sourceSha ?? "") ||
    !candidate.branch ||
    !repository ||
    repository.full_name !== authoritative.repository ||
    repository.full_name !== reproduction.repository ||
    !Number.isInteger(repository.id) ||
    !SHA_256.test(inputDigests.workflow ?? "") ||
    !SHA_256.test(inputDigests.endpointMatrix ?? "") ||
    !SHA_256.test(inputDigests.decisions ?? "") ||
    !SHA_256.test(inputDigests.supportedVersions ?? "") ||
    typeof expectedPublicApiBaseUrl !== "string"
  ) {
    return [
      "external evidence requires a COMPLETE candidate and the canonical GitHub repository",
    ];
  }
  if (
    independentReviewers.size !== INDEPENDENT_ROLES.size ||
    [...INDEPENDENT_ROLES].some(
      (roleId) => !independentReviewers.get(roleId),
    ) ||
    new Set(independentReviewers.values()).size !== INDEPENDENT_ROLES.size
  ) {
    errors.push(
      "external evidence requires two distinct GitHub identities for the independent security and data/release roster roles",
    );
  }
  if (
    !implementationOperator ||
    [...independentReviewers.values()].includes(implementationOperator)
  ) {
    errors.push(
      "external evidence requires an implementation operator identity distinct from both independent reviewers",
    );
  }

  for (const [label, claim] of [
    ["authoritativeEvidence", authoritative],
    ["independentReproduction", reproduction],
  ]) {
    if (!RUN_ID.test(String(claim.runId ?? ""))) {
      errors.push(`${label}: a numeric GitHub run ID is required`);
      continue;
    }
    const run = runs.get(String(claim.runId));
    validateRun({
      label,
      claim,
      run,
      repository,
      candidate,
      errors,
    });
    validateJobs({
      label,
      claim,
      jobs: jobs.get(String(claim.runId)),
      candidate,
      errors,
    });
    for (const name of Object.keys(EXPECTED_JOBS)) {
      const jobClaim = claim.jobs?.[name] ?? {};
      validateArtifact({
        label: `${label}.${name}`,
        claim: jobClaim,
        live: artifacts.get(String(jobClaim.artifactId)),
        files: artifactFiles.get(String(jobClaim.artifactId)),
        repository,
        candidate,
        runClaim: claim,
        run,
        inputDigests,
        expectedPublicApiBaseUrl,
        now,
        errors,
      });
    }
  }

  const authoritativeRun = runs.get(String(authoritative.runId));
  const reproductionRun = runs.get(String(reproduction.runId));
  const reproductionLogin = identityLogin(reproduction.actor?.identity);
  if (
    String(authoritative.runId) === String(reproduction.runId) ||
    reproduction.runUri === authoritative.runUri ||
    reproductionRun?.event !== "workflow_dispatch" ||
    authoritativeRun?.event !== "push" ||
    login(reproductionRun?.triggering_actor?.login) !== reproductionLogin ||
    login(reproductionRun?.actor?.login) !== reproductionLogin ||
    !INDEPENDENT_ROLES.has(reproduction.actor?.roleId) ||
    independentReviewers.get(reproduction.actor?.roleId) !==
      reproductionLogin ||
    login(authoritativeRun?.triggering_actor?.login) === reproductionLogin
  ) {
    errors.push(
      "independent reproduction must be a distinct workflow_dispatch initiated by its claimed independent GitHub identity",
    );
  }

  validateApprovalResources({
    closure,
    approvals,
    resources,
    repository,
    independentReviewers,
    implementationOperator,
    errors,
  });
  const authoritativeScan = scanIdentityMap(
    artifactFiles.get(
      String(authoritative.jobs?.containerSecurity?.artifactId ?? ""),
    ),
    "authoritativeEvidence.containerSecurity",
    errors,
  );
  const reproductionScan = scanIdentityMap(
    artifactFiles.get(
      String(reproduction.jobs?.containerSecurity?.artifactId ?? ""),
    ),
    "independentReproduction.containerSecurity",
    errors,
  );
  if (JSON.stringify(authoritativeScan) !== JSON.stringify(reproductionScan)) {
    errors.push(
      "independent reproduction must resolve the exact same complete image identity map",
    );
  }
  return errors;
}

export const phaseZeroExternalEvidenceConstants = Object.freeze({
  expectedWorkflowPath: EXPECTED_WORKFLOW_PATH,
  expectedJobs: EXPECTED_JOBS,
});
