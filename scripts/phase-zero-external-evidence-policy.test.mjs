import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { validatePhaseZeroExternalEvidence } from "./phase-zero-external-evidence-policy.mjs";

const sourceSha = "a".repeat(40);
const repository = { id: 9876, full_name: "owner/repository" };
const inputDigests = {
  workflow: "1".repeat(64),
  endpointMatrix: "2".repeat(64),
  decisions: "3".repeat(64),
  supportedVersions: "4".repeat(64),
};
const publicApiBaseUrl = "https://api.mecoflow.example.net/api/v1";
const hash = (value) => createHash("sha256").update(value).digest("hex");

function fixture() {
  const closure = {
    schemaVersion: 1,
    status: "COMPLETE",
    candidate: { branch: "main", sourceSha },
    remoteControls: {},
    authoritativeEvidence: evidenceClaim("100", "owner", "push", 1000),
    independentReproduction: {
      ...evidenceClaim("200", "independent", "workflow_dispatch", 2000),
      actor: {
        name: "Independent Reviewer",
        identity: "github:independent",
        roleId: "INDEPENDENT-DATA-RELEASE",
      },
    },
  };
  const approvals = { schemaVersion: 1, records: [] };
  const runs = new Map();
  const jobs = new Map();
  const artifacts = new Map();
  const artifactFiles = new Map();
  for (const [claim, actor, event] of [
    [closure.authoritativeEvidence, "owner", "push"],
    [closure.independentReproduction, "independent", "workflow_dispatch"],
  ]) {
    const runId = Number(claim.runId);
    runs.set(claim.runId, liveRun(claim, actor, event));
    jobs.set(claim.runId, {
      total_count: 3,
      jobs: [
        liveJob("dependency-review", "skipped"),
        liveJob("verify", "success"),
        liveJob("container-security", "success"),
      ],
    });
    for (const [claimName, jobClaim] of Object.entries(claim.jobs)) {
      const jobName = claimName === "verify" ? "verify" : "container-security";
      const files = evidenceFiles({ claim, jobName, actor, event });
      if (jobName === "verify") {
        jobClaim.stepSummarySha256 = hash(files.steps);
      } else {
        jobClaim.scanSummarySha256 = hash(files.scanSummary);
        const steps = JSON.parse(files.steps);
        steps.scanSummarySha256 = jobClaim.scanSummarySha256;
        files.steps = Buffer.from(`${JSON.stringify(steps)}\n`);
      }
      const manifest = JSON.parse(files.manifest);
      manifest.inputs.phaseZeroStepSummary.sha256 = hash(files.steps);
      files.manifest = Buffer.from(`${JSON.stringify(manifest)}\n`);
      jobClaim.manifestSha256 = hash(files.manifest);
      if (jobName === "verify") jobClaim.stepSummarySha256 = hash(files.steps);
      artifacts.set(String(jobClaim.artifactId), {
        id: Number(jobClaim.artifactId),
        name: `${jobName === "verify" ? "phase-zero-verify" : "phase-zero-container"}-${claim.runId}-${claim.runAttempt}`,
        expired: false,
        expires_at: "2026-09-01T00:00:00Z",
        size_in_bytes: 100,
        digest: jobClaim.artifactDigest,
        workflow_run: {
          id: runId,
          repository_id: repository.id,
          head_repository_id: repository.id,
          head_sha: sourceSha,
          head_branch: "main",
        },
      });
      artifactFiles.set(String(jobClaim.artifactId), files);
    }
  }
  return {
    closure,
    approvals,
    repository,
    runs,
    jobs,
    artifacts,
    artifactFiles,
    resources: new Map(),
    inputDigests,
    expectedPublicApiBaseUrl: publicApiBaseUrl,
    now: new Date("2026-08-13T00:00:00Z"),
  };
}

function evidenceClaim(runId, actor, event, artifactBase) {
  const runUri = `https://github.com/${repository.full_name}/actions/runs/${runId}`;
  return {
    repository: repository.full_name,
    sourceSha,
    sourceRef: "refs/heads/main",
    runId,
    runAttempt: 1,
    runUri,
    conclusion: "success",
    lockfileSha256: "5".repeat(64),
    containerPolicySha256: "6".repeat(64),
    jobs: {
      verify: jobClaim("verify", artifactBase + 1, "7".repeat(64)),
      containerSecurity: jobClaim(
        "container-security",
        artifactBase + 2,
        "8".repeat(64),
      ),
    },
    actor,
    event,
  };
}

function jobClaim(name, artifactId, artifactDigest) {
  return {
    name,
    sourceSha,
    conclusion: "success",
    artifactId: String(artifactId),
    artifactDigest: `sha256:${artifactDigest}`,
    manifestSha256: "0".repeat(64),
    ...(name === "verify"
      ? { stepSummarySha256: "0".repeat(64) }
      : { scanSummarySha256: "0".repeat(64) }),
  };
}

function liveRun(claim, actor, event) {
  return {
    id: Number(claim.runId),
    run_attempt: 1,
    html_url: claim.runUri,
    path: ".github/workflows/ci.yml",
    head_sha: sourceSha,
    head_branch: "main",
    head_repository: { id: repository.id },
    repository: { id: repository.id },
    status: "completed",
    conclusion: "success",
    event,
    actor: { login: actor, id: actor === "owner" ? 10 : 20 },
    triggering_actor: { login: actor },
  };
}

