# Changelog

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
- Fixed the cumulative Phase 3A seed so unchanged item-master fixtures no longer rewrite `updatedAt`, restoring the documented idempotency gate.
- Kept Phase 1 permission/fixture reconciliation atomic while giving the expanded catalog a bounded 20-second transaction window under parallel integration load.

### Fixed

- Phase 0 review remediation for safe production configuration validation, configured-bucket readiness, deterministic seeding, loopback-only local infrastructure, reproducible setup/CI commands, generated Next.js type handling, and minimal production runtime stages.
- Explicit API health-controller injection for the metadata-light `pnpm dev` transpiler.
- Reliable cross-platform `pnpm dev` supervision without deprecated Turbo flags or nested API/worker watch processes.
