# Current phase

Phase 1 — Identity and authorization (implemented and locally verified on 2026-07-16). Work stops before Phase 2.

# Completed capabilities

- Phase 0 repository, runtime, infrastructure, configuration, health, logging, Prisma, test, CI, and container foundations remain intact.
- Keycloak OIDC Authorization Code Flow with S256 PKCE, one-time database authorization transactions, browser-bound state, nonce, discovery/JWKS RS256 verification, generic authentication failures, and validated production identity/session configuration.
- Opaque database-backed sessions use an HttpOnly `SameSite=Lax` cookie (`Secure` in production); access/refresh tokens are discarded after callback and are never written to `localStorage`.
- Authenticated issuer/subject identities synchronize into `UserProfile`; inactive profiles are denied.
- Internal/supplier organizations, active/inactive memberships, seeded roles and granular permissions, role assignments, and organization-scope policies are persisted and enforced server-side.
- Deny-capable project-scope policy/resolver interfaces exist for Phase 2 without creating project data, APIs, or screens.
- `/api/v1/me` returns only the active profile and scoped authorization context.
- Separate accessible internal and supplier application shells, generic access-denied handling, internal navigation, and supplier navigation.
- Internal administration screens and APIs for organization creation/listing, membership creation/activation/deactivation, synchronized user selection, seeded role listing, and atomic role assignment.
- Supplier and read-only roles cannot enter/write internal administration. Scoped protected identifier attempts use equivalent safe responses.
- Membership creation/status changes and every actual role-set change create redacted audit events in the same database transaction. PostgreSQL triggers reject audit event update/delete operations.
- Unsafe administration commands require a session-bound CSRF cookie/header pair, validated DTOs with unknown-property rejection, permission policy, scope policy, and optimistic membership versions.
- OpenAPI, authorization matrix, domain/security/test/dependency documentation, local Keycloak realm fixtures, positive/negative authorization tests, and OIDC Playwright workflows are updated.

# Partially completed capabilities

- None within the bounded Phase 1 scope.

# Not started

- Phase 2–9 operational capabilities. In particular, no project, milestone, work-package, procurement, logistics, quality, readiness, notification, reporting, or scorecard entity/API/screen has been added.

# Active technical decisions

- ADR-0001 through ADR-0014 remain accepted and governing.
- The API is the OIDC callback/session and authorization authority; Next.js is a presentation/BFF consumer and never grants business access.
- Roles grant permissions only. Active membership, organization type/scope, object scope, CSRF, and concurrency are independent mandatory checks.
- The Phase 1 OIDC profile is public-client Authorization Code + S256 PKCE with RS256 ID tokens. Algorithm/client-authentication expansion requires security review.

# Database migrations

- `20260715000000_phase_0_foundation` remains unchanged.
- `20260716000000_phase_1_identity_authorization` adds user profiles, organizations, memberships, roles, permissions, role grants, membership role assignments, opaque sessions, short-lived OIDC transactions, and audit events, with foreign keys, uniqueness/scope indexes, UTC timestamps, and optimistic membership versions.
- The migration adds database triggers that reject `UPDATE` and `DELETE` against `audit_events`.
- The deterministic seed always upserts documented roles/permissions. Only explicit `local`, `development`, `test`, or `ci` environments seed two fictional organizations plus Keycloak/test identities and memberships; ambiguous, staging, and production environments create no fixture organizations or profiles.
- No business-data backfill is required because Phase 0 contained no business entities. Production down-migration is not authorized; restore/redeploy uses the documented backup and migration process.

# Test status

- `pnpm db:migrate` and `pnpm db:seed` apply successfully against local PostgreSQL.
- `pnpm test:authorization` passes policy and live-database positive/negative coverage, including inactive user, inactive membership, supplier denial, read-only denial, identifier equivalence, role audit atomicity, and database immutability.
- `pnpm test:e2e` passes Chromium login/PKCE, local-storage, access-denied, internal-navigation, and supplier-navigation workflows using a deterministic test-only OIDC provider.
- Formatting, lint, strict typecheck, unit tests, integration tests, production build, and OpenAPI drift verification are part of the final Phase 1 gate and are reported with exact commands in the implementation handoff.

# Known defects

- None known that block the bounded Phase 1 acceptance criteria after local verification.

# Security review status

- Authentication state is browser-bound, one-time, and expiring. Session and CSRF values are high-entropy; only hashes are persisted. Browser access tokens are not used.
- Permission and scope decisions occur in API application services/policies before repositories mutate data. Supplier membership cannot satisfy internal-administration policy.
- Inactive user/membership/organization state is evaluated for every session-backed request. Protected errors do not include token, claim, database, stack, or object-existence detail.
- Role/membership changes are atomic with audit persistence; audit write failure aborts the business transaction and database triggers prevent normal mutation/deletion.
- Local realm credentials and deterministic OIDC provider identities are fictional, non-production fixtures. Production rejects documented local session secrets and insecure browser/OIDC URLs.

# Concurrency and data integrity

- Membership status and role-set writes use expected versions; stale writes return a safe conflict and do not partially mutate roles or audit evidence.
- Unique constraints prevent duplicate issuer/subject profiles, organization codes, memberships, permission grants, and role assignments.
- Role scope is validated against organization type before assignment. Foreign keys use restrictive deletion to preserve identity/audit references.

# Deployment status and limitations

- No staging or production deployment has occurred or is authorized by Phase 1.
- Production Keycloak realm provisioning, redirect/origin configuration, TLS/proxy enforcement, secret injection, MFA policy, session cleanup scheduling, rate limiting, monitoring/alerting, and recovery rehearsal remain deployment/hardening responsibilities.
- The local deterministic OIDC provider is test-only and is never part of an application runtime image.
- Audit read/export UI and retention automation are deferred; Phase 1 persists immutable evidence and seeds `audit.read` but exposes no audit browsing endpoint.
- Supplier self-membership permissions are reserved in the matrix, but supplier self-administration screens/APIs are deferred to the supplier collaboration phase; suppliers cannot use internal administration.

# Next recommended task

- Stop here. Begin Phase 2 projects, milestones, and work packages only after explicit user approval and a new bounded implementation request.