function liveJob(name, conclusion) {
  return {
    name,
    head_sha: sourceSha,
    status: "completed",
    conclusion,
    started_at: "2026-08-12T00:00:00Z",
    completed_at: "2026-08-12T00:01:00Z",
  };
}

function evidenceFiles({ claim, jobName, actor, event }) {
  const steps = Buffer.from(
    `${JSON.stringify({
      schemaVersion: 1,
      sourceSha,
      result: "passed",
      ...(jobName === "container-security"
        ? { scanSummarySha256: "pending" }
        : undefined),
    })}\n`,
  );
  const manifest = Buffer.from(
    `${JSON.stringify({
      schemaVersion: 1,
      source: {
        repository: repository.full_name,
        repositoryId: String(repository.id),
        sha: sourceSha,
        ref: "refs/heads/main",
        workflow: "CI",
        workflowRef: `${repository.full_name}/.github/workflows/ci.yml@refs/heads/main`,
        workflowSha: sourceSha,
      },
      run: {
        id: claim.runId,
        attempt: "1",
        job: jobName,
        status: "success",
        url: claim.runUri,
        trigger: {
          event,
          actor: { login: actor, id: actor === "owner" ? "10" : "20" },
          triggeringActor: { login: actor },
        },
      },
      executionEnvironment: { publicApiBaseUrl },
      inputs: {
        lockfile: { sha256: claim.lockfileSha256 },
        containerScanPolicy: { sha256: claim.containerPolicySha256 },
        workflow: { sha256: inputDigests.workflow },
        endpointMatrix: { sha256: inputDigests.endpointMatrix },
        decisions: { sha256: inputDigests.decisions },
        supportedVersions: { sha256: inputDigests.supportedVersions },
        phaseZeroStepSummary: { sha256: hash(steps) },
      },
    })}\n`,
  );
  return {
    manifest,
    steps,
    ...(jobName === "container-security"
      ? {
          scanSummary: Buffer.from(
            `${JSON.stringify({
              result: "recorded",
              results: [
                {
                  image: "mecoflow/api:candidate",
                  resolvedIdentity: `sha256:${"a".repeat(64)}`,
                  repoDigests: [],
                },
                {
                  image: "redis:immutable",
                  resolvedIdentity: `sha256:${"b".repeat(64)}`,
                  repoDigests: [`redis@sha256:${"c".repeat(64)}`],
                },
              ],
            })}\n`,
          ),
        }
      : undefined),
  };
}

test("accepts live source-bound runs, jobs, artifact digests, and downloaded evidence", () => {
  const evidence = fixture();
  assert.deepEqual(validatePhaseZeroExternalEvidence(evidence), []);
});

test("rejects fabricated metadata, altered downloads, endpoint drift, and non-independent reruns", () => {
  const evidence = fixture();
  evidence.artifacts.get("1001").digest = `sha256:${"f".repeat(64)}`;
  evidence.artifactFiles.get("1002").manifest = Buffer.from("{}\n");
  evidence.expectedPublicApiBaseUrl = "https://drift.example.net/api/v1";
  evidence.runs.get("200").event = "push";
  evidence.runs.get("200").actor = { login: "owner", id: 10 };
  const errors = validatePhaseZeroExternalEvidence(evidence);
  assert.ok(errors.some((error) => error.includes("artifact identity/digest")));
  assert.ok(errors.some((error) => error.includes("manifest digest")));
  assert.ok(errors.some((error) => error.includes("claimed run and source")));
  assert.ok(errors.some((error) => error.includes("workflow_dispatch")));
});

test("rejects image identity drift between independent candidate runs", () => {
  const evidence = fixture();
  const files = evidence.artifactFiles.get("2002");
  const summary = JSON.parse(files.scanSummary);
  summary.results[0].resolvedIdentity = `sha256:${"f".repeat(64)}`;
  files.scanSummary = Buffer.from(`${JSON.stringify(summary)}\n`);
  const errors = validatePhaseZeroExternalEvidence(evidence);
  assert.ok(
    errors.some((error) => error.includes("same complete image identity")),
  );
});

test("rejects approval records whose GitHub resource does not authenticate the signer", () => {
  const evidence = fixture();
  evidence.approvals.records.push({
    id: "APR-CANDIDATE",
    subject: "phase-zero:candidate",
    scope: "Phase 0 candidate baseline",
    reviewedSourceSha: sourceSha,
    decision: "APPROVED",
    approver: { identity: "github:owner", roleId: "REPO-ADMIN" },
    independentReviewer: {
      identity: "github:independent",
      roleId: "INDEPENDENT-SECURITY",
    },
    roleApprovals: [{ identity: "github:owner", roleId: "REPO-ADMIN" }],
    evidenceUri:
      "https://api.github.com/repos/owner/repository/issues/comments/123",
    evidenceSha256: hash(Buffer.from('{"body":"unrelated"}')),
  });
  evidence.resources.set(evidence.approvals.records[0].evidenceUri, {
    bytes: Buffer.from('{"body":"unrelated"}'),
    json: { body: "unrelated", user: { login: "someone-else" } },
  });
  const errors = validatePhaseZeroExternalEvidence(evidence);
  assert.ok(errors.some((error) => error.includes("does not authenticate")));
});
