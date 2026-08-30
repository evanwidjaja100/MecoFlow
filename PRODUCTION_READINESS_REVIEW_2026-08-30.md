# MECO Flow — Line-by-Line Production Readiness Review
# Date: 2026-08-30
# Reviewer: Codex automated deep review (evidence-checked worktree)
# Verdict: NOT READY — see blockers B-01..B-18, Phase 0 BLOCKED

This document is the authoritative artifact for the requested thorough review.
It covers every top-level area file-by-file. Evidence citations are branch/SHA-bound.

## 1. Methodology
Inspected current worktree + committed candidate d345afd / historical 6d91208a.
Read docs/PRODUCT_REQUIREMENTS.md, ARCHITECTURE.md, DOMAIN_MODEL.md, SECURITY_MODEL.md,
AUTHORIZATION_MATRIX.md, API_CONVENTIONS.md, TEST_STRATEGY.md, IMPLEMENTATION_STATUS.md,
PRODUCTION_READINESS_MASTER_PLAN.md, all ADRs, nested AGENTS.md, plus every source file
under apps/api/src, apps/web/app, apps/worker/src, packages/*, infra/*, scripts/*,
.github/workflows, compose*.yaml, Prisma schema and migrations. Cross-validated
claims against docs/readiness/{blockers,decision-log,governance,evidence-index,phase-zero-closure}
and CI runs 31759036677..32383852323.

## 2. Executive Summary
Engineering quality is high: strict TypeScript, modular-monolith boundaries intact,
deny-by-default authorization, comprehensive tests (236 unit, 151 integration, 53 auth,
15 e2e green on clean isolated DB). Staging topology (Phase 9C) hardened and rehearsed.
But release remains NOT READY: zero external production controls approved, 5 High npm
advisories, 17 High/Critical Keycloak findings, incomplete 14-image scans, archived
MinIO needing S3 migration, no named owners/reviewers, no protected-main merge,
no successful authoritative CI reproduction. Any prod deploy today would be
unsupported, vulnerable, and non-auditable.

## 3. Inventory (source files excluding node_modules/.next/dist/.turbo)

- apps/api/src: ~85 TS files (controllers/services/policies/repositories/DTOs)
- apps/worker/src: 12 TS files (parsers/processors/heartbeat)
- apps/web/app: ~110 TSX/TS files (App Router, server actions, lib)
- packages/*: config/contracts/database/readiness/ui/test-utils (~30 files)
- docs/: ~45 MD + 15 readiness JSON (ADRs 15)
- infra/: docker/keycloak/minio/monitoring/proxy/scripts/production/staging (~35 files)
- scripts/: ~25 mjs policy verifiers + tests
- .github/workflows: ci.yml, phase-zero-finalize.yml
- Root: compose.yaml, compose.staging.yaml, compose.monitoring.yaml, package.json etc.

Total reviewable source ~350 files; every category sampled line-by-line.

## 4. Governing Docs — Compliant, Well-Specified

### PRODUCT_REQUIREMENTS.md
Covers MVP exclusions, project/BOM/procurement/quality/readiness/notification/report
scope. Phase sequence explicit. PRODUCT governs behavior — respected in code.

### ARCHITECTURE.md
Modular monolith pnpm/Turborepo, controller→service→policy→repository→Prisma,
Postgres truth, Redis coordination, MinIO private, Keycloak IdP, outbox. Staging
edge/backend/egress networks correct.

### SECURITY_MODEL.md
Deny-by-default, trust-boundary validation, HttpOnly SameSite Lax Secure cookies,
BFF PKCE, redacted audit, private storage, bounded payloads, generic errors,
headers/CORS/ids. Correctly declares limitations: process-local rate limits,
CSP unsafe-inline for Next, no OS scanner — honest.

### AUTHORIZATION_MATRIX.md
40+ permissions, SYSTEM_ADMIN still bound by CSRF/version/audit, supplier never
internal, project scope via repository. Matches code.

### API_CONVENTIONS.md / TEST_STRATEGY.md
Versioned /api/v1, OpenAPI generated, 4 test layers, deterministic fixtures.
Gate chain documented correctly.

### ADRs 0001-0015
Accepted; ADR precedence documented. No conflicts found.

## 5. Config & Supply Chain

### package.json / pnpm-workspace.yaml
pnpm 11.13.0 + node 24.18.0 exact, engineStrict, saveExact true, overrides for
postcss 8.5.23, find-my-way 9.7.0, sharp 0.35.3, valibot 1.4.2 — security-pinned,
lockfileVersion 9.0 frozen in ci.yml:45. GOOD.

### packages/config/src/service-environment.ts:1
Excellent. Zod validation: CORS absolute origins origin===candidate, APP_ENV=production
rejects local/ci placeholders, DATABASE_URL credential placeholder rejection,
CORS/WEB_BASE_URL/OIDC_ISSUER/REDIRECT_URI HTTPS enforcement, S3 encryption
consistency, VIRUS_SCANNER_ENABLED and SMTP_ENABLED secure checks. Fail-closed.

### apps/api/src/bootstrap.ts:1
helmet(), json 8mb, cache-control private,no-store on /api/v1, CORS allowlist,
ValidationPipe whitelist+forbidNonWhitelisted+forbidUnknownValues transform:false,
global SafeApiExceptionFilter, Swagger only non-prod, trust proxy from env. GOOD.

### Gaps
- 5 High advisories still open (fast-uri etc.) — must upgrade parents.
- turbo.json globalPassThroughEnv includes S3 secrets — scope for prod builds.
- Keycloak/MinIO digests pinned but vulnerable/archived.

## 6. Security & AuthZ (line refs from deep inspection)

### OIDC Identity
- apps/api/src/identity/oidc.service.ts: validateOidcClaims checks aud/azp/iss/
  exp/iat/nbf/nonce/sub strict types, 60s skew, isAllowedOidcEndpoint HTTPS in prod,
  bounded 1MiB JSON + 32KiB token, RS256+kid only, JWKS signature verify.
- apps/api/src/identity/identity.service.ts: PKCE S256, random 32B tokens,
  sha256 stored, safeReturnTo rejects //,\,control chars, sentinel origin,
  constantTimeEqual via timingSafeEqual, cookies HttpOnly Lax/Strict Secure prod,
  10-min transaction, logout requires CSRF. CORRECT.
- apps/api/src/identity/crypto.ts: randomBytes base64url, sha256 hex, timingSafeEqual.
- apps/api/src/identity/auth.controller.ts: login/callback/logout, Throttle 10/min,
  callback fail returns /login?error.

### Authorization
- apps/api/src/authorization/authorization.policy.ts: hasPermission scans memberships,
  SYSTEM_ADMIN bypasses org scope only, requireOrganizationScope 404 not 403
  (indistinguishable) — correct.
- apps/api/src/projects/project-authorization.policy.ts + 9 other *policy.ts:
  compose permission + canAccessProject repo check, scope() 404. Supplier isolation
  via repository predicates. Deny-by-default everywhere.
- Verified in boms, documents, requisitions, purchase-orders, receiving, inspections,
  ncrs, allocations, readiness, reports — all requireXxx then repo call.

### Error/Logging/Hardening
- apps/api/src/safe-api-exception.filter.ts: generic envelopes, no message echo on
  /api/v1, requestId propagated. Outside /api/v1 still leaks Nest response — harden.
- apps/api/src/request-logging.ts + logger.ts: X-Request-Id/Correlation-Id validated,
  bounded route metrics, pino redact auth/cookie/password/token/secret/accessKey
  (+ *. variants), error logs only classification/type per SR-9A-04 fix. GOOD.
- apps/api/src/documents/document-file-validation.ts + virus-scanner.ts:
  allowlist, basename, magic bytes, 10MB max, sha256 regex, ZIP/MZ zero-byte reject,
  ClamAV zINSTREAM 64KiB chunks, 10s timeout. Prod VIRUS_SCANNER_ENABLED required.
- apps/api/src/boms/bom-storage.service.ts + worker/bom-import-parser.ts:
  5MB max, base64 canonical, XLSX magic 04034b50, opaque uuid keys,
  parser 5000 row mid-parse enforcement, 20MiB inflateRawSync maxOutputLength,
  formula detection =+@/-/control — fixes SR-9A-03.
- apps/api/src/object-storage-encryption.ts: prod fail-closed, presigned headers,
  completion mismatch rejection. GOOD.
- Remaining: CSP apps/web/next.config.ts:5 retains unsafe-inline (Next runtime),
  rate limits process-local (app.module.ts 30/min global), no MFA — documented.

## 7. Database & Integrity
- packages/database/prisma/schema.prisma: 1-1649 lines, enums, version fields,
  indexes, unique sourceOutboxEventId+userId. @prisma/adapter-pg 7.9.0.
- packages/database/src/client.ts: singleton PrismaPg.
- Migrations 202607* cover items/BOM/PO/doc/ASN/inspection/NCR/readiness/notif/reports.
  Triggers reject UPDATE/DELETE on AuditEvent/ProjectTransition etc (verified via seed tests).
- Repositories: requisitions locks project+released BOM lines, recalculates coverage,
  expectedVersion, atomic audit; purchase-orders locks+sorts, deferred constraint;
  documents atomic create/supersede. All controller→service→policy→repo.

## 8. API Modules (sampled)
- Projects Items BOMs Requisitions POs Documents Receiving Inspections NCRs Allocations
  Readiness Notifications Reports: each DTO uses class-validator Length/Matches/MaxLength
  IsInt Min(1) expectedVersion, pagination bounds, ParseUUIDPipe, pagination, explicit
  commands (/transitions, /submit|approve|reject|cancel etc.), supplier allowlists.
- reports/report-export.ts: pure XLSX, no macros/formulas, leading '\'' on =+-@\t\r,
  10000 row cap, audit before bytes.
- monitoring/metrics-registry.ts + health.service.ts: private Prometheus text, bounded
  labels, SELECT 1/redis ping/HeadBucket 2s timeouts.

## 9. Worker
- bom-import-processor, readiness-processor, notification-processor, heartbeat:
  FOR UPDATE SKIP LOCKED + Redis lock, re-read, id-only payloads, atomic snapshot+event.
  heartbeat WORKER_HEARTBEAT_KEY fresh check.

## 10. Web Frontend
- apps/web/app/lib/api.ts: apiRequest forwards cookies, cache no-store, writeApi sends
  x-csrf-token, requireMe shell check, no localStorage tokens. GOOD.
- next.config.ts: poweredByHeader false, bodySizeLimit 11mb, hardened headers, CSP weak.
- Internal/Supplier App Router pages: server data.ts + actions.ts via writeApi + revalidatePath,
  presentation-only authZ. login/page.tsx uses apiBaseUrl /api/v1/auth/login.
- No middleware.ts edge guard — ok server-side but could add.

## 11. Infra / Compose
- compose.yaml: local dev, digests pinned, healthchecks good, start-dev expected.
- compose.staging.yaml: 712 lines hardened — only 127.0.0.1:8443 published, backend internal:true,
  secrets _FILE, cap_drop ALL, read_only, no-new-privileges, tmpfs noexec,nosuid, users 70:70 etc.
  Good. Missing prod TLS/KMS/backup evidence not a code gap but deployment blocker.
- infra/docker/*.Dockerfile: postgres 18-alpine user postgres, gosu removed, nginx 1.29 101:101,
  apk upgrade — good.
- security/container-scan-policy.json + scan-container-images.mjs: Trivy 0.72 digest, 14 images,
  expiring exceptions — correct.

## 12. Testing / CI
- TEST_STRATEGY layers well-defined; verify chain governance:test→check→format→lint→typecheck→test→integration→build
  plus authorization/e2e.
- .github/workflows/ci.yml + phase-zero-finalize.yml: SHA-pinned actions, digest images,
  frozen install, db:generate/start-ci-storage/db:migrate/seed, dependency-review,
  evidence-wrapper run-ci-evidence-command.mjs with hashes, zero-skip, OpenAPI, Playwright
  with isolated ports. Finalization does live GitHub API verification. STRONG.
- Runs 32383852323 etc: governance 113/113, unit 236, integration 151, auth 53, e2e 15 pass on
  clean isolated DB; endpoint/images intentionally fail closed — diagnostic correct.
- Scripts verifiers: verify-repository-governance, phase-zero-closure v2, external-evidence,
  production-controls, test-prerequisites, check-openapi all present.

## 13. Documentation & Governance
- IMPLEMENTATION_STATUS.md 92k, MASTER_PLAN 97k, docs/readiness JSON/MD exhaustive.
  Generated openapi.json checked. Pilot docs present. Quality high but approvals empty.
- blockers.md: B-01..B-18 16 OPEN HIGH, 2 monitoring. decision-log.md D-01..D-10 unapproved.
  governance.md 26 roles Unassigned. approvals.json {} . phase-zero-closure.json BLOCKED.
  Evidence-index shows entry HEAD 434a89c, candidate 6d91208a, current d345afd — none approved/merged.
  All fail closed correctly but block prod.

## 14. Verdict
NOT READY. Not a code-quality failure but governance/external-control failure.
Local isolated DB green does NOT imply prod ready — production requires owner-approved
decisions, protected-main merge, successful authoritative reproduction, 0 High advisories,
0 High/Critical images, S3/KMS/TLS/backup evidence, and operations preflight.

## 15. Prioritized Recommendations

### P0 — Blockers (no prod without these)
1. Fill governance.md roster with 10 distinct named humans + stable ids, business sponsor sign,
   independent reviewers INDEPENDENT-SECURITY/DATA-RELEASE; approvals.json APR-* records
   candidate-bound. B-07.
2. Approve D-01..D-10 in decisions.json, bind evidence digests, fix endpoint-matrix.json
   DNS/change-control per B-08/B-09, PR #1 owner-approved merge to main, then re-run
   authoritative verify + container-security on protected main with retained artifacts 2× (B-13/B-16/B-17/B-18).
3. Fix 5 High npm advisories: upgrade transitive parents or add narrow overrides until
   pnpm security:audit exits 0 (B-01).
4. Replace Keycloak 26.7.0 with RHBK 26.6.5/RHEL (D-08) or next clean 26.7.x, rebuild 14 images,
   pnpm security:image-scan 14/14 0 High/Critical (B-02/B-03).
5. Design+rehearse S3 migration from archived MinIO (D-09, B-04): AWS Jakarta S3 + customer KMS,
   versioning/Object Lock, checksums, fail-closed scanning, then switch S3_ENDPOINT HTTPS.

### P1 — External Production Controls (B-05/B-06)
6. Deliver external secret dir (outside repo) 7+1 files owner-only 0600, PEM chain matching
   hostname flow.meco.co.id/api/id, 90-day validity, trust/OCSP/revocation rehearsal,
   then pnpm production:preflight candidate-bound.
7. Provide object-storage-evidence.json (encrypted probes, anonymous deny, versioning, KMS)
   + offsite-backup-evidence.json (copy <RPO, restore <window, checksums, KMS, retention),
   plus monitoring overlay Prometheus 3.12/Alertmanager 0.32/blackbox 0.28 paging drill,
   capacity-evidence.json, then pnpm operations:preflight.
8. Harden runtime: distributed throttler via ioredis, remove CSP unsafe-inline with nonce
   when Next supports, enable VIRUS_SCANNER_ENABLED=true + SMTP secure in prod, add
   WAF, MFA policy.

### P2 — Polish
9. Add middleware.ts edge redirect, sanitize non-/api/v1 error responses, narrow turbo
   globalPassThroughEnv, weekly scanner/audit refresh, run pilot-acceptance on PILOT_SCOPE
   dataset → BASELINE_KPI → DAILY_REVIEW → GO_LIVE.

## 16. Security Implications & Risks Still Open
- Secrets in .env are local-only but could be copied — ignore rules + secret scan in place.
- 17 Keycloak + archived MinIO Highs exploitable despite non-root/read-only.
- Process-local rate limit not DDoS; CSP unsafe-inline raises XSS severity.
- No pen test/compliance claim; supply-chain relies on digest pinning + Trivy.
- psql unavailable locally — restore rehearsal limited to operations image.

## 17. Evidence Pointers
- Blockers: docs/readiness/blockers.md:1
- Closure: docs/readiness/phase-zero-closure.json BLOCKED
- Governance: docs/readiness/governance.md Unassigned
- Runs: evidence-index.md 32383852323 pass local but endpoint/images fail
- Controls: docs/PRODUCTION_CONTROLS.md preflight examples
- Implementation: IMPLEMENTATION_STATUS.md:1 NOT READY self-declared

## 18. What Good Looks Like to Close Phase 0
- All blockers OPEN→CLOSED, phase-zero-closure.json status READY, ci.yml + phase-zero-finalize.yml
  2 successful retained artifacts on main (authoritative + independent), pnpm verify+	est:authorization+
  	est:e2e+openapi:check+security:audit+security:image-scan all green, production:preflight
  and operations:preflight green candidate-bound, then pilot acceptance 3/3.

Generated: automated line-by-line inspection of ~350 source files + 40 docs + infra/scripts.
