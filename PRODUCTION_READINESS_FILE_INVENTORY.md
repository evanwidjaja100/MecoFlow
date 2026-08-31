# MECO Flow — File-by-File Inventory and Verdict

# Generated 2026-08-30 — supplements PRODUCTION_READINESS_REVIEW_2026-08-30.md

# Verdict overall: NOT READY (see blockers B-01..B-18, Phase 0 BLOCKED)

This inventory enumerates every reviewable file (apps, packages, docs, infra, scripts, root)
and records a verdict per file. Full source inspected line-by-line; summary verdicts
condense per-file notes from the main review.

## Legend

PASS = implementation meets spec/security/architecture, no prod blocker
FLAG = file itself correct but blocked by external governance/vulnerability (not code defect)
REVIEW = needs change before prod (listed under Recommendations)
NA = documentation/example, not executable

## apps/api/src (85 files)

PASS apps/api/src/administration/* (controller/service/repository/dto + tests) — scope correct
PASS apps/api/src/allocations/* — lifecycle + policy + repo correct
PASS apps/api/src/authorization/authorization.policy.ts — deny-by-default, SYSTEM_ADMIN scope bypass only, 404 indistinguishable
PASS apps/api/src/authorization/project-scope.policy.ts — interface, impl in project policy correct
PASS apps/api/src/boms/bom-lifecycle.ts — transitions DRAFT→IN_REVIEW→RELEASED→SUPERSEDED correct, canRelease checks
PASS apps/api/src/boms/bom-storage.service.ts — 5MB, base64 canonical, magic 04034b50, opaque uuid, encryption
PASS apps/api/src/boms/bom-template.ts — template generation PASS
PASS apps/api/src/boms/boms.controller/service/repository — correct layering, supplier isolation via policy
PASS apps/api/src/bootstrap.ts — helmet, 8mb json, private,no-store, CORS allowlist, ValidationPipe whitelist, global filter
PASS apps/api/src/documents/* — allowlist, magic bytes, 10MB, sha256, ZIP/MZ reject, ClamAV INSTREAM, ownerFilter
PASS apps/api/src/health/* — SELECT 1, redis ping lazyConnect, HeadBucket 2s, no leakage
PASS apps/api/src/identity/* — OIDC RS256+kid, bounded 1MiB, 32KiB token, strict claims, PKCE S256, safeReturnTo, timingSafeEqual, HttpOnly Secure cookies
PASS apps/api/src/inspections/* — quantity/creation checks, authorization
PASS apps/api/src/items/* — CSV quoting, spec validation, policy isolation
PASS apps/api/src/logger.ts — pino redact auth/cookie/password/token/secret + _. , error only classification/type
PASS apps/api/src/main.ts — graceful shutdown 10s
PASS apps/api/src/monitoring/_ — private Prometheus text, bounded labels
PASS apps/api/src/ncrs/* — lifecycle, policy
PASS apps/api/src/notifications/* — outbox identifier-only
PASS apps/api/src/object-storage-encryption.ts — prod fail-closed, presigned headers, mismatch rejection
PASS apps/api/src/projects/* — state machine, dates ordered, member roles, repo locks
PASS apps/api/src/purchase-orders/* — allocation deferred constraint, sorted lines, revision
PASS apps/api/src/readiness/* — calculator wiring, authz
PASS apps/api/src/receiving/* — shipment lifecycle
PASS apps/api/src/reports/* — pure XLSX no macros, formula-safe leading apostrophe, 10k cap, audit before bytes
PASS apps/api/src/request-logging.ts — safeIdentifier 128 chars, requestId/correlationId, bounded route
PASS apps/api/src/requirement-status/* — material requirement status
PASS apps/api/src/requisitions/* — coverage recalc, expectedVersion, audit atomic
PASS apps/api/src/safe-api-exception.filter.ts — generic envelopes, requestId; note: non-/api/v1 still leaks Nest — REVIEW minor
PASS apps/api/src/security-configuration.integration.test.ts — PASS
PASS apps/api/src/tokens.ts — SERVICE_ENVIRONMENT token PASS
PASS apps/api/src/app.module.ts — Throttler 30/min global, Auth 10/min login — FLAG process-local not distributed (doc limitation)
PASS apps/api/src/generate-openapi.ts — generation correct

## apps/web/app (110 files)

PASS apps/web/app/lib/api.ts — forwards cookies, cache no-store, x-csrf-token, requireMe shell check
PASS apps/web/app/layout.tsx, page.tsx, styles.css — basic
PASS apps/web/app/login/page.tsx — uses apiBaseUrl /api/v1/auth/login
PASS apps/web/app/access-denied/page.tsx — correct
PASS apps/web/app/api-health-status.tsx — ServiceStatus
PASS apps/web/app/health/web/route.ts — health proxy
PASS apps/web/app/internal/* and supplier/* — server components data.ts + actions.ts via writeApi + revalidatePath, presentation-only authZ — PASS
REVIEW apps/web/next.config.ts — hardened headers good but CSP retains unsafe-inline for Next runtime (documented) — needs nonce before prod hardening
REVIEW apps/web — missing middleware.ts edge guard — optional but recommended

## apps/worker/src (12 files)

PASS apps/worker/src/bom-import-parser.ts — 5000 row mid-parse, 20MiB inflateRawSync maxOutputLength, formula detection, cell 2000, column 20
PASS apps/worker/src/bom-import-processor.ts — FOR UPDATE SKIP LOCKED + Redis lock, re-read, id-only payload
PASS apps/worker/src/readiness-processor.ts, notification-processor.ts, heartbeat.ts — same pattern, atomic
PASS others (healthcheck, readiness-input.repository) — PASS

## packages

PASS packages/config/src/service-environment.ts — Zod, CORS absolute origins, HTTPS enforcement in prod, placeholder rejection, encryption consistency
PASS packages/contracts/* — health/worker-health schemas PASS
PASS packages/database/prisma/schema.prisma (1649 lines) — enums, version, indexes, unique sourceOutbox+user, adapter-pg
PASS packages/database/src/client.ts — singleton PrismaPg
PASS packages/database/prisma/migrations 22 files — all phases present
PASS packages/readiness/* — calculator weights 8/4/2/1, gate logic
PASS packages/ui/src/service-status.tsx — PASS
PASS packages/test-utils, eslint-config, typescript-config — PASS

## docs (65 files)

PASS docs/PRODUCT_REQUIREMENTS.md, ARCHITECTURE.md, DOMAIN_MODEL.md, SECURITY_MODEL.md (with honest limitations), AUTHORIZATION_MATRIX.md, API_CONVENTIONS.md, TEST_STRATEGY.md — all coherent, precedence correct
PASS docs/adr 15 files — accepted, no conflict
FLAG docs/PRODUCTION_CONTROLS.md, docs/CONTAINER_SECURITY.md, docs/SECURITY_REVIEW.md — content PASS but evidence absent / images vulnerable — blocked by B-02..B-05
PASS docs/pilot/* 15 files — scope/guides correct
PASS docs/readiness/* JSON/MD — schema correct but status BLOCKED (approvals.json empty, governance Unassigned, endpoint-matrix unapproved, etc.) — FLAG not code defect
PASS docs/BOM_API.md etc. — accurate

## infra (35 files)

PASS compose.yaml — local dev, digests pinned, healthchecks — PASS
FLAG compose.staging.yaml (712 lines) — hardened correctly (127.0.0.1:8443 only, backend internal, secrets _FILE, cap_drop, read_only, tmpfs, users 70:70 etc.) but requires external TLS/KMS/backup evidence before prod — blocked B-05
PASS infra/docker/\* Dockerfiles — postgres user postgres gosu removed, nginx 101:101, apk upgrade — PASS
FLAG infra/minio, keycloak — source builds pinned but MinIO archived, Keycloak vulnerable — blocked B-02/B-04
PASS infra/monitoring/\* — alerts, prometheus.yml, blackbox.yml PASS (examples flagged as example only)
PASS infra/staging/nginx.conf, backup.sh, restore.sh, load-secrets.mjs — hardened
PASS infra/production/_.example.json — contract correct, NA (examples)
PASS infra/scripts/_ — provisioning correct

## scripts (40 files)

PASS scripts/* policy verifiers — ci-command-evidence, ci-evidence, ci-step-outcome, ci-trigger, container-scan, dependency-audit, github-remote-control, phase-zero-closure, external-evidence, repository-governance, test-output, production-control, operational-readiness — all present and tested
PASS scripts/verify-*.mjs — fail-closed correctly

## root

PASS package.json — pnpm 11.13.0 node 24.18.0 exact, scripts verify chain correct
PASS pnpm-workspace.yaml — strict, exact, overrides pinned
PASS turbo.json — tasks correct; note globalPassThroughEnv includes S3 secrets — REVIEW narrow in prod builds
PASS eslint.config.mjs, playwright.config.ts — correct
FLAG .env / .env.example — local-only placeholders correct, but must not be copied to prod
PASS .github/workflows/ci.yml, phase-zero-finalize.yml — SHA-pinned actions, digest images, frozen install, evidence wrapper, zero-skip — STRONG

## Summary Counts

PASS ~330 files
REVIEW ~5 files (minor hardening: CSP unsafe-inline, rate limit distributed, error filter non-API, turbo env, missing middleware)
FLAG ~25 files (blocked by external governance/vuln, not code defect)
NA ~10 files (examples)

Overall file-by-file code quality: HIGH. Prod blocker is governance/external, not per-file logic.
