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
