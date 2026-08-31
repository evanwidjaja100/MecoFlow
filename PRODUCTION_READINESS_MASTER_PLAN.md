# MECO Flow Production Readiness Master Implementation Plan

**Status:** PHASE 0 COMPLETE
**Release classification:** NOT READY  
**Plan date:** 2026-08-10  
**Execution model:** One explicitly authorized phase at a time

## 1. Purpose

This plan turns the repository audit into an ordered, evidence-driven program
for making MECO Flow production ready. It is deliberately phase gated:

- The phase numbers in this plan are production-readiness remediation gates.
  They do not rename the historical delivery phases recorded in
  IMPLEMENTATION_STATUS.md.
- Start only the phase explicitly authorized by the user.
- Give that phase its own goal, scope, non-goals, tests, and exit criteria.
- Work in an implement–test–review loop until every phase gate passes.
- Do not start the next phase while any scoped defect, release blocker, failed
  check, missing evidence, or issue that invalidates the phase remains.
- Stop after closing the phase and wait for explicit authorization to continue.

No engineering process can literally guarantee that software contains no
mistakes. The operational standard for this plan is therefore:

- zero known release-blocking defects;
- zero failing, skipped, weakened, flaky, or cached-only required checks;
- reproducible evidence from a clean checkout and production-like environment;
- independent review for security-, authorization-, data-, migration-, and
  release-critical changes; and
- immediate reopening of a phase when later work invalidates its evidence.

## 2. Governing rules and precedence

Before changing code in any phase, read:

- docs/PRODUCT_REQUIREMENTS.md
- docs/ARCHITECTURE.md
- docs/DOMAIN_MODEL.md
- docs/SECURITY_MODEL.md
- docs/AUTHORIZATION_MATRIX.md
- docs/API_CONVENTIONS.md
- docs/TEST_STRATEGY.md
- IMPLEMENTATION_STATUS.md
- all applicable accepted ADRs
- the root AGENTS.md and every nested AGENTS.md governing changed files

When documents conflict:

1. The latest accepted ADR governs architecture.
2. PRODUCT_REQUIREMENTS.md governs behavior.
3. SECURITY_MODEL.md and AUTHORIZATION_MATRIX.md govern access control.
4. Unresolved conflicts block implementation and must be recorded rather than
   silently resolved in code.

Repository invariants remain mandatory throughout the program:

- TypeScript strict mode stays enabled.
- Modular-monolith boundaries are preserved.
- Controllers call application services.
- Application services call policies, domain services, and repositories.
- Only repositories access Prisma.
- Every trust boundary is validated.
- Authorization is enforced server-side and denies by default.
- Guards are never bypassed.
- Workflow states are changed only through authorized domain transitions.
- Audit events are immutable.
- Secrets are never exposed.
- Tests are not weakened to make a gate pass.
- Every behavior change receives tests and affected documentation updates.
- New dependencies require documented necessity, security impact, maintenance
  impact, ownership, and exit strategy.

## 3. How to execute this plan

The recommended user instruction for beginning a phase is:

    Start Phase 0 from PRODUCTION_READINESS_MASTER_PLAN.md.
    Do not start Phase 1.

Replace the phase number only after the prior phase has been closed and the user
has explicitly authorized the next phase.

### 3.1 Phase goal protocol

At the start of every phase, the implementing agent must:

1. Read this plan and all governing documents for the files in scope.
2. Create exactly one active phase goal when the goal capability is available.
   The goal must name the phase, objective, scope, non-goals, required tests,
   evidence, and exit criteria. Do not assign a token budget unless the user
   explicitly requests one. If the goal capability is unavailable, create the
   same phase-goal record in the evidence index before implementation.
3. Record the branch, commit SHA, worktree state, lockfile digest, migration
   state, and baseline test results.
4. Create a working plan whose items map directly to the phase exit gate.
5. Open a phase defect ledger. Every scoped discovery must be fixed in the phase
   or treated as a blocker. Only a clearly out-of-scope, non-release-blocking
   finding may move to a named later phase, and only with an owner, acceptance
   test, rationale, security review, and proof that it does not affect the
   current phase's assumptions, exit criteria, or evidence.
6. Identify the accountable implementer and independent reviewers before
   security-, data-, or release-critical work begins.

### 3.2 Mandatory phase loop

Repeat this loop until the phase exit gate passes without exceptions:

1. Reproduce and specify the next defect or missing behavior.
2. Add a failing automated test or an equally strong executable check.
3. Implement the smallest complete vertical slice.
4. Run the narrowest relevant checks.
5. Review authorization, trust boundaries, data invariants, migration safety,
   audit attribution, observability, failure handling, and user experience.
6. Inspect the diff for architectural boundary violations and accidental
   changes.
7. Run the complete phase gate from a clean, uncached state.
8. Obtain independent review where required.
9. Fix every finding and restart at step 1.

A passing targeted test never substitutes for a complete phase gate.

### 3.3 Phase closure protocol

A phase is complete only when all of the following are true:

1. Every scoped requirement and audit finding has an implementation or
   documented proof that no change is required.
2. Required tests pass from a clean state with exact commands, environment,
   duration, and test counts recorded.
3. No required test is skipped, quarantined, weakened, flaky, or accepted only
   from cache.
4. The final diff, database schema, migrations, OpenAPI output, configuration,
   generated artifacts, and documentation have been inspected.
5. An independent reviewer has signed off on the phase evidence.
6. IMPLEMENTATION_STATUS.md and all affected governing documents reflect
   reality.
7. A closure report records assumptions, security implications, residual risks,
   limitations, rollback instructions, and evidence locations.
8. The phase goal is marked complete only after all preceding items pass.
9. Work stops. The next phase remains locked until the user explicitly
   authorizes it.

If any item fails, the phase remains active and the loop continues.

## 4. Program-wide evidence gates

Commands may evolve as repository scripts evolve, but replacements must provide
equal or stronger coverage and be documented. Unless a phase explicitly proves
a command is inapplicable, use these exact repository gates:

### 4.1 Core source gate

    git diff --check
    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm test:integration
    pnpm test:authorization
    pnpm openapi:check
    pnpm test:e2e
    pnpm build

Run gates without relying solely on prior cache output. Record test totals and
all exclusions.

### 4.2 Database and migration gate

- Apply all migrations to a blank database.
- Upgrade a populated copy representative of production data.
- Verify foreign keys, uniqueness, tenant and membership isolation, workflow
  invariants, JSON validation, audit append-only behavior, and rollback or
  forward-recovery procedure.
- Verify backup and restore after the final schema is frozen.
- Capture query plans and latency for bounded-list and reporting hot paths.

### 4.3 Security and supply-chain gate

Phase 2 must close the currently known dependency and image blockers before
feature work continues. The complete gate becomes mandatory in Phase 13 and is
rerun after any dependency, source, image, identity, infrastructure, or
security-configuration change.

- dependency audit with exit code zero and no unresolved Critical or High
  advisory;
- secret scanning;
- static security analysis;
- container image and operating-system package scan;
- software bill of materials and provenance generation;
- authorization regression suite;
- abuse, rate-limit, session, CSP, upload, and storage-boundary tests;
- signed or otherwise policy-compliant immutable artifacts.

The existing commands below are a minimum, not a substitute for missing secret,
static, dynamic, provenance, or authorization controls. The responsible phase
must add reproducible controls for any gap.

### 4.4 Production-environment gate

Production evidence is layered so a phase never depends on evidence created by
a later phase:

1. Phase 15 validates policies, IaC, providers, secrets, TLS, KMS, networking,
   individual production controls, and production-control policy tests. It does
   not claim the complete preflight before backup evidence exists.
2. Phase 16 validates coordinated off-site backup and restore, then runs the
   complete production preflight plus monitoring, paging, capacity, degradation,
   and operational-readiness evidence.
3. Phase 17 reruns both prior layers plus every staging, security, performance,
   accessibility, localization, UAT, and rollback gate against one frozen
   candidate.

### 4.5 Repository command and prerequisite matrix

Every run records the command, source SHA, image digests, environment,
prerequisites, start and end time, exit code, test count, and immutable output
location.

| Phase      | Command                                                                      | Mandatory prerequisites and pass criterion                                                                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2, 13, 17  | pnpm security:audit                                                          | Clean deterministic install from the recorded lockfile; exit code zero                                                                                                                                                                                    |
| 2, 14, 17  | pnpm security:image-scan:test                                                | Current policy tests; exit code zero                                                                                                                                                                                                                      |
| 2          | pnpm security:image-scan                                                     | Docker and scanner available; APP_VERSION set; every baseline policy image freshly built or pulled by immutable digest; all 14 current release images accounted for; zero unapproved or expired Critical/High findings                                    |
| 14, 17     | pnpm security:image-scan                                                     | Reconcile final deployment manifests against security/container-scan-policy.json; remove stale entries and add omissions; freshly scan every unique final release image by digest; zero unresolved Critical/High findings                                 |
| 15, 16, 17 | pnpm production:preflight:test                                               | Current production-control policy tests; exit code zero                                                                                                                                                                                                   |
| 16, 17     | pnpm production:preflight                                                    | Run only after the witnessed off-site restore; MECOFLOW_PRODUCTION_CONTROL_FILE points to the candidate-bound external manifest outside the repository; authenticated provider evidence is current; retain only the approved safe summary                 |
| 16, 17     | pnpm operations:preflight:test                                               | Current operational-readiness policy tests; exit code zero                                                                                                                                                                                                |
| 16, 17     | pnpm operations:preflight                                                    | MECOFLOW_OPERATIONAL_READINESS_FILE points to candidate-bound monitoring, on-call/paging, and capacity evidence accepted by the current schema; training and approvals remain release-packet evidence; backup/restore remains production-control evidence |
| 16, 17     | pnpm monitoring:validate and pnpm monitoring:config                          | Prepared staging environment file, monitoring secrets, Docker, and production-equivalent routes; configuration and policy pass                                                                                                                            |
| 16, 17     | pnpm capacity:test and pnpm capacity:run                                     | MECOFLOW_CAPACITY_FILE and production-equivalent dependencies prepared; test and measured thresholds pass                                                                                                                                                 |
| 17         | pnpm staging:config and pnpm staging:build                                   | .runtime/staging/staging.env, external secret files, trusted TLS, isolated databases, Docker, APP_VERSION, and immutable base images prepared                                                                                                             |
| 17         | pnpm staging:restore-rehearsal                                               | Local Compose backup volume and a clean isolated target prepared; this local isolated regression rehearsal passes in addition to the separate Phase 16 provider-specific off-site restore                                                                 |
| 17         | pnpm staging:pilot-acceptance, pnpm test:staging-smoke, and pnpm pilot:check | Exact candidate deployed to clean production-equivalent staging; all role, locale, device, browser, and evidence prerequisites prepared; all checks pass                                                                                                  |

