# Repository and CI governance

## In-repository implementation state

The current Phase 0 worktree (not yet committed or owner-approved) implements:

- full-commit-SHA references for all third-party GitHub Actions;
- workflow-level `contents: read`, while GitHub reports default workflow
  permissions `read` and `can_approve_pull_request_reviews: false`;
- sha256 pins for every external Dockerfile base, Compose service, CI service,
  release-policy image, and the Trivy scanner;
- exact Node `24.18.0` and pnpm `11.13.0` enforcement;
- evidence-wrapped frozen lockfile install and isolated CI PostgreSQL service;
- non-short-circuiting core gates with `TURBO_FORCE=true`; every command retains
  source-bound argv, start/end/duration, effective exit, secret-redacted
  stdout/stderr, zero-skip/zero-todo evaluation for test commands, and output
  SHA-256 values;
- evidence-wrapped storage/application-image setup plus a final
  `git status --porcelain` gate prove that all required commands ran and that
  none changed the candidate workspace;
- the approved production API endpoint is exported from the typed endpoint
  matrix immediately before the final application build and is retained in
  command evidence, while browser tests build separately against an explicit
  loopback test endpoint;
- the dependency audit must parse as JSON and match the exact recorded four-High
  advisory baseline; registry, parser, severity, identity, and advisory-set drift
  fail Phase 0. Container vulnerability findings run to completion as retained
  Phase 2 diagnostics, but skipped, cancelled, missing-image, identity, scanner,
  report, and summary inconsistencies fail Phase 0;
- always-run, secret-free CI manifests bind the source SHA, lockfile digest,
  container-policy digest, complete step outcomes, command evidence hashes, run
  identity, runner, and aggregate result; immutable v4 artifacts retain these
  records plus generated Playwright/test and complete container-scan output for
  90 days;
- `pnpm governance:test` and `pnpm governance:check`, which fail when required
  files/tests disappear or tracked Action/external-image references become
  mutable.
- an independently dispatched, least-privilege finalization workflow downloads
  both candidate-run artifact sets and verifies live GitHub repository, run,
  job, actor, artifact, approval, remote-control, input-hash, endpoint, digest,
  and expiry data before the local closure record can pass.

The Keycloak 26.7.0 immutable reference is
`sha256:0f198be292568439d700cdbfb893e69a6009bb43a94a06a945b1d3d506c76b13`.
It is an identity pin, not proof that the image passes Phase 2 vulnerability
policy.

Project-owned images are built under versioned local tags, resolved to exact
Docker image IDs, and exported into fail-closed `MECOFLOW_*_IMAGE` variables;
the staging Compose file refuses to resolve without all nine immutable values.
Candidate evidence must run Compose with those generated identities and
without rebuilding. Final registry digests, SBOM, provenance,
signature/attestation, and immutable deployment-manifest linkage remain Phase
14 work. No evidence may claim that final artifact control already exists.

The evidence-retention workflow is implemented but uncommitted and has not yet
produced an artifact. GitHub run logs plus `steps.json`, per-command JSON/logs,
the uploaded manifest, and the artifact ID/digest must be recorded in the
evidence index after a clean run; repository configuration alone is not
accepted as baseline evidence.

## Live GitHub control-plane evidence — 2026-08-13

Read-only `gh` inspection of `evanwidjaja100/MecoFlow` showed:

- repository visibility `public`; default branch `main` (visibility changed
  after the 2026-08-11 diagnostic and before this read-only recheck);
- `main` branch-protection API returns HTTP 404 (`Branch not protected`) and
  the repository-ruleset API returns an empty list; unlike the 2026-08-11
  response, the current API result does not establish a plan limitation;
- no GitHub environments exist (`total_count: 0`);
- Actions are enabled with `allowed_actions: all` and organization/repository
  `sha_pinning_required: false`;
- default workflow permissions are read-only and workflows cannot approve PRs.
- the repository has exactly one collaborator (the administrator), so an
  independent repository reviewer cannot currently approve changes.
- the labels API returns only GitHub's nine default labels; required `BLOCKER`,
  `CRITICAL`, `HIGH`, `LATER-PHASE`, and `IMPLEMENTED-UNCOMMITTED` labels do not
  exist.

Therefore required reviews, required checks, no-force-push/no-delete controls,
and a protected release environment are **not enforced**. Repository policy
files are useful defense in depth but cannot replace control-plane enforcement
while direct pushes to an unprotected branch remain possible.

## Required owner actions

1. Add an independent repository collaborator with the appropriate review-only
   access before enabling a mandatory independent approval.
2. Protect `main` with pull requests and at least one independent approving review; dismiss
   stale approvals.
3. Require an up-to-date branch and the exact checks `dependency-review`,
   `verify`, `container-security`, and `phase-zero-finalization`. The latter
   three pass Phase 0 only when
   every required gate succeeds and the recorded Phase 2 diagnostics complete
   with attributable evidence; unresolved advisory findings remain blockers in
   their owning phases.
4. Disallow force pushes and branch deletion, including for administrators.
5. Restrict allowed Actions and enable SHA-pinning enforcement.
6. Create a protected `production` environment with independent reviewers and
   least-privilege deployment permissions before accepting release evidence.
7. Create the exact governed defect/release labels `BLOCKER`, `CRITICAL`,
   `HIGH`, `LATER-PHASE`, and `IMPLEMENTED-UNCOMMITTED` with descriptions that
   preserve the semantics in `governance.md`.
8. Obtain owner approval for the intended repository visibility and its
   security implications, or restore the repository to its approved visibility.
9. Re-run and retain the read-only API output tied to the committed Phase 0
   source SHA.

Until these actions pass, B-11/B-12/B-17/B-18 block Phase 0 closure and later
evidence is not accepted as immutable governance evidence.

## Machine-validated control record

The values below mirror `phase-zero-closure.json`. `PASS` requires an immutable
evidence URI, check timestamp, candidate SHA, and approval record; prose or a
repository-local policy file alone cannot satisfy the control.

| Control ID | Control                        | Status    | Evidence URI | Evidence SHA-256 | Checked at | Candidate SHA | Approval record |
| ---------- | ------------------------------ | --------- | ------------ | ---------------- | ---------- | ------------- | --------------- |
| CI-01      | Branch protection/ruleset      | `BLOCKED` |              |                  |            |               | `MISSING`       |
| CI-02      | Protected release environment  | `BLOCKED` |              |                  |            |               | `MISSING`       |
| CI-03      | Restricted full-SHA Actions    | `BLOCKED` |              |                  |            |               | `MISSING`       |
| CI-04      | Independent reviewer access    | `BLOCKED` |              |                  |            |               | `MISSING`       |
| CI-05      | Governed defect/release labels | `BLOCKED` |              |                  |            |               | `MISSING`       |
| CI-06      | Approved repository visibility | `BLOCKED` |              |                  |            |               | `MISSING`       |
