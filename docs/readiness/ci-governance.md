# Repository and CI governance

## In-repository implementation state

The historical source-affecting Phase 0 candidate is
`6d91208a6d5912508178f981f575ff4345e34430`. The pre-repair pull-request head is
`c919ab1b5e86d9e12f75d4fdf6155a1ceab59f12` after evidence-only commits
`1f83021`, `96f3120`, and `c919ab1`; pull request #1 is not yet owner-approved
or merged. Source-affecting closure-contract, canonical-control-evidence,
typed-topology, and regression changes are committed at
`aa87b4e269bed660a761d6c36a1093a666addbd9`. The final Phase 0 candidate must be
the protected merge result on `main`. The Phase 0 implementation provides:

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
- closure schema version 2 records the exact
  `mecoflow/github-control/v1` projection schema for each GitHub control. The
  finalizer re-reads the live APIs and hashes only stable security-relevant
  fields; approval comments continue to use exact raw-response byte digests.

The Keycloak 26.7.2 immutable reference is
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
Run `31718073882` evaluated the final implementation candidate `e443e5b`:
dependency review and every executable verify gate passed again, including
E2E 15/15, while the aggregate jobs failed only on the absent APR-backed
endpoint and its dependent images/scans. The retained container record contains
zero false Trivy-format errors for its 14 incomplete identity diagnostics.
Run `31759036677` then evaluated commit `6d91208`, which added source-derived
readiness values without supplying any human approval or production endpoint.
Dependency review passed; governance 82/82, unit 236/236, integration 151/151,
authorization 53/53, E2E 15/15, and all other executable verify gates passed
with zero skips/todos. The aggregate jobs failed only the unchanged
endpoint/application-image and dependent 14-image identity chain. Its retained
artifacts remain diagnostic only.
Runs `31759673383`, `31760236777`, and `31760932202` evaluated the three later
evidence-only heads. Each passed dependency review and the executable verify
baseline, then failed the same unapproved endpoint/application-image and
incomplete 14-image identity chain. The then-current run `31760932202` retained
verify artifact `9204654001` with digest
`3475e2fdaf6239ee4c63b5fa1eff001c8a655b632b4e4411c3ffeadd916efab0` and
container artifact `9204550945` with digest
`6d7b794781b5409bb7f06db847e79b3a75b9a8bf3494770ad2298313e8f80320`.
All three are failed pull-request diagnostics, not candidate-bound closure
evidence.

Run `32382576019` then proved that the selected-Actions allowlist and full-SHA
policy permit the pinned workflow. Its strict dependency baseline correctly
failed on newly published `GHSA-ggr8-5vv4-36mx` instead of silently accepting
registry drift. Source checkpoint `d345afd` records that fifth High advisory
without remediating locked Phase 2. Follow-up run `32383852323` passed the exact
five-advisory verifier, dependency review, governance 113/113, unit 236/236,
integration 151/151, authorization 53/53, and E2E 15/15. Verify then failed
only `endpoint_environment` and `application_images`; container evidence
failed the same endpoint/release-image prerequisites and all 14 dependent
identity scans. Both runs are unapproved pull-request diagnostics.

## Live GitHub control-plane evidence — refreshed 2026-08-20

Authenticated `gh` inspection of `evanwidjaja100/MecoFlow`, refreshed on
2026-08-20 without changing remote state, showed:

- repository visibility `public`; default branch `main`. User intent is known,
  but no authenticated, candidate-bound visibility approval is recorded;
- `main` is protected with one required approval, stale-review dismissal,
  last-push approval, conversation resolution, administrator enforcement,
  strict up-to-date enforcement, and the exact required checks
  `dependency-review`, `verify`, and `container-security`; force pushes and
  deletion are disabled;
- the `production` environment exists, reports `can_admins_bypass: false`, and
  its GET readback exposes only the protected-branch deployment policy with no
  required-reviewer rule or least-privilege deployment secret; self-review
  prevention must be configured and read back with real reviewers;
- Actions are enabled with `allowed_actions: selected`, repository
  `sha_pinning_required: true`, both broad GitHub-owned/verified toggles false,
  and the exact patterns `actions/checkout@*`,
  `actions/dependency-review-action@*`, `actions/setup-node@*`, and
  `actions/upload-artifact@*`. This 2026-08-20 hardening is mechanically live
  but still lacks a candidate-bound canonical digest and named approval;
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
- a post-run fix now preserves `identity-error` as an incomplete
  diagnostic instead of attempting to parse its placeholder output as a
  completed Trivy report. Governance 82/82 and container-policy 14/14 pass
  locally. Run `31718073882` verified the behavior remotely, but remains failing
  diagnostic evidence because the endpoint/image gates did not pass; and
- source checkpoint `d345afd` was evaluated by run `32383852323` under the
  restricted Actions policy. Dependency review and all non-approval-dependent
  gates passed, while verify/container failed only the unchanged
  endpoint/application-image and incomplete-scan prerequisites. The two
  retained artifacts are diagnostic and unapproved.

Branch mutation protections and the three required check names are now
enforced, but required checks have not produced an accepted passing candidate
run and no independent reviewer is available.
The release environment, Actions approval/evidence, visibility approval, and
candidate-bound immutable evidence are incomplete. Phase 0 therefore remains
blocked.

## Required owner actions

1. Add both named independent reviewers as non-administrator collaborators
   with write access so counted review and workflow dispatch are available.
2. Complete the required independent approval of pull request #1 under the
   existing `main` protection after every required check passes.
3. Supply the approved endpoint record and rerun until the exact required
   checks `dependency-review`, `verify`, and
   `container-security` all pass; retain candidate-bound successful evidence. The
   recorded Phase 2 diagnostics must complete with attributable evidence, while
   unresolved advisory findings remain blockers in their owning phases.
4. Preserve the existing administrator enforcement and force-push/deletion
   denial, and retain authenticated evidence bound to the candidate.
5. After the pinned candidate workflow reaches `main`, restrict allowed Actions
   and enable SHA-pinning enforcement; retain authenticated evidence of both.
6. Preserve disabled administrator bypass; add real roster-bound independent
   required-reviewer protection and self-review prevention to `production`;
   and add the protected least-privilege `PHASE_ZERO_READ_TOKEN` before
   accepting release evidence.
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