External evidence must identify the provider, environment, resource identifier,
timestamp, owner, and immutable configuration or manifest version. Placeholder
values are never release evidence.

## 5. Ownership and sign-off

One person may hold several roles, but responsibilities and approvals must be
explicit.

| Role                       | Required responsibility                                            |
| -------------------------- | ------------------------------------------------------------------ |
| Software engineering owner | Architecture, implementation, repository gates                     |
| Security owner             | Threat model, authorization, application and supply-chain security |
| Database/data owner        | Migrations, invariants, backup, restore, data reconciliation       |
| Product owner              | Requirements, workflow acceptance, release scope                   |
| Test/QA owner              | Test strategy, regression, E2E, defect ledger                      |
| QA/QC business owner       | Inspection policy, evidence, disposition, and QA/QC UAT            |
| Purchasing owner           | Purchase-order and commitment UAT                                  |
| Warehouse owner            | ASN, receiving, inspection, and evidence UAT                       |
| Project-management owner   | Project planning, scope, and project-management UAT                |
| Engineering-domain owner   | Engineering-domain requirements and UAT                            |
| PPIC owner                 | Planning, inventory, and production-control UAT                    |
| Production owner           | Production-domain workflow UAT                                     |
| Finance-readonly owner     | Finance reporting and read-only access UAT                         |
| Management owner           | Management reporting and oversight UAT                             |
| Identity owner             | Supported IdP configuration, claims, sessions, break-glass         |
| Cloud/platform owner       | IaC, networking, storage, TLS, KMS, secrets                        |
| SRE/on-call owner          | SLOs, alerts, paging, runbooks, capacity, DR                       |
| Privacy/compliance owner   | Retention, audit, evidence, data handling                          |
| Release manager            | Candidate freeze, approvals, deployment, rollback                  |
| Business sponsor           | Residual-risk acceptance and go-live decision                      |

No role may self-approve its own critical control without an independent
reviewer.

## 6. Phase map

| Phase | Name                                                              | Current state |
| ----- | ----------------------------------------------------------------- | ------------- |
| 0     | Governance, decisions, and immutable baseline                     | COMPLETE      |
| 1     | Systemic authorization and audit attribution                      | LOCKED        |
| 2     | Immediate dependency and image blocker containment                | LOCKED        |
| 3     | Inspection, receiving-time, and evidence safety                   | LOCKED        |
| 4     | Supplier reporting correctness                                    | LOCKED        |
| 5     | Readiness, worker, and database reliability                       | LOCKED        |
| 6     | Shared frontend, capability, and locale foundation                | LOCKED        |
| 7     | Purchase-order revision and supplier commitments                  | LOCKED        |
| 8     | ASN, receiving, and immutable corrections                         | LOCKED        |
| 9     | Documents, evidence, and inspection configuration                 | LOCKED        |
| 10    | Bounded APIs and performance                                      | LOCKED        |
| 11    | Localization, accessibility, and responsive operation             | LOCKED        |
| 12    | Architecture, maintainability, and documentation closure          | LOCKED        |
| 13    | Dependency convergence and application-security hardening         | LOCKED        |
| 14    | Supported identity, object storage, CI, and artifact supply chain | LOCKED        |
| 15    | Production platform, secrets, TLS, and KMS                        | LOCKED        |
| 16    | Backup, DR, monitoring, paging, and capacity                      | LOCKED        |
| 17    | Immutable staging, security review, UAT, and final qualification  | LOCKED        |
| 18    | Controlled deployment and measurable hypercare                    | LOCKED        |

## 7. Detailed implementation phases

## Phase 0 — Governance, decisions, and immutable baseline

**Objective:** Establish a trustworthy starting point and prevent unrelated or
unreviewable changes from contaminating later evidence.

**Phase goal:** Produce an owned, reproducible baseline and a reconciled backlog
that maps every audit finding to exactly one phase.

**Required work:**

1. Inventory the current dirty worktree: tracked modifications, untracked files,
   generated files, secrets, migration changes, and local-only artifacts.
2. Classify every change as intentional product work, generated output,
   environment-specific material, secret exposure, or unrelated work.
3. Preserve user work. Do not discard, reset, overwrite, stage, or commit it
   without explicit authority. Create a clean secondary worktree if that is the
   safest way to isolate the readiness program.
4. Establish an owner-approved clean branch and committed source SHA. Every
   included file must be attributable to that SHA; original user work remains
   preserved separately until its disposition is explicitly approved.
5. Implement and verify repository and release governance before accepting
   evidence: protected branches, mandatory reviews, enforced required checks,
   clean isolated test databases, protected release environments,
   least-privilege workflow permissions, every third-party CI Action pinned to a
   full commit SHA, and every base or service image referenced immutably.
6. Re-run the full documented baseline from the clean source revision without
   relying only on caches.
7. Reconcile audit findings against requirements, accepted ADRs, security
   policy, authorization matrix, schema, OpenAPI, tests, and implementation
   status. Give each finding an owner, severity, phase, and executable
   acceptance test.
8. Resolve or formally record documentation conflicts and missing decisions.
9. Establish the defect ledger, risk register, decision log, evidence index,
   reviewer roster, release-blocker labels, command-prerequisite records, and
   evidence-invalidation ownership.
10. Define exact supported runtime, package-manager, database, browser, and
    deployment-tool versions.
11. Obtain business, data, privacy, and SRE approval for availability and
    latency targets, RPO, RTO, retention periods, capacity assumptions,
    headroom, supported locales, timezones, browsers, devices, and accessibility
    target. These are design inputs, not values invented during infrastructure
    implementation.
12. Select the supported production identity provider and object-storage
    provider, define their required integration contracts and support ownership,
    and start procurement immediately. Local MinIO is development-only.
13. Approve the production endpoint matrix: public web URL, API base URL, DNS,
    CORS origins, OIDC issuer and callback URLs, identity-provider hostname,
    external proxy chain and trusted hop count, internal service names, and
    build-time public values.
14. Confirm that test scripts fail when prerequisites or required test files are
    missing; no silent success is permitted.
15. Record the current five High dependency advisories, all 14 release images,
    the failing Keycloak scan, archived object-storage concern, and external
    production-control gaps as explicit blockers.

**Verification and evidence:**

- Clean-checkout baseline with exact commands and outputs.
- Worktree reconciliation manifest.
- Finding-to-phase traceability matrix.
- Named owners and reviewers.
- Recorded environment and tool versions.
- Approved SLO, RPO, RTO, retention, capacity, provider, locale, browser,
  device, and WCAG decisions.
- Passing branch-protection, full-SHA Action, immutable image-reference,
  least-privilege workflow, isolated-database, protected-environment, and
  evidence-retention checks.
- Approved endpoint matrix with owners and change-control rules.
- Full core source gate result, even if failing; failures become ledger items.

**Exit gate:**

- Every existing change is understood and preserved.
- Every known audit finding has an owner, severity, phase, and acceptance test.
- No unresolved documentation conflict changes the design of Phase 1.
- An owner-approved clean committed SHA exists, all source is attributable to
  it, and the original dirty worktree has been preserved without loss.
- The baseline is reproducible by an independent reviewer from that SHA.
- All Phase 0 and later evidence runs only through the immutable,
  least-privilege CI and source controls.
- Phase 1 and Phase 2 have no unresolved provider, target, ownership, or
  endpoint, acceptance-test, or CI decision.

**Estimated effort:** 3–7 engineering days.

## Phase 1 — Systemic authorization and audit attribution

**Objective:** Eliminate cross-membership scope mixing and make identity,
authorization, and audit attribution unambiguous.

**Phase goal:** Make every resource-specific decision operate on one exact
server-derived authorized membership, preserve correlation for legitimate
multi-scope collections, and prove deny-by-default isolation across every
module.

**Required work:**

1. Adopt and document a canonical resource-specific authorization context
   containing the authenticated actor, exact qualifying membership,
   organization, project or supplier scope, role, grant, required permission,
   resource, and authorization source.
2. For legitimate multi-scope collections, model access as an OR of complete
   correlated tuples such as membershipId, organizationId, and projectId.
   Never flatten valid tuples into independent membership, organization,
   project, supplier, role, or grant arrays. Explicit global authority must be a
   real grant, never a union synthesized across memberships.
3. Derive every qualifying membership server-side from the authenticated
   principal, requested resource, required permission, and assignment. A
   client-selected membership or organization may be a validated navigation
   hint, but it is never an authority source and cannot broaden a query.
