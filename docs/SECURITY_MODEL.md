# Security model

## Principles

MECO Flow denies access by default, validates every trust boundary, minimizes disclosed data, keeps secrets outside source control, and records security-relevant business changes immutably. Inaccessible and nonexistent protected resources must be indistinguishable.

## Authentication and sessions

Keycloak is the sole identity provider. The historical Phase 1 implementation established OIDC Authorization Code with PKCE using secure HttpOnly cookies and a backend-for-frontend session; browser local storage must never contain access or refresh tokens. The production-readiness program revalidates systemic authorization and attribution in its separately authorized Phase 1. Production has no default administrator credentials, uses Secure cookies and an explicit SameSite/CSRF design, and restricts Keycloak administration.

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

## Phase 2 project controls

Project list queries are scope-filtered in the repository and never load an unscoped result set for application-side filtering. Internal project workers require both an active explicitly assigned project membership and the relevant permission, except documented internal management/system-administrator oversight. Supplier principals can read only projects explicitly shared with their own active supplier membership; supplier overview responses omit employee/member identities and transition history. Supplier A, Supplier B, nonexistent-ID, read-only-write, and CSRF negative cases are automated.

Project state is excluded from the generic edit DTO and can change only through a validated explicit transition command. Project and child writes are CSRF protected, expected-version checked, constrained to object scope and workflow state, and committed atomically with a redacted audit event. Transition history and audit history have database triggers rejecting update/delete. Completed and cancelled projects are read-only; no reopen command is present in Phase 2.

## Phase 3A item-master controls

The item master is a global internal catalog. Access still requires an active principal, an active membership in an active internal organization, and the operation-specific `item.read`, `item.write`, or `item.export` permission. Supplier and reserved customer roles receive none of these permissions and cannot use the item API or internal screens. The organization stored on an item-master audit event is the qualifying actor membership's organization; it is audit context, not catalog ownership.

Every item-master write requires the existing session-bound CSRF proof. Edits and item deactivation require an expected version, use database predicates and row locking where reference integrity requires it, and write a redacted audit event in the business transaction. Duplicate codes, inactive or mismatched references, required attributes, typed values, unit/attribute precision, and changes that would invalidate active references are validated server-side. Inactive items are read-only; there is no item-delete route and PostgreSQL rejects direct item deletion.

Item search is bounded and case-insensitive over code and name. CSV export is separately permissioned, applies validated filters, rejects results over 10,000 rows, quotes all cells, prefixes cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return, and records `ITEMS_EXPORTED` with a count and non-sensitive filter summary. No Phase 3A change initiates asynchronous processing, so no outbox payload is produced.

## Phase 3B BOM and upload controls

BOM access requires an active internal membership, a specific `bom.*` permission, and project read/write policy scope. Suppliers have no BOM permissions and are denied before identifier resolution. Unsafe upload, confirmation, correction, and lifecycle routes require session-bound CSRF; expected versions protect confirmation, corrections, and transitions. Resolved BOM/import/revision identifiers are always rechecked against project scope.

Uploads accept only `.csv` and `.xlsx`, use a 5 MiB limit, safe basename checks, extension/MIME/magic validation, SHA-256, opaque private S3 keys, server-side encryption requests, and quarantine state. The worker rechecks size/checksum and applies archive entry/count/expansion/path/encryption/content limits. Macro-enabled extensions, macro parts, external links, embedded objects, executable masquerades, binary CSV, and unsupported content fail closed. Spreadsheet formulas are never evaluated; XLSX formula cells and formula-like CSV fields are explicit validation errors. Storage keys are never returned by API representations or placed in audit/Redis payloads.

Import creation, parse completion/rejection, confirmation, line correction, review, release, supersede, and cancel are audited with redacted changes. Release and auto-supersede share one database transaction. Immutable transition triggers, a one-release partial unique index, draft-only line trigger, positive-decimal checks, restrictive foreign keys, and the released-only official view preserve lifecycle and readiness integrity.

## Phase 4A purchase requisition controls

