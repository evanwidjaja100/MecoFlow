# Test strategy

## Layers

- Unit tests cover pure configuration validation, policies, calculations, workflows, normalization, validation, sanitization and idempotency.
- Integration tests use isolated disposable PostgreSQL/Redis/object-storage dependencies for repositories, constraints, transactions, audit/outbox effects and operational workflows.
- Authorization tests exercise every protected command and supplier object with negative identifier manipulation.
- Playwright tests use accessible roles/labels for critical browser workflows and include accessibility smoke coverage without arbitrary sleeps.

Tests are deterministic, independent of order, use fictional fixtures, and clean up or isolate their state. A failing test is not weakened to obtain green status. Obsolete expectations require a documented behavior decision first.

## Phase 0 gates

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, Prisma migration/seed, and the Playwright landing-page smoke test form the foundation. `pnpm verify` is the shared local/CI primary quality chain. CI uses frozen installation, service containers, migration validation, checked-in OpenAPI drift detection, production builds, browser smoke, moderate-or-higher dependency audit, pull-request dependency review and container build checks.

## Phase 1 gates

`pnpm test:authorization` runs policy and live-PostgreSQL authorization tests, including inactive profile/membership denial, supplier administration denial, read-only write denial, safe identifier behavior, role-change atomicity, and database-enforced audit immutability. `pnpm test:e2e` runs a deterministic OIDC Authorization Code/PKCE provider and covers login, access denied, internal navigation, supplier navigation, and absence of browser local-storage tokens. The full gate remains `pnpm verify`, followed by `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check`.

Local release verification must target a newly created, migrated, and seeded
database rather than the persistent developer database. Integration scenarios
append intentionally retained workflow/readiness evidence, so repeated release
runs against one database distort representative volumes and can trigger the
deliberate five-second readiness statement limit. CI satisfies this rule with
an ephemeral PostgreSQL service. Local operators must retain the failing
isolated database for diagnosis or safely drop only the exact
`mecoflow_verify_*` database after recording a successful result; shared,
staging, restore-rehearsal, and production databases must never be reset for
verification.

The local Playwright configuration accepts `DATABASE_URL` from the invoking
environment so the browser gate can use that isolated database. It starts fresh
API and web processes instead of attaching to potentially stale development
servers. Windows defaults to one Playwright worker to stay within the measured
host memory/page-file capacity; Linux and CI retain Playwright's normal worker
selection. `E2E_WEB_PORT` and `E2E_API_PORT` may select distinct loopback ports
when the defaults are occupied; both must remain distinct from the fixed seeded
OIDC issuer port `4310`, and the web build-time `NEXT_PUBLIC_API_BASE_URL` must
match the selected API port. Test scenarios and assertions remain unchanged in
scope.

Environment-blocked commands are reported with exact cause and residual risk; no command is reported successful unless it completed successfully.

## Phase 2 gates

The full existing gate remains mandatory. Unit tests exhaustively compare every source/target project-state pair with the accepted transition graph, including the forbidden completed-to-active path. Integration tests cover transactional transition/audit evidence, database immutability, arbitrary-state-patch rejection, category/project/child persistence, seed idempotency, and two simultaneous project edits using one expected version (exactly one succeeds). Authorization tests add Supplier A/B project-object isolation, safe nonexistent equivalence, supplier field filtering, read-only denial, and CSRF denial. Playwright creates, edits, and explicitly transitions a project through accessible controls while preserving URL-backed project filters, sorting, and pagination.

## Phase 3A gates

The full existing gate remains mandatory. Unit tests cover unit/attribute decimal precision, definition shapes, required and typed specification values, numeric bounds, duplicate values, and CSV quoting/formula sanitization. Integration tests cover global duplicate category/unit/item codes, per-category attribute-code uniqueness, active-reference and required-value rules, category immutability on item edits, optimistic concurrency, deactivation/read-only behavior, absence of a delete route, database-enforced item-delete rejection, filtered case-insensitive search, the 10,000-row CSV limit, transactional redacted audits, and deterministic Phase 3A seed idempotency.