4. Remove authorization decisions that independently combine role, supplier,
   organization, project, or grant information from different memberships.
5. Pass the canonical context through guards, controllers, application services,
   policies, domain services, and repositories without reconstructing or
   widening it.
6. Revalidate authority, version, and the exact membership/resource predicate
   atomically inside the same database transaction as each mutation. Use
   conditional mutation or appropriate locking so concurrent revocation cannot
   commit state or an outbox event.
7. Do not authorize delayed jobs from a serialized role or grant snapshot.
   Persist only minimum actor/membership audit attribution; jobs run under a
   documented system principal or independently revalidate current authority
   and resource invariants.
8. Require actorMembershipId for every human membership-scoped audit event.
   Represent legitimate automated activity with an explicit system principal
   and documented null-membership semantics. Never fabricate legacy
   attribution.
9. Make organization creation and its audit event commit in one transaction.
10. Review every endpoint, protected repository predicate, field-shaping DTO,
    background worker, queue payload, download, upload, report, pagination
    predicate, document association, and administrative action against the
    authorization matrix.
11. Update OpenAPI, domain model, security model, authorization matrix, ADRs,
    migration plan, and client contracts.
12. Add exhaustive negative tests for multiple memberships in different
    creation orders, roles, organizations, projects, supplier assignments,
    disabled memberships, stale tokens, current-membership hints, concurrent
    membership changes, and concurrent revoke-versus-write.

**Verification and evidence:**

- Authorization matrix coverage report for every protected operation.
- Unit, integration, authorization, and E2E tests that prove both allow and deny
  behavior.
- Property or permutation tests showing membership order cannot change access.
- Direct object-reference, report, attachment, and job-consumer isolation tests.
- Concurrent revoke-versus-write tests proving neither state nor outbox events
  commit after authority is revoked.
- Transactional organization-create audit test.
- Migration evidence for audit attribution.
- Independent security and architecture review.

**Exit gate:**

- No protected path derives scope from actor-wide first-match or independently
  flattened membership data.
- No cross-membership role, organization, project, supplier, or grant mixing is
  possible.
- Every mutation atomically revalidates current authorized scope.
- Every new human event has unambiguous actor and membership attribution; every
  automated event has an explicit documented system principal.
- Organization creation cannot commit without its audit event.
- All core, database, and authorization gates pass.

**Reopen triggers:** Any later protected repository query, field-shaping DTO,
organization/project relation, pagination predicate, document association,
queue payload, endpoint, job, role, grant, identity claim, or audit schema
change.

**Estimated effort:** 3–6 engineering weeks.

## Phase 2 — Immediate dependency and image blocker containment

**Objective:** Remove the known-red supply-chain baseline before months of
additional product work build on it.

**Phase goal:** Make the current lockfile audit and every current release-image
policy pass without a broad final dependency or artifact freeze.

**Required work:**

1. Reproduce and remediate the recorded High advisories affecting fast-uri,
   brace-expansion, js-yaml, and nanoid through supported direct or transitive
   upgrades, replacement, or repository-supported advisory-specific resolution.
2. Verify the lockfile is deterministic, complete, and unchanged by a clean
   frozen install.
3. Build or pull by immutable digest every image listed in
   security/container-scan-policy.json, including all 14 current release images.
4. Replace the failing Keycloak image with a supported digest-pinned build and
   close the recorded findings. Do not use an expired or broad business
   exception to override the scanner.
5. Run the full core source, authorization, dependency-audit, image-policy, and
   fresh-image-scan gates after each material remediation.
6. Record temporary compatibility constraints that must be revisited during
   Phase 13 and full provider qualification that remains for Phase 14.

**Verification and evidence:**

- pnpm security:audit exits zero from a clean deterministic install.
- All policy images are accounted for and scanned freshly by digest.
- Zero unresolved or unapproved Critical or High dependency or image finding.
- Keycloak starts and passes authentication and browser smoke tests using the
  currently supported integration contract.
- Independent security and application compatibility review.

**Exit gate:**

- The four recorded High dependency advisories are closed through a
  repository-supported mechanism.
- All 14 current release images and every policy image pass the current scan
  policy.
- The supported digest-pinned Keycloak build has no unresolved Critical or High
  finding.
- The full core and Phase 1 authorization gates remain green.

**Reopen triggers:** Any later lockfile, dependency, base image, runtime image,
scanner policy, or identity image change.

**Estimated effort:** 1–3 engineering weeks.

## Phase 3 — Inspection, receiving-time, and evidence safety

**Objective:** Remove unsafe defaults and make inspection decisions, timestamps,
and evidence handling fail safely.

**Phase goal:** Ensure missing, stale, unauthorized, or incomplete inspection
input can never silently produce an approving or misleading result.

**Required work:**

1. Remove every default checklist pass, certificate acceptance, disposition,
   accepted or rejected quantity, and canned reason. Use explicit unanswered,
   incomplete, not-evaluated, failed, or blocked states.
2. Require an explicit answer for every policy-required check and derive
   conforming server-side; clients may display but never determine it.
3. Enforce accepted plus rejected plus quarantined equals finalized received
   quantity. Validate cumulative receipts, tolerances, lot and serial
   requirements, conditional acceptance, and concurrent updates.
4. Reauthorize conditional acceptance through the exact Phase 1 context in the
   same transaction as the transition.
5. Model real-world operational time as occurredAt and server persistence time
   as recordedAt. Accept occurredAt only as RFC3339 with an explicit offset,
   reject timezone-less values, store UTC, preserve its source, and render using
   Asia/Jakarta where that is the approved business timezone.
6. Prevent browser-local conversion, UTC slicing, server timezone, or daylight
   saving assumptions from changing an instant or date-only business value.
7. Pin finalized inspection evidence to an immutable approved DocumentVersion
   identifier and SHA-256 of the exact bytes, never only to a mutable logical
   Document.
8. Migrate an existing evidence reference only when its exact version and
   checksum are provable. Otherwise retain it as provenance-unknown and require
   explicit policy handling; never fabricate provenance.
9. Prove later upload, replacement, rescan, or logical-document change cannot
   change evidence already attached to a finalized inspection.
10. Validate upload type and signature, size, count, ownership, object key,
    checksum, malware status, retention class, scan state, review state, and
    download authorization.
11. Separate pending, scanned, rejected, quarantined, expired, approved, and
    available evidence states.
12. Make transitions idempotent and concurrency safe; prohibit direct state
    assignment.
13. Before finalization, require an explicit confirmation summary showing lot
    and item, every answered check, exact evidence version and checksum,
    received, accepted, rejected, and derived quarantined quantities,
    disposition, and the authored reason.
14. Update receiving and inspection UI so incomplete states, authoritative
    times, evidence provenance, and server errors are explicit and actionable.

**Verification and evidence:**

- Boundary and mutation tests for all quantity, quarantine, tolerance, and
  conditional-acceptance combinations.
- Missing-field, malformed-field, stale-version, unauthorized, replay, and
  concurrent-request tests.
- UTC-server and Jakarta-server tests that reproduce and prevent the original
  seven-hour defect, plus the supported timezone matrix.
- Upload/download isolation and malicious-file tests.
- Immutable-version and checksum tests proving later document replacement
  cannot change finalized inspection evidence.
- E2E proof that cancelling the confirmation returns without finalizing and
  confirming or safely retrying produces exactly one finalization.
- E2E proof from receiving through inspection and audit history.

**Exit gate:**

- No missing inspection input or default can result in pass, approval,
  disposition, quantity, or reason.
- Every conforming result is derived server-side from explicit required answers.
- occurredAt and recordedAt have distinct, documented, tested semantics.
- Evidence-dependent transitions require the immutable approved DocumentVersion
  and SHA-256; legacy uncertainty is visible and never fabricated.
- Finalization cannot bypass the complete confirmation summary and is
  idempotent.
- Quantity and workflow invariants hold under concurrency.
- Relevant core, database, security, and E2E gates pass.

**Estimated effort:** 2–4 engineering weeks.

## Phase 4 — Supplier reporting correctness

**Objective:** Make every supplier report complete, reproducible, scoped, and
auditable.

**Phase goal:** Eliminate source-fact truncation and prove that report results
match authoritative data for all supported sizes and membership scopes.

**Required work:**

1. Define each metric, denominator, time window, timezone, status inclusion,
   late-arrival rule, correction rule, and access rule in product documentation.
2. Apply every eligibility predicate before any bound. Execute selection and
   aggregation against one consistent database snapshot; never filter a capped
   partial source set in memory.
3. For synchronous bounded results, fetch eligible limit plus one to detect
   oversize and return an explicit oversized-result response or switch to a
   governed asynchronous export. Never silently truncate.
4. Preserve Decimal(30,6) or stronger authoritative arithmetic end to end.
   Never aggregate or compare authoritative quantities through JavaScript
   Number. Define final rounding and display rules explicitly.
5. If snapshots are used, define watermark, rebuild, idempotency, correction,
   reconciliation, and freshness behavior.
6. Bind every report to the canonical authorized scope from Phase 1.
7. Include report parameters, data watermark, generated time, and scope in the
   result and audit trail.
8. Add stable pagination or export jobs for detail views; never truncate without
   an explicit user-visible limit.
9. Cover empty sets, more-than-cap datasets, ties, duplicate events, corrected
   receipts, partial receipts, timezone boundaries, and concurrent updates.
10. Reconcile output against independent SQL or controlled fixtures.

**Verification and evidence:**

- Golden datasets with hand-verified expected metrics.
- Exact 9,999, 10,000, 10,001, and 10,002 eligible-fact tests, including
  10,002 facts grouped into one supplier, plus every former page boundary.