Requisition access requires an active internal membership, an operation-specific `requisition.*` permission, and existing project policy scope. Suppliers receive none and are denied before protected object detail is disclosed. Unsafe creation and lifecycle commands require session-bound CSRF. DTOs reject unknown and server-owned workflow, attribution, coverage, and override-authorizer fields.

Creation accepts only current released BOM-line identifiers in the addressed project. It locks those rows before calculating active coverage, validates positive decimal quantities against the BOM unit precision, and denies over-need quantities unless the same qualifying project-write membership separately has `requisition.override` and supplies a bounded reason. Overrides retain the actor and need/coverage snapshot and emit a dedicated redacted audit event. Expected versions and row locks protect lifecycle commands; requester, approved approver, lines, and transition history are database-immutable. Requisition mutations and their audit evidence share one transaction.

## Phase 4B purchase-order and commitment controls

Internal PO routes require an active internal membership, an operation-specific `purchase-order.*` permission, and existing project read/write scope. Creation accepts only approved requisition lines in the addressed project and an active supplier organization with active project assignment. Sorted requisition-line locks, current-revision filtering, decimal precision checks, expected versions, immutable snapshots, and a deferred ordered-versus-allocated total constraint prevent double ordering and partial quantity state. Over-ordering additionally requires `purchase-order.override`, a bounded reason, immutable actor attribution, and dedicated audit evidence. An approved requisition consumed by an active current PO cannot be cancelled through its command.

Supplier routes require `supplier.purchase-order.read`, `supplier.purchase-order.acknowledge`, or `supplier.commitment.write`, the principal's active supplier organization to equal the PO addressee, and an active exact membership assignment on the project. Permission checks precede object resolution and inaccessible/nonexistent identifiers return the same safe not-found contract. Supplier list/detail DTOs are explicit allowlists: internal unit prices, commercial terms, buyer/line notes, requisition/allocation identifiers, internal users, transitions, audit evidence, storage keys, and unrelated objects are absent rather than redacted after serialization. No PO attachment endpoint exists in Phase 4B.

Only a sent current revision can be acknowledged and only an acknowledged current revision accepts commitment lines. Commitment revisions and lines are append-only, line/revision compound foreign keys prevent cross-revision substitution, and optimistic PO version increments serialize supplier changes. All creation, revision, send, cancel, acknowledgement, and commitment actions write redacted audit evidence transactionally; PostgreSQL triggers reject history mutation and deletion.

## Phase 5A document controls

Document routes compose an active principal, operation permission, project scope, owner organization, association scope, CSRF for every command, workflow state, and expected version. Internal readers see documents only in authorized projects. Supplier lists/details are repository-filtered to the principal's owner organization and active project assignment; purchase-order associations additionally require that supplier to be the addressee. Permission preflight and protected-object re-scope preserve real/nonexistent equivalence.

Storage remains private and anonymous bucket access is disabled. Upload initiation accepts only safe `.pdf`, `.png`, `.jpg`, `.jpeg`, `.txt`, and `.csv` metadata up to 10 MiB; ZIP, office ZIP containers, executables, traversal names, invalid UTF-8 text, mismatched MIME/magic, invalid sizes, and invalid checksums fail closed. Five-minute PUT URLs use extension-free random UUID keys and bind length, MIME, SHA-256 metadata/checksum, and production encryption. Completion independently retrieves the object and verifies stored metadata, exact size, SHA-256, supported detected type, and ClamAV result.

Scanner disabled/unavailable/error/timeout and malware detections remain `SCAN_FAILED` and cannot enter review or download. Only `CLEAN` review/approved versions can receive audited two-minute private GET URLs; suppliers and normal readers receive approved content only. Object keys are not serialized or placed in audit changes. Upload initiation/completion, download URL issuance, review submission, approval, rejection, and supersede initiation are audited. Database triggers enforce quarantined inserts, valid scan/workflow transitions, immutable file metadata/approved versions/associations/transitions, and retained history.

## Phase 5B ASN and receiving controls

