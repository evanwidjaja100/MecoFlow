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

## Phase 6A receiving-inspection transaction path

The inspection controller calls the inspection application service, which composes operation permission, project policy, workflow state, expected version, conditional-acceptance authority, and evidence-document policy before repository mutation. Item-scoped active definitions are snapshotted into an inspection during original receipt posting in the same transaction as lot creation, or through an explicit command for an awaiting lot.

Result recording locks and versions the inspection and validates checklist, configured-precision measurement, and approved-clean linked certificate evidence. Finalization locks the inspection then lot, derives effective received quantity from retained receipt/correction history, validates exact accepted/rejected quantities, derives quarantine, and atomically finalizes the inspection, updates lot disposition buckets/status, and writes audit evidence. Database triggers preserve definition/inspection/check history, enforce one-way lot disposition, and reject corrections after disposition. Phase 6A uses no worker/outbox work and creates no NCR or allocation record.

## Phase 6B NCR and material-allocation transaction path

The NCR controller calls its application service, which composes internal project permission or exact supplier-organization/project scope before repository access. Creation derives supplier ownership from inspection/lot receipt lineage or validates an explicitly assigned project supplier. Expected-version commands lock the NCR, append immutable transitions or numbered supplier responses, update lifecycle attribution, and write redacted audit evidence atomically. Supplier DTOs are constructed from an allowlist; internal note fields and sharing-control metadata are never serialized, and explicitly shared disposition text is mapped to a distinct supplier field.

Allocation creation locks the inventory lot, rechecks its accepted disposition and current released matching BOM line, applies unit precision, recalculates retained allocated/consumed quantity, and atomically writes the allocation plus audit evidence. A database trigger takes the same lot lock and independently enforces scope and accepted availability. Conditional use composes an independent permission, retained inspection authorizer, bounded reason, allocation authorizer, and dedicated audit. Release and consume lock the lot then allocation, expected-version check the active state, and append immutable quantity-snapshot transitions with audit evidence. Phase 6B uses no worker/outbox work and creates no Phase 7 readiness data.

## Phase 7A material-requirement projection path

The projection controller calls its application service, which reuses the internal `bom.read` plus project-read policy before repository access. In one repeatable-read transaction, the repository loads only current released requirements and their explicitly traced requisition, PO allocation/commitment, ASN, inventory-lot/correction/inspection, and material-allocation records. A pure `material-requirement-status-v1` calculator performs exact fixed-scale aggregation and deterministic pooled-line attribution; controllers and services never access Prisma.

The endpoint is a live read model and writes no audit, outbox, or snapshot row. Current sent/acknowledged PO revisions determine commercial order/confirmation totals. Retained physical shipment and lot history remains visible across later PO revision changes, without allowing superseded BOM capacity to be reassigned. Phase 7A adds no worker path, dashboard, score, notification, report, or Phase 7B behavior.

## Phase 7B readiness snapshot path

The pure calculators live in `@mecoflow/readiness`; both API and worker consume the same versioned material contracts without importing one deployable from another. Relevant authoritative aggregate changes atomically enqueue identifier-only readiness events through database triggers. The worker coalesces a project's pending events, takes a PostgreSQL advisory transaction lock, loads only current released requirements and retained trace inputs, calculates project/work-package results, and commits immutable snapshots, redacted audit evidence, and event completion in one serializable transaction.

## Staging deployment boundary

Phase 9C packages the modular monolith as separate non-root web, API, worker,
migration, and operations containers plus non-root infrastructure services.
nginx is the only published ingress and preserves the external HTTPS
host/scheme for OIDC and secure cookies. API/web/Keycloak share the edge
network required for routed traffic. The web server also joins the private
backend network so its authenticated server action can follow internal MinIO
presigned upload URLs; no backend port is published. Databases, Redis, object
storage, and ClamAV remain private. The API and worker still use repositories as the only
Prisma boundary; the migration/seed jobs are explicit deployment operations
and do not introduce a second application data-access path.

Schema migration, RBAC seed reconciliation, and staging-fixture provisioning
are separate one-shot jobs. Application startup never mutates schema. Durable
state resides in named volumes, while external secret and TLS files live
outside Git. A coordinated operations image owns backup/restore tooling but no
public endpoint. This topology is staging evidence, not an approved production
platform.

## Operational observability boundary

The API exposes `/metrics` only to the private backend network. A monitoring
controller calls an application service, which reads persisted outbox/email
facts through `MonitoringRepository`; the controller/service do not access
Prisma. The service composes existing dependency readiness and the shared
versioned Redis worker-heartbeat contract. HTTP instrumentation uses bounded
route templates/status classes, never identifiers or payload values.

The optional staging monitoring overlay runs private Prometheus,
Alertmanager, and HTTPS black-box exporter containers. nginx explicitly denies
public `/metrics`. Prometheus stores bounded operational time series and sends
actionable alerts to Alertmanager. The tracked receiver is observation-only;
production paging configuration and credentials remain external. Capacity
testing is a separate read-only client and creates no application business,
audit, or queue state.

A five-minute worker sweep invokes the identical idempotent path for projects with released BOMs. Input hash plus explicit UTC calculation date and versions prevents duplicate same-input batches. The API performs only authorized snapshot reads; Next.js renders management, project, material, and history views and never decides readiness or authorization. No notification/report/scorecard dispatcher is introduced.

## Phase 8A notification delivery path

An `AFTER INSERT` database trigger on project-scope readiness snapshots writes one identifier-only alert or scheduled-reminder outbox row in the same transaction. The notification worker claims rows with `FOR UPDATE SKIP LOCKED`, re-reads the authoritative snapshot and current active internal project members, applies each recipient's server-side preferences, and creates per-event/per-user notification records under a database uniqueness constraint.

Email delivery is a separately retained state machine with deterministic message IDs, bounded exponential retry, ambiguous-send fail-safe behavior, and explicit recoverable dead-letter state. SMTP is optional; disabled delivery is recorded as skipped without affecting in-app delivery. Worker logs expose event outcome, attempt, duration, created/sent/skipped counts, and periodic pending/processing/dead-letter counts. The API exposes only the current user's notification inbox and preferences; project assignment is rechecked on every inbox read. No report or supplier-scorecard path is introduced.

## Phase 8B report and scorecard path

Report controllers call the report application service, which validates the period and composes dedicated report/export/scorecard permissions with existing project and source-read policy. The report repository applies project and supplier predicates before loading readiness, PO, ASN, inspection, or NCR rows. A pure versioned supplier-scorecard calculator receives only scoped retained facts and returns exact KPI numerators, denominators, percentages, and monthly buckets.

CSV and XLSX serializers are pure and formula-safe. XLSX is generated as a minimal macro-free OOXML package without formulas or external relationships. The service records redacted `REPORT_EXPORTED` audit evidence before returning bytes. No report worker, persisted aggregate, denormalized score table, or Phase 9 cache/performance path is introduced.

## Phase 1 — Canonical AuthorizationContext

All protected operations now resolve one exact AuthorizationContext via AuthorizationService (exactly-1 qualifying membership, otherwise 403). Supplier collections use AuthorizationContextSet with tuple-OR predicates, never independent IN arrays. Every mutation revalidates membership ACTIVE inside the same transaction as the versioned update and outbox. Workers construct SYSTEM_PRINCIPAL contexts (WORKER_BOM_IMPORT, WORKER_READINESS) and audit events store actorMembershipId/systemPrincipal with xor CHECK. See ADR-0016.
