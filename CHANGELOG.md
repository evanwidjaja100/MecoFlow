# Changelog

## 2026-08-02 — monitoring, on-call, and capacity readiness controls

- Added a private bounded-cardinality Prometheus endpoint for HTTP, process,
  dependency, worker-heartbeat, outbox, and email-delivery signals.
- Added a private non-root Prometheus/Alertmanager/HTTPS black-box monitoring
  overlay with six recording rules, seventeen actionable alerts, bounded
  retention, configuration validation, and complete image-gate coverage.
- Added external on-call/monitoring evidence validation, paging/escalation
  procedures, and a dependency-free read-only capacity runner with enforced
  health/internal/supplier latency, error, headroom, and recovery gates.
- Repository tests/configuration pass; real paging, production-equivalent load,
  provider evidence, and approval remain required before production.

## 2026-08-02 — production external-control contract

- Added a fail-closed provider-neutral preflight for externally delivered
  secret files, trusted TLS chain/key/hostname/expiry, KMS-backed private object
  storage evidence, and encrypted/versioned off-site backup plus restore
  evidence.
- Added production non-secret/evidence templates outside the runtime path and
  CI policy tests; tracked examples intentionally fail until copied externally
  and populated from real provider checks.
- Added explicit production `aws:kms` object uploads and verification while
  retaining `AES256` only for externally proven KMS-backed SSE-S3 providers.
- No external infrastructure was provisioned and production readiness remains
  blocked.

## 2026-08-01 — Container image vulnerability gate

- Added a digest-pinned Trivy gate for every release image with policy tests,
  exact expiring exceptions, ignored JSON evidence, and CI enforcement.
- Removed unused npm/Corepack tooling and `gosu` from runtime images, patched
  PostgreSQL/nginx layers, upgraded Keycloak to 26.7.0, and replaced stale
  MinIO images with checksum-verified source builds of the final security fix
  plus scanner-required Go module updates.
- Recorded ten clean images and the unresolved Keycloak HIGH findings without
  weakening the gate or inventing risk approval; the candidate remains not
  ready.

## 2026-08-01 — Controlled pilot preparation

- Added the controlled-pilot scope, user/project/BOM templates, role guides,
  incident/correction/support procedures, acceptance/KPI/review/go-live/
  rollback/evaluation artifacts, and safe dataset documentation.
- Added a guarded idempotent staging pilot-data job and HTTPS Playwright
  acceptance flow covering internal, supplier, warehouse, QA/QC, readiness,
  reports, partial delivery, quarantine/NCR, and bidirectional supplier
  isolation.
- Corrected staging BOM object uploads so only production requests S3
  server-side encryption; production behavior remains fail-closed and tested.
- Serialized material-requirement queries within the single repeatable-read
  transaction, removing ineffective concurrent transaction-client work and
  restoring the unchanged 20-second integration gate. Three clean targeted
  runs and the complete 104-test integration suite passed.
- Stabilized the complete browser release gate with isolated database
  propagation, fresh test-owned services, bounded Windows parallelism, and
  identity-accurate deterministic fixtures; all 15 scenarios pass on a clean
  migrated and seeded database.
- Classified the candidate `NOT READY`: deployed pilot acceptance, restore,
  authorization, audit, OpenAPI, aggregate integration, builds, and the full
  browser gate passed, but external pilot controls and approvals are incomplete.

## 2026-07-30 — Phase 9C staging deployment

- Added production-oriented non-root images and staging Compose with private
  durable services, nginx TLS ingress, external Docker secrets, controlled
  migration/seed/provision jobs, health checks, log rotation, and OCI version
  metadata.
- Added coordinated application/Keycloak/object backup, guarded restore,
  object-persistence probe, deployment/rollback runbooks, and a staging
  release checklist.
- Fixed fresh Phase 8B migration ordering and runtime packaging/public-link
  defects found by the deployment rehearsal.
- Passed real HTTPS/Keycloak internal and supplier smoke flows with
  bidirectional cross-supplier isolation, backup validation, and persistence
  recreation. A destructive restore and production acceptance remain blocked.

## 2026-07-27 — Phase 9A security hardening

- Hardened normalized login return paths, OIDC claims/provider responses,
  request limits, safe errors, structured-log redaction, browser/cache headers,
  and compressed BOM parsing.
- Patched the supported dependency graph to zero known audit advisories and
  retained frozen Linux/Alpine production builds.
- Kept all application containers non-root while making deployed artifacts
  root-owned and non-writable; added negative/security integration coverage and
  `docs/SECURITY_REVIEW.md`.
- Recorded the unresolved accumulated-fixture and Windows Playwright runner
  blocker without weakening browser tests or resetting shared local data.

## 2026-07-27 — Phase 8B reports and supplier scorecards

- Added the bounded Project Readiness, Material Exceptions, Supplier Performance, and Own Supplier Scorecard report catalog.
- Added exact versioned supplier KPIs with separate original/latest commitment performance and monthly trends.
- Added repository-scoped internal/supplier authorization, secure audited CSV/XLSX exports, formula neutralization, known-outcome fixtures, and internal/supplier report interfaces.