Supplier ASN routes require `supplier.asn.read`, `supplier.asn.write`, or `supplier.asn.transition`, the exact addressed active supplier organization, and the same membership's active project assignment. Permission preflight precedes protected PO/ASN resolution. Supplier creation derives organization/project/current revision from the acknowledged PO; unknown, cross-supplier, superseded-revision, duplicate, imprecise, non-positive, and over-shipped lines fail closed. Supplier responses are allowlists without internal PO fields, employee actors, audits, receipts, inventory, or another supplier's data.

Internal shipment/receipt routes compose `shipment.*` or `receiving.*` permission with project scope, CSRF, workflow state, and expected version. Posting additionally validates a bounded safe idempotency key, locks the receipt/project/ASN lines, and rechecks effective quantity before any committed effect. The posted receipt, lot/adjustment records, audit event, and idempotency evidence commit together; any failure rolls back all of them. Database guards prohibit history deletion, posted receipt mutation, lot mutation, invalid transitions, cross-ASN lines, and inventory effects outside posted receipts.

ASN packing lists/certificates and receipt photographs pass through the existing private document controls. Supplier ASN associations require owner equality; supplier receipt association is denied. Object keys, presigned URLs, idempotency keys, file contents, and traceability data are excluded from audit changes and logs where not operationally required.

## Phase 6A receiving-inspection controls

Inspection routes require an active internal membership, operation-specific `inspection.*` permission, and project read/write policy where an operational object is involved. Permission preflight precedes inspection/lot identifier resolution. Supplier roles receive no inspection grants or DTO. Configuration is separately permissioned and audited; definitions are item-scoped, versioned, retained, and snapshotted so later edits cannot rewrite issued inspection work.

Every command requires CSRF. Result recording and finalization lock and expected-version check the open inspection. Measurement precision and limits are server decisions. Certificate results accept only the current approved clean version of an internal-owned document already associated with the exact inspection and project. The existing opaque key, quarantine, independent object verification, malware scan, approval, and authorized-download rules remain authoritative; an upload or association alone never makes evidence usable.

Finalization validates current received quantity from immutable lot/correction history, exact unit precision, accepted/rejected bounds, required result completion, and disposition shape. Ordinary acceptance cannot override a required nonconformance. Conditional acceptance requires the independent `inspection.conditional-accept` permission, immutable authorizer attribution, reason, and dedicated audit event. Inspection state, lot status/quantity buckets, and all audit evidence commit together. Correction posting and finalization acquire the same lot-row lock before reading status or adjustments, and the adjustment trigger also locks that lot before validating insertion. Database guards reject repeat finalization, history mutation/deletion, invalid direct lot changes, and correction adjustments after disposition.

## Phase 6B NCR and material-allocation controls

Internal NCR routes require an active internal membership, operation-specific `ncr.*` permission, and project read/write scope. Supplier routes require `supplier.ncr.read` or `supplier.ncr.respond`, exact supplier organization ownership, and the same active membership's exact project assignment. Supplier list/detail queries apply both scopes in the repository. Foreign and nonexistent identifiers produce the same not-found response.

Supplier NCR DTOs are constructed as allowlists. Internal disposition property names, the sharing-control boolean, internal creator/transition/closure actors, and audit data are absent. When internal closure explicitly shares disposition text, only the text is mapped into `sharedDispositionNotes`; otherwise it is `null`. Supplier response messages are bounded, append-only, attributed, expected-version serialized, and audited in the same transaction. Database triggers reject response, transition, or terminal NCR history mutation/deletion.

Allocation routes are internal-only and compose `allocation.*` permission with project scope. Creation locks the lot before reading disposition or availability and counts only accepted quantity minus retained `ALLOCATED`/`CONSUMED` records. Rejected, quarantined, and awaiting-inspection statuses fail closed. Item, unit, project, current released BOM state, decimal precision, and positive quantity are revalidated transactionally. A database insert trigger repeats the lot lock and invariant checks to prevent bypass and concurrent over-allocation.

Conditionally accepted material additionally requires `allocation.conditional-use`, the inspection's retained conditional authorizer, a bounded use reason, allocation authorizer attribution, and a dedicated audit event. Release and consume lock the lot and allocation, expected-version check the active state, retain immutable quantity-snapshot transitions, and commit audit evidence atomically. Release restores availability; consumption never does.

