# Phase 1 — Systemic authorization and audit attribution — Detailed implementation plan

**Status:** DRAFT — unlocked at 1b87a4c (Phase 0 COMPLETE 2026-08-31/09-01). One phase at a time per PRODUCTION_READINESS_MASTER_PLAN.md:3.1

## 1. Goal

Make every resource-specific decision operate on one exact server-derived authorized membership, preserve correlation for legitimate multi-scope collections, and prove deny-by-default isolation.

## 2. Current gaps vs 12 required items

- No canonical AuthorizationContext — principal has memberships[] array, request-context only correlationId/requestId
- Flattened decisions: authorization.policy.ts hasPermission uses some with SYSTEM_ADMIN union; projects.repository accessWhere builds OR from separate membershipIds/managementIds arrays
- First-match: bom/item/ncr/po policies use find(INTERNAL && has permission) order-dependent
- Multi-scope correlation lost: supplierScope returns flattened arrays, supplierWhere does independent IN checks
- No atomic revalidation: mutations do not re-check membership ACTIVE in same tx as outbox
- Worker has no system principal, auditEvent has only actorUserId no actorMembershipId
- createOrganization not transactional with audit
- Tests miss permutation, stale token, hint abuse, concurrent revoke-vs-write

## 3. Design — canonical AuthorizationContext

New file apps/api/src/authorization/authorization-context.ts:

export type AuthorizationSource = 'MEMBERSHIP_QUALIFIED' | 'SYSTEM_PRINCIPAL';
export type SystemPrincipal = 'WORKER_BOM_IMPORT' | 'WORKER_READINESS' | 'WORKER_NOTIFICATION' | 'MIGRATION_SEED';
export interface AuthorizationContext {
readonly actorUserId: string | null;
readonly actorMembershipId: string | null;
readonly organizationId: string;
readonly organizationType: 'INTERNAL' | 'SUPPLIER';
readonly projectId?: string;
readonly roles: readonly string[];
readonly permissions: ReadonlySet<string>;
readonly requiredPermission: string;
readonly resource: { type: string; id?: string };
readonly source: AuthorizationSource;
readonly systemPrincipal?: SystemPrincipal;
readonly correlationId: string;
readonly requestId: string;
}

Rules:

- Constructed only by AuthorizationService.resolve(principal, {permission, resource}) — single qualifying membership, never some/find first.
- Client hint (x-organization-id) is navigation only, not authority.
- System principal path uses actorUserId:null, organization derived from resource.

### 3.2 Multi-scope correlation

AuthorizationContextSet = { contexts: AuthorizationContext[] } OR set.
supplierScope returns contexts[] tuples, repo generates OR: contexts.map(c => ({ organizationId: c.organizationId, members.some.membershipId: c.actorMembershipId })) never independent IN arrays.

### 3.3 Pass-through

Guard attaches request.authorizationContext via @AuthContext() decorator, passed unchanged through service->policy->repo. Repos do not recompute hasPermission.

### 3.4 Atomic revalidation

Every mutation runs \ with SELECT FOR UPDATE or updateMany(where:{id, version, organizationId: ctx.organizationId}) plus membership re-check. Outbox inside same tx.

### 3.5 Workers

Payload remains minimal ID. Worker constructs SYSTEM_PRINCIPAL context and revalidates invariants before snapshot.

### 3.6 Audit

Migration 20260831000000_phase_1_audit_attribution adds actorMembershipId, systemPrincipal, CHECK constraint, FK. All auditEvent.create use ctx values.

### 3.7 Org creation

AdministrationRepository.createOrganization becomes \ with auditEvent.

### 3.8 Review every surface

Checklist per module: administration, projects, items, boms, documents, requisitions, purchase-orders, allocations, receiving, inspections, ncrs, readiness, reports, monitoring, worker, web. Each row: endpoint, repo predicate, DTO filter, worker predicate, state, fix, test.

### 3.9 Docs & contracts

Update SECURITY_MODEL.md, AUTHORIZATION_MATRIX.md, DOMAIN_MODEL.md, API_CONVENTIONS.md, ARCHITECTURE.md, new ADR-0016, OpenAPI.

### 3.10 Tests

New canonical-authorization.test.ts + expanded *.authorization.integration.test.ts:

- 2 memberships permuted (project.write vs SYSTEM_ADMIN union must deny)
- supplier 2-org correlation (4 rows, no cross)
- disabled membership, stale token, hint abuse, concurrent revoke-vs-write, fast-check order, IDOR, field filter

## 4. Implementation sequence

1. Migrations & types + decorator/guard
2. Core policy resolve()
3. Repo predicates (tuple OR)
4. Transactional hardening
5. Workers SYSTEM_PRINCIPAL
6. Audit wiring
7. Web hints audit
8. Tests (30-40 new cases)
9. Docs & OpenAPI
10. Full gate: lint typecheck test:authorization test:integration test:e2e, verify-repository-governance, verify-phase-zero-closure PASS

## 5. Verification

- pnpm lint, typecheck, test, test:authorization, test:integration, test:e2e green clean uncached
- matrix coverage report
- checklist docs/readiness/phase-one-checklist.md

## 6. Risks

- accessWhere tuple-OR changes list results (correct but visible)
- audit CHECK needs backfill historic rows -> MIGRATION_SEED
- Keycloak sole IdP assumption

## 7. Branching

Create goal Phase 1 — Systemic authorization and audit attribution, working plan 1:1 to verification, defect ledger docs/readiness/phase-one-defects.md, evidence-index entry before code.
