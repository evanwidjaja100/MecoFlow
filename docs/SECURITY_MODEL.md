# Security model

## Principles

MECO Flow denies access by default, validates every trust boundary, minimizes disclosed data, keeps secrets outside source control, and records security-relevant business changes immutably. Inaccessible and nonexistent protected resources must be indistinguishable.

## Authentication and sessions

Keycloak is the sole identity provider. Phase 1 will implement OIDC Authorization Code with PKCE using secure HttpOnly cookies or a backend-for-frontend session; browser local storage must never contain access or refresh tokens. Production has no default administrator credentials, uses Secure cookies and an explicit SameSite/CSRF design, and restricts Keycloak administration.

## Authorization decision

Every protected operation checks authenticated identity, active user, active membership, permission, organization scope, project scope where applicable, object policy, workflow state, and field visibility. Supplier users see only their organization's explicitly addressable/shared records and never internal costs, comments, evaluations, audits, private dispositions, employee data, unrelated projects, or another supplier's records.

## Application and API controls

Validate path/query/body values and reject unknown sensitive-command properties. Bound payloads, strings, pagination and timeouts. Use parameterized Prisma operations, generic production errors, security headers, CORS allowlists, request IDs, correlation IDs, idempotency and optimistic concurrency where required. Logs redact authorization headers, cookies, passwords, tokens, credentials, keys, document contents and unnecessary personal data.

## Files and supply chain

Object storage is private. Uploads use opaque keys, allowlisted extension and verified MIME, size limits, SHA-256, safe filenames, quarantine/scan states and authorization before short-lived downloads. Executables and ZIP are disallowed in MVP. Lockfiles, frozen installs, dependency review, vulnerability review, pinned container majors and non-root application images reduce supply-chain risk.

## Phase 1 status

The API implements Keycloak OIDC Authorization Code with S256 PKCE, one-time database-backed authorization transactions, browser-bound state/nonce verification, RS256 ID-token verification against discovery/JWKS, profile synchronization, and opaque server-side sessions. The session cookie is HttpOnly, `SameSite=Lax`, and Secure in production; access and refresh tokens are neither persisted nor exposed to the web application. Unsafe administration requests require a session-bound CSRF cookie/header pair and an allowed browser origin.

Authorization composes active profile, active membership/organization, permission, internal/supplier organization type, and scoped object identifiers. Supplier principals cannot enter internal administration. Protected API errors are stable and generic. Membership and role changes write redacted audit events in the same transaction, and PostgreSQL triggers reject audit update/delete operations.

Rate limiting and upload/download controls remain later hardening/operational-module work. Production Keycloak realm provisioning, TLS/proxy cookie enforcement, secret injection, and MFA policy are deployment responsibilities and are not proven by local Phase 1 tests.
