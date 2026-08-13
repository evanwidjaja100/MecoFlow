# Repository and CI governance

## In-repository implementation state

The latest committed Phase 0 candidate
`e7db0eb03ba184dbed1e3d35d294c583153867d7` (pull request #1; not yet
owner-approved or merged) implements:

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

The evidence-retention workflow is committed on the candidate. Run
`31707913394` failed all three required checks. Runs `31712296742`,
`31713053533`, and `31713790180` passed `dependency-review` but failed `verify`
and `container-security`. Run `31716612512` for commit `db503f3` was superseded
and cancelled after dependency review passed and container security failed.
Replacement run `31717030980` evaluated commit `e7db0eb`: dependency review and
all 15 browser scenarios passed, but verify and container security failed on
the still-unapproved endpoint and dependent image/scan evidence. All artifacts
from incomplete, cancelled, or failed runs are diagnostic only. GitHub run logs plus
`steps.json`, per-command JSON/logs, the uploaded manifest, and artifact
IDs/digests must validate after a successful clean run; repository
configuration or retained non-passing artifacts are not accepted as baseline
evidence.

## Live GitHub control-plane evidence — 2026-08-13

Authenticated `gh` inspection of `evanwidjaja100/MecoFlow` after the approved
control-plane mutations showed:

- repository visibility `public`; default branch `main`. User intent is known,
  but no authenticated, candidate-bound visibility approval is recorded;
- `main` is protected with one required approval, stale-review dismissal,
  last-push approval, conversation resolution, administrator enforcement,
  strict up-to-date enforcement, and the exact required checks
  `dependency-review`, `verify`, and `container-security`; force pushes and
  deletion are disabled;
- the `production` environment exists and accepts protected branches, but has
  no required reviewers and reports `can_admins_bypass: true`;
- Actions are enabled with `allowed_actions: all` and organization/repository
  `sha_pinning_required: false`. The owner approved deferring restriction until
  the candidate's full-SHA workflow reaches `main`, because the workflow still
  on `main` contains mutable references; the deferred control remains open;
- default workflow permissions are read-only and workflows cannot approve PRs;
- dependency alerts and the dependency graph are now enabled; authenticated
  SBOM readback returned 633 packages. Run `31707913394` predates that control
  mutation, so its dependency-review failure remains a valid historical
  diagnostic rather than current-state evidence;
- the repository has exactly one collaborator (the administrator), so an
  independent repository reviewer cannot currently approve pull request #1;
- the exact governed labels `BLOCKER`, `CRITICAL`, `HIGH`, `LATER-PHASE`, and
  `IMPLEMENTED-UNCOMMITTED` exist with governed descriptions; and
- pull request #1 run `31707913394` failed all three required checks because
  the dependency graph was not enabled and verify/container evidence was
  incomplete;
- runs `31712296742`, `31713053533`, and `31713790180` passed dependency review
  but failed verify/container. The first two could not start the E2E web server;
  the third ran all 15 scenarios but failed authentication/navigation. All
  three rejected the unapproved production endpoint and dependent image builds.
  Their container verifier also threw `ReferenceError: result is not defined`;
- commits `db503f3` and `e7db0eb` canonicalize the E2E loopback origin, add
  negative origin coverage, and replace the undefined scan-verifier access with
  parsed structured validation; and
- run `31716612512` was superseded/cancelled. Replacement run `31717030980`
  proved the E2E fix with 15/15 passing and executed the repaired container
  verifier without the former exception. It still failed verify on
  `endpoint_environment` and `application_images`, while container verification
  rejected endpoint/release-image evidence and all 14 incomplete scans. Before
  those approval-dependent failures, governance 81/81, unit 236, integration
  151, authorization 53, E2E 15/15, build, policies, Compose, and cleanliness
  passed. Neither run is accepted closure evidence.
- a post-run local fix now preserves `identity-error` as an incomplete
  diagnostic instead of attempting to parse its placeholder output as a
  completed Trivy report. Governance 82/82 and container-policy 14/14 pass
  locally, but this follow-up is uncommitted and has no remote candidate
  evidence.

Branch mutation protections and the three required check names are now
enforced, but required checks have not produced an accepted passing candidate
run and no independent reviewer is available.
The release environment, Actions restriction, visibility approval, and
candidate-bound immutable evidence are incomplete. Phase 0 therefore remains
blocked.

## Required owner actions

1. Add an independent repository collaborator with the appropriate review-only
   access before enabling a mandatory independent approval.
2. Complete an independent approval of pull request #1 under the existing
   `main` protection after every required check passes.
3. Supply the approved endpoint record, commit the post-run scan-parser fix,
   and rerun until the exact required checks `dependency-review`, `verify`, and
   `container-security` all pass; retain candidate-bound successful evidence. The
   recorded Phase 2 diagnostics must complete with attributable evidence, while
   unresolved advisory findings remain blockers in their owning phases.
4. Preserve the existing administrator enforcement and force-push/deletion
   denial, and retain authenticated evidence bound to the candidate.
5. After the pinned candidate workflow reaches `main`, restrict allowed Actions
   and enable SHA-pinning enforcement; retain authenticated evidence of both.
6. Add independent required reviewers to `production`, disable administrator
   bypass, and enforce least-privilege deployment permissions before accepting
   release evidence.
7. Retain authenticated, candidate-bound evidence and approval for the five
   governed labels and their descriptions.
8. Record authenticated owner approval for the intended repository visibility and its
   security implications, or restore the repository to its approved visibility.
9. Re-run and retain the read-only API output tied to the committed Phase 0
   source SHA.

Until these actions pass, B-11/B-12/B-13/B-17/B-18 block Phase 0 closure and
later evidence is not accepted as immutable governance evidence.

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