Authorization tests cover permission-specific read/write/export access, supplier denial, inactive/read-only principal denial, CSRF on every write path, safe item identifiers, and export audit evidence. Playwright creates supporting master data and a typed item through accessible controls, edits and searches it through URL-backed query state, downloads the filtered CSV, and deactivates the item without exposing a delete control. The final gate is `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. Exact command results belong in the implementation handoff; documentation does not represent an unrun command as successful.

## Phase 3B gates

Unit tests cover the complete BOM lifecycle matrix, release preconditions, upload name/type/magic/size checks, fixed CSV/XLSX templates, retained duplicates/blank rows, invalid quantity/unit, ambiguous item matching, and non-evaluated CSV/XLSX formulas. Integration tests cover revision-number uniqueness, draft-only line mutation, immutable history, released-only official lines, same-transaction release/audit, automatic supersede, one active release, and concurrent same-version release. Worker integration verifies private-object retrieval, checksum, row persistence, file state, outbox state, and audit evidence.

Authorization tests cover authentication, internal project scope, supplier real/nonexistent equivalence, unassigned internal real/nonexistent equivalence, and CSRF before upload storage. Playwright uploads an invalid import, displays its row error, uploads a corrected import, confirms the draft, corrects a line, reviews, releases, and observes released-only readiness plus zero-valued procurement placeholders. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration/seed.

## Phase 4A gates

Unit tests exhaust the requisition transition matrix and cover exact-need, under-need, over-need, already-covered, and invalid quantity boundaries. Integration tests create from a released BOM line, prove active coverage/outstanding calculations, authorized and unauthorized over-need behavior, dedicated audit evidence, requester/approver preservation, invalid transition rejection, coverage release on rejection/cancellation, database immutability, and two concurrent creates that cannot both reserve the same outstanding need.

Authorization tests cover authentication, supplier real/nonexistent equivalence, unassigned internal real/nonexistent equivalence, CSRF before creation, and the independent internal override permission. Playwright releases a BOM requirement, creates the requisition from displayed outstanding need, submits it, approves it, and verifies status and attribution. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation.

## Phase 4B gates

Unit tests exhaust the PO lifecycle matrix and cover exact-approved, partially available, fully consumed, over-order, and invalid quantity boundaries. Integration tests cover approved-source enforcement, line/allocation equality, separately authorized reasoned overrides, concurrent double-order prevention, PO revision retention, send/acknowledge/cancel lifecycle, approved-requisition cancellation protection, original/latest commitment dates, late-date exception projection, append-only database guards, and transactional audit evidence.

Authorization tests cover Supplier A list/detail access, Supplier B/nonexistent equivalence for PO detail, acknowledgement, commitments and absent attachment routes, active project assignment, CSRF-before-write, and server-side absence of internal prices, terms, notes, requisition allocation identity, and employee/audit fields. Playwright creates an approved source, creates and internally sends a PO, signs in as the addressed supplier, acknowledges it, appends two commitment revisions, and verifies original/latest dates and internal-field absence. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. Shipment, ASN, receiving, inspection, and inventory tests remain Phase 5 or later.

## Phase 5A gates

Unit tests cover allowlisted extension/MIME/size/checksum handling, ZIP/executable/binary/magic rejection, UTF-8 detection, and exact presigned URL expiry. Integration tests use private MinIO and PostgreSQL to exercise a signed PUT, independent object/checksum verification, clean review/approval, audited download signing, replacement approval/automatic supersede, approved metadata immutability, failed checksum, rejection, and concurrent expected-version behavior.

Authorization tests cover unauthenticated and CSRF denial, Supplier A own access, Supplier B/nonexistent equivalence, server-side storage-key absence, supplier approval denial before identifier disclosure, project scope, and own-organization filtering. Playwright uploads a file through the document component and confirms scanner-unavailable content fails closed in the security table. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. ASN, receiving, inspection, NCR, allocation, and readiness remain later work.

## Phase 5B gates

Unit tests exhaust the ASN transition matrix. Integration tests cover supplier-owned current PO-line scope, shipped and received quantity bounds, transition/audit history, idempotent posting, one-lot-per-line creation, posted immutability, separate corrections and adjustments, database guards, and forced audit failure rollback of receipt plus lot effects. Document-association tests cover supplier ASN attachment acceptance, supplier receipt denial, and internal receipt photograph association.

Authorization tests cover Supplier A creation/read/commands, Supplier B/nonexistent equivalence for PO and ASN targets, foreign PO-line rejection, CSRF-before-write, active exact project assignment, and supplier field allowlisting. Playwright uses a touch-enabled 1024×768 context to create/submit/dispatch an ASN, record arrival, enter traceability data, create/post a draft receipt, and observe an awaiting-inspection lot. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed. Inspection, NCR, allocation, and readiness remain deferred.

## Phase 6A gates

Unit tests cover exact decimal precision, accepted/rejected overflow, derived quarantine, and disposition-specific quantity shapes. Integration tests cover automatic and explicit definition snapshots, immutable snapshot behavior after configuration changes, checklist and measurement results, accepted/conditionally accepted/quarantined/rejected lot buckets, ordinary nonconformance rejection, effective quantity after pre-finalization corrections, late-correction rejection, once-only concurrent finalization, correction-versus-finalization serialization, forced-audit rollback, approved-clean certificate evidence, and finalization/audit evidence.

Authorization tests cover supplier real/nonexistent equivalence, independent conditional-acceptance permission, CSRF-before-write, and dedicated conditional-authorization audit evidence. Playwright posts inspection-required material, opens the work queue, records checks, finalizes acceptance, and verifies read-only disposition and lot buckets. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed. NCR, supplier quality response, material allocation, and readiness remain deferred.

## Phase 6B gates

Unit tests exhaust NCR and material-allocation lifecycle edges. Integration tests cover all three NCR source types, active supplier derivation/scope, append-only numbered responses, internal-note filtering, explicit sharing, expected-version concurrency, immutable history, accepted-lot/BOM matching, precision, release/consume quantity snapshots, audit rollback, quarantined rejection, conditional authority/audit, and concurrent over-allocation prevention.

Authorization tests cover Supplier A/B and nonexistent equivalence, supplier list isolation, server-side absence of internal note/control/actor/history fields, CSRF-protected supplier response, retained supplier attribution, independent conditional-use denial, and authorized conditional allocation. Playwright releases a requirement, receives and quarantines material, creates/issues an inspection-linked NCR, submits a supplier response, explicitly shares closure disposition, creates an allocation from a separate accepted traceable lot, and consumes it with visible retained history. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. Phase 7 projection and dashboards remain absent.

## Phase 7A gates

Pure calculation tests cover exact decimal arithmetic, active/cancelled requisition treatment, split sourcing, pooled PO-line attribution, current versus replaced PO plans, multiple commitment revisions and dates, dispatched versus undispatched ASN quantities, partial receipts, signed corrections, accepted/rejected/quarantined/unresolved partitions, certificate completeness, released/active/consumed allocations, shortage, stage, blocker priority, deterministic repeat calculation, and invalid persisted inputs.

Database integration uses a deterministic semantic fixture with two requirements pooled onto one PO line, revised commitments, a partial shipment, two partial receipts, a negative correction, mixed quality disposition, released and consumed allocations, and an independently superseded BOM revision. It reads the projection twice unchanged, proves identical output, exact total conservation, and released-only inclusion. Authorization coverage proves internal access, server-side field minimization, supplier denial, and supplier real/nonexistent equivalence. Standard formatting, lint, strict type-check, unit, integration, authorization, production build, and OpenAPI drift checks remain required. Phase 7A adds no dashboard/browser workflow.

## Phase 7B gates

Pure tests cover every stage score and criticality weight; score bands; every rejected, quarantine, certificate, NCR, late-commitment, and due-shortage critical gate; partial acceptance; the 30-day future LOW rule; resolved NCR removal; determinism; and invalid inputs. Database integration proves trigger-created events, event coalescing, released-only source loading, project/work-package batches, versions/input hashes, atomic audit/event completion, same-day scheduled idempotence, next-day recalculation, and immutable history.

Authorization tests cover internal management/project/material/history reads, explanation completeness, supplier denial, field minimization, and real/nonexistent equivalence. Playwright traverses management, project, material, and history views and asserts score, blockers, reasons, and actions remain displayed together. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation.

## Phase 8A gates

Database integration proves readiness snapshot/outbox atomic commit and forced rollback, event and per-recipient uniqueness, replay idempotency, preference enforcement, scheduled-reminder classification, bounded email retry, and retained outbox/email dead letters. Authorization coverage proves own-user preference/inbox scope, CSRF, expected versions, active project assignment rechecks, supplier absence, and inaccessible/nonexistent equivalence. SMTP configuration tests prove disabled defaults, local Mailpit configuration, and production fail-closed validation.

Playwright reads and marks an in-app notification and changes an email preference through accessible controls. Worker unit/integration coverage checks replay, duplicate prevention, retry, dead-letter, and structured observability state. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. Reports and supplier scorecards remain Phase 8B.

## Phase 8B gates

Pure known-outcome fixtures cover every KPI, original versus latest commitments, partial/late/future delivery, superseded unshipped exclusion, retained noncurrent arrival, every quality disposition, NCR response, monthly trends, exact rounding, and null zero-denominator behavior. Export tests cover metadata, filters, row limits, CSV quoting, leading-whitespace formula triggers, macro-free XLSX, and audit redaction.

Database integration covers report filters, immutable export audit evidence, project scope, own-supplier organization predicates, and Supplier A/B row isolation. Authorization tests prove required underlying grants, supplier-derived organization, foreign-selector rejection, and denial before repository access. Playwright covers the internal report catalog, CSV download, supplier scorecard, original/latest labels, accessible trend tables, and absence of a supplier selector. The cumulative gate is `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. Phase 8B adds no Phase 9 hardening.