## Phase 7A material-requirement status controls

The projection is internal-only. It requires an active internal membership with `bom.read` and project-read scope before the repository loads requirement or procurement objects. Supplier memberships cannot satisfy the BOM policy even when they hold project collaboration access. Inaccessible and nonexistent projects retain the existing safe project response behavior.

The response contains requirement/item/unit identifiers and internal aggregate quantities, but no supplier identities, commercial prices/terms, user attribution, traceability text, inspection notes, NCR fields, document metadata, storage keys, audit events, or raw contribution records. Exact arithmetic and invariant checks fail closed on inconsistent persisted data. Source queries share a repeatable-read transaction snapshot so concurrent writes cannot produce a mixed-time response. The read has no mutation, audit, outbox, or concurrency side effect; database transaction rules on its source records remain authoritative.

## Phase 7B readiness controls

Readiness routes require active internal `readiness.read`, `project.read`, and existing project policy scope. Supplier memberships have no grant and fail before protected resolution. Management portfolio queries apply project access predicates in the repository; web navigation is presentation only. Representations expose minimized material aggregates and explanations, not supplier identity, commercial data, actors, traceability/internal NCR text, document metadata/keys, or audit rows.

Snapshot creation is worker-only. Identifier-only events commit with source changes, are coalesced without losing events created after claim, and are completed atomically with a changed snapshot batch. Serializable transactions plus a project advisory lock serialize event and schedule workers. Exact/hash validation fails closed. Snapshot update/delete is database-rejected, and changed batches write redacted system audit evidence. Queue payloads contain only project/source identifiers.

## Phase 8A notification controls

Notification event payloads contain only project and readiness-snapshot identifiers. The worker re-reads authoritative state and derives recipients only from active users with active internal memberships, active organizations, and active exact project-member assignments. Supplier users receive no readiness notification. The inbox is user-owned and repository-filtered; every read or mark-read operation also requires a current active project assignment, so revoked access cannot expose retained project notification text. Preference writes can target only the authenticated user, require CSRF and expected version, serialize on the user row, and write redacted audit evidence in the same transaction.

SMTP is off by default. Local explicit SMTP points to loopback Mailpit. Production rejects enabled SMTP unless it uses a nonlocal host, implicit TLS, a nonlocal sender, and injected credentials. Passwords are validated at startup, never persisted in notification/outbox data, and covered by log redaction. Email addresses are retained only on the delivery record; logs expose counts and safe error classifications, not recipients or message bodies. A post-send database failure is treated as ambiguous and dead-lettered rather than automatically resent.

## Phase 8B report and scorecard controls

Internal report access composes `report.read` or `report.export` with existing project, readiness, BOM, and applicable source-read grants. Internal supplier performance additionally requires `scorecard.read`. Supplier scorecard access uses separate supplier permissions, derives organization from the active authenticated membership, and repository-filters by exact supplier organization plus active project assignment. A supplier organization selector is rejected on supplier routes. Foreign and nonexistent supplier scope remains indistinguishable.

Supplier output is aggregate-only and omits other suppliers, internal prices/terms/notes, employee identities, audits, inspection detail, and internal NCR fields. Export filters are validated and bounded. All text cells beginning, including after whitespace, with `=`, `+`, `-`, `@`, tab, or carriage return receive a leading apostrophe. XLSX contains no macros, formulas, hidden sheets, external links, or embedded content. Exports fail above 10,000 rows and write redacted immutable audit evidence before bytes are returned.

## Phase 9A hardening controls

Phase 9A revalidated the documented trust boundaries against the implementation
and added narrowly scoped defense in depth:

- login return paths must remain relative after browser-compatible URL
  normalization; backslashes, protocol-relative values, control characters,
  and malformed cookie encoding fail closed;
- OIDC tokens require strict scalar claim types, applicable `azp`, `nbf`,
  bounded token/JSON sizes, and HTTPS discovered endpoints outside local/test;
