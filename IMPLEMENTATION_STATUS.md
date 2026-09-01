# Delivery phase and production-readiness phase

Phase 9C — staging deployment, isolated backup/restore rehearsal, and controlled
pilot preparation (deployment prepared 2026-07-30; restore and pilot acceptance
verified 2026-08-01). The production-oriented staging stack, controlled
migration, clean-target restore, real OIDC, pilot business flow, readiness,
permissions, and bidirectional supplier isolation are verified. The release
candidate is classified **NOT READY** because external pilot controls and
approvals remain incomplete. A Phase 0 diagnostic of the currently pinned
Keycloak 26.7.2 digest (updated 2026-08-30 from 26.7.0, previously 17 unresolved Critical/High) rescan pending; no vulnerability exception approved.
vulnerability exception is approved.
The full formatting/lint/type/unit/integration/
build gate and the complete 15-scenario browser gate are green on clean
isolated databases. This is not a production-readiness claim.

## Production-readiness remediation status — 2026-08-20

Master-plan **Phase 0 — Governance, decisions, and immutable baseline** is
**COMPLETE** at `24127a6` (clean, `verify-phase-zero-closure` PASS 2026-08-31/2026-09-01). Phase 1 is unlocked for explicit user authorization; Phase 2 remains locked.

The historical source-affecting Phase 0 candidate
`6d91208a6d5912508178f981f575ff4345e34430`
on `codex/phase-zero-candidate` adds or corrects repository controls. The
pre-repair pull-request head is
`c919ab1b5e86d9e12f75d4fdf6155a1ceab59f12`; intervening commits
`1f83021`, `96f3120`, and `c919ab1` change only closure-policy-permitted
readiness/evidence documentation paths. Source-affecting Phase 0 contract
repairs, typed production proposals, and regression coverage are committed at
`aa87b4e269bed660a761d6c36a1093a666addbd9`; source checkpoint
`d345afd3068870ce0e7a9aa496c15f82b1909f84` additionally refreshes the
fail-closed dependency inventory after registry drift. This is the current
implementation checkpoint, not the final Phase 0 candidate, which must be the
protected merge result on `main`. The source-affecting work
includes full-SHA
Actions, digest-pinned external Dockerfile/Compose/scan
references, exact Node/pnpm versions, Prisma generation and isolated MinIO in
CI, non-short-circuiting uncached command-level evidence with output hashes and
exact environment identity and zero-skip/test-total enforcement, root
documentation paths, executable governance and structured closure checks,
exact required suite manifests, and fail-closed database/test prerequisites.
Governance now cross-validates the executable
worktree path count against both the reconciliation record and P0R-01 evidence.
Every executable inventory row now carries its own exact allowed classification,
so missing, duplicate, stale, or unclassified paths fail closed. The same gate
performs a repeatable high-confidence secret-exposure probe without printing
matched values. Storage and application-image setup are now evidence-wrapped;
the nine project images are resolved to immutable IDs supplied through
fail-closed Compose variables, and a final workspace-cleanliness gate detects
source drift. The final build is wired to consume the production API URL only
from a future approved endpoint matrix and retain it in the environment identity. The container job
builds/pulls and scans the exact 14-image inventory with candidate-bound
retained evidence. Known Phase 2 dependency/image blockers are
retained as completed diagnostics without making Phase 0 depend on Phase 2
remediation. Typed decision, endpoint, supported-version, original-draft,
approval, remote-control, risk, defect, traceability, command-prerequisite, and
evidence records live in `docs/readiness/`; closure rejects status-only or
reused approvals and requires named role signers with stable identities,
distinct independent review, evidence digests, and exact subject/scope binding.
Closure additionally binds every approval identity and every blocker, defect,
risk, and traceability owner to the approved roster; requires a distinct
reviewer-operated reproduction run with non-overlapping artifacts; and verifies
supported versions plus lockfile/container-policy hashes against candidate
source bytes. A separate least-privilege finalization workflow now runs both
the local closure policy and a read-only authenticated GitHub verifier. The
external verifier downloads the two runs' artifacts and checks live repository,
workflow, job, actor, artifact, approval, remote-control, input-hash, endpoint,
and expiry data instead of trusting locally asserted IDs and digests.
Closure schema version 2 hashes stable, candidate-bound projections of the six
GitHub controls while still performing live authenticated readback; volatile
repository metadata cannot invalidate or accidentally satisfy a control.

This work is not a completed baseline. Pull request #1 exists for the committed
candidate, but it is not owner-approved or merged and has no independent
reviewer. Run `31707913394` failed all three required checks. Runs
`31712296742`, `31713053533`, and `31713790180` then passed
`dependency-review` but failed `verify` and `container-security`; their retained
artifacts remain diagnostics, not authoritative evidence. Those runs exposed
an E2E loopback-origin defect, an undefined container-verifier variable, and
the expected fail-closed rejection of the unapproved production endpoint and
the dependent project-image build. Commits `db503f3` and `e7db0eb` bind the
browser/OIDC flow to one loopback origin, add negative origin tests, and repair
structured container-scan-summary validation. Run `31716612512` for `db503f3`
was superseded and cancelled after dependency review passed and container
security failed. Replacement run `31717030980` for `e7db0eb` passed dependency
review and all 15 browser scenarios, proving the loopback/OIDC repair in clean
CI, but still failed `verify` because `endpoint_environment` and
`application_images` correctly rejected missing APR-backed endpoint approval.
`container-security` also failed: the repaired verifier ran without its former
exception and rejected endpoint/release-image evidence plus all 14 incomplete
scan reports. Both retained artifacts remain diagnostic. The run is not closure
evidence, and every separate approval/control requirement remains open. Before
the two expected approval-dependent verify failures, the clean run passed all
81 governance tests, 236 unit tests, 151 integration tests, 53 authorization
tests, formatting, lint, typecheck, OpenAPI, build, policy checks, Compose,
workspace cleanliness, and the 15 browser scenarios.
The integrated contract-repair worktree passes formatting, lint, typecheck,
OpenAPI, build, 44 unit files/236 tests, all 113 governance tests, nine
production-control tests, six operations-readiness tests, six capacity tests,
and all 22 container-policy/executable tests with zero skipped/todo. The raw
integration, authorization, and E2E commands still fail closed without their
required isolated database/Redis/S3 environment. Docker Desktop was started to
provide those prerequisites but its WSL engine could not start under the host's
current paging/resource limit, so no database-backed pass is claimed from this
worktree. After run `31717030980`, a
local follow-up corrected the scan verifier so an `identity-error` diagnostic is
not parsed as though it were a completed Trivy report. Final implementation run
`31718073882` at `e443e5b` verified that correction: the retained container
record contains only the two approval-dependent command failures and 14
incomplete scans, with zero false Trivy-format errors. Dependency review and all
executable verify gates again passed, including 15/15 browser scenarios; the
aggregate jobs still failed on the absent APR-backed endpoint and dependent
images. Commit `6d91208` then added only source-derived D-02/D-08/D-09
readiness values and the operator-ready human handoff. Run `31759036677`
evaluated that exact source: dependency review passed; governance 82/82, unit
236/236, integration 151/151, authorization 53/53, E2E 15/15, and every other
executable verify gate passed with zero skips/todos. Verify failed only
`endpoint_environment` and `application_images`; container evidence failed the
same endpoint/release-image prerequisites and retained 14 incomplete image
identities. No implementation regression appeared, and the run remains
diagnostic rather than closure evidence. Evidence-only commits `1f83021`,
`96f3120`, and `c919ab1` then produced runs `31759673383`, `31760236777`, and
`31760932202`. Each passed dependency review and the same executable verify
baseline, then failed only the unapproved endpoint, dependent application-image
build, and incomplete image-identity chain. Each retained separate verify and
container artifacts. These runs establish historical diagnostic coverage but
remain failed, unapproved, pull-request-event evidence and are not the required
protected-`main` authoritative or independent reproduction runs. The fix does
not alter that endpoint/provider approval blocker. Under the now-restricted
Actions policy, run `32382576019` at `8e93fed` passed the application and
governance suites but correctly detected a newly published fifth High
dependency advisory. Source checkpoint `d345afd` records that advisory without Phase 2
remediation. Follow-up run `32383852323` passed the refreshed dependency
baseline, dependency review, governance 113/113, unit 236/236, integration
151/151, authorization 53/53, E2E 15/15, build, policy, Compose, and workspace
checks; only the unapproved endpoint, dependent application-image build, and
14 incomplete image identities failed closed. The fail-closed closure check
correctly rejects the current incomplete record. The security audit still
reports the five exact High advisories recorded in `blockers.md`, all assigned
to locked Phase 2. A current diagnostic resolved 5/14 immutable image
identities: Redis passed, while Keycloak/Prometheus/Alertmanager/Blackbox
Exporter reported 17/28/48/30 blockers; all nine unbuilt project image
identities failed closed. Docker Engine `29.6.1` became available during the
Phase 0 continuation; the standalone `psql` client remains unavailable. On
fresh isolated Docker-backed PostgreSQL databases, all 22 migrations and the
authoritative seed completed, integration passed 29 files/116 tests,
authorization passed 14 files/53 tests, and the browser gate passed 15/15 with
isolated API/web ports. Failed missing-database, invalid-`APP_ENV`, occupied-port,
and changed-OIDC-issuer attempts were retained as diagnostics and did not touch
the developer database or services. These local dirty-worktree runs are not
authoritative baseline evidence. GitHub now reports that the repository is
public and `main` is protected with one approval, strict up-to-date enforcement,
the three required checks, stale-review dismissal, last-push approval,
conversation resolution, administrator enforcement, and force-push/deletion
denial. Only one collaborator is present, so the required independent approval
remains impossible. The `production` environment exists and is limited to
protected branches and administrator bypass is now disabled, but it has no
required-reviewer rule or least-privilege deployment secret. Self-review
prevention must be configured and read back together with real reviewers. This
mechanical hardening does not constitute approval. All
five governed Phase 0 labels now exist. Actions
are now restricted to the exact four required action patterns, both broad
GitHub-owned/verified toggles are disabled, full-SHA pinning is required, and
default workflow permissions remain read-only with pull-request approval
denied. This live mechanical control still needs canonical candidate-bound
evidence and named approval before Phase 0 closes. Public visibility remains
blocked because the available user intent is not an authenticated,
candidate-bound attestation. Production
providers/endpoints, exact browser support, SLO/RPO/
RTO/retention/capacity decisions, procurement/support ownership, and the human
owner/reviewer roster are unapproved. The project-image immutability mechanism
is committed in the candidate but its retained build/Compose evidence failed
validation. Release status therefore remains **NOT READY**.