## Phase 9A security gates

Focused unit tests cover normalized login return paths, malformed cookies,
strict OIDC audiences/authorized party/not-before/types/endpoint schemes,
bounded identity-provider responses, safe logger output, early file row limits,
bounded decompression, and web security-header policy.

A live API integration suite asserts security and cache headers, exact allowed
and denied CORS origins, the JSON body ceiling with stable 413 output,
attacker-input non-echo, and rate limiting with stable 429 output. Existing
negative authorization, supplier A/B isolation, inaccessible/nonexistent
equivalence, file-security, spreadsheet-export, audit, concurrency, and full
integration suites remain mandatory and were not weakened.

Dependency verification uses the repository `pnpm security:audit` command and
frozen lockfile. Container verification uses Compose configuration, all three
production Dockerfile builds, and runtime identity/artifact-permission probes.
The full Playwright gate remains mandatory. Its 2026-07-27 accumulated-fixture
and Windows teardown blocker, and the later clean-database resolution, are
documented in `SECURITY_REVIEW.md`.

## Phase 9B performance and data gates

`pnpm performance:measure` exercises the enforced 5,000-row BOM boundary, a
5,000-line readiness calculation, and the 10,000-delivery/inspection/NCR
scorecard boundary across 12 trend months. Results are evidence for the local
review, not a hardware-independent pass/fail threshold.

