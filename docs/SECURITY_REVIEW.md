# Phase 9A security review

Date: 2026-07-27

## Scope and methodology

This review covered the Phase 9A trust boundaries in the API, web application,
worker, database access layer, file-processing paths, exports, runtime
configuration, dependency graph, Compose topology, and production application
images. The method combined:

- documentation-to-code traceability against the security model,
  authorization matrix, API conventions, and accepted ADRs;
- route inventory and static inspection of every path parameter, unsafe HTTP
  method, authorization entry point, repository scope, raw query, file
  boundary, logger, and runtime image;
- focused negative and regression tests for reproduced weaknesses;
- the complete repository verification, authorization, integration, OpenAPI,
  dependency-audit, Compose, image-build, and image-permission gates;
- a production browser run, with its original harness/data-state failures
  recorded rather than hidden or bypassed and subsequently resolved on a clean
  isolated database.

This is a focused engineering review, not a penetration test or a claim of
regulatory compliance.

## Threat categories reviewed

- OIDC authentication, callback state/nonce/PKCE, claim validation, and
  identity-provider transport/response boundaries
- opaque server-side sessions, cookies, logout, return paths, CSRF, and browser
  token storage
- role, permission, project, organization, supplier, and object-level
  authorization
- object-ID validation, inaccessible/nonexistent behavior, and field-level
  response filtering
- private upload/download authorization, content validation, malware scanning,
  archive expansion, checksums, and storage-key exposure
- safe failures, response caching, CORS, rate limits, request-size limits, and
  browser security headers
- structured logging and sensitive-data redaction
- CSV/XLSX formula neutralization, export authorization, and export audit
  evidence
- Prisma/raw-query parameterization and repository-bound database access
- dependency advisories and frozen-lockfile reproducibility
- Compose exposure plus application-container users and artifact permissions

## Findings and remediation

### SR-9A-01 — unsafe post-login return-path normalization

Severity: Medium. Status: Remediated.

Evidence: the return-path validator accepted a leading-slash value containing
backslashes. WHATWG URL normalization can interpret that shape as a
scheme-relative destination when resolved by a browser. Malformed percent
encoding in cookies could also throw during cookie parsing.

Remediation: return paths now reject backslashes, protocol-relative forms,
control characters, and any value that does not resolve to the sentinel local
origin. Stored legacy transaction paths are revalidated before redirect use.
Malformed cookie values are treated as absent.

Verification: `identity.service.test.ts` covers backslash/control-character
paths and malformed cookie encoding. A direct URL-resolution reproduction was
run before the fix.

### SR-9A-02 — incomplete OIDC claim and provider-response boundaries

Severity: Medium. Status: Remediated.

Evidence: multi-audience tokens did not require a matching authorized-party
claim; `nbf` and strict claim types were not checked; discovered endpoints and
IdP JSON bodies were not bounded as tightly as other trust boundaries.

Remediation: multi-audience tokens require matching `azp`, mismatched
single-audience `azp` is rejected, `nbf` and strict scalar claim types are
validated, and ID tokens are capped at 32 KiB. Discovery, token, and JWKS JSON
responses are streamed with a 1 MiB bound. Production-discovered endpoints
must use HTTPS; local/test may use HTTP or HTTPS.

Verification: `oidc.service.test.ts` covers the valid profile, `azp` cases,
future `nbf`, invalid claim types, absent subject, endpoint schemes, and
oversized provider JSON.

### SR-9A-03 — BOM parser resource exhaustion

Severity: High. Status: Remediated.

Evidence: the import parser enforced its 5,000-row limit only after collecting
the complete CSV/XLSX result, and deflate output was expanded before the
declared archive-size checks. A small compressed input could therefore consume
memory well beyond the accepted logical file.

Remediation: CSV and XLSX parsing now rejects as soon as row 5,001 is observed.
Raw deflate uses `maxOutputLength` bounded by the declared entry size and the
20 MiB archive ceiling before decompressed bytes are materialized. Existing
compressed-size, entry-count, path, formula, macro, and format checks remain.

Verification: worker tests cover an over-limit CSV and compressed output that
exceeds its declared entry size.

### SR-9A-04 — sensitive and attacker-controlled error logging

Severity: Medium. Status: Remediated.

Evidence: API exception logging could include raw exception messages/stacks,
top-level secret-like fields were not covered by every redaction rule, and a
worker failure log could include an arbitrary error message.

Remediation: application exception logs now emit a fixed message, safe error
classification, and error type without raw stack/message content. API and
worker redaction include top-level and nested password, token, secret,
access-key, and storage-key fields. Worker notification failures log the error
type rather than arbitrary message content.

Verification: logger unit tests prove the fixed safe error shape and expanded
redaction paths. Integration tests prove an attacker-controlled invalid value
is not echoed by the public error response.