- Decimal boundary, comparison, aggregation, and rounding tests.
- Membership isolation and report-download authorization tests.
- Query-plan and performance evidence for expected and peak volumes.
- Product, data, and security sign-off on metric definitions.

**Exit gate:**

- Every supported dataset produces complete and deterministic results.
- No silent source-fact truncation remains.
- Predicates precede limits, oversized results are explicit, and all
  authoritative arithmetic preserves decimal integrity.
- Every metric and scope can be explained and reproduced from recorded evidence.
- Performance meets the approved target without unbounded memory use.

**Reopen triggers:** Metric-definition, schema, event, timezone, or data-retention
changes.

**Estimated effort:** 2–4 engineering weeks.

## Phase 5 — Readiness, worker, and database reliability

**Objective:** Make service health, retries, transactions, and database
constraints reflect actual safe operation.

**Phase goal:** Prove that the application and workers fail visibly, retry
correctly, and preserve data integrity under dependency and concurrency faults.

**Required work:**

1. Separate business-readiness recalculation and outbox processing from HTTP
   startup, liveness, service readiness, and dependency diagnostics.
2. In each worker claim, select and return the exact event IDs claimed, touch
   only currently eligible or stale rows, never increment future-backoff rows,
   and retain the post-claim attempt count for each event.
3. Determine retryable, terminal, and exhausted status per event. Never leave an
   exhausted event PENDING, consume an event that arrived after the claim, or
   apply one event's attempt count to another.
4. Define bounded exponential backoff, jitter, attempt limits, poison-message
   handling, dead-letter behavior, idempotency, and durable outcome records.
5. Supervise the initial claim promise and surface startup failures. During
   shutdown, stop new claims, drain in-flight database, storage, and SMTP work
   for a bounded interval, persist a recoverable state, and only then disconnect
   dependencies.
6. Make service readiness fail when any mandatory dependency prevents safe
   service and ensure exhausted health-check retries are never masked.
7. Test two concurrent workers, mixed attempt counts, future backoff, stale
   locks, newly arriving events, poison messages, process interruption, and
   SIGTERM during database, storage, and SMTP work.
8. Enforce composite ReadinessSnapshot projectId/workPackageId integrity and all
   other critical foreign keys, uniqueness, checks, optimistic-concurrency, and
   membership predicates.
9. Validate persisted readiness JSON with a runtime schema on both write and
   read. Surface controlled corruption errors and metrics instead of trusting
   malformed data.
10. Preserve immutable NCR source attribution and terminal actor/timestamp
    attribution.
11. Use truthful expand, backfill, validate, and contract migrations with
    before/after reconciliation and no fabricated legacy provenance.
12. Verify the runtime database role cannot update or delete audit events and
    that the existing append-only PostgreSQL triggers remain effective.
13. Add fault-injection tests for database, queue, storage, IdP, SMTP, network,
    and process interruption.
14. Emit structured logs, metrics, and trace correlation for claim, retry,
    readiness, shutdown, corruption, and terminal decisions.

**Verification and evidence:**

- Deterministic per-event claim and retry tests including exhausted, recovered,
  mixed-attempt, future-backoff, new-arrival, and terminal cases.
- Concurrent worker, supervised-startup, graceful-shutdown, duplicate-delivery,
  poison-message, and partial-failure tests.
- Blank and populated migration tests with constraint verification.
- ReadinessSnapshot composite-integrity, persisted-JSON corruption, NCR
  attribution, and reconciliation evidence.
- Database-role tests proving audit records cannot be updated or deleted by the
  runtime role.
- Readiness tests against real unavailable and degraded dependencies.

**Exit gate:**

- Readiness status matches actual ability to serve safely.
- Retried work is per-event, bounded, observable, idempotent, and recoverable;
  no exhausted event remains PENDING.
- Database constraints protect critical invariants independently of application
  code.
- Existing audit immutability is verified under the actual runtime role, and
  organization creation has transactional audit evidence from Phase 1.

**Estimated effort:** 2–4 engineering weeks.

## Phase 6 — Shared frontend, capability, and locale foundation

**Objective:** Standardize frontend behavior so users see accurate permissions,
errors, state, and environment context.

**Phase goal:** Replace scattered page-specific behavior with shared,
well-tested primitives for capabilities, actions, errors, session handling, and
environment and locale safety before building the remaining workflows.

**Required work:**

1. Generate or validate typed client contracts from the accepted OpenAPI source.
2. Introduce a shared ActionState model covering idle, submitting, success,
   retryable failure, terminal failure, conflict, and unauthorized states.
3. Normalize API errors, safely expose request/correlation identifiers, map
   field errors, preserve user input, focus an accessible error summary, and
   announce outcomes.
4. Keep one stable idempotency key across a logical retry, prevent double
   submission, send expected versions, and handle stale-version conflicts.
5. Consume server-issued capabilities for presentation only; server
   authorization remains authoritative.
6. Implement reliable logout, session expiry, stale-membership handling, and
   safe redirect behavior.
7. Add unmistakable non-production environment indicators and prevent
   configuration leakage.
8. Standardize loading, empty, permission-denied, not-found, conflict, pending,
   retry, and terminal states, including intentional route loading.tsx,
   error.tsx, and not-found.tsx behavior.
9. Validate nested object and project URL context instead of trusting route
   composition.
10. Make the current membership and organization selection and display explicit
    and accessible; mark current navigation with aria-current.
11. Establish typed equal-key English and Indonesian catalogs, validated locale
    selection, dynamic document language, English fallback, build-time
    missing-key failure, and central Jakarta, currency, quantity, percentage,
    decimal, and null formatters. Full migration and language review occur in
    Phase 11.
12. Establish reusable form, validation, notification, focus, and confirmation
    patterns.
13. Remove UI branches that infer authority from role names or client-local
    assumptions.

**Verification and evidence:**

- Component and integration tests for shared states and normalized errors.
- Contract-drift check against OpenAPI.
- Session-expiry, membership-switch, logout, and permission-change E2E tests.
- Double-submit, stable-idempotency-key retry, stale-version, field-error,
  URL-context, and request-ID tests.
- Typed catalog equality, missing-key, formatter, and dynamic-language tests.
- Accessibility checks for focus and announcements in shared components.

**Exit gate:**

- Every mutation form and command uses the shared reliability primitives; no
  throw-only or silently discarded server failure remains.
- The UI never treats visibility as authorization.
- Server errors remain visible, actionable, and traceable.
- Session and environment behavior is consistent across the application.
- The locale and formatter foundation is mandatory for all UI added after this
  phase.

**Estimated effort:** 2–4 engineering weeks.

## Phase 7 — Purchase-order revision and supplier commitments

**Objective:** Complete purchase-order revision and supplier commitment
workflows without mutating history or guessing quantities.

**Phase goal:** Deliver an authorized, versioned, auditable PO revision and
commitment flow using the shared frontend foundation.

**Required work:**

1. Create every PO revision as a retained new revision with expected version,
   reason, allocation editing, immutable prior revision, and an explicit
   current-versus-proposed diff.
2. Preserve original and latest supplier commitments as distinct records; do
   not present commitment changes as the PO-revision diff.
3. Require explicit supplier commitment line selection. A selected line records
   an append-only commitment date revision; an omitted line retains its prior
   date or pending state and is never populated or submitted implicitly.
4. Show ordered quantity plus original and latest commitment dates. Do not add a
   supplier-entered committed-quantity concept without an explicit product
   decision and corresponding domain, API, authorization, migration, and test
   change.
5. Handle rejection, resubmission, stale version, concurrent revision,
   duplicate command, and selected-line date revision without direct state
   assignment.
6. Apply the Phase 1 context and audit attribution to every read, diff,
   transition, and line-level mutation.
7. Update product requirements, domain model, OpenAPI, authorization matrix,
   operator guidance, and historical display behavior.

**Verification and evidence:**

- Unit, integration, authorization, concurrency, and E2E tests for every
  revision and commitment path.
- Tests proving prior revisions and original commitments never change.
- Selected/unselected commitment-line date, pending-state, stale-version, and
  retry tests. Partial-quantity tests apply only to PO allocation and order
  quantities, not supplier commitment dates.
- Purchasing and supplier UAT with retained audit evidence.

**Exit gate:**

- PO revision and supplier commitment are complete without hidden manual work.
- History is immutable, current-versus-proposed differences are accurate, and
  unselected lines are unchanged.
- Every command is authorized, idempotent, version checked, auditable, and uses
  the Phase 6 action-state behavior.

**Estimated effort:** 2–4 engineering weeks.

## Phase 8 — ASN, receiving, and immutable corrections

**Objective:** Complete partial shipment and receipt workflows while preserving
authoritative quantities and correction history.

**Phase goal:** Deliver explicit line-selection, remaining-quantity, split
receipt, cancellation, and correction behavior without destructive edits.

**Required work:**

1. Require explicit ASN line selection and show authoritative
   remaining-shippable quantity for each eligible line.
2. Support partial shipment, overage policy, duplicate command, cancellation,
   and concurrency. Follow the product requirement: an ASN is cancelled and a
   new ASN is created; do not invent an ASN correction command.
3. Require explicit receipt line selection, support split receipts, and show
   authoritative remaining-receivable quantities.
4. Keep receipt quantity fields blank until intentionally entered; never default
   them to the full remaining quantity.
5. Record goods-receipt corrections as immutable correcting entries linked to
   the original. Never rewrite received or audit history.
6. Preserve ordered, committed, shipped, received, accepted, rejected,
   quarantined, corrected, and remaining invariants under concurrency.
7. Apply Phase 1 authorization and Phase 6 action-state, idempotency, conflict,
   and accessible-error behavior throughout.