PostgreSQL plans are captured before and after an index change with
`EXPLAIN (ANALYZE, BUFFERS)`. An index is retained only when the target plan
selects it and measured execution improves. Pagination tests prove defaults,
the 100-row ceiling, metadata, and continued principal scope. Report
integration exercises the five-second statement-bounded reads.

Existing exact KPI fixtures, import/parser tests, allocation concurrency,
receipt idempotency/rollback, outbox replay/dead-letter tests, authorization,
full integration, OpenAPI, production build, and browser suites remain
mandatory. `docs/PERFORMANCE_REVIEW.md` records data volumes, environment,
before/after evidence, cache and worker review, expected limits, and residual
risks.

## Phase 9C staging deployment gates

The staging gate builds every production-oriented image and inspects OCI
version/revision metadata, configured/effective runtime users, required
runtime artifacts, absence of source/tests/Git metadata, externally mounted
secrets, named volumes, and Docker log rotation. Compose must resolve without
warnings and only the TLS reverse proxy may publish a port.

Deployment verification starts actual PostgreSQL, Keycloak PostgreSQL,
passworded Redis AOF, private MinIO, ClamAV, production-mode Keycloak, API,
worker, web, and nginx containers. The controlled migration job must apply all
committed migrations before seed and app startup. Health gates must verify
dependencies and application/worker readiness, not only process existence.

