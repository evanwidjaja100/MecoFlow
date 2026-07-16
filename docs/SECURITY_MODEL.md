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

## Phase 0 status

Phase 0 validates configuration, keeps only documented local-development placeholders in `.env.example`, rejects those placeholders and insecure browser origins during production-mode service startup, binds local infrastructure ports to loopback, uses private MinIO configuration, and establishes safe logging and health responses. It does not expose business endpoints. OIDC, policy enforcement, persistent audit, rate limiting, CSRF and upload controls remain required in later phases.
