# Changelog

## Phase 1 — 2026-07-16

- Added Keycloak OIDC Authorization Code with PKCE, browser-bound state/nonce checks, synchronized profiles, opaque server-side sessions, and `/api/v1/me`.
- Added organizations, memberships, seeded roles/permissions, server-side organization policies, Phase 2 project-policy interfaces, and internal/supplier application shells.
- Added internal organization/membership/role administration, same-transaction immutable audit events, checked OpenAPI, positive/negative authorization tests, and OIDC browser workflows.

All notable changes follow Keep a Changelog and semantic versioning conventions.

## [Unreleased]

### Added

- Phase 0 repository, architecture, infrastructure, application, database, testing, and CI foundations.

### Fixed

- Phase 0 review remediation for safe production configuration validation, configured-bucket readiness, deterministic seeding, loopback-only local infrastructure, reproducible setup/CI commands, generated Next.js type handling, and minimal production runtime stages.
- Explicit API health-controller injection for the metadata-light `pnpm dev` transpiler.
- Reliable cross-platform `pnpm dev` supervision without deprecated Turbo flags or nested API/worker watch processes.