- authenticated API responses are non-cacheable, API error envelopes do not
  echo exception text, and oversized/rate-limited requests retain stable 413
  and 429 classifications;
- the browser receives an explicit CSP, frame/object denial, MIME protection,
  same-origin referrer policy, HSTS, COOP, and CORP policy;
- compressed BOM input is output-bounded before allocation and row limits are
  enforced while parsing;
- structured logs redact top-level and nested secret-like names and do not
  serialize arbitrary exception messages or traces;
- application containers execute as non-root while deployed code and
  dependencies remain root-owned and non-writable by the process.

The CSP currently retains inline script/style compatibility for the Next.js
runtime. Rate limits remain process-local, and the repository has no supported
container OS-vulnerability scanner. These and all review evidence are recorded
in `SECURITY_REVIEW.md`.

## Phase 9C staging deployment controls

The staging topology exposes only loopback HTTPS through nginx. All
long-running and one-shot containers use non-root service users; application
roots are read-only and code is root-owned/non-writable. Docker secret file
mounts inject database, Redis, S3, session, Keycloak, and smoke credentials
from ignored external runtime paths. Secret values are absent from image
build arguments, image layers, Compose environment metadata, and provisioning
output. The TLS private key is proxy-only; the API receives only the public
local CA certificate needed to validate the public OIDC issuer.

The object bucket is private and the application account is constrained to the
single exact staging bucket. Dependency ports and Keycloak administration are
not published. nginx denies `/admin/`, forwards a fixed single trusted proxy
hop, limits request bodies, and enables TLS 1.2/1.3 and HSTS. Health responses
remain metadata-light while readiness authenticates to actual dependencies.
The web server also joins the private backend network because its authenticated
server action follows an internal MinIO presigned upload URL; browsers never
receive backend-network access. The local staging MinIO has no external KMS,
so this rehearsal is not encrypted at rest. `APP_ENV=production` continues to
require signed server-side-encryption headers and therefore requires an
approved KMS-capable object-store configuration. Production configuration now
also requires HTTPS object storage and an explicit encryption contract.
`aws:kms` requires a nonempty KMS key identifier and signs it into document
uploads; completion rejects a mismatched reported algorithm/key. `AES256` is
accepted only with external evidence that the provider's SSE-S3 path is backed
by the approved KMS.

A provider-neutral preflight denies repository-local/placeholder secret
delivery, invalid TLS chain/host/key/expiry, stale or non-private KMS storage
evidence, and stale or unverified encrypted off-site backup evidence. These
checks validate the supplied contract but do not authenticate provider
attestations or replace formal security/operations approval.

Migration and fixture jobs are operator-controlled. Smoke-fixture provisioning
fails closed outside staging. Backup/restore tools use external credentials,
checksum complete sets, and require explicit destructive restore
confirmations. Phase 9C validates backup inputs and supplier isolation but
the 2026-08-01 rehearsal additionally proves one clean, single-host local
restoration plus authentication, readiness, permissions, document checksums,
and supplier isolation. It does not prove a production secret manager,
production CA/KMS, encrypted off-host media, image OS scanning, MFA policy,
real paging/capacity evidence, cross-host recovery, or acceptance approval.

## Production observability controls

Operational metrics are private and nginx returns 404 for `/metrics`. Labels
contain only bounded HTTP methods, framework route templates, status classes,
fixed dependency names, fixed/`OTHER` event types, and queue states. Requests,
UUIDs, query values, cookies, tokens, credentials, email addresses, supplier
identities, object keys, exception text, and queue payloads are excluded.
Collection failure has its own metric so a missing queue series cannot be
mistaken for zero work.

Alertmanager receiver URLs/tokens and capacity authentication headers must be
external files. The capacity runner accepts only GET/HEAD, does not follow
redirects, bounds configuration/header files and requests, refuses secret-like
query keys, and emits no body/header content. Nonlocal configuration/evidence
must stay outside the repository. Production approval requires witnessed
firing/resolved notification and escalation evidence; the staging observation
receiver fails that gate by design.
