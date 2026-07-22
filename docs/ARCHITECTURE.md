# Architecture

## System shape

MECO Flow is a TypeScript modular monolith in a pnpm/Turborepo workspace. Deployable processes share contracts and infrastructure but remain independently startable:

```text
Browser -> Next.js web -> NestJS REST API -> application services -> policies/domain services -> repositories -> Prisma -> PostgreSQL
                                      |                                                    |
                                      +-> private S3-compatible storage                    +-> transactional outbox
                                                                                                      |
                                                                                               Redis-backed worker
```

`apps/web` is the App Router frontend, `apps/api` owns REST/OpenAPI and synchronous application behavior, and `apps/worker` owns bounded asynchronous work. `packages/contracts` contains transport-neutral schemas, `packages/database` owns Prisma, `packages/config` validates configuration, `packages/ui` contains local shared UI, and `packages/test-utils` contains deterministic fixtures.

## Boundaries

Controllers never access Prisma. The dependency direction is controller → application service → domain service/policy → repository → Prisma. Modules expose intentional public interfaces and may not import private implementation details from another module. Shared packages remain free of deployable-specific state.

PostgreSQL is the source of truth. Redis is coordination/queue infrastructure, not authoritative storage. MinIO supplies local private object storage. Keycloak is the identity source. Mailpit captures local mail. Asynchronous domain events use a transactional outbox once operational modules begin.

## Runtime foundations

- Strict TypeScript and startup environment validation.
- JSON request logs with request/correlation identifiers and secret redaction.
- `/health/live` reports process liveness; `/health/ready` checks PostgreSQL, Redis, and object storage without exposing credentials or detailed topology.
- REST resources live below `/api/v1`; OpenAPI is generated from the API and checked in CI.
- UTC crosses API and persistence boundaries; presentation uses configured locale and timezone.

## Security boundaries

Browser input, HTTP payloads, identity claims, environment values, files, spreadsheets, queue payloads, database JSON, and external responses are untrusted. Authentication uses Keycloak OIDC Authorization Code with PKCE and secure server-managed sessions in Phase 1. Authorization is permission and policy based, organization and project scoped, deny-by-default, and independently testable.

## Deployment

Local development uses Docker Compose for PostgreSQL, Redis, MinIO, Keycloak, and Mailpit while applications run through pnpm. Container definitions provide a staging-like path. Kubernetes and microservices are explicitly excluded. See `DEPLOYMENT.md` and accepted ADRs.

## Phase 3B asynchronous import path

The API stores private upload objects and atomically creates import metadata, audit evidence, and a parse-request outbox row. The worker claims PostgreSQL outbox rows with `FOR UPDATE SKIP LOCKED`, uses a short Redis coordination lock, re-reads authoritative metadata, streams the private object, and transactionally writes dry-run rows plus terminal job/audit state. File bytes and row payloads never enter Redis.

## Phase 4A requisition transaction path

The requisition controller calls its application service, which composes operation permission and project policy before the repository resolves or mutates records. Creation locks the project and selected released BOM lines, recalculates active requisition coverage, validates quantity precision and override authority, and writes the requisition, immutable lines, and redacted audit evidence in one PostgreSQL transaction. Explicit lifecycle commands lock and expected-version check the requisition before writing state, immutable transition history, approver attribution where applicable, and audit evidence atomically. Phase 4A has no worker or outbox work because it starts no asynchronous integration.

## Phase 4B purchase-order transaction path

The purchase-order controller calls its application service, which composes operation permission, project policy, supplier-organization object scope, and field policy before repository access. Creation and revision lock the project and sorted approved requisition lines, recalculate quantity already consumed by current non-cancelled PO revisions, enforce precision and any separately authorized reasoned override, and atomically write the retained revision, immutable lines/allocations, and redacted audit evidence. A deferred database constraint requires each line's ordered quantity to equal its allocation total.

Send, acknowledgement, and cancellation are explicit expected-version transitions with immutable transition and audit rows. Supplier commitment submission locks the PO, validates current acknowledged revision ownership and line scope, increments the PO version, and appends an immutable commitment revision with audit evidence. Read models derive original/latest line dates and internal late-commitment exceptions; supplier DTOs are constructed from an allowlist and never serialize internal commercial fields. No Phase 4B operation emits worker/outbox work or creates a Phase 5 record.

## Phase 5A document transaction and storage path

The document controller calls the document application service, which composes document permission, project policy, owner-organization policy, workflow state, storage verification, and the virus-scanner interface before repository mutation. Initiation signs a five-minute private PUT for an opaque key, then transactionally persists quarantined metadata, validated existing-entity associations, and redacted audit evidence. Completion re-reads the private object, rechecks length/metadata, computes SHA-256, detects content type where supported, and scans bytes through the ClamAV-compatible interface before a transaction records clean draft or failed-scan state.

Review commands lock and expected-version check the file version. Replacement approval supersedes the previous approved version and approves the new version in one transaction while retaining both. Downloads are represented by audited two-minute private GET URLs issued only after server-side object, organization, project, workflow, and scan-state authorization. Phase 5A uses no Redis or outbox payload and creates no shipment or receiving record.

## Phase 5B shipment and receipt transaction path

The receiving controller calls the receiving application service, which composes supplier or internal operation permission, exact organization scope, project policy, workflow state, expected version, and idempotency before repository mutation. Supplier ASN creation locks the addressed acknowledged PO and sorted current-revision lines, recalculates active shipped quantity, and atomically writes lines plus redacted audit evidence. Explicit supplier submit/dispatch/cancel and internal arrive commands lock the ASN and append immutable transition/audit rows.

Receipt creation resolves only arrived ASN lines in the authorized project. Posting locks the receipt, project, and sorted ASN lines, rechecks effective received quantities, sets the idempotency evidence, creates awaiting-inspection lots or correction adjustments, and writes audit evidence in one PostgreSQL transaction. Posted receipt content and inventory history are database-immutable. Packing lists, certificates, and photographs reuse the private document service through object-scoped ASN/receipt associations. Phase 5B adds no worker/outbox work and does not implement inspection, NCR, allocation, or readiness.