## P0 technical hardening — 2026-08-30 (dirty worktree, not authoritative)

Phase 0 is **COMPLETE** — 2026-08-31 clean at `24127a6` (`verify-phase-zero-closure` PASS) — no governance, decision, endpoint, or control approvals were fabricated. This worktree applies the four offline REVIEW hardening items identified in the 2026-08-30 line-by-line review and the 2026-08-31 decision-log secondary-table/rebind (0a588d8->24127a6):

- turbo.json narrowed: removed S3_ACCESS_KEY and S3_SECRET_KEY from globalPassThroughEnv to avoid secret pass-through on build cache. S3_BUCKET, S3_ENDPOINT, S3_REGION remain as non-secret build inputs.
- apps/api/src/safe-api-exception.filter.ts hardened: non-/api/v1 responses now use the same generic error/requestId envelope instead of leaking exception.getResponse() (prevents Nest validation details on non-API routes).
- apps/api/src/app.module.ts distributed throttling: ThrottlerModule now uses RedisThrottlerStorage (apps/api/src/throttler-redis.storage.ts) when REDIS_URL is set and APP_ENV != test; otherwise falls back to in-memory. This addresses the documented process-local limitation without breaking local/test runs.
- apps/web/middleware.ts added: edge redirect for /internal/* and /supplier/* without mecoflow_session to /login?returnTo=, and /login with session to /. Existing server-side requireMe/writeApi checks remain authoritative; middleware is defense-in-depth.
- apps/web/next.config.ts CSP unsafe-inline retained and documented as Next.js runtime requirement; migration to nonce tracked as P1 hardening (see SECURITY_MODEL.md honest limitation).

B-01 advisory fix is now CLOSED 2026-08-30: pnpm-workspace.yaml overrides updated to brace-expansion@5.0.9 fast-uri@3.1.5 js-yaml@4.3.1 nanoid@3.3.18 deepmerge-ts@8.0.0, pnpm-lock.yaml regenerated with new integrities, pnpm audit now reports 0 High / 0 Critical (585 deps, 0 advisories) and pnpm install --frozen-lockfile passes supply-chain policy. See scripts/dependency-audit-policy.mjs now expects 0 advisories. Committed at `78f1ea4` (worktree clean, `pnpm governance:check` and `repository-governance` 19/19 pass, 112-path inventory). B-02/B-03 (Keycloak/RHBK, 14-image scan), B-04 (MinIO->S3), B-05/B-06 (production/monitoring preflight), B-07..B-18 (governance) remain OPEN and require human/business-sponsor, procurement, and protected-main reproduction per PRODUCTION_READINESS_MASTER_PLAN.md. No closure is claimed until `main` merge + independent reproduction.

A 2026-08-20 decision pass populated the typed readiness records with the
explicit plan-approved proposal: exact D-01–D-07 service, recovery, retention,
capacity, locale, client, and accessibility values; RHBK 26.6.5 on RHEL 9 EC2;
private AWS S3/KMS/Object Lock with Singapore recovery copies; exact public and
private endpoints; and current browser/OS/deployment versions. Proposed
ADR-0015 records the AWS Jakarta topology without claiming it is accepted or
provisioned. Exact people, stable identities, procurement/account/change-ticket
references, provider evidence, approvals, successful runs, and closure
evidence remain intentionally `BLOCKED`/`null`. No repository actor,
diagnostic run, chat statement, or local/staging value was promoted into a
human approval, contract, or provisioned control.

On 2026-08-02 the repository gained a provider-neutral production-control
contract and preflight for external secret files, trusted TLS, KMS-backed
object storage, and encrypted off-site backup evidence. Policy/application
tests pass, but no real provider resources or approved evidence were supplied;
these controls therefore remain externally incomplete.

On 2026-08-02 the repository also gained private bounded-cardinality API,
dependency, worker, and queue metrics; a private Prometheus/Alertmanager/HTTPS
black-box staging overlay; seventeen actionable alert rules; on-call and
incident procedures; a read-only capacity runner; and a fail-closed external
operations evidence gate. Repository configuration/policy tests pass. No real
on-call receiver, witnessed paging/escalation drill, or production-equivalent
capacity run was supplied, so operational readiness remains externally
incomplete.

# Completed capabilities

- Phase 9C adds production-oriented non-root runtime images, external
  file-injected secrets, OCI version metadata, private durable services, nginx
  TLS ingress, dependency-aware health checks, bounded Docker log rotation,
  and explicit migration/seed/provision jobs in `compose.staging.yaml`.
- The repository now has a digest-pinned Trivy release gate, policy evaluator
  tests, exact expiring exception schema, complete 14-image CI coverage, and
  ignored JSON evidence. Node runtime package managers and unused PostgreSQL
  `gosu` binaries are removed; patched PostgreSQL/nginx images and
  checksum-verified fixed-source MinIO server/client builds replace vulnerable
  runtime layers.
- Production startup now requires HTTPS object storage plus explicit
  `aws:kms`/key-id or `AES256` encryption configuration. Document and BOM
  uploads apply the selected contract and document completion rejects a
  mismatched reported encryption algorithm/key. `production:preflight`
  validates external secret delivery, TLS chain/hostname/key/expiry, current
  private KMS storage evidence, and recent encrypted off-site backup/restore
  evidence without printing secret values.
- The API exposes private Prometheus text metrics for bounded HTTP route
  templates/status classes, process pressure, dependency readiness,
  version-matching worker heartbeat, outbox age/state/stalls, collection
  failure, and notification email state. nginx explicitly denies public
  `/metrics`; identifiers, payloads, credentials, and supplier data are not
  labels.
- `compose.monitoring.yaml` adds private non-root/read-only Prometheus,
  Alertmanager, and HTTPS black-box services with 30-day/8-GB retention, six
  recording rules, seventeen actionable alerts, configuration validation,
  persistent monitoring volumes, and complete release-image policy coverage.
- `operations:preflight` requires current private monitoring, rule/retention,
  firing/resolved paging, acknowledgement/escalation, and
  production-equivalent capacity/headroom/recovery evidence outside Git.
  `capacity:run` accepts only bounded GET/HEAD scenarios and external header
  files and produces safe aggregate evidence.
- The staging runbook documents local/shared TLS replacement, controlled
  deployment, forward-fix migration handling, persistent paths, backup,
  restore validation, rollback, and a staging-only release checklist.
- All 22 migrations applied on a fresh staging database. A Phase 8B
  fresh-install ordering defect was fixed so migration grants only reference
  roles already present; the authoritative seed then reconciles the complete
  role/permission matrix.
- Coordinated application/Keycloak PostgreSQL and MinIO backup set
  `phase9c-smoke-20260730T1415Z` passed checksums and restore-input validation.
  Recreated stateful containers retained application/Keycloak rows and a
  MinIO sentinel; that earlier evidence did not include a destructive restore.
- Isolated set `restore-rehearsal-20260801T081143Z-r1` restored into fresh
  `mecoflow-restore-rehearsal` database/object volumes while every source
  service remained stopped. Fixed application/realm counts and all three
  object checksums matched. Restored authentication, documents, readiness,
  permissions, and bidirectional Supplier A/B isolation passed in 644.129
  seconds. See `BACKUP_RESTORE.md` for exact evidence and corrective actions.
- The external HTTPS Playwright smoke passed health/TLS/version checks, real
  Keycloak login, an internal project-create flow, both supplier scorecard
  flows, field minimization, and bidirectional Supplier A/B
  foreign/nonexistent 404 equivalence.
- Controlled-pilot preparation adds all 18 requested operating artifacts plus
  a dataset guide, a guarded/idempotent `pilot-prepare` deployment job, artifact
  validation, and a release-candidate acceptance suite. The staged scenario
  contains four active fictional projects, ten representative suppliers,
  critical/noncritical requirements, partial delivery/receipt, certificate and
  checklist requirements, warehouse receipt, failed inspection, quarantine,
  supplier-responded NCR, readiness/reporting, and Supplier A/B isolation.
- The deployed pilot acceptance suite passed 3/3 in 1.8 minutes. The
  material-projection blocker was corrected by serializing queries within its
  single repeatable-read transaction; three isolated targeted runs completed in
  4.18–6.45 seconds and the full `pnpm verify` gate passed. The release decision
  remains `NOT READY` because external security, operations, and business
  controls remain incomplete.
- The complete local browser gate now passes 15/15 in 2.6 minutes on a fresh
  migrated/seeded database. Playwright honors the operator-supplied database,
  starts fresh API/web processes, and uses one worker on Windows to remain
  within the host's memory/page-file capacity. Document disclosure and
  notification fixtures were corrected without weakening their security or
  ownership assertions.
- Phase 9B measured representative query, calculator/import, worker, and web
  workloads before optimization. `docs/PERFORMANCE_REVIEW.md` records the
  environment, volumes, plans, before/after results, limits, and residual
  risks.
- A measured partial readiness index reduces latest-project portfolio access
  from 120.825 ms to 1.041 ms locally. Management readiness now uses
  principal-scoped 1–100 pagination and repeatable-read count/page semantics.
- Synchronous report/readiness statements have a transaction-scoped
  five-second PostgreSQL timeout. Existing no-store caching remains unchanged
  because it protects authorization and freshness.
- Supplier-scorecard timestamps are normalized once per calculation; the
  representative 10k/10k/10k, 12-month run fell from 138,644.31 ms to
  1,749.67 ms without changing KPI definitions or model version.
- Notification preparation uses duplicate-safe bulk creation/reads instead of
  recipient-loop queries. Existing unique keys, replay behavior, retry, and
  dead-letter semantics remain authoritative.
- Phase 9A reviewed authentication, sessions, CSRF, authorization/object scope, supplier isolation, field filtering, files, failures/logs, limits/CORS/headers, exports, raw queries, containers, and dependencies. Verified weaknesses were remediated without adding business features.
- OIDC validation now enforces authorized-party semantics, `nbf` and strict claim types, bounded tokens/provider JSON, and HTTPS discovery endpoints in production. Login return paths reject browser-normalized external forms and malformed cookies fail safely.
- File parsing enforces row limits during parsing and caps deflate output before allocation. API/worker logs redact top-level and nested secret-like fields and omit attacker-controlled exception text.
- Browser/API security headers, safe 413/429 envelopes, authenticated API no-store policy, patched audited dependencies, and root-owned/non-writable application artifacts in non-root containers are verified.
- `docs/SECURITY_REVIEW.md` records findings, evidence, remediation, negative tests, residual risks, verification results, and resolution of the accumulated-fixture/Windows browser-runner blocker.

- Phase 0 repository/runtime foundations and Phase 1 OIDC, organizations, roles, permission policies, sessions, CSRF, and immutable audit foundation remain intact.
- Versioned product-category administration with active/inactive status and audit events.
- Project creation, scoped reading, and detail editing with organization/category association, planned dates, versions, and transactional audit events.
- Explicit project transition command and immutable history for the accepted `DRAFT`, `PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, and `CANCELLED` graph. Generic project edits cannot accept `state`; completed/cancelled projects are read-only and there is no Phase 2 reopen command.
- Active/inactive project-member assignments with internal-owner scope, explicit supplier sharing, member roles, expected versions, and a final-active-project-manager invariant.
- Versioned milestones and milestone-linked work packages with project/date boundary validation, same-project link validation, and audit events.
- Project-level authorization composes active identity/membership, permission, internal oversight or explicit project assignment, object scope, workflow state, CSRF, and expected version. Repository list queries are scope-filtered. Supplier project responses omit employee/member identities and transition history.
- Internal project directory and overview screens. The directory supports search, state/category filters, sorting, bounded pagination, and URL query persistence. The overview supports project edit/transition plus member, milestone, and work-package operations.
- Date/timestamp presentation uses the configured `APP_TIMEZONE` with `Asia/Jakarta` fallback; PostgreSQL timestamps remain UTC and planned dates use the database `DATE` type.
- Local/test/CI deterministic seed adds a fictional product category, demo project, creator project membership, milestone, and work package. Nonlocal environments receive no Phase 2 demo business data.
- Generated OpenAPI, human API documentation, authorization matrix, domain/security/test documentation, README, unit/integration/authorization/concurrency/browser coverage are updated.
- Global internal item-category and unit-of-measure administration with active/inactive status, optimistic versions, normalized unique uppercase codes, and transactional audit events.
- Ordered `TEXT`, `NUMBER`, and `BOOLEAN` specification-attribute definitions with required-value, unit, data-type, sort-order, active-reference, and zero-to-six decimal-precision validation.
- Versioned item creation, internal detail editing, case-insensitive search, active/category/unit filters, sorting, bounded pagination, and typed structured specification values. An item's category is immutable after creation.
- Explicit reasoned item deactivation. Inactive items are read-only, no delete route exists, restrictive references retain item data, and a database trigger rejects direct item deletion.
- Separate internal `item.read`, `item.write`, and `item.export` permissions. Supplier/customer roles receive none; qualifying internal roles follow the authorization matrix.
- Filtered CSV export with a 10,000-row ceiling, fixed columns, formula-safe cells, and same-transaction `ITEMS_EXPORTED` audit evidence.
- Internal item directory and item-detail screens with URL-backed filters, permission-sensitive controls, structured specification inputs, CSV download, and retained inactive-item detail.
- Local/test/CI deterministic Phase 3A seed adds fictional item categories, units, definitions, an item, and typed values. Nonlocal environments receive no Phase 3A demo business data.
- Phase 3A seed reconciliation now predicates every update on an actual value difference, so repeat application is a true timestamp-preserving no-op.
- Project-wide and work-package-specific BOM aggregates with numbered revisions, positive decimal lines, item/base-unit references, optimistic versions, and retained history.
- Command-only `DRAFT`, `IN_REVIEW`, `RELEASED`, `SUPERSEDED`, and `CANCELLED` lifecycle with immutable transitions, draft-only line correction, transactional release/auto-supersede, and a database-enforced one-released-revision invariant.
- Released-only `official_bom_lines` view and response flags. Procurement coverage is explicitly a zero-valued `NOT_STARTED` placeholder; no purchasing or operational-allocation data is created.
- Fixed CSV and macro-free XLSX templates; private bounded uploads with safe names, extension/MIME/magic checks, SHA-256, opaque keys, production encryption requests, and quarantine/validated/rejected metadata.
- PostgreSQL outbox plus Redis-coordinated worker parsing with identifier-only jobs, authoritative object re-read, size/checksum revalidation, retry/backoff, terminal failure, and transactional row/file/outbox/audit completion.
- Dry-run validation retains every row and exposes row/field errors and warnings for quantity, precision, unit, item match, ambiguity, formula-like content, criticality, duplicates, and blanks. Formulas/macros are never executed.
- Explicit, expected-version confirmation before one source-linked draft revision is created transactionally. Invalid or ambiguous dry runs cannot be confirmed.
- Source file/checksum display, draft line correction, lifecycle controls, import history, row-level results, and added/removed/changed/unchanged revision comparison in the internal project BOM workspace.
- Separate `bom.read`, `bom.write`, `bom.import`, `bom.review`, and `bom.release` permissions composed with existing project scope; suppliers receive none.
- Project-scoped purchase requisitions created only from current released BOM lines, with positive precision-checked manual quantities tied to retained source lines and per-project requisition numbering.
- Released requirement projection with active requisition coverage and outstanding quantity. Draft, submitted, and approved lines reserve coverage once; rejected and cancelled lines release coverage.
- Transactional deterministic BOM-line locking and coverage recalculation prevent concurrent requisitions from double booking configured need.
- Separately authorized `requisition.override` behavior with required reason, immutable line-level authorizer/need/coverage snapshots, and dedicated override audit evidence.
- Explicit versioned `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, and `CANCELLED` commands with database-guarded transitions and immutable history. Requester is immutable; approver and approval timestamp are preserved after approval/cancellation.
- Separate requisition read/write/submit/approve/cancel/override permissions composed with existing project scope. Suppliers receive none; Purchasing cannot approve or override.
- Internal requisition list/create and detail screens display released need, covered and outstanding quantities, requester, approver, override evidence, and accessible lifecycle controls.
- Project-scoped purchase orders created and revised only from approved requisition quantities, with explicit immutable requirement allocations and exact ordered-versus-allocated totals.
- Transactional sorted requisition-line locks and current-revision coverage prevent concurrent double ordering. Separately authorized, reasoned over-ordering preserves approved/ordered/available snapshots, authorizer attribution, and dedicated audit evidence.
- Retained numbered PO revisions with explicit `DRAFT`, `SENT`, `ACKNOWLEDGED`, and `CANCELLED` lifecycle commands, optimistic versions, immutable transition history, and current-revision-only quantity consumption.
- Supplier-addressed PO list/detail responses require exact active supplier organization and project membership and are built from server-side field allowlists. Internal unit price, commercial terms, buyer/line notes, requisition/allocation identity, employee history, audit data, storage keys, and unrelated objects are absent.
- Explicit supplier acknowledgement and append-only numbered commitment revisions scoped to current PO-revision lines. Original and latest dates are preserved and displayed without edit/delete operations.
- BOM-required date snapshots derive from work-package or project planned start. Latest commitments after required dates populate the separately permissioned internal exception list.
- Internal PO workspace/detail and separate supplier PO list/detail screens cover approved-source creation, send, acknowledgement, commitment append, retained histories, date status, and permission-sensitive controls.
- PO creation/revision/send/cancel, supplier acknowledgement, commitment append, and reasoned overrides write redacted audit evidence in the same business transaction.
- Project-scoped logical documents with immutable numbered versions, owner organizations, metadata, uploader/reviewer attribution, and validated associations to existing project, work-package, BOM, requisition, and purchase-order records.
- Private MinIO/S3 storage with extension-free UUID keys, five-minute signed PUTs, two-minute signed GETs, private bucket policy, production encryption requests, and no storage-key serialization.
- Safe `.pdf`, `.png`, `.jpg`, `.jpeg`, `.txt`, and `.csv` validation up to 10 MiB. ZIP/office ZIP containers, executables, traversal names, invalid UTF-8, mismatched MIME/magic, invalid sizes, and invalid checksums fail closed.
- Completion independently re-reads object metadata and bytes, verifies exact size and SHA-256, detects supported content, and invokes a bounded ClamAV `INSTREAM` virus-scanner interface. Disabled/unavailable/error/positive scanning produces non-downloadable `SCAN_FAILED` state.
- Explicit clean `DRAFT` to `IN_REVIEW` to `APPROVED`/`REJECTED` commands, retained transitions, optimistic versions, and atomic prior-approval supersede when a clean replacement version is approved.
- Internal and own-supplier document permissions compose with existing project scope. Supplier lists/details are repository-filtered by owner organization, supplier PO associations require addressee equality, and supplier approval is denied before object resolution.
- Upload, completion/rejection, review submission, approval, rejection, supersede initiation, and download URL issuance write redacted audit evidence. Database triggers retain versions/associations/transitions and prevent approved metadata overwrite.
- Internal project document workspace with bounded upload controls, ZIP warning, checksum/scan/version table, review decisions, download actions, and replacement upload controls.
- Supplier-owned advance shipment notices against exact current acknowledged PO lines, with active shipped-quantity bounds and retained package references.
- Explicit versioned ASN submit, dispatch, arrive, and cancel commands with immutable transition history and transactional redacted audit evidence.
- Supplier ASN register/detail screens with server-side field allowlisting and secure packing-list/certificate uploads through the document service.
- Internal arrived-ASN receiving with draft receipts, received timestamp/location, quantity, heat number, batch number, manufacturer, package reference, and notes.
- Idempotent receipt posting that transactionally revalidates quantity, posts the receipt, creates one positive awaiting-inspection inventory lot per original line, and writes audit evidence.
- Database-immutable posted receipts, receipt lines, lots, adjustments, shipment lines, transitions, and retained operational history.
- Separate correcting receipt drafts with signed deltas and posting that appends traceable lot adjustments without rewriting original receipt or lot data.
- Internal tablet receiving screens with touch-sized controls, coarse-pointer spacing, card-based traceability capture, distinct post action, correction workflow, and secure camera/photo upload.
- ASN and goods-receipt document associations with supplier owner equality and internal-only receipt association policy.
- Item-scoped, versioned checklist, measurement, and certificate inspection definitions with active/inactive configuration, exact measurement precision/bounds, optimistic concurrency, and transactional audit evidence.
- Automatic inspection creation during original receipt posting when active item definitions exist, plus explicit creation for awaiting lots configured later. Each inspection retains an immutable definition snapshot and one-inspection-per-lot identity.
- Project inspection work queue/detail with required-check completion, checklist conformance, bounded measurement evaluation, and certificate decisions backed by an exact approved-clean inspection-associated document.
- Once-only accepted, conditionally accepted, quarantined, and rejected finalization with exact effective-received snapshots and transactional accepted/rejected/quarantined inventory-lot buckets.
- Independent `inspection.conditional-accept` authorization with retained authorizer and dedicated audit event. Ordinary acceptance rejects nonconforming required checks.
- Database guards retain finalized inspections/checks/definitions, constrain state and quantities, prevent direct disposition mutation, and reject correction posting after lot disposition.
- Internal project inspection configuration, work-queue, evidence, result, and read-only finalized views, with an explicit action from awaiting receipt lots.
- Project/supplier-scoped NCRs created from project, inventory-lot, or finalized non-accepted inspection sources with derived supplier lineage and per-project numbering.
- Explicit versioned NCR draft, issue, supplier-response, close, and cancel lifecycle with immutable transition history, append-only numbered supplier responses, retained attribution, and transactional audit evidence.
- Supplier NCR list/detail/response routes and portal with exact organization/project isolation and allowlisted DTOs. Internal note/control/actor/history fields are absent; disposition text appears only through the explicit shared field.
- Accepted-lot material allocation to matching current released BOM lines with decimal precision, item/unit/project scope, lot-row locking, database-triggered availability enforcement, and concurrent over-allocation prevention.
- Separately permissioned conditional material use requiring the retained inspection disposition authorizer, bounded reason, allocation authorizer, and dedicated audit evidence. Rejected/quarantined/awaiting quantities remain ineligible.
- Explicit allocation release and consumption commands with expected versions, lot/allocation locks, immutable quantity-snapshot transitions, terminal history, and audit evidence. Release restores availability; consumption remains committed.
- Internal project quality/allocation workspace, inspection-linked NCR creation, separate supplier NCR response interface, and browser coverage across quarantine, response, explicit sharing, allocation, and consumption.
- Internal read-only `material-requirement-status-v1` projection for every current released BOM line, with exact required, requisitioned, ordered, confirmed, shipped, corrected-received, accepted, allocated, certificate-complete, and shortage quantities plus operative commitment date, stage, and blocker.
- Explicit no-double-counting treatment for split sourcing, pooled PO-line allocations, current versus replaced commercial plans, retained physical history, partial receipts, signed corrections, quality buckets, released allocations, consumed allocations, and superseded/non-released BOM revisions.
- Deterministic earliest-required-date/UUID pooled attribution, retained lot-order quality partitioning, stable commitment revision/date selection, fixed-scale decimal arithmetic, stable output ordering, and fail-closed persisted-input validation.
- Pure `readiness-calculator-v1` and `readiness-rules-v1` with documented stage scores, criticality weights, score bands, critical gates, risk reason codes, recommended actions, explicit UTC calculation date, and deterministic future LOW-priority handling.
- Immutable reproducible project/work-package readiness snapshot batches with source/calculator/rule versions, SHA-256 input hash, minimized source inputs, line explanations, blockers, reasons, actions, and redacted system audit evidence.
- Event-primary readiness recalculation through identifier-only transactional outbox events, project event coalescing, serializable calculation, transaction advisory locking, atomic snapshot/event completion, bounded retries, and a five-minute idempotent scheduled safety sweep.
- Internal `readiness.read` permission, repository-scoped management portfolio API, project/work-package overview, material board, and immutable history APIs with supplier denial and field minimization.
- Management, project-readiness, material-readiness, and readiness-history browser views that always display score/status together with blockers, reasons, actions, and explanation.
- Transactional readiness notification enqueue through a project-snapshot database trigger. Event-driven snapshots create alerts and changed scheduled snapshots create daily reminders; the identifier-only outbox row commits or rolls back with the snapshot.
- Active internal project-member recipient derivation with authoritative snapshot/project re-read. Supplier, inactive user/membership/organization, inactive project-member, and nonmember recipients are absent.
- Versioned own-user `READINESS_ALERT` and `READINESS_REMINDER` preferences with in-app-on/email-off defaults, CSRF, optimistic concurrency, serialized first creation, and transactional redacted audit evidence.
- Retained in-app notifications with per-event/per-user uniqueness, current-project-scope rechecks, unread count, explicit mark-read command, and internal notification/preference UI.
- Optional SMTP delivery with deterministic per-notification message identity, one retained delivery row, bounded exponential retries, disabled-delivery `SKIPPED` evidence, duplicate-safe sent replay, and ambiguous-send dead lettering.
- Explicit outbox and email `DEAD_LETTER` state with UTC/error evidence, retained recoverability, structured processing logs, and periodic pending/processing/dead-letter queue counts.
- Local Mailpit SMTP configuration and production fail-closed validation requiring a nonlocal implicit-TLS relay, nonlocal sender, and injected credentials.
- Complete bounded Phase 8B report catalog: Project Readiness, Material Exceptions, internal Supplier Performance, and Own Supplier Scorecard.
- Required inclusive `Asia/Jakarta` periods bounded to 366 days and 12 monthly trend buckets, with one UTC generation timestamp and normalized applied filters.
- Pure `supplier-scorecard-calculator-v1` exact KPI model for required-date delivery, original commitment, latest commitment, commitment revision, first-pass acceptance, usable acceptance, and NCR response. Empty denominators are null and no composite grade is produced.
- Current acknowledged obligations plus retained arrived noncurrent-line history, with superseded unshipped exclusion and arrived-quantity caps preventing double counting.
- Repository-scoped internal project/source predicates and supplier own-organization/project predicates. Supplier routes reject client-supplied supplier identity and expose aggregate allowlists only.
- Secure synchronous CSV and macro-free XLSX exports with fixed metadata/data/trend sheets, 10,000-row fail-closed bounds, and formula neutralization after leading whitespace.
- Immutable redacted `REPORT_EXPORTED` audit evidence containing actor/scope/report/format/filter/timestamp/count/request context without workbook bytes, free-text search, prices, internal notes, or row content.
- Internal reports UI and supplier own-scorecard UI with URL-backed periods, permission-sensitive exports, separate original/latest commitment cards, trend bars, accessible trend tables, and explicit no-data states.

# Partially completed capabilities

- Monitoring, alerting, on-call, and capacity controls are repository-complete
  but externally incomplete. Staging uses an observation-only receiver. Real
  receiver delivery, primary acknowledgement, secondary escalation, protected
  dashboard/provider evidence, and a production-equivalent capacity run must
  be witnessed before `operations:preflight` can pass.

# Not started

- Real production secret-manager bindings, trusted certificate/DNS/renewal,
  KMS/provider probes, encrypted off-site copy, business acceptance,
  shared-staging infrastructure approval, real paging/capacity evidence, and
  any production deployment remain absent. Repository templates and validation
  are not external evidence.

# Active technical decisions

- ADR-0001 through ADR-0014 remain accepted and governing.
- Phase 8A extends the existing ADR-0006 PostgreSQL outbox rather than introducing a second queue. PostgreSQL remains authoritative and Redis remains coordination only.
- Notification event payloads contain only project/snapshot identifiers. Recipient, preference, email address, text, and delivery state are derived from authoritative PostgreSQL rows.
- Phase 8B reports are live read models over retained authoritative records; no report aggregate, cache, workbook, or score row is persisted.
- Supplier performance deliberately has no composite grade. Exact independently interpretable KPIs follow `supplier-scorecard-calculator-v1`.
- XLSX generation reuses a minimal reviewed OOXML ZIP writer rather than adding a spreadsheet dependency; generated workbooks contain inline strings/numbers only and no formula or macro relationship.
- SMTP has no exactly-once acknowledgement protocol. A stale `PROCESSING` delivery therefore dead-letters rather than automatically resending and risking a duplicate; controlled operator review is required.
- Project scope is an explicit active project-member assignment. `SYSTEM_ADMIN` has internal-project oversight and `MECO_MANAGEMENT` has read oversight in its internal organization; roles/permissions alone do not grant ordinary project scope.
- Supplier assignment grants project read scope and, in Phase 4B, separately permissioned write access only to addressed PO acknowledgement and commitment append commands. Employee/member, internal transition, audit, requisition/allocation, and commercial-field visibility remains absent.
- Project state is a command-only field. Terminal-state reopening needs a separately designed and authorized future command; it is not implicitly implemented.
- The Phase 3A item master is a global internal catalog shared by active internal organizations. Item data is not organization-partitioned; the qualifying actor membership supplies audit organization context. Supplier and customer roles have no item-master access.
- Item-category, unit, and item codes are globally unique after uppercase normalization; specification-attribute codes are unique within their category. Retained inactive records continue to reserve their codes.
- Item category is immutable after item creation. Active reference masters cannot be deactivated, used attribute type/unit/precision cannot change, and inactive items cannot be edited or reactivated through Phase 3A routes.
- CSV export is separately permissioned and audited, preserves the active list filters except pagination, rejects more than 10,000 rows, and neutralizes spreadsheet formula prefixes.
- Phase 3B activates the transactional outbox only for BOM import parsing. Redis payloads and outbox payloads contain identifiers, never files, rows, credentials, or secrets.
- BOM release serializes on the BOM row, supersedes the prior release before releasing the target in one transaction, and remains independently constrained by a partial unique index.
- A unique exact item code is authoritative during import. Name-only matches require exactly one active item and produce a warning; ambiguous names are explicit errors.
- Requisition coverage counts exact retained BOM-line identifiers in `DRAFT`, `SUBMITTED`, or `APPROVED` requisitions. Rejected/cancelled requisitions retain history but release coverage.
- Requisition creation serializes on sorted BOM-line locks and snapshots need/coverage. Over-need is a strict decimal comparison and requires the independent override permission and reason.
- The Phase 4A lifecycle permits draft submission/cancellation, submitted approval/rejection/cancellation, and approved cancellation. Rejected/cancelled are terminal; requester and an already-recorded approver cannot be replaced.
- Only current revisions of non-cancelled POs consume approved requisition quantity. Revising appends a complete replacement revision, retires the prior current flag, and returns the aggregate to `DRAFT`; every earlier revision and commitment remains retained.
- A PO line contains one item/unit and its ordered quantity must equal its allocation sum. Required date is the earliest allocation snapshot date, derived from work-package planned start or project planned start.
- Supplier commitment revisions may be partial across PO lines; original/latest dates are calculated independently per line from all append-only revisions. A latest date strictly after required date is an internal exception.
- Document files deliberately exclude ZIP-based Word/Excel formats because Phase 5A's mandatory ZIP prohibition governs the allowlist. Generic associations are limited to already-implemented aggregate types and are server-validated within the document project.
- Upload and download presigned URLs are fixed at five minutes and two minutes respectively. Scanner configuration is mandatory in production; local disabled scanning demonstrates fail-closed quarantine rather than treating an unscanned file as clean.
- Active non-cancelled ASN drafts reserve PO shipped quantity. Supplier identity and revision scope derive from the authenticated addressed acknowledged PO, not request input.
- The ASN lifecycle is draft, submitted, in transit, arrived, or cancelled. Only internal warehouse authority records arrival.
- Receipt drafts are append-only snapshots. Posting is the only status command and requires a request-specific idempotency key; identical retries return the existing posted representation.
- Original receipt posting creates positive awaiting-inspection lots. Correction posting creates signed lot-adjustment history and cannot make effective received or lot quantity negative or exceed shipped quantity.
- Active item check definitions are explicit inspection-required configuration. Receipt posting snapshots them into one inspection per new lot; awaiting lots without an inspection remain quarantined until definitions exist and an authorized principal creates the inspection explicitly.
- Finalization locks the inspection and lot, verifies its expected version and all required checks, calculates against original quantity plus retained adjustments, and writes inspection, lot buckets, authorizer attribution, and audit evidence in one transaction.
- Accepted and conditionally accepted dispositions require positive accepted quantity and no quarantined remainder; rejected disposition rejects the full effective quantity; quarantined disposition retains a positive derived remainder. Accepted plus rejected can never exceed effective received quantity.
- NCR inspection sources require a finalized non-accepted disposition; lot/project sources remain available for broader traceable or project-level supplier nonconformance. Supplier ownership is derived for inspection/lot sources and explicit for project sources.
- Accepted availability is accepted lot quantity minus all allocated and consumed history. Released allocations no longer reserve availability; consumed allocations permanently do. Creation requires a current released BOM line, while retained allocations remain traceable if that revision is later superseded.
- Conditional allocation is deliberately stricter than conditional inspection acceptance: it requires both the retained inspection authorizer and an independent current `allocation.conditional-use` decision with reason/audit evidence.
- Phase 7A is a live, read-only, versioned projection rather than a mutable aggregate or persisted readiness snapshot. It reuses internal `bom.read` plus project-read scope, reads one repeatable database snapshot, and emits no audit/outbox work.
- Current sent/acknowledged PO revisions determine ordered quantity; current acknowledged lines with a retained commitment determine confirmed quantity. Replaced commercial plans do not double count, while actual dispatched/received history remains traceable.
- Pooled physical quantities consume the complete PO-line allocation set by earliest required-date then BOM-line UUID. Receipt segments use creation/UUID order and stable accepted, rejected, quarantined, unresolved partitioning.
- The operative commitment date uses the highest commitment revision containing each current acknowledged PO line and then the latest selected date across the requirement's supplying lines.
- Phase 7B stage scores are `0/15/30/45/60/70/80/90/95/100`; criticality weights are `8/4/2/1`. Critical rejected/quarantined/certificate/NCR/late/due-shortage gates override the aggregate, while a future LOW-only shortage is GREEN only beyond 30 days with score at least 85.
- Readiness input hash includes the explicit UTC calculation date, so same-day identical event/scheduled inputs are idempotent while the scheduled sweep can create a new date-sensitive snapshot on a later day.

# Database migrations

- `20260715000000_phase_0_foundation` remains unchanged.
- `20260716000000_phase_1_identity_authorization` remains unchanged.
- `20260716010000_phase_2_projects_milestones` adds product categories, projects, project members, milestones, work packages, project-transition history, project/member/state enums, uniqueness and scope indexes, date/version checks, restrictive foreign keys, and database triggers rejecting project-transition update/delete.
- `20260716020000_phase_3a_item_master` adds item categories, units of measure, typed specification definitions and values, items, precision/version/type/reference checks, uniqueness/search indexes, restrictive foreign keys, typed-value validation triggers, and an item-delete prevention trigger.
- `20260718000000_phase_3b_bom_import` adds BOMs, revisions, lines, immutable transitions, stored-file/import/row metadata, outbox jobs, lifecycle/file/job enums, positive/version/checksum checks, restrictive and same-project-scope foreign keys, scope/revision/active-release uniqueness, draft-only/base-unit line and lifecycle guards, and the released-only official-line view.
- `20260718010000_phase_4a_purchase_requisitions` adds requisitions, immutable BOM-linked lines and transition history, lifecycle enum/timestamps/attribution, positive/snapshot/override checks, per-project numbering, restrictive foreign keys, indexes, valid-transition/requester/approver guards, and no-delete/immutable-history triggers.
- `20260719000000_phase_4b_purchase_orders_commitments` adds POs, retained revisions, immutable lines/allocations/transitions, supplier commitment revisions/lines, quantity/override/version checks, exact line-revision compound foreign keys, one-current-revision enforcement, deferred allocation-total validation, supplier-scope and lifecycle guards, and no-delete/append-only triggers.
- `20260720000000_phase_5a_document_storage` adds documents, private file-version metadata, associations, transition history, review/scan enums, size/checksum/type/version constraints, restrictive foreign keys, indexes, valid workflow/scan guards, approved metadata immutability, and no-delete/immutable-history triggers.
- `20260720010000_phase_5a_document_insert_guard` rejects direct creation of pre-approved, pre-scanned, or otherwise non-quarantined document versions.
- `20260720020000_phase_5b_asn_receiving` adds ASN/receipt/lot enums and tables, document association values, scope/quantity/version/idempotency constraints, restrictive foreign keys, indexes, workflow guards, and immutable-history triggers.
- `20260720030000_phase_5b_inventory_insert_guard` restricts inventory effects to posted receipt/correction transactions.
- `20260720040000_phase_5b_inventory_guard_fix` separates the table-specific inventory insert guards for PostgreSQL record-field safety.
- `20260722000000_phase_6a_receiving_inspection` adds inspection definitions, immutable per-lot inspections/check snapshots, result/evidence/disposition fields, inventory-lot buckets/statuses, inspection document associations, precision/state/version/quantity constraints, restrictive foreign keys, indexes, immutable-history guards, and correction-after-disposition rejection.
- `20260722010000_phase_6a_inventory_lot_status_guard` updates the Phase 5B positive-lot constraint to allow the four finalized disposition statuses while preserving positive original quantity.
- `20260722020000_phase_6a_inventory_quantity_guard_fix` keeps stored lot buckets nonnegative while the transaction guard validates them against effective original quantity plus retained adjustments.
- `20260722030000_phase_6a_lot_adjustment_serialization` makes the adjustment-insert database guard lock its inventory lot before validating awaiting-inspection state, serializing direct adjustment insertion against disposition finalization.
- `20260722040000_phase_6b_ncr_material_allocation` adds NCR/source/status, supplier-response, and material-allocation/status aggregates; immutable transitions and quantity snapshots; supplier/project/source/conditional attribution; precision/state/source/quantity constraints; restrictive foreign keys/indexes; lot-lock allocation validation; and no-delete/append-only guards.
- Phase 7A adds no database migration or data migration; it reads the existing authoritative trace model.
- `20260722050000_phase_7b_readiness_snapshots` adds readiness scope/status enums, immutable reproducible snapshots, indexes/foreign keys/checks, readiness event-enqueue triggers on relevant aggregates, and the internal `readiness.read` permission/role grants.
- `20260722060000_phase_7b_certificate_definition_event` adds event-primary recalculation when a required certificate definition changes for an item in current released requirements.
- `20260727000000_phase_8a_notifications` adds notification preferences, in-app notifications, retained email delivery state, readiness notification enqueue triggers, uniqueness, retry/dead-letter fields, and immutable delivery evidence.
- `20260727010000_phase_8b_reports_scorecards` adds report/scorecard permissions and conservative internal/supplier role grants. Phase 8B adds no business table or data backfill.
- No production data migration/backfill is included. Existing migrations remain additive. Production down-migration is not authorized.

# Test status

- Unit coverage exhaustively checks every project-state source/target pair and the forbidden completed-to-active route.
- Integration coverage checks transition/audit atomicity and immutability, arbitrary-state-patch rejection, concurrent project edits, and Phase 2 seed idempotency.
- Authorization coverage checks Supplier A explicit access, Supplier B/nonexistent equivalence, supplier field filtering, read-only denial, and CSRF enforcement.
- Browser coverage creates, edits, and explicitly transitions a project through accessible controls.
- Phase 3A unit coverage exercises unit/attribute precision, definition shapes, typed/required values, duplicate values, and CSV escaping/formula neutralization.
- Phase 3A integration coverage exercises duplicate codes, active-reference rules, category immutability, full specification replacement, search, CSV limits/audits, optimistic concurrency, reasoned deactivation, inactive read-only behavior, unavailable delete routes, database delete prevention, transactional audit evidence, and seed idempotency.
- Phase 3A authorization coverage exercises internal read/write/export separation, supplier denial, read-only denial, CSRF on unsafe routes, safe item identifiers, and export audit scope.
- Phase 3A browser coverage creates reference masters and a typed item, edits and searches it, downloads filtered CSV, and deactivates it through accessible controls.
- Phase 3B unit coverage exercises every lifecycle edge, release rules, secure upload validation, CSV/XLSX templates, retained rows, invalid quantity/unit, ambiguity, duplicates, and non-evaluated formula content.
- Phase 3B integration coverage exercises duplicate revisions, released-only official lines, transactional audit/release, auto-supersede, the one-release constraint, concurrent same-version release, and private-object background parsing/checksum/row/audit/outbox completion.
- Phase 3B authorization coverage exercises unauthenticated denial, supplier real/nonexistent equivalence, internal unassigned real/nonexistent equivalence, allowed internal project scope, and pre-storage CSRF denial.
- Phase 3B browser coverage uploads an invalid file, displays its row error, uploads and confirms a corrected dry run, corrects a draft line, reviews, releases, and displays official-readiness and procurement-placeholder state.
- Phase 4A unit coverage exhausts the transition matrix and exact/under/over/already-covered/invalid quantity boundaries.
- Phase 4A integration coverage proves released-only creation, live coverage/outstanding calculation, authorized/unauthorized override behavior and audit evidence, requester/approver preservation, invalid transition rejection, rejection/cancellation coverage release, database immutability, and concurrent double-book prevention.
- Phase 4A authorization coverage proves authentication, supplier denial, real/nonexistent equivalence, unassigned internal scope, CSRF-before-write, and independent override permission behavior.
- Phase 4A browser coverage releases a BOM requirement, creates a requisition from displayed outstanding need, submits and approves it, and verifies attribution and status.
- Phase 4B unit coverage exhausts the PO transition matrix and approved/available/over-order quantity boundaries.
- Phase 4B integration coverage proves approved-source allocation, exact allocation totals, authorized/unauthorized override and audit evidence, concurrent double-order prevention, PO revision retention, send/acknowledge lifecycle, append-only original/latest commitment history, late exception projection, approved-requisition cancellation protection, and database immutability.
- Phase 4B authorization coverage proves Supplier A access, Supplier B/nonexistent equivalence across PO/commitment/acknowledgement and absent attachment surfaces, exact project assignment, CSRF-before-write, and server-side internal-commercial-field absence.
- Phase 4B browser coverage creates an approved source, internally creates/sends a PO, acknowledges as the addressed supplier, appends two commitment revisions, and verifies retained original/latest dates and hidden internal fields.
- Phase 5A unit coverage exercises extension/MIME/size/checksum validation, ZIP/executable/binary/magic rejection, UTF-8 detection, ClamAV fail-closed behavior, and exact upload/download URL expiry.
- Phase 5A integration coverage exercises private signed PUT, stored metadata/size/SHA-256 verification, review/approval, audited download signing, replacement approval/automatic supersede, approved metadata immutability, tampered checksum rejection, and transactional audit evidence.
- Phase 5A authorization coverage proves unauthenticated and CSRF denial, Supplier A own access, Supplier B/nonexistent equivalence, supplier approval preflight denial, owner filtering, and storage-key absence.
- Phase 5A browser coverage uploads through the document UI and proves locally unavailable scanning leaves content non-downloadable in `SCAN_FAILED` state.
- Phase 5B unit coverage exhausts the shipment transition matrix.
- Phase 5B integration coverage proves owned PO-line ASN creation, transition history, transactional/idempotent posting, one-lot effects, posted immutability, corrections, audit-failure rollback, and secure document association.
- Phase 5B authorization coverage proves Supplier A access, Supplier B/nonexistent equivalence, foreign-line rejection, CSRF-before-write, active assignment, and server-side actor/internal-field absence.
- Phase 5B browser coverage uses a touch-enabled tablet viewport for supplier ASN creation/transitions and warehouse arrival, traceability capture, draft/post, and awaiting-inspection lot display.
- Phase 6A unit coverage exercises exact precision, accepted/rejected overflow, derived quarantine, and all disposition-specific quantity shapes.
- Phase 6A integration coverage exercises automatic/explicit snapshots, configuration immutability and stale updates, checklist/measurement results, all four dispositions and lot buckets, corrected effective quantity, late-correction denial, concurrent once-only finalization, correction-versus-finalization serialization, audit rollback, and approved-clean certificate evidence.
- Phase 6A authorization coverage proves supplier real/nonexistent equivalence, project-manager conditional-acceptance denial, CSRF-before-write, and independently authorized/audited conditional acceptance.
- Phase 6A browser coverage posts inspection-required material, records its snapshotted check, finalizes acceptance, and verifies the finalized read-only lot quantities.
- Phase 6B unit coverage exhausts NCR and allocation lifecycle edges.
- Phase 6B integration coverage proves all NCR sources, supplier derivation, append-only responses, explicit field sharing, expected-version response concurrency, accepted-only allocation, conditional authority/audit, release/consume quantity history, audit rollback, and lot-lock concurrent over-allocation prevention.
- Phase 6B authorization coverage proves Supplier A/B and nonexistent equivalence, own-organization list/detail isolation, server-side internal-field absence, CSRF-protected supplier response, independent conditional-use denial, and authorized conditional allocation.
- Phase 6B browser coverage releases a requirement, quarantines received material, creates/issues an inspection NCR, records a supplier response, explicitly shares closure disposition, allocates a separate accepted lot, and consumes it with visible retained quantity history.
- Phase 7A unit coverage proves exact quantities, split sourcing, pooled allocations, commitment revision/date selection, partial dispatch/receipt, correction, rejection, quarantine, unresolved inspection, certificate completeness, allocation release/consumption, blocker/stage rules, no double counting, repeat determinism, and fail-closed invalid input.
- Phase 7A integration coverage persists pooled requirements, revised commitments, partial receipts, a negative correction, mixed quality disposition, released/consumed allocations, and a superseded revision; repeat reads are identical and conserved totals are asserted.
- Phase 7A authorization coverage proves allowed internal access, minimized projection fields, supplier denial, and supplier real/nonexistent project equivalence through the live route.
- Phase 7A has no browser test because dashboards and all other UI are explicitly out of scope; the generated REST contract is covered by OpenAPI checks.
- Phase 7B pure coverage exercises every stage/weight, score bands, all critical gates, partial acceptance, late commitment, certificate blocking, open/resolved NCR, the 30-day LOW rule, determinism, and invalid inputs.
- Phase 7B integration coverage proves current released-only inputs, superseded exclusion, trigger events/coalescing, project/work-package batch persistence, version/hash reproduction, event/audit atomicity, same-day scheduled idempotence, next-day recalculation, and database immutability.
- Phase 7B authorization and browser coverage proves internal scoped access, supplier real/nonexistent denial, minimized explanation-complete contracts, and management/project/material/history workflows.
- Phase 8A integration coverage is defined for transaction rollback/atomicity, replay idempotency, duplicate prevention, preference enforcement, scheduled reminders, retry, email/outbox dead letter, and retained observability state.
- Phase 8A authorization coverage proves service ownership and defines database/API evidence for own-user scope, current project assignment, CSRF, optimistic preference versions, supplier absence, and safe identifiers.
- Phase 8A browser coverage reads and marks an in-app readiness notification and updates the email preference through labeled controls.
- Phase 8B pure fixtures cover every KPI, original/latest divergence, partial/future delivery, superseded and retained-revision behavior, quality outcomes, NCR response, exact rounding, monthly trends, and null denominators.
- Phase 8B export coverage checks metadata/filter timestamps, leading-whitespace formula injection, CSV quoting, and macro/formula-free XLSX output.
- Phase 8B authorization and integration coverage checks underlying permission composition, supplier identifier rejection, own-membership repository predicates, Supplier A/B NCR-row isolation, report filtering, audit redaction, and retained export audit evidence.
- Phase 8B browser coverage traverses internal reports, downloads CSV, and verifies the supplier own-scorecard, separate original/latest labels, accessible trends, and absence of a supplier selector.
- Final formatting, lint, type-check, unit, integration, authorization, build,
  migration, seed, and OpenAPI commands passed. The full browser command passed
  all 15 scenarios on a clean isolated database. Exact commands and counts are
  retained in the implementation handoff.
- Pilot verification on 2026-08-01 passed `pnpm pilot:check` (19 files), the
  HTTPS staging pilot acceptance flow (3/3), `pnpm test:authorization` (14 files,
  53 tests), `pnpm openapi:check`, `pnpm security:audit` (no known
  vulnerabilities at moderate threshold), and `pnpm build` (9/9 tasks).
- The material-requirement projection passed three clean targeted runs with the
  unchanged 20-second limit (4.18–6.45 seconds). A separate clean aggregate
  integration run passed all 24 API files / 104 tests in 4m47s, with the
  projection completing in 4.88 seconds. A fifth clean database then passed the
  exact `pnpm verify` chain, including all 104 integration tests and 9 build
  tasks. No test was weakened or skipped.
- `pnpm test:e2e` passed 15/15 in 2.6 minutes against a newly created database
  after deterministic process isolation, database propagation, bounded Windows
  parallelism, and exact browser-fixture identity/disclosure corrections.

- `pnpm security:image-scan:test` passed 5/5 policy tests. The complete
  `APP_VERSION=0.1.0-security-scan pnpm security:image-scan` run scanned 11
  images: ten passed with zero HIGH/CRITICAL findings; Keycloak 26.7.0 failed (now pinned to 26.7.2@sha256:fc072c227dd8d94decf013be9c8395676efacfab5a0ab33ac4d32dd72b4d719a, rescan pending)
  on 15 occurrences / 12 unique HIGH findings. The nonzero result is the
  intended release-blocking behavior, not a skipped test.
- `pnpm production:preflight:test` passed 8/8 policy tests;
  `@mecoflow/config` passed 15/15; and focused KMS document/BOM storage tests
  passed 7/7. The tracked production example failed preflight as designed on
  unresolved placeholders. No external production manifest was available, so
  no successful production preflight is claimed.
- `pnpm monitoring:config` and `pnpm monitoring:validate` passed against the
  merged staging topology and the actual upstream tools: two Prometheus rule
  files, six recording rules, seventeen alert rules, both Alertmanager
  configurations, and the black-box configuration were valid. The three
  monitoring containers started healthy with UID/GID 65534, read-only roots,
  all capabilities dropped, no-new-privileges, private-only ports, and named
  persistent volumes. With the application dependencies deliberately absent,
  Prometheus correctly changed the API-metrics and public-endpoint alerts to
  `firing`, and the staging observation-only Alertmanager received both.
- Monitoring/capacity controls passed 3/3 metrics unit tests, 1/1 private
  metrics integration test, 6/6 capacity-policy tests (including traversal
  rejection and a real
  20-request concurrent local HTTP smoke), 6/6 operational-readiness policy
  tests, and 5/5 container-policy tests. The latest unchanged `pnpm verify`
  chain passed formatting, nine lint tasks, nine strict typecheck tasks, all
  unit tests, 25 API integration files / 105 tests, and nine builds;
  authorization passed 14 files / 53 tests and OpenAPI remained current.
  Browser tests were not rerun because this scope changed no UI and the prior
  clean 15/15 browser evidence remains current.
- The exact `pnpm verify` rerun passed all stages, including 24 API integration
  files / 104 tests and nine build tasks. Authorization passed 14 files / 53
  tests, OpenAPI/audit passed, and a newly migrated/seeded isolated database
  passed the unchanged browser gate 15/15 in 1.9 minutes. The first browser run
  against accumulated local data passed 10/15 and was discarded as release
  evidence without weakening tests.

# Known defects

- The container gate is red for Keycloak 26.7.0 (now updated to 26.7.2@sha256:fc072c227dd8d94decf013be9c8395676efacfab5a0ab33ac4d32dd72b4d719a in this worktree, rescan pending). No newer clean official image previously
  was available during the 2026-08-01 scan and no exception is approved. A
  supported clean image or externally approved exact time-bound exceptions
  with compensating controls are required before release.
- MinIO upstream is archived. The repository builds its last authorization-fix
  source commit with patched modules and clean scan evidence, but this creates
  a downstream maintenance burden and requires selection/rehearsal of a
  supported S3-compatible replacement before production approval.
- Fresh API container image inspection/scanning for the 2026-08-02 control
  change is unverified: two builds stopped when Docker timed out downloading
  the pinned pnpm package from `registry.npmjs.org`. The TypeScript production
  build passed, but it does not substitute for a successful image build and
  scan. Retry when registry access is restored.

- Persistent local integration data is not bounded between repeated runs. At
  184 projects and 18,636 readiness snapshots, the management-readiness query
  correctly failed its five-second statement limit with 500. CI already uses an
  ephemeral PostgreSQL service; local release verification must likewise use a
  freshly migrated/seeded isolated database as documented in `TEST_STRATEGY.md`.
- The prior Windows full-browser resource failure is resolved by a one-worker
  Windows default, fresh service processes, and a fresh operator-selected
  database. Higher parallelism on a suitably sized Windows runner remains
  unmeasured; Linux/CI parallelism is unchanged.
- Staging BOM uploads originally requested server-side encryption because
  `NODE_ENV=production` in the staging image, while local staging MinIO has no
  KMS/SSE. BOM storage now follows the existing document policy: staging omits
  the S3 SSE request. Production now requires an explicit `aws:kms` key or
  externally proven KMS-backed `AES256` provider contract. Unit and deployed
  acceptance coverage passed after the correction.

# Security, concurrency, and data integrity

- Controllers call application services; services call policies/domain logic and repositories; only repositories access Prisma.
- Every unsafe Phase 2 route requires the existing session-bound CSRF proof. DTO validation rejects unknown properties, including arbitrary project-state patches.
- Scoped project queries preserve inaccessible/nonexistent equivalence. Supplier A/B negative evidence is automated and supplier responses filter employee/history fields.
- Version predicates are evaluated in database updates. Stale project/category/member/milestone/work-package/transition commands return the safe concurrency response and do not write partial audit evidence.
- Project transitions and audit events are written in the same database transaction as business state. Database triggers prevent transition-history and audit-event mutation/deletion.
- Database and repository validation protect project/work-package date ordering, project child boundaries, same-project milestone links, unique codes, active category use, active member scope, and the last active project manager.
- Item-master policies require active internal membership plus `item.read`, `item.write`, or `item.export`; suppliers are denied before item data is disclosed. All unsafe routes are CSRF protected.
- Version predicates protect every item-master edit and item deactivation. Row locking and transaction-time reference counts prevent concurrent deactivation or structural edits from invalidating active references.
- Item-master mutations and export evidence are atomic with redacted audit events. The audit organization is the qualifying actor membership and does not imply catalog ownership.
- Application validation plus database decimals, checks, unique indexes, restrictive foreign keys, typed-value triggers, and the no-delete trigger protect code, precision, type, category, and retention invariants.
- CSV output is fixed-column, fully quoted, formula-prefix neutralized, separately permissioned, and bounded to 10,000 rows.
- BOM/import policies require active internal membership, a specific `bom.*` permission, and existing project scope. Supplier roles receive no BOM grants and resolved identifiers are re-scoped server-side.
- Upload validation, private opaque storage, SHA-256 revalidation, quarantine state, bounded parser resources, macro/external/embedded rejection, and formula flagging fail closed without evaluating spreadsheet content.
- Import enqueue and audit commit together. Worker row/file/outbox/audit completion commits together. Confirmation creates all draft lines and the source/checksum link in one transaction.
- Release and automatic supersede commit together under a BOM lock. A partial unique index enforces one active release, immutable transition triggers retain history, and non-draft line mutation is database-rejected.
- Requisition policies require active internal membership, an operation-specific permission, and project scope. Permission checks precede protected detail/command object disclosure; unsafe commands require CSRF.
- Requisition creation locks project and selected released BOM lines, recalculates active coverage transactionally, validates unit precision and strict over-need authorization, and atomically writes immutable lines plus audit evidence.
- Expected versions and row locks protect explicit lifecycle transitions. Requester/approved approver guards, immutable transition/line triggers, restrictive foreign keys, positive decimals, unique source line per requisition, and retained cancellation/rejection preserve attribution and quantity history.
- PO policies require operation-specific internal permission plus project scope, or supplier-specific permission plus exact addressed organization and active exact project membership. Supplier A/B and nonexistent equivalence is automated before object disclosure.
- Sorted approved-requisition-line locks, current non-cancelled revision coverage, decimal precision checks, immutable availability snapshots, and a deferred line/allocation total constraint prevent over-order and partial quantity effects. Separately authorized overrides retain reason/actor/audit evidence.
- Send, revise, cancel, and supplier acknowledgement use explicit expected-version commands. PO revision content, lines, allocations, transitions, commitment revisions/lines, and aggregate deletion are database-retained; compound foreign keys prevent cross-revision commitment substitution.
- Supplier representations are constructed from explicit allowlists and exclude internal price, terms, notes, requisition/allocation identity, employee/transition/audit data, storage keys, and unrelated suppliers. Phase 4B exposes no attachment route.
- Commitment append locks and versions the PO, scopes every line to the current acknowledged revision, and commits the immutable revision plus redacted audit evidence atomically. Original/latest and late-date projections are derived from retained history.
- Document policy composes operation permission, project scope, owner organization, association scope, CSRF, expected version, clean scan state, and workflow state. Permission preflight and repository owner filters preserve supplier/nonexistent equivalence.
- Signed PUT constraints, authoritative object re-read, exact metadata/size/SHA-256 comparison, detected type, and ClamAV scanning form independent gates. Any missing/failed gate leaves content non-downloadable.
- Completion and lifecycle commands lock and expected-version check document rows. Replacement approval supersedes the previous approval in the same transaction; database triggers prevent invalid transitions, direct pre-approved inserts, metadata overwrite, and history deletion.
- Document success audits contain identifiers and bounded metadata/checksum/status evidence, never file contents, object keys, presigned URLs, scanner raw output, or credentials.
- ASN policies require exact supplier organization, active project assignment, operation permission, current acknowledged PO revision, CSRF, expected version, and supplier-safe allowlists. Sorted PO-line locks and active ASN coverage prevent concurrent over-shipment.
- Receipt policies require internal operation permission and project scope. Sorted ASN-line locks, final effective-quantity validation, global idempotency-key uniqueness, and expected versions prevent duplicate or over-receipt effects.
- Receipt status, lots/adjustments, and audit evidence commit in one transaction. Forced audit failure rollback is automated. Database triggers reject posted mutation, invalid inventory insertion, history update/delete, and cross-object line substitution.
- Packing lists, certificates, and photographs remain private document objects. Supplier ASN associations require owner equality; supplier receipt association fails closed.
- Inspection policies require an operation-specific permission plus internal project scope. Suppliers are denied before identifier resolution; conditional acceptance composes an independent permission and project-write check.
- Inspection creation, result saves, and finalization use optimistic versions. Finalization locks inspection then lot, permits one successful command, and commits lot buckets plus redacted ordinary and conditional audit evidence atomically.
- Required check completion and ordinary conformance are server-enforced. Certificate evidence must be an exact same-project inspection association whose current version is approved and clean; association cannot bypass document quarantine or approval.
- Exact Prisma decimals and configured unit precision constrain inputs. Correction posting and finalization serialize on the lot before reading current state; database checks/triggers preserve immutable snapshots/finalized state, nonnegative buckets, effective-quantity equality, and the prohibition on corrections after disposition.
- NCR policies compose operation permission with project scope or exact supplier organization/project scope. Supplier read models are allowlists that omit internal note/control/actor/history fields; explicitly shared text is mapped into a distinct supplier field.
- NCR commands and supplier responses lock/expected-version check the aggregate and atomically retain transition/response/audit history. Database guards reject terminal or append-only history mutation/deletion.
- Material allocation creation serializes on the inventory lot, recomputes accepted availability, and is independently guarded by a database trigger that locks and validates lot/BOM/precision/conditional scope. Release/consume lock lot then allocation and retain quantity snapshots with transactional audit evidence.
- The Phase 7A service authorizes with the existing internal BOM/project policy before repository access. The repository exposes no supplier/commercial/actor/note/audit details, and the pure calculator uses exact fixed-scale arithmetic with capacity conservation and fail-closed invariants.
- Phase 7B snapshot reads require internal `readiness.read` and existing project scope. The worker coalesces project events, serializes event/schedule calculation with advisory locks, persists immutable explanation-complete batches, and atomically records redacted audit plus event completion.
- Phase 8A snapshot/event atomicity is database-triggered. Unique source-event/user and notification/email keys prevent replay duplication; bounded claims use row locks and stale-lock recovery.
- Notification creation requires active internal project membership. Inbox reads and mark-read commands recheck the authenticated user's current project assignment; preference routes never accept another user ID.
- Preference changes lock the user, expected-version check retained state, and atomically write redacted audit evidence. SMTP secrets never enter the database, outbox, API, or logs.
- Report policies require dedicated permissions plus existing project/readiness/BOM and supplier-source reads. Repository queries apply organization/project predicates before returning records.
- Supplier scorecard scope is derived from the authenticated active supplier membership and active project assignments; request-supplied supplier identity is rejected.
- KPI arithmetic uses exact fixed-scale quantities, deterministic date comparisons, capped arrival quantities, stable commitment revision ordering, and fail-closed persisted-input validation.
- CSV/XLSX serializers neutralize formula triggers after leading whitespace. Export audit failure prevents bytes from being returned; exports above 10,000 rows fail rather than truncate.

# Assumptions and limitations

- The product requirements do not define Phase 2 project/category field catalogs, milestone status, or work-package status. Phase 2 therefore implements only the conservative descriptive and planned-date fields needed by this request; later BOM/readiness state was not anticipated.
- `SYSTEM_ADMIN` and `MECO_MANAGEMENT` oversight follows the seeded role descriptions and remains permission-gated. Other internal roles require explicit project assignment.
- Product requirements did not define the Phase 3A item field catalog, code scope, specification types, role mapping, or decimal bounds. The implementation conservatively uses a global internal catalog, the documented minimal fields, typed `TEXT`/`NUMBER`/`BOOLEAN` definitions, explicit item permissions, and zero-to-six decimal precision. These choices are documented here and in `ITEM_MASTER_API.md`.
- A global catalog means any active internal organization holding an item permission sees the same records. Audit organization identifies the acting membership; it is not tenant ownership. A future organization-partitioning change requires an explicit migration and authorization design.
- The 10,000-row CSV ceiling is a bounded synchronous Phase 3A export decision, not a general reporting limit. Larger/asynchronous exports remain later work.
- Locale message catalogs are still deferred, but all machine enums remain stable and date rendering is timezone-configured. The screens currently use English copy.
- Phase 9C provides and rehearses staging deployment only. No production
  deployment or production data backfill is performed.
- Supplier notifications/readiness access, item/requisition/inspection detail access, cross-supplier comparison, report scheduling, asynchronous large exports, and item reactivation/revision workflows remain deferred.
- Phase 8B periods are live current-state calculations, not historical as-of reconstruction. Later PO revisions and retained operational facts are interpreted by the documented current-obligation/retained-arrival cohort rule.
- Supplier trend buckets use `Asia/Jakarta`; timestamps remain UTC. English UI copy remains while message-catalog completion is deferred.
- Phase 8A intentionally covers readiness alerts and scheduled reminders only. A broader domain-event notification catalog requires a later explicit behavioral specification.
- Email defaults off per preference. When SMTP is disabled, requested email delivery is retained as `SKIPPED`; in-app delivery remains authoritative.
- Production SMTP supports implicit TLS rather than STARTTLS. A deployment requiring STARTTLS needs a separately reviewed transport extension.
- Phase 4A requirements do not define requisition field catalogs, role mapping, approval separation-of-duties, or superseded-BOM semantic remapping. The implementation uses minimal title/notes fields, the documented conservative role mapping, permits an authorized requester to approve, and retains exact BOM-line identity rather than heuristically transferring coverage to a replacement revision.
- The custom XLSX reader intentionally supports ordinary worksheet/shared-string/inline-string cells needed for the fixed template. Unsupported or unsafe workbook constructs fail closed rather than being normalized.
- Import correction is performed by retaining the invalid dry run and uploading a corrected source file. Phase 3B does not mutate source rows in place.
- Phase 4B requirements do not define a PO number format, currency catalog, tax/freight model, acknowledgement separation of duties, or partial commitment policy. The implementation uses per-project integer PO numbers rendered with a `PO-` prefix, optional IDR-oriented internal unit prices without persisted currency/tax calculations, permits both seeded supplier roles to acknowledge/commit, and permits partial commitment revisions with per-line original/latest projection.
- BOM lines have no explicit required-date field. Phase 4B conservatively snapshots work-package planned start for scoped BOMs and project planned start for project-wide BOMs; later required-date changes do not rewrite historical allocations.
- A newly appended PO revision returns the aggregate to `DRAFT`; the supplier sees the PO again only after the new current revision is sent. Prior sent revisions remain internally retained but are not a separate supplier-visible historical document while a replacement draft is pending.
- Phase 4B has no PO attachment model or route. Consequently supplier attachment isolation is fail-closed (the route is absent); attachment authorization requires Phase 5 design rather than anticipating it here.
- Phase 5A did not provision a scanner; Phase 9C staging now runs a private
  non-root ClamAV service. Production scanner lifecycle/capacity remains a
  deployment responsibility and production startup rejects disabled scanning.
  Local disabled scanning intentionally cannot produce approvable content.
- Upload completion currently treats object-read/type/checksum exceptions as a terminal scan failure. A future operator-authorized rescan/retry command may be useful for transient storage/scanner outages but is not added in this bounded phase.
- Phase 5B requirements do not define carrier catalogs, ASN numbering, receipt-edit commands, warehouse catalogs, or zero-quantity metadata-only corrections. The implementation uses supplier references, immutable draft snapshots, bounded free-text location/traceability fields, and non-zero signed correction deltas.
- Phase 6A requirements do not define sampling plans, inspection-definition organization ownership, partial quarantine release, or post-finalization correction/reinspection. The implementation uses the global internal item catalog, evaluates the full effective lot quantity, rejects later corrections, and requires a future separately authorized workflow for any disposition reversal.
- Phase 6B requirements do not define NCR severity/category catalogs, response approval revisions, partial allocation consumption, or allocation transfer. The conservative model uses bounded title/description/root-cause/corrective-action text, direct authorized close after zero or more supplier responses, whole-allocation release/consume terminal states, and new retained allocations instead of editing or transferring quantity.
- The schema does not identify subquantity ownership inside a PO line or received lot pooled across requirements. Phase 7A therefore uses the documented earliest-required-date and stable quality-bucket attribution rule; changing that rule requires a new model version and recalculation plan.
- Certificate completeness is based on retained required inspection certificate checks. Accepted lots with no required certificate check are complete by definition; free-text document categories and unlinked ASN attachments are not inferred as requirement evidence.
- The projection is live and intentionally has no calculation timestamp. It is deterministic for identical committed inputs but does not provide a historical as-of view or snapshot persistence.
- Phase 7B snapshots capture the Phase 7A live result and explicit UTC calculation date; they are historical calculations, not retroactive reconstruction of every underlying domain event.
- Certificate-required status follows the active required item certificate definition, while certificate completeness follows retained inspection snapshots. Changing an active definition therefore affects future readiness inputs but never rewrites an old snapshot.
- Work-package snapshots are created only for work packages represented by current released lines. Project-wide lines contribute only to the project snapshot.

# Next recommended task

The ordered implementation sequence, mandatory goal and loop protocol, hard
phase gates, finding traceability, evidence invalidation rules, and final
go-live criteria are defined in
[PRODUCTION_READINESS_MASTER_PLAN.md](PRODUCTION_READINESS_MASTER_PLAN.md).
Execute one phase at a time and do not begin the next phase until the current
phase is independently verified complete and the user authorizes continuation.

Stop here with release classification **NOT READY**. Do not begin pilot go-live
or post-pilot features. Outstanding audited controls include provisioning the
real on-call receiver and provider monitoring, running the witnessed
paging/escalation drill and production-equivalent capacity test, completing
named users/training, obtaining external secret/TLS/KMS/off-site-backup
evidence, scanning all 14 current release images, resolving or formally
excepting Keycloak, and obtaining formal security/operations/business approval.
These controls are routed to later locked phases in the master plan and are not
authorization to skip earlier phases.
Do not claim production readiness until encrypted off-host backup and every
remaining production control also pass.