8. Update governing documents, contracts, audit display, and operator guidance.

**Verification and evidence:**

- Partial, split, overage, cancellation/new-ASN, correction, retry, and
  concurrency tests.
- Tests proving blank defaults, line omission, cumulative invariants, and
  immutable correction history.
- Supplier and warehouse role-based E2E and UAT evidence.

**Exit gate:**

- Every partial and exceptional shipment/receipt path preserves quantities,
  authorization, state, and audit attribution.
- No receipt or ASN field silently submits an inferred quantity or line.
- Corrections are additive and immutable; no historical record is rewritten.

**Estimated effort:** 2–4 engineering weeks.

## Phase 9 — Documents, evidence, and inspection configuration

**Objective:** Complete usable document, attachment, photograph, and QA
configuration workflows on top of the immutable evidence model from Phase 3.

**Phase goal:** Make every supported document association, upload lifecycle,
inspection definition, and historical snapshot operable and auditable.

**Required work:**

1. Support generic document association to project, work package, BOM,
   requisition, and PO with same-project validation and server-side
   authorization.
2. Display newly uploaded ASN documents and receipt photographs immediately
   with upload progress, retry, checksum, scan, quarantine, review, approval,
   preview/download, retention, and audit state.
3. Define removal narrowly as abandoning an incomplete upload or removing a
   pre-initiation client selection where policy permits. Never delete a
   persisted or approved version, evidence link, association/history, or audit
   record; rejection and supersession are retained lifecycle commands.
4. Enforce the immutable DocumentVersion and SHA-256 provenance rules from Phase
   3 for inspection evidence and every evidence-dependent transition.
5. Support inspection-definition create, update, and deactivate with measurement
   UOM, precision, required evidence, versioning, and historical snapshot
   retention.
6. Replace the current first-100 inspection-item chooser with bounded searchable
   selection that can reach every authorized item.
7. Keep configuration policy in the domain/application layer rather than
   hard-coded presentation branches.
8. Apply Phase 1 authorization and Phase 6 action, error, idempotency, URL
   context, locale, and accessibility primitives throughout.
9. Update requirements, domain model, security model, authorization matrix,
   OpenAPI, retention guidance, and operator instructions.

**Verification and evidence:**

- Association, same-project, cross-project denial, upload, scan, quarantine,
  approval, rejection, supersession, and download isolation tests.
- Direct API and database negative tests proving persisted versions, approved
  versions, evidence links, associations/history, and audit records cannot be
  deleted through a removal path.
- Search tests beyond 100 items and at all pagination boundaries.
- Inspection-definition update/deactivate, UOM, precision, and historical
  snapshot tests.
- QA/QC, warehouse, purchasing, and auditor E2E and UAT evidence.

**Exit gate:**

- Every required association and post-upload state is visible and authorized.
- Finalized evidence remains pinned to immutable approved bytes.
- Removal cannot erase retained document, association, evidence, or audit
  history.
- Inspection definitions are maintainable without changing historical results.
- No supported item is unreachable because of a hidden client or API cap.

**Estimated effort:** 2–5 engineering weeks.

## Phase 10 — Bounded APIs and performance

**Objective:** Remove unbounded reads, N+1 behavior, unstable pagination, and
avoidable memory growth.

**Phase goal:** Give every list, report detail, attachment collection, and
inspection query an explicit, tested resource bound.

**Required work:**

1. Inventory all list and relation-loading endpoints and measure their query
   count, row count, payload size, memory use, and latency.
2. Replace unbounded inspection and related N+1 paths with batched or set-based
   repository queries.
3. Choose bounded deterministic pagination per endpoint. Preserve page/page-size
   and totals where explicit page navigation is required; use cursors only when
   an accepted API contract or ADR justifies them. Document stable ordering,
   filters, maximum page sizes, and total-count behavior.
4. Bound exports and expensive reports with asynchronous jobs where needed.
5. Apply request body, upload, result, concurrency, and timeout limits at every
   relevant boundary.
6. Add indexes only with migration, query-plan, write-cost, and maintenance
   evidence.
7. Fix readiness history beyond 100, administration organization-request
   fan-out, inspection item search, and batched attachment/evidence reads.
8. Replace raw-UUID report inputs with authorized searchable project and
   supplier selectors, add material-report filters, and preserve filter, sort,
   and page state in the URL.
9. Introduce bounded summary DTOs instead of loading complete objects where the
   view does not need them.
10. Publish approved service-level and dataset-size assumptions plus browser
    payload, rendering, client-JavaScript, upload-memory, and Web Vitals
    budgets.
11. Add API, database, worker, and browser performance regression tests at
    representative and peak volume.

**Verification and evidence:**

- Query-count assertions and captured query plans.
- Load tests for large inspections, reports, attachments, and role-scoped lists.
- Memory, latency, error-rate, and database-saturation results.
- Stable-pagination tests under concurrent insertion and update.
- Browser payload, rendering, Web Vitals, client-JavaScript, and upload-memory
  results for supported devices.

**Exit gate:**

- No production endpoint has an undocumented unbounded data path.
- Former N+1 paths meet approved query-count and latency budgets.
- Pagination is stable, authorized, and contract documented.
- Search, filters, sort, and page state remain usable and reproducible.
- Peak-load tests pass without unsafe database or memory saturation.

**Reopen triggers:** New list endpoints, indexes, query patterns, or volume
assumptions.

**Estimated effort:** 2–4 engineering weeks.

## Phase 11 — Localization, accessibility, and responsive operation

**Objective:** Make the supported user experience correct across languages,
assistive technology, timezones, and required device sizes.

**Phase goal:** Remove remaining hard-coded production strings and meet the
approved accessibility and responsive-support standard.

**Required work:**

1. Move every user-facing string, validation message, status, notification, and
   error into typed equal-key English and Indonesian catalogs, except explicitly
   approved product names and machine values.
2. Validate the user locale, provide an accessible language switcher, set the
   document language dynamically, use English fallback, and fail the build on a
   missing or unequal key.
3. Centralize Asia/Jakarta instant and date-only behavior plus IDR, metric
   quantity, decimal, percentage, and null formatting. Prohibit argument-less
   toLocaleString and UTC-sliced defaults for local inputs.
4. Obtain native or fluent Indonesian domain review of all critical journeys.
5. Meet WCAG 2.2 AA across semantic structure, skip navigation, keyboard access,
   aria-current, aria-sort, focus order and restoration, focus-not-obscured,
   labels, descriptions, error association, live announcements, contrast,
   forced colors, reduced motion, target size, zoom, and status meaning.
6. Use at least 44 px targets generally and 48–52 px targets for warehouse and
   QA/QC operation unless an independently reviewed exception satisfies WCAG.
7. Make data tables operable with associated headers and accessible card or
   alternate views at supported widths.
8. Test at minimum a 390×844 phone, 768×1024 tablet in portrait and landscape,
   and the approved desktop matrix, with keyboard, touch, 200% and 400% zoom,
   forced colors, and reduced motion.
9. Add automated checks plus manual supported screen-reader, keyboard, touch,
   zoom, and responsive testing.
10. Ensure error and state meaning never depends only on color, position, or
    untranslated codes.

**Verification and evidence:**

- Missing-key and pseudo-localization checks.
- Locale and timezone E2E matrix.
- Automated accessibility scan plus manual review with zero unresolved WCAG
  2.2 A or AA violation; only independently reviewed false positives may be
  excluded.
- Manual keyboard and supported screen-reader evidence.
- Responsive screenshots or visual-regression evidence at approved breakpoints.

**Exit gate:**

- No user-facing string bypasses localization except approved product names and
  machine values.
- All supported workflows satisfy WCAG 2.2 AA and the required manual checks.
- Supported locales, timezones, browsers, and viewports pass their matrix.

**Estimated effort:** 2–5 engineering weeks.

## Phase 12 — Architecture, maintainability, and documentation closure

**Objective:** Remove structural debt that would make production operation or
future changes unsafe.

**Phase goal:** Prove modular boundaries, eliminate oversized responsibility
clusters, and align documentation with the implemented system.

**Required work:**

1. Run a complete controller-to-service-to-policy/domain-to-repository boundary
   audit.
2. Remove direct Prisma access outside repositories and presentation-layer
   business rules.
3. Split oversized modules by cohesive responsibility without changing accepted
   behavior.
4. Centralize duplicated policy, validation, transition, query, and error
   behavior.
5. Close strict-type escapes, unsafe casts, ignored compiler errors, and stale
   dead code.
6. Document new architecture decisions and dependency decisions as ADRs.
7. Align requirements, architecture, domain model, security model,
   authorization matrix, API conventions, test strategy, runbooks, and
   implementation status.
8. Add an automated architecture restriction that prevents Prisma access
   outside approved repositories or infrastructure adapters and enforces all
   other mandatory production-code boundaries. Only an accepted ADR may change
   a governing invariant.

**Verification and evidence:**

- Boundary scan and architecture-test results.
- Complexity and duplication review of changed critical modules.
- No undocumented direct persistence access or business-state mutation.
- Documentation review by engineering, security, product, and operations.

**Exit gate:**

- All production code conforms to the documented modular architecture.
- The automated boundary restriction passes and cannot be bypassed by an
  undocumented adapter.
- No known structural defect blocks safe maintenance or operation.
- Documentation and OpenAPI describe the behavior that actually ships.
- The full core source and database gates pass before dependency freeze.

**Estimated effort:** 2–5 engineering weeks.

## Phase 13 — Dependency convergence and application-security hardening

**Objective:** Converge and validate the application dependency set after
workflow completion and close remaining application-layer security risks.