`tests/staging/smoke.spec.ts` runs against the external HTTPS endpoint and real
Keycloak. It covers health/TLS/version metadata, internal authentication and
project creation, supplier scorecard/project access, server-side field
minimization, and bidirectional Supplier A/B foreign-versus-nonexistent 404
equivalence. Credentials are read by the PowerShell wrapper from ignored
external secret files and are never printed.

Operational verification creates/checksums both PostgreSQL dumps, a Keycloak
realm export, completed document objects, and the full object mirror. The
backup/restore rehearsal stops the source, recreates separately namespaced
target volumes, proves all target data stores are empty before mutation,
restores both databases and the object bucket, compares fixed application and
realm counts/checksums, applies migrations, and starts the restored services.
`tests/staging/backup-source.spec.ts` creates representative documents through
the secured flow. `tests/staging/restore-rehearsal.spec.ts` proves restored
document/readiness behavior and supplier denial; the standard staging smoke
adds authentication, core flow, and bidirectional supplier isolation. Business
acceptance remains a mandatory production blocker.

Production-control policy tests use only temporary test values outside the
repository. They cover exact manifest shape, production-only values, external
path containment, secret length/uniqueness/placeholder and POSIX-mode checks,
safe error output, TLS failure, evidence freshness, KMS/bucket-policy
consistency, off-site RPO/checksum/restore evidence, and safe summary output.
Configuration tests require HTTPS object storage and explicit `aws:kms` plus a
key identifier or `AES256` without one. Storage tests prove signed KMS upload
headers and fail-closed encryption-result matching. Real provider trust, ACL,
KMS, immutable retention, and off-site transfer evidence remains an external
release gate rather than a mocked pass.

## Production operations-readiness gates

Metrics unit coverage proves route-label bounding, fixed/`OTHER` queue event
labels, histogram/counter output, dependency/heartbeat/collection signals, and
absence of attacker identifiers. API integration exercises the private scrape
endpoint against real PostgreSQL/Redis configuration and verifies no session or
database secret is emitted. The shared heartbeat contract is tested once and
consumed by both worker and API.

`pnpm monitoring:validate` uses the pinned upstream tools to validate
Prometheus configuration, six recording rules, seventeen alert rules, both
Alertmanager configurations, and black-box configuration. Merged Compose
validation proves monitoring services remain private, non-root, read-only, and
log-rotated. Their images join the complete fail-closed image scan.

`pnpm operations:preflight:test` covers successful current evidence,
outside-repository controls, stale/public/incomplete monitoring, missing
resolved delivery/acknowledgement/escalation, deficient capacity evidence, and
safe errors. `pnpm capacity:test` covers read-only configuration boundaries,
nonlocal health/internal/supplier requirements, percentile/threshold failure,
and a real bounded concurrent ephemeral HTTP smoke. A real production-equivalent
capacity run and real paging drill remain external release gates.
