# ADR-0016 — Canonical AuthorizationContext, tuple-OR, and system principal audit

**Status:** Accepted 2026-09-02
**Deciders:** Platform, Security
**Related:** ADR-0009 (authorization policies), ADR-0011 (audit events), Phase 1 plan docs/readiness/phase-one-implementation-plan.md

## Context

Pre-Phase 1 authorization used flattened membership arrays (`principal.memberships`) with `some`/`find` and independent `IN` checks (`organizationIds` + `membershipIds`). This allowed union bypass (two memberships each with subset of permissions combining to pass) and supplier cross-leakage (`org:s1,m2` matching `org:s1,m1` + `org:s2,m2` via separate IN arrays). Workers had no principal, and audit events lacked `actorMembershipId`.

## Decision

- Introduce `AuthorizationContext` and `AuthorizationContextSet` (apps/api/src/authorization/authorization-context.ts, authorization.service.ts). `resolve()` requires exactly one qualifying membership (`length !== 1 → 403`), never `some`/`find` first. System principals (`WORKER_BOM_IMPORT`, `WORKER_READINESS`, `MIGRATION_SEED`) produce `source: SYSTEM_PRINCIPAL` contexts with `actorUserId:null`.
- Supplier scopes return `AuthorizationContextSet` (one context per qualifying supplier membership) and repositories generate tuple-OR predicates: `OR: contexts.map(c => ({ supplierOrganizationId: c.organizationId, project.members.some.membershipId: c.actorMembershipId }))` — never independent `IN` arrays.
- Every mutation revalidates `membership.status ACTIVE` inside the same `$transaction` as the `updateMany(where:{id, version, organizationId: ctx.organizationId})` and outbox write (prevents TOCTOU revoke-vs-write).
- Migration 20260901000000 adds `AuditEvent.actorMembershipId` (FK → memberships), `systemPrincipal`, index, and CHECK xor (`actorUserId IS NOT NULL XOR systemPrincipal IS NOT NULL`). All `auditEvent.create` now write `actorMembershipId/systemPrincipal`.
- Workers construct system principal contexts and revalidate invariants before snapshots.

## Consequences

- Correct deny-by-default: permuted two-membership tests (project.write vs SYSTEM_ADMIN) now deny; supplier 4-row matrix (2 orgs × 2 memberships) yields exactly 2 rows, no cross.
- Audit attribution is membership-precise; backfill historic rows set `systemPrincipal=MIGRATION_SEED`.
- Client hint `x-organization-id` is navigation-only, not authority.
- Breaking change for callers that relied on flattened `supplierWhere(organizationIds,membershipIds)` — deprecated in favor of `FromSet` methods.

## Verification

- canonical-authorization.test.ts (exactly-1, supplier tuple-OR, system principal, hint abuse, no cross).
- Phase 1 checklist docs/readiness/phase-one-checklist.md tracks code/tests/docs/gates.