**Phase goal:** Produce a supported, minimal dependency graph and a hardened
application candidate with no unresolved release-blocking security finding.

**Required work:**

1. Inventory direct, transitive, development, build, and runtime dependencies.
2. Revalidate the Phase 2 fixes for fast-uri, brace-expansion, js-yaml, and
   nanoid, then upgrade, replace, pin, or remove every remaining vulnerable or
   unsupported dependency.
   Document necessity, security impact, maintenance ownership, and compatibility
   for every added or retained high-risk dependency.
3. Enforce lockfile integrity and deterministic installation.
4. Harden sessions, cookies, CSRF protection, CORS, CSP, security headers,
   redirects, rate limits, abuse controls, input limits, logging redaction, and
   error disclosure.
5. Implement indexed and bounded cleanup of expired OIDC transactions and
   expired or revoked sessions using approved retention periods and
   multi-replica-safe leadership.
6. Use shared Redis or approved edge throttling with explicit trusted-proxy
   configuration, spoofing tests, and documented fail-open or fail-closed
   behavior when the limiter is unavailable.
7. Remove production script unsafe-inline and prove a nonce- or hash-based CSP
   in a production Next.js build.
8. Review authentication and authorization attack paths using the Phase 1
   context model.
9. Scan for secrets, insecure cryptography, command or query injection, SSRF,
   path traversal, unsafe deserialization, and upload/download bypass.
10. Generate an SBOM and record licenses and policy exceptions.
11. Run security tools against production-mode builds, not only source.
12. Fix every validated release-blocking finding and rerun the complete security
    gate after each material change.

**Verification and evidence:**

- Clean deterministic install and build.
- Dependency audit, secret scan, static analysis, dynamic security tests, and
  authorization suite results.
- Session, rate-limit, CSP, upload, redirect, and error-disclosure tests.
- SBOM, license report, exception register, and independent security sign-off.

**Exit gate:**

- Zero unresolved Critical or High vulnerability and zero unresolved P0 or P1
  audit finding. Business approval alone cannot override a security gate.
- A repository-supported, advisory-specific disposition may be used only when
  it makes the policy command pass and has security ownership and expiry.
- Lower-severity, genuinely non-requirement residual risks have owner,
  compensating control, expiry, and explicit approval.
- The dependency graph is supported, deterministic, documented, and ready for
  the immutable artifact freeze in Phase 14.
- All application security gates pass.

**Reopen triggers:** Any later source, dependency, build-tool, provider
integration, or security
configuration change.

**Estimated effort:** 2–6 engineering weeks, plus vendor lead time.

## Phase 14 — Supported identity, object storage, CI, and artifact supply chain

**Objective:** Replace non-production components and produce trusted immutable
release artifacts.

**Phase goal:** Qualify the supported identity provider, supported object
storage, and artifact pipeline using production-equivalent configurations.

**Required work:**

1. Qualify the supported identity and object-storage providers selected in
   Phase 0. Production must use a supported object store; MinIO may remain
   development-only.
2. Define identity realms or tenants, clients, OIDC/PKCE flows, claims,
   membership hints, keys, rotation, MFA, recovery, service accounts, logout,
   session lifetime, revocation, clock skew, metrics, backup/restore, realm
   import or migration, and break-glass access.
3. Define storage encryption, bucket policy, object ownership, presigned access,
   malware scanning, quarantine, retention, legal hold, deletion, replication,
   lifecycle, and audit events.
4. Build a provider-contract suite covering signed PUT, HEAD metadata, checksum,
   KMS headers, anonymous denial, cross-object privacy, versioning, scanning,
   restore, latency, and failure.
5. Inventory every existing object and checksum, migrate to the supported store,
   reconcile all bytes and metadata, adapt backup and restore tooling, rehearse
   cutover, and retain a tested rollback path.
6. Remove development images, mutable tags, embedded credentials, and
   environment-specific defaults from production manifests.
7. Pin every third-party GitHub Action to a full commit SHA and every base and
   runtime image to an immutable digest. Use least-privilege workflow
   permissions, isolated fresh test databases, protected release environments,
   and an immutable registry.
8. Build web and service artifacts against the exact Phase 0 endpoint matrix,
   including build-time public API values, then derive candidate versions from
   the source revision and verify OCI labels, source SHA, lockfile digest, image
   digest, endpoint values, and manifest linkage.
9. Reconcile the final deployment manifests against
   security/container-scan-policy.json, remove stale entries, add omissions, and
   freshly scan every unique final release image by digest. Explicitly close the
   recorded Keycloak findings if Keycloak remains in the final topology.
10. Generate provenance, SBOM, signatures or policy-approved attestations, and
    immutable artifact identifiers.
11. Test identity and storage failure, latency, key rotation, access revocation,
    and regional or provider degradation.
12. Update threat model, ADRs, runbooks, support ownership, and provider exit
    strategy.

**Verification and evidence:**

- Real-provider integration tests in a production-like environment.
- Realm migration/import, OIDC/PKCE, claims, MFA, logout, metrics,
  backup/restore, and full authentication/browser regression evidence.
- Cross-membership and cross-object access tests.
- Object checksum inventory, migration reconciliation, cutover, rollback, and
  provider-contract evidence.
- Reconciled deployment-manifest/scan-policy inventory and fresh scan of every
  unique final release image, with zero unresolved Critical or High finding and
  no stale or omitted entry.
- Artifact provenance and digest verification.
- CI branch protection, required-check, full-SHA Action, least-privilege,
  isolated-database, registry, protected-environment, version, and OCI-label
  evidence.
- Identity, storage, security, and platform owner sign-off.

**Exit gate:**

- Only supported production components and immutable artifacts remain; MinIO is
  absent from production.
- Identity claims and the server-derived qualifying membership bind correctly
  to the Phase 1 model.
- Object access, scanning, encryption, retention, and audit controls pass.
- Artifacts can be independently reproduced or verified according to policy and
  are frozen by source, dependency, image, manifest, and digest.
- Embedded public endpoints exactly match the approved Phase 0 matrix, and all
  Phase 0 CI immutability controls are revalidated for the final artifacts.

**Reopen triggers:** Provider, image, claim, storage-policy, dependency, or build
change.

**Estimated effort:** 3–8 engineering weeks, plus procurement and provider lead
time.

## Phase 15 — Production platform, secrets, TLS, and KMS

**Objective:** Build a reproducible, least-privilege production platform without
placeholder infrastructure or manually managed secrets.

**Phase goal:** Provision the production-equivalent environment entirely from
reviewed configuration and prove every trust boundary and secret lifecycle.

**Required work:**

1. Implement reviewed infrastructure as code for network segmentation,
   compute, database, queue, object storage, identity integration, DNS, TLS,
   KMS, secret manager, logs, metrics, traces, backups, and artifact access.
2. Define separate accounts, projects, subscriptions, or equivalent isolation
   for production and non-production.
3. Provision and verify the exact Phase 0 endpoint matrix, including public web
   and API URLs, DNS, CORS, OIDC issuer/callback, identity hostname, proxy hops,
   internal names, and the values embedded in Phase 14 artifacts.
4. Expose only approved TLS ingress publicly. Keep database, Redis, storage
   administration, IdP administration, ClamAV, metrics, and other control
   surfaces private and prove reachability and denial from every relevant zone.
5. Apply least-privilege service identities, database roles, security groups,
   firewall rules, network policies, administrative access, exact trusted-proxy
   hop configuration, and controlled egress.
6. Run containers and processes as non-root with read-only filesystems where
   supported, dropped Linux capabilities, no privilege escalation, explicit
   writable mounts, health checks, and CPU, memory, and process limits.
7. Require PostgreSQL encryption in transit and at rest, HA, PITR, restricted
   administration, and tested connection limits. Require Redis
   authentication, TLS, approved durability and eviction behavior, private
   access, and recovery behavior.
8. Prohibit application-startup migrations. Migrations run as a separate,
   least-privilege, one-shot release task.
9. Design database, object, identity, and infrastructure backups to the RPO,
   RTO, retention, failure-domain, and capacity decisions approved in Phase 0.
10. Implement the existing external production-control contract in
    infra/production/README.md. Keep external control files outside the
    repository, deliver secrets through approved _FILE interfaces, verify file
    ACLs, and retain only the preflight's safe summary.
11. Store no production secret in source, images, CI logs, manifests, examples,
    or local defaults. Define generation, delivery, rotation, revocation,
    break-glass, auditing, and ownership.
12. Validate the TLS chain, SAN, hostname, private-key match, trust and revocation
    behavior, renewal, and rotation.
13. Prove KMS-backed encrypted write/read, denial of unencrypted write, denial of
    anonymous access, object versioning, key separation, and key rotation.
14. Enforce modern TLS and encrypted service-to-service communication where
    required.
15. Add policy-as-code, IaC validation, drift detection, environment preflight,
    and destructive-change controls.
16. Produce a candidate-bound external manifest, environment inventory,
    data-flow diagram, responsibility matrix, operating cost baseline, and
    support escalation path.

**Verification and evidence:**

- Reproducible provisioning into a clean production-like environment.
- IaC scan, policy checks, network reachability tests, and drift report.
- Secret and certificate rotation exercises.
- KMS and encryption verification for data in transit and at rest.
- Successful production-control policy tests plus individual secret-file, ACL,
  TLS, KMS, provider, endpoint, reachability, runtime, PostgreSQL, Redis, and
  migration-mode checks. The complete pnpm production:preflight is deferred
  until Phase 16 creates and restores the required off-site backup.
- Least-privilege review by platform, security, identity, and database owners.

**Exit gate:**