## Phase 1 — 2026-07-16

- Added Keycloak OIDC Authorization Code with PKCE, browser-bound state/nonce checks, synchronized profiles, opaque server-side sessions, and `/api/v1/me`.
- Added organizations, memberships, seeded roles/permissions, server-side organization policies, Phase 2 project-policy interfaces, and internal/supplier application shells.
- Added internal organization/membership/role administration, same-transaction immutable audit events, checked OpenAPI, positive/negative authorization tests, and OIDC browser workflows.

All notable changes follow Keep a Changelog and semantic versioning conventions.

## [Unreleased]

### Added

- Phase 0 repository, architecture, infrastructure, application, database, testing, and CI foundations.
- Phase 3B project/work-package BOMs, revision lifecycle/comparison, secure CSV/XLSX templates and uploads, background dry-run validation, explicit confirmation, transactional release/supersede, authorization/audit controls, UI workflows, and automated coverage.
- Phase 4A purchase requisitions from released BOM requirements, live coverage/outstanding quantities, concurrency-safe quantity bounds, separately permissioned/audited over-need overrides, explicit lifecycle/attribution history, internal screens, OpenAPI, and automated browser/security/integrity coverage.
- Phase 4B approved-quantity purchase orders with immutable allocations and retained revisions, explicit send/acknowledge/cancel commands, supplier-scoped safe list/detail responses, append-only commitment revisions, original/latest dates, late commitment exceptions, audit evidence, OpenAPI/docs, internal/supplier screens, and automated lifecycle/concurrency/authorization/browser coverage.
- Phase 5A project-scoped document storage with immutable numbered versions, owner organization and typed associations, private MinIO/S3 extension-free UUID keys, signed PUT/GET URLs, safe format validation up to 10 MiB, ClamAV virus scanning with fail-closed quarantine, explicit DRAFT/IN_REVIEW/APPROVED/REJECTED lifecycle and replacement supersede, separate permission/audit controls, internal document workspace, and automated coverage.
- Phase 5B supplier advance shipment notices with owned PO-line scoping, active shipped-quantity bounds and retained package references, explicit submit/dispatch/arrive/cancel lifecycle, internal tablet receiving with touch-sized traceability capture, idempotent receipt posting, awaiting-inspection inventory lots, signed correction deltas, secure document associations, supplier/internal screens with field allowlisting, and automated lifecycle/concurrency/authorization/browser coverage.
- Phase 6A item-scoped receiving check definitions and immutable per-lot snapshots, automatic and explicit inspection creation, checklist/measurement/certificate results, approved evidence enforcement, accepted/conditionally accepted/quarantined/rejected dispositions, transactional lot quantity buckets, independent conditional-acceptance authorization/audit, work-queue/detail screens, and concurrency/integrity/browser coverage.
- Phase 6B project/lot/inspection NCRs with explicit issue/respond/close/cancel lifecycle, supplier-isolated allowlisted views, append-only corrective responses, explicitly shared disposition text, accepted-lot allocation to released BOM lines, database-serialized availability, independently authorized conditional use, immutable release/consume quantity history, internal/supplier interfaces, and lifecycle/isolation/concurrency/audit/browser coverage.
- Phase 7A internal `material-requirement-status-v1` projection for current released BOM lines, with exact pipeline quantities, operative commitment dates, deterministic stage/blocker rules, split/pooled sourcing attribution, correction and quality handling, released/consumed allocation semantics, OpenAPI/docs, and comprehensive unit/integration conservation coverage.
- Phase 7B `readiness-calculator-v1` and `readiness-rules-v1` with criticality-weighted stage scores, overriding critical gates, deterministic reason/action explanations, immutable reproducible project/work-package snapshots, event-primary and scheduled-idempotent worker recalculation, internal readiness authorization, management/project/material/history APIs and dashboards, OpenAPI/docs, and unit/integration/authorization/browser coverage.
- Fixed the cumulative Phase 3A seed so unchanged item-master fixtures no longer rewrite `updatedAt`, restoring the documented idempotency gate.
- Kept Phase 1 permission/fixture reconciliation atomic while giving the expanded catalog a bounded 20-second transaction window under parallel integration load.

### Fixed

- Serialized inventory-lot correction posting against receiving-inspection finalization in both the repository workflow and database adjustment guard, preventing a concurrent late adjustment from diverging finalized quantity buckets.
- Phase 0 review remediation for safe production configuration validation, configured-bucket readiness, deterministic seeding, loopback-only local infrastructure, reproducible setup/CI commands, generated Next.js type handling, and minimal production runtime stages.
- Explicit API health-controller injection for the metadata-light `pnpm dev` transpiler.
- Reliable cross-platform `pnpm dev` supervision without deprecated Turbo flags or nested API/worker watch processes.
