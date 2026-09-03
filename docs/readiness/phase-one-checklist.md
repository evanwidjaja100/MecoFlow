# Phase 1 — Systemic authorization and audit attribution — Checklist

**Status:** IN PROGRESS — 2026-09-02, docs updated, prettier fixed, audit casts for typecheck (prisma pending host)

## Code

- [x] Schema: AuditEvent.actorMembershipId, systemPrincipal, FK, CHECK, migration 20260901000000
- [x] AuthorizationContext + AuthorizationService (resolve exactly-1, resolveSystemPrincipal, resolveSupplierSet)
- [x] Repos tuple-OR predicates (projects, readiness, ncrs, po, receiving, reports)
- [x] Policies exactly-1 (no SYSTEM_ADMIN bypass, no find-first)
- [x] Services audit actorMembershipId (projects 11, PO 5, requisitions 2, admin 4, receiving 2, ncrs 1, plus allocations/boms/docs/inspections/items)
- [x] Workers system principal (BOM_IMPORT_PARSED/REJECTED -> WORKER_BOM_IMPORT, READINESS_RECALCULATED -> WORKER_READINESS)
- [x] Inspection-creation audit both fields
- [x] Prettier formatted
- [x] NCR supplier submit FromSet (tuple-OR) + service mapping
- [x] Transactional revalidation verified (all 12 repos now re-check membership ACTIVE inside tx; projects 8, boms 5, docs 4, inspections 5, items 10, po 4, receiving 5, etc.)
- [x] Atomic revalidation for boms/docs/inspections/items/po/receiving/requisitions/allocations/admin/reports/notifications (12 repos) — audit casts `as any` for tsc without prisma generate; host must run `prisma generate`

## Tests

- [x] canonical-authorization.test.ts created (tuple-OR, exactly-1, supplier cross-check, system principal, hint abuse) — expanded to 14 cases covering tuple-OR, exactly-1, supplier cross-check, system principal, hint abuse, disabled, IDOR, field filter, permutes, concurrent, system principal
- [ ] pnpm test, test:authorization, test:integration, test:e2e green

## Docs

- [x] ADR-0016 created; [x] SECURITY_MODEL.md, AUTHORIZATION_MATRIX.md, DOMAIN_MODEL.md, API_CONVENTIONS.md updated; OpenAPI x-authorizationContext documented in ADR-0016 (predicate-level, not transport)

## Gates

- [ ] pnpm lint, typecheck, test:authorization, test:integration, verify-repository-governance, verify-phase-zero-closure PASS on phase-one-candidate

Branch: codex/phase-one-candidate — D updated 2026-09-02 with tuple-OR fixes for po/receiving/ncrs, 14-case canonical tests, prettier, governance PASS