- Production can be recreated from versioned, reviewed inputs.
- No placeholder, development-only, mutable, or manually hidden dependency is
  part of the deployment.
- Secrets, TLS, KMS, network, and administrative controls pass end to end.
- Only TLS ingress is public; private services are unreachable externally;
  trusted-proxy, egress, non-root, read-only, dropped-capability, resource-limit,
  PostgreSQL HA/PITR, Redis security/durability, and no-startup-migration checks
  pass.
- Deployed endpoints and embedded artifact values match the approved matrix.
- External files, _FILE delivery, ACLs, TLS identity, encrypted-write and
  anonymous-denial checks satisfy infra/production/README.md.
- All external resources have named owners and support arrangements.

**Estimated effort:** 4–10 engineering weeks, plus procurement and change-window
lead time.

## Phase 16 — Backup, DR, monitoring, paging, and capacity

**Objective:** Prove that the service can be detected, supported, recovered, and
scaled under realistic failure and demand.

**Phase goal:** Meet approved SLO, recovery, alerting, and capacity targets using
real production-equivalent systems.

**Required work:**

1. Confirm the Phase 0 SLIs, SLOs, error-budget policy, availability, latency,
   throughput, RPO, RTO, retention, and capacity decisions remain valid; any
   change reopens the affected platform design.
2. Implement actionable dashboards and at least the repository's current
   minimum 17 alert rules for application, workers,
   database, queue, identity, storage, certificates, backups, security events,
   saturation, and business workflow failures, with at least 30-day monitoring
   retention and public metrics access denied.
3. Route alerts through the real paging path with severity, deduplication,
   escalation, ownership, alternate delivery, and runbook links. Prove real
   firing and resolved notifications, primary acknowledgement within 15
   minutes, and controlled no-ack secondary escalation.
4. Create a coordinated, checksummed complete-set backup containing application
   PostgreSQL, Keycloak data/configuration, the complete object set, and required
   infrastructure state.
5. Copy the complete set to a separate approved account, region, or failure
   domain using a distinct approved backup KMS key, immutable or versioned
   retention, a complete-set marker, and remote checksum verification.
6. Use a provider-specific procedure to restore from the off-site copy into a
   clean isolated environment and verify counts, checksums, OIDC, core business
   flows, supplier isolation, audit history, and measured RPO/RTO. This is
   separate from the local Compose restore-regression script.
7. Run representative, peak, soak, spike, and degraded-dependency load tests for
   at least 30 minutes, 10 clients, and 10,000 requests.
8. Require errors no greater than 1%, p95 no greater than 1,000 ms, p99 no
   greater than 2,000 ms, resource headroom of at least 30%, and queue recovery
   no greater than 300 seconds, unless Phase 0 approved a stricter target.
9. Tune autoscaling, connection pools, worker concurrency, queue behavior,
   database capacity, timeouts, and rate limits from measured evidence.
10. Validate runbooks through game days, including rollback, provider outage,
    credential compromise, data corruption, and queue backlog.
11. Establish on-call rota, support handoff, incident process, status
    communication, and post-incident review process.
12. Add the witnessed backup/restore result to the external production-control
    manifest and pass pnpm production:preflight, retaining only its safe
    summary.
13. Bind the monitoring, on-call/paging, and capacity results to the provisional
    candidate and pass pnpm operations:preflight. Keep training and approvals in
    the release packet rather than claiming the current schema verifies them.

**Verification and evidence:**

- Successful witnessed off-site restore and DR report with complete-set,
  checksum, identity, object, business, isolation, and measured RPO/RTO proof.
- End-to-end page acknowledgement and escalation evidence.
- Load, soak, failure, and recovery results meeting the stated quantitative
  thresholds.
- Successful production and operational preflights using their correct,
  non-overlapping evidence schemas.
- Dashboard and runbook review by SRE, engineering, security, and domain owners.

**Exit gate:**

- Recovery meets approved RPO and RTO with reconciled data.
- Critical failures create actionable pages received by the accountable person.
- At least 17 rules, 30-day retention, denied public metrics, firing/resolved
  messages, 15-minute acknowledgement, secondary escalation, and alternate
  delivery are proven.
- Capacity targets pass with approved headroom and graceful degradation.
- Candidate-bound production preflight passes after the off-site restore.
- Candidate-bound operational preflight passes.
- On-call staff can execute validated runbooks without undocumented knowledge.

**Reopen triggers:** Schema, provider, topology, workload, SLO, retention, or
operational ownership change.

**Estimated effort:** 3–8 engineering weeks plus observation time.

## Phase 17 — Immutable staging, security review, UAT, and final qualification

**Objective:** Qualify one exact release candidate in a production-equivalent
environment and make an evidence-based go/no-go decision.

**Phase goal:** Obtain all technical, security, operational, product, and
business approvals for an immutable artifact and configuration set.

**Required work:**

1. Freeze source SHA, lockfile, migrations, artifacts, image digests, IaC,
   configuration schema, feature flags, SBOM, and evidence index.
2. Deploy those exact artifacts to a clean production-equivalent staging
   environment using the production procedure.
3. Run the full core, database, security, supply-chain, external-service,
   performance, accessibility, localization, backup, DR, and paging gates.
4. Perform an independent threat-model review and attack-path validation focused
   on authorization, identity, uploads, reports, audit records, and operations.
5. Conduct role-based UAT with project management, engineering-domain, PPIC,
   purchasing, suppliers, warehouse, QA/QC, production, finance-readonly,
   management, auditors, administrators, support, and business owners. A role
   without a critical journey requires a documented product-owner rationale.
6. Run applicable critical journeys in English and Indonesian and on the
   approved phone, tablet portrait/landscape, desktop, browser, keyboard, touch,
   and assistive-technology matrix.
7. Rehearse migration, deployment, smoke testing, rollback, forward recovery,
   data reconciliation, and incident communication.
8. Close every release blocker. Any candidate-changing fix creates a new
   candidate and reruns all invalidated evidence.
9. Assemble the release packet: evidence, residual risks, approvals, runbooks,
   support plan, change window, rollback thresholds, and decision record.

**Verification and evidence:**

- Clean full-gate result tied to immutable identifiers.
- Independent security assessment and remediation closure.
- Signed UAT outcomes for all critical roles and workflows.
- Fresh provider-specific off-site restore evidence plus the separate local
  Compose restore-regression result.
- Successful deployment and rollback rehearsal.
- Complete evidence index with no placeholder or expired artifact.

**Exit gate:**

- Zero unresolved Critical or High vulnerability, zero unresolved P0 or P1 audit
  finding, and zero known release-blocking defect. Business approval cannot
  override a technical security gate.
- All required reviewers and operational owners sign the exact candidate.
- The release manager can reproduce every artifact and locate every proof.
- The business sponsor issues the formal go decision and the candidate becomes
  **READY FOR PRODUCTION / APPROVED TO DEPLOY**. This is distinct from the
  post-deployment program closure in Phase 18.

**Reopen triggers:** Any source, dependency, migration, image, IaC, provider,
configuration, feature-flag default, or release-procedure change.

**Estimated effort:** 2–4 engineering weeks, excluding remediation loops.

## Phase 18 — Controlled deployment and measurable hypercare

**Objective:** Release safely, detect regression quickly, and close the program
only after stable real-world operation.

**Phase goal:** Deploy the qualified candidate within approved guardrails and
demonstrate stable production operation through the defined hypercare period.

**Required work:**

1. Verify approvals, change window, staffing, artifacts, configuration, and a
   fresh coordinated off-site backup and restore point
   before deployment.
2. Verify artifact digests, migrations, rollback criteria, status messaging, and
   contact paths immediately before deployment.
3. Close traffic and deploy only the Phase 17 candidate using the rehearsed
   dark-deployment procedure.
4. Run migrations once as an explicit forward-only release step. Never run
   migrations implicitly during application startup, edit an applied migration,
   or alter audit history.
5. Wait for dependency-aware readiness before opening traffic.
6. Run read-only production smoke checks or use a dedicated synthetic canary
   tenant/project with retained auditable fixtures for authentication, membership
   selection, purchase orders, ASN, receiving, inspection, reports, evidence,
   workers, audit history, and administration.
7. Never delete audit or workflow evidence created by a synthetic canary.
8. Use canary, phased rollout, or another approved exposure control where the
   architecture permits.
9. Watch SLIs, security signals, business invariants, queue depth, errors,
   latency, saturation, and support contacts continuously through the risk
   window.
10. Close traffic immediately for cross-supplier exposure, audit loss,
    quantity/report inconsistency, checksum/encryption/quarantine failure,
    migration uncertainty, paging loss, a capacity or SLO threshold breach, or
    queue non-recovery.
11. Roll back application code only when schema compatibility was proven in
    Phase 17. Database migrations remain forward-only; an incompatible recovery
    uses a reviewed forward fix or an isolated restored replacement. Do not
    improvise away a safety threshold.
12. Reconcile database, object, queue, and audit state after migration and again
    after the observation window.
13. Maintain an owned hypercare ledger with severity, response target, decision,
    and customer communication.
14. Complete the post-release review and transfer remaining non-blocking work
    into the normal product backlog.

**Verification and evidence:**

- Deployment record tied to exact digests and configuration.
- Smoke, migration, and reconciliation results.
- Hypercare dashboards, incident record, and support metrics.
- Final operational and business-owner acceptance.

**Exit gate:**

- The approved measurable hypercare duration completes with SLO compliance,
  healthy paging, no stuck terminal work, and the approved number of consecutive
  successful off-site backups.
- No unresolved P0/P1 or Sev-1/Sev-2 incident, integrity discrepancy, security
  blocker, or critical workflow defect remains.