### SR-9A-05 — vulnerable transitive and direct dependencies

Severity: High. Status: Remediated for known advisories at review time.

Evidence: the supported `pnpm audit` gate initially reported 16 advisories: 9
high and 7 moderate, including Next.js, Sharp/libvips, PostCSS, fast-uri,
brace-expansion, Hono, and Valibot paths.

Remediation: Next.js was updated to 16.2.12, PostCSS to 8.5.23, Prisma packages
to 7.9.0, and ESLint to 10.8.0. Workspace overrides now select patched
`find-my-way`, `sharp`, and `valibot` versions; the stale unused Hono override
was removed. The lockfile and dependency rationale were updated.

Verification: `pnpm security:audit` reports no known vulnerabilities. The
frozen install, complete build, native Linux/Alpine image builds, and browser
run all used the updated graph.

### SR-9A-06 — oversized JSON returned an internal error

Severity: Low. Status: Remediated.

Evidence: an 8 MiB JSON request exceeded the configured body limit but was
converted to generic HTTP 500 instead of a safe bounded rejection.

Remediation: the global exception filter recognizes only the body parser's
specific `entity.too.large` 413 shape and returns the stable
`REQUEST_TOO_LARGE` envelope. Generic 429 responses receive the stable
`RATE_LIMIT_EXCEEDED` envelope. The mapping does not trust arbitrary exception
status fields.

Verification: a live-application integration test sends the oversized request
and asserts 413 plus the safe error code.

### SR-9A-07 — incomplete browser and authenticated-response defense in depth

Severity: Low. Status: Remediated with a documented CSP residual.

Evidence: the web runtime had no explicit repository-owned security-header
policy, and authenticated API responses did not explicitly prohibit caching.

Remediation: all web routes emit CSP, frame denial, MIME-sniffing denial,
referrer, permissions, HSTS, COOP, and CORP headers. API v1 responses emit
`Cache-Control: private, no-store` and `Pragma: no-cache`. Existing exact-origin
CORS and credential policy remains unchanged. The referrer policy is
`same-origin`: cross-origin navigation receives no referrer, while same-origin
form submissions retain a non-null origin for the framework's Server Action
CSRF comparison.

Verification: web configuration tests assert the required directives. A live
API integration test covers headers, allowed and untrusted CORS origins,
request limits, safe error content, and rate limiting.

### SR-9A-08 — runtime user owned deployed container code

Severity: Low. Status: Remediated.

Evidence: API, worker, and web images ran as non-root `node`, but the runtime
COPY steps assigned the entire application/dependency tree to that user. A
compromised process could overwrite its deployed code.

Remediation: runtime artifacts remain root-owned and world-readable while the
process continues to run as the unprivileged `node` user.

Verification: all three images build successfully. Runtime probes report UID
1000 and root-owned `0644` entrypoints that are not writable by UID 1000.

## Controls reviewed without a new finding

- All 73 unsafe API routes declare CSRF and resolve their principal through the
  mutating identity boundary. Session identifiers are opaque, stored hashed,
  rotated on login, server-side revoked, `HttpOnly`, production `Secure`, and
  same-site constrained; browser token storage remains absent.
- The route inventory found 114 path parameters: 109 object IDs use the UUID
  parsing boundary, four export path parameters use closed enums, and the
  notification-type parameter is checked against the service enum.
- Authorization tests cover deny-by-default permissions, internal object
  scope, supplier A/B isolation, inactive identity/scope cases, and equivalent
  inaccessible/nonexistent behavior. Supplier presenters remain allowlisted
  and exclude employee identity, commercial/internal notes, storage keys,
  unrelated supplier data, and audit internals.
- Document and BOM files retain opaque private keys, short-lived signed URLs,
  owner/project/association checks, completion-time metadata and byte re-read,
  MIME/magic/checksum checks, bounded malware scanning, and fail-closed
  quarantine/download behavior.
- Report exports retain server-derived scope, fixed schemas, leading-whitespace
  formula neutralization, macro-free XLSX generation, row bounds, and
  same-request immutable redacted audit evidence.
- Production raw-query use is Prisma-tagged/parameterized. The only
  `$executeRawUnsafe` occurrence is test-only generated DDL in a receiving
  integration test; no request-derived value reaches it.
- Compose development services bind host ports to loopback. Production
  application images run non-root and now cannot rewrite deployed artifacts.

## Tests added

- Identity return-path and malformed-cookie unit tests
- OIDC claim, endpoint-scheme, token-size, and provider-response-size unit tests
- API logger redaction and safe-exception unit tests
- Live API security-configuration integration tests for headers, cache policy,
  CORS, request size, error non-echo, and rate limiting