- Backup, paging, ownership, and support remain operational.
- IMPLEMENTATION_STATUS.md records the deployed version and verified
  limitations.
- The status becomes **PRODUCTION DEPLOYMENT VALIDATED / READINESS PROGRAM
  CLOSED** only now.

**Estimated effort:** Deployment window plus 1–4 weeks of hypercare.

## 8. Audit finding traceability

This table is the initial routing. Phase 0 must reconcile it against the
canonical audit ledger and add any omitted finding before Phase 1 starts.

| Audited problem                                                                               | Primary phase | Required downstream revalidation |
| --------------------------------------------------------------------------------------------- | ------------- | -------------------------------- |
| Dirty worktree and unreproducible source baseline                                             | 0             | Every phase                      |
| Missing owner-approved SLO, RPO, RTO, retention, provider, device, locale, and WCAG decisions | 0             | 15–18                            |
| Systemic multi-membership authorization scope mixing                                          | 1             | 3–10, 12–14, 17                  |
| Ambiguous human membership versus system-principal audit attribution                          | 1             | 5, 7–10, 17                      |
| Organization creation lacks transactional audit evidence                                      | 1             | 5, 17                            |
| Four recorded High dependency advisories                                                      | 2             | 13, 14, 17                       |
| Failing Keycloak and incomplete release-image scan                                            | 2             | 14, 17                           |
| Unsafe inspection defaults and client-derived conformance                                     | 3             | 8, 9, 17                         |
| Incorrect receiving time and seven-hour Jakarta shift                                         | 3             | 8, 11, 17                        |
| Evidence references mutable logical documents rather than exact bytes                         | 3             | 9, 14, 17                        |
| Incomplete attachment, scan, and evidence safety                                              | 3             | 9, 13, 14, 17                    |
| Supplier-report source-fact truncation                                                        | 4             | 10, 17                           |
| Partial-set filtering and missing limit-plus-one detection                                    | 4             | 10, 17                           |
| Decimal(30,6) values aggregated or compared through JavaScript Number                         | 4             | 10, 17                           |
| Business-readiness outbox claim/retry defect                                                  | 5             | 16, 17                           |
| Worker startup, shutdown, idempotency, and poison-message gaps                                | 5             | 16, 17                           |
| ReadinessSnapshot composite-integrity gap                                                     | 5             | 16, 17                           |
| Persisted readiness JSON lacks runtime read/write validation                                  | 5             | 16, 17                           |
| NCR source and terminal attribution gaps                                                      | 5             | 17                               |
| Runtime database-role audit immutability not verified                                         | 5             | 15, 17                           |
| Inconsistent frontend action, error, retry, and idempotency states                            | 6             | 7–11, 17                         |
| Client-side role assumptions and capability gaps                                              | 6             | 7–10, 13, 17                     |
| Logout, session, URL-context, and environment-indicator gaps                                  | 6             | 13, 17                           |
| Partial purchase-order revision and commitment workflow                                       | 7             | 10, 11, 17                       |
| Partial ASN, line selection, and remaining-shippable workflow                                 | 8             | 10, 11, 17                       |
| Partial receiving and destructive-correction risk                                             | 8             | 10, 11, 17                       |
| Incomplete generic document associations and post-upload display                              | 9             | 10, 11, 14, 17                   |
| Incomplete inspection-definition maintenance, UOM, precision, and item search                 | 9             | 10, 11, 17                       |
| Unbounded inspection queries and N+1 behavior                                                 | 10            | 16, 17                           |
| Incomplete pagination, filters, DTO bounds, and browser budgets                               | 10            | 16, 17                           |
| English/Indonesian localization and Jakarta/IDR formatting gaps                               | 11            | 17                               |
| Accessibility and responsive-operation gaps                                                   | 11            | 17                               |
| Oversized modules, direct persistence risk, and architecture drift                            | 12            | 13, 14, 17                       |
| Documentation and implementation-status drift                                                 | 12            | 17, 18                           |
| Vulnerable, stale, or unsupported dependency remainder                                        | 13            | 14, 17                           |
| OIDC/session cleanup, shared throttling, trusted proxy, and CSP gaps                          | 13            | 17                               |
| Unsupported identity image and incomplete IdP qualification                                   | 14            | 15–17                            |
| Archived MinIO production posture and missing object migration                                | 14            | 15–17                            |
| Mutable CI Actions/images, missing provenance, SBOM, or registry controls                     | 14            | 17                               |
| Placeholder production infrastructure and external manifests                                  | 15            | 16, 17                           |
| Secret-file, TLS identity, KMS, encryption, and network gaps                                  | 15            | 16, 17                           |
| Missing coordinated off-site backup and witnessed restore                                     | 16            | 17, 18                           |
| Missing monitoring, paging, on-call, and runbook proof                                        | 16            | 17, 18                           |
| Missing quantitative capacity and degradation evidence                                        | 16            | 17, 18                           |

## 9. Evidence invalidation rules

Later changes can invalidate earlier approval. At minimum:

| Change after a gate                                                                                                                                                                                          | Evidence that must be rerun                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization, identity claim, role, grant, protected repository query, field-shaping DTO, organization/project relation, pagination predicate, queue payload, document association, endpoint, or job change | Complete Phase 1 allow/deny/permutation/concurrency suite, security review, affected integration and E2E, UAT                                                          |
| Schema, migration, query, report, numeric rule, JSON shape, event, or retention change                                                                                                                       | Database gate, migration reconciliation, Phase 1 predicates, report reconciliation, backup/restore, capacity/performance, affected UAT                                 |
| Workflow, domain transition, or UI behavior change                                                                                                                                                           | Relevant unit, integration, authorization, idempotency, E2E, localization, accessibility, responsive, and UAT evidence                                                 |
| Source, dependency, lockfile, build tool, CI Action, base image, runtime image, or image policy change                                                                                                       | Core and authorization gates, dependency and image scans, SBOM, provenance, OCI linkage, production and operational preflights, capacity, exact-candidate staging, UAT |
| Identity provider, realm, client, key, claim, session, MFA, or identity image change                                                                                                                         | Phase 1, authentication/browser regression, IdP backup/restore, monitoring, paging, capacity, both external preflights, staging, UAT                                   |
| Object provider, storage policy, malware scanning, bucket, KMS, versioning, retention, or migration change                                                                                                   | Provider-contract suite, checksum reconciliation, evidence authorization, backup/restore, production preflight, operational preflight, staging and UAT                 |
| IaC, topology, network, database, queue, compute, provider, or scaling change                                                                                                                                | IaC/policy/drift checks, security review, production preflight, backup/DR, monitoring/paging, capacity, operational preflight, staging qualification                   |
| Secret, TLS certificate/trust, or KMS key rotation/change                                                                                                                                                    | ACL/TLS/KMS checks, production preflight, affected provider tests, monitoring, staging qualification                                                                   |
| Alert, SLO, capacity target, backup, on-call, or runbook change                                                                                                                                              | Phase 16 paging, restore, game-day, capacity and operational-preflight evidence plus affected final qualification                                                      |
| Release, migration, traffic-control, smoke, rollback, or forward-recovery procedure change                                                                                                                   | Clean deployment, migration, readiness, smoke, reconciliation, traffic-close, and recovery rehearsal                                                                   |

The release manager maintains the invalidation matrix in the evidence index and
must reject stale evidence.

## 10. Definition of ready-to-deploy and program completion

MECO Flow is **READY FOR PRODUCTION / APPROVED TO DEPLOY** only when Phases 0
through 17 have passed in order and:

1. Every Critical, High, P0, P1, requirement, and release-blocking finding is
   closed.
2. Any lower-severity, genuinely non-requirement residual risk is time bounded
   and has an owner, compensating control, expiry, security review, and explicit
   approval.
3. The exact deployed source, dependencies, images, migrations, IaC,
   configuration, and external resources are identifiable and reproducible.
4. Authorization, audit attribution, workflow invariants, reports, evidence,
   and data isolation pass negative and concurrency testing.
5. Production systems use supported identity and storage services with
   least-privilege, encryption, secret rotation, and immutable artifacts.
6. Backups restore successfully; DR, paging, capacity, and runbooks meet their
   approved targets.
7. Every supported role completes production-equivalent UAT, or the product
   owner documents why it has no critical journey, across the applicable
   English/Indonesian and device/browser/accessibility matrix.
8. No required test or approval is failing, skipped, stale, weakened, flaky, or
   based only on cached output.
9. Documentation, implementation status, evidence index, ownership, residual
   risks, and operational handoff are current.

The production-readiness program is **CLOSED** only after Phase 18 also passes:

1. The exact approved candidate is deployed and reconciled.
2. The measurable hypercare duration completes within SLO and error-budget
   policy.
3. The required consecutive off-site backups, healthy paging, queue recovery,
   and operational ownership are proven.
4. No unresolved P0/P1, Sev-1/Sev-2, integrity, security, or critical-workflow
   incident remains.

## 11. Schedule and planning assumptions

This is a dependency-constrained risk program, not a deadline promise. A
reasonable planning range is approximately 9–18 months for a staffed
cross-functional team; a small or single-engineer team may require 12–24 months
or more. Additional lead time may be required for identity, storage, cloud,
procurement, security assessment, and change-window coordination. Tasks inside
a phase may run in parallel only when they do not share safety-critical design
or evidence. Phase gates themselves remain sequential.

The estimate must be recalculated after Phase 0 establishes:

- team capacity and named owners;
- the true size of the dirty-worktree reconciliation;
- external provider and procurement lead times;
- production volume and SLO assumptions;
- migration and historical-data complexity; and
- the number and severity of new defects found by the loops.

Speed never authorizes skipping a gate.