- BOM parser early-row-limit and decompression-output-limit tests
- Web security-header configuration test

The existing negative authorization, supplier-isolation, file-security,
spreadsheet-export, and complete integration suites were also run unchanged.

## Accepted residual risks

- The CSP retains `unsafe-inline` for scripts and styles because the current
  Next.js server-rendered runtime requires inline bootstrapping and styles.
  It still denies framing, objects, broad network origins, and foreign form
  actions. Nonce/hash adoption requires a dedicated rendering change and is
  deferred; no untrusted HTML rendering was found.
- Rate limiting is in-process and per client address. A multi-replica,
  proxy-aware global limiter and edge policy are deployment architecture work,
  not a speculative Phase 9A rewrite. Production must configure trusted proxy
  handling and upstream controls deliberately.
- The supported repository tooling has no container CVE scanner. This review
  ran dependency audit, frozen Linux image builds, Compose validation, and
  runtime identity/permission probes. Image-OS advisory scanning remains a
  deployment-pipeline gap.
- Local official infrastructure images are not all pinned to an explicit
  non-root user. Their host ports are loopback-only and they are development
  dependencies; production infrastructure is externally managed.
- The OIDC implementation intentionally supports the documented RS256 provider
  profile. This review does not claim general OpenID Provider certification.
- The patched Sharp version is a minor update within a pre-1.0 series.
  Type-check, production builds, Linux image builds, and relevant browser paths
  were exercised, but upstream 0.x compatibility remains a maintenance risk.

## Browser-runner resolution and unresolved blockers

- The earlier accumulated-data and Windows resource blocker is resolved.
  Playwright now honors an operator-supplied isolated database, owns fresh API
  and web processes, and uses one worker on Windows. On 2026-08-01 the complete
  unmodified command passed 15/15 in 2.6 minutes against a newly migrated and
  seeded database, including OIDC/PKCE and internal/supplier denial paths.
- The integration suite emits a `pg` deprecation warning for calling
  `client.query()` while a query is executing. Tests pass today, but this must
  be resolved before upgrading to `pg` 9.

## Verification commands and results

- `pnpm verify` — passed formatting, lint, type-check, unit, integration, and
  build gates. API unit: 178 tests; API integration: 104 tests; worker unit: 8
  tests.
- `pnpm test:authorization` — passed, 14 files / 53 tests across all scoped
  packages.
- `pnpm test:integration` — passed all 14 tasks.
- API security integration target — passed, 1 file / 5 tests.
- `pnpm security:audit` — initially failed with 16 advisories (9 high, 7
  moderate); passed with no known vulnerabilities after remediation.
- `pnpm install --frozen-lockfile` — passed.
- `pnpm openapi:check` — passed with no generated contract drift.
- `pnpm db:deploy` — passed; 21 migrations found and none pending.
- `pnpm db:seed` — passed.
- `pnpm test:e2e` — passed 15/15 in 2.6 minutes on 2026-08-01 against an
  isolated fresh database after browser-runner stabilization.
- `docker compose config --quiet` — passed.
- `docker build -f apps/api/Dockerfile ...`, worker equivalent, and web
  equivalent — passed for all three production images.
- Runtime `docker run` identity/permission probes — passed: all applications
  run as UID 1000; deployed entrypoints are root-owned and non-writable.

No database or data migration was required by Phase 9A.

## Container image security addendum — 2026-08-01

The production-oriented image set was scanned with Trivy 0.72.0 pinned by
digest. Baseline HIGH/CRITICAL findings included unused npm tooling in all Node
runtimes, Alpine packages and the unused `gosu` Go binary in PostgreSQL-based
images, Alpine packages in nginx, and extensive stale Go modules in the 2025
MinIO server/client binaries. The Node package managers and `gosu` were removed
from runtime layers; PostgreSQL/nginx packages are upgraded during the
candidate build; and MinIO server/client are checksum-verified source builds
from exact commits with explicit fixed module versions.

After remediation, API, worker, web, migrations, operations, MinIO, ClamAV,
PostgreSQL, proxy, and Redis each report zero HIGH/CRITICAL findings. Runtime
identity/content probes also passed. Keycloak 26.7.2 reports 15 occurrences
across 12 unique HIGH findings in Red Hat OpenJDK, Jackson, Microsoft JDBC,
Netty, and PostgreSQL JDBC packages. One OpenJDK finding has no vendor fix in
the scanned image; the others have fixed component versions but no newer
official Keycloak image was available during verification. No risk exception
was invented or approved, so the gate and release remain red.

The exact policy, exception requirements, source provenance, commands, and
evidence path are in `CONTAINER_SECURITY.md`. The MinIO downstream rebuild and
archived upstream are residual maintenance risks; full staging object,
authentication, isolation, backup, and restore verification is required after
every change to those images.
