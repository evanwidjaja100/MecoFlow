# Current phase

Phase 5B — ASN and receiving (implemented on 2026-07-20; exact final verification results are reported in the implementation handoff). Work stops before inspection, NCR, material allocation, and readiness functionality.

# Completed capabilities

- Phase 0 repository/runtime foundations and Phase 1 OIDC, organizations, roles, permission policies, sessions, CSRF, and immutable audit foundation remain intact.
- Versioned product-category administration with active/inactive status and audit events.
- Project creation, scoped reading, and detail editing with organization/category association, planned dates, versions, and transactional audit events.
- Explicit project transition command and immutable history for the accepted `DRAFT`, `PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, and `CANCELLED` graph. Generic project edits cannot accept `state`; completed/cancelled projects are read-only and there is no Phase 2 reopen command.
- Active/inactive project-member assignments with internal-owner scope, explicit supplier sharing, member roles, expected versions, and a final-active-project-manager invariant.
- Versioned milestones and milestone-linked work packages with project/date boundary validation, same-project link validation, and audit events.
- Project-level authorization composes active identity/membership, permission, internal oversight or explicit project assignment, object scope, workflow state, CSRF, and expected version. Repository list queries are scope-filtered. Supplier project responses omit employee/member identities and transition history.
- Internal project directory and overview screens. The directory supports search, state/category filters, sorting, bounded pagination, and URL query persistence. The overview supports project edit/transition plus member, milestone, and work-package operations.
- Date/timestamp presentation uses the configured `APP_TIMEZONE` with `Asia/Jakarta` fallback; PostgreSQL timestamps remain UTC and planned dates use the database `DATE` type.
- Local/test/CI deterministic seed adds a fictional product category, demo project, creator project membership, milestone, and work package. Nonlocal environments receive no Phase 2 demo business data.
- Generated OpenAPI, human API documentation, authorization matrix, domain/security/test documentation, README, unit/integration/authorization/concurrency/browser coverage are updated.
- Global internal item-category and unit-of-measure administration with active/inactive status, optimistic versions, normalized unique uppercase codes, and transactional audit events.
- Ordered `TEXT`, `NUMBER`, and `BOOLEAN` specification-attribute definitions with required-value, unit, data-type, sort-order, active-reference, and zero-to-six decimal-precision validation.
- Versioned item creation, internal detail editing, case-insensitive search, active/category/unit filters, sorting, bounded pagination, and typed structured specification values. An item's category is immutable after creation.
- Explicit reasoned item deactivation. Inactive items are read-only, no delete route exists, restrictive references retain item data, and a database trigger rejects direct item deletion.
- Separate internal `item.read`, `item.write`, and `item.export` permissions. Supplier/customer roles receive none; qualifying internal roles follow the authorization matrix.
- Filtered CSV export with a 10,000-row ceiling, fixed columns, formula-safe cells, and same-transaction `ITEMS_EXPORTED` audit evidence.
- Internal item directory and item-detail screens with URL-backed filters, permission-sensitive controls, structured specification inputs, CSV download, and retained inactive-item detail.
- Local/test/CI deterministic Phase 3A seed adds fictional item categories, units, definitions, an item, and typed values. Nonlocal environments receive no Phase 3A demo business data.
- Phase 3A seed reconciliation now predicates every update on an actual value difference, so repeat application is a true timestamp-preserving no-op.
- Project-wide and work-package-specific BOM aggregates with numbered revisions, positive decimal lines, item/base-unit references, optimistic versions, and retained history.
- Command-only `DRAFT`, `IN_REVIEW`, `RELEASED`, `SUPERSEDED`, and `CANCELLED` lifecycle with immutable transitions, draft-only line correction, transactional release/auto-supersede, and a database-enforced one-released-revision invariant.
- Released-only `official_bom_lines` view and response flags. Procurement coverage is explicitly a zero-valued `NOT_STARTED` placeholder; no purchasing or operational-allocation data is created.
- Fixed CSV and macro-free XLSX templates; private bounded uploads with safe names, extension/MIME/magic checks, SHA-256, opaque keys, production encryption requests, and quarantine/validated/rejected metadata.
- PostgreSQL outbox plus Redis-coordinated worker parsing with identifier-only jobs, authoritative object re-read, size/checksum revalidation, retry/backoff, terminal failure, and transactional row/file/outbox/audit completion.
- Dry-run validation retains every row and exposes row/field errors and warnings for quantity, precision, unit, item match, ambiguity, formula-like content, criticality, duplicates, and blanks. Formulas/macros are never executed.
- Explicit, expected-version confirmation before one source-linked draft revision is created transactionally. Invalid or ambiguous dry runs cannot be confirmed.
- Source file/checksum display, draft line correction, lifecycle controls, import history, row-level results, and added/removed/changed/unchanged revision comparison in the internal project BOM workspace.
- Separate `bom.read`, `bom.write`, `bom.import`, `bom.review`, and `bom.release` permissions composed with existing project scope; suppliers receive none.
- Project-scoped purchase requisitions created only from current released BOM lines, with positive precision-checked manual quantities tied to retained source lines and per-project requisition numbering.
- Released requirement projection with active requisition coverage and outstanding quantity. Draft, submitted, and approved lines reserve coverage once; rejected and cancelled lines release coverage.
- Transactional deterministic BOM-line locking and coverage recalculation prevent concurrent requisitions from double booking configured need.
- Separately authorized `requisition.override` behavior with required reason, immutable line-level authorizer/need/coverage snapshots, and dedicated override audit evidence.
- Explicit versioned `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, and `CANCELLED` commands with database-guarded transitions and immutable history. Requester is immutable; approver and approval timestamp are preserved after approval/cancellation.
- Separate requisition read/write/submit/approve/cancel/override permissions composed with existing project scope. Suppliers receive none; Purchasing cannot approve or override.
- Internal requisition list/create and detail screens display released need, covered and outstanding quantities, requester, approver, override evidence, and accessible lifecycle controls.
- Project-scoped purchase orders created and revised only from approved requisition quantities, with explicit immutable requirement allocations and exact ordered-versus-allocated totals.
- Transactional sorted requisition-line locks and current-revision coverage prevent concurrent double ordering. Separately authorized, reasoned over-ordering preserves approved/ordered/available snapshots, authorizer attribution, and dedicated audit evidence.
- Retained numbered PO revisions with explicit `DRAFT`, `SENT`, `ACKNOWLEDGED`, and `CANCELLED` lifecycle commands, optimistic versions, immutable transition history, and current-revision-only quantity consumption.
- Supplier-addressed PO list/detail responses require exact active supplier organization and project membership and are built from server-side field allowlists. Internal unit price, commercial terms, buyer/line notes, requisition/allocation identity, employee history, audit data, storage keys, and unrelated objects are absent.
- Explicit supplier acknowledgement and append-only numbered commitment revisions scoped to current PO-revision lines. Original and latest dates are preserved and displayed without edit/delete operations.
- BOM-required date snapshots derive from work-package or project planned start. Latest commitments after required dates populate the separately permissioned internal exception list.
- Internal PO workspace/detail and separate supplier PO list/detail screens cover approved-source creation, send, acknowledgement, commitment append, retained histories, date status, and permission-sensitive controls.
- PO creation/revision/send/cancel, supplier acknowledgement, commitment append, and reasoned overrides write redacted audit evidence in the same business transaction.
- Project-scoped logical documents with immutable numbered versions, owner organizations, metadata, uploader/reviewer attribution, and validated associations to existing project, work-package, BOM, requisition, and purchase-order records.
- Private MinIO/S3 storage with extension-free UUID keys, five-minute signed PUTs, two-minute signed GETs, private bucket policy, production encryption requests, and no storage-key serialization.
- Safe `.pdf`, `.png`, `.jpg`, `.jpeg`, `.txt`, and `.csv` validation up to 10 MiB. ZIP/office ZIP containers, executables, traversal names, invalid UTF-8, mismatched MIME/magic, invalid sizes, and invalid checksums fail closed.
- Completion independently re-reads object metadata and bytes, verifies exact size and SHA-256, detects supported content, and invokes a bounded ClamAV `INSTREAM` virus-scanner interface. Disabled/unavailable/error/positive scanning produces non-downloadable `SCAN_FAILED` state.
- Explicit clean `DRAFT` to `IN_REVIEW` to `APPROVED`/`REJECTED` commands, retained transitions, optimistic versions, and atomic prior-approval supersede when a clean replacement version is approved.
- Internal and own-supplier document permissions compose with existing project scope. Supplier lists/details are repository-filtered by owner organization, supplier PO associations require addressee equality, and supplier approval is denied before object resolution.
- Upload, completion/rejection, review submission, approval, rejection, supersede initiation, and download URL issuance write redacted audit evidence. Database triggers retain versions/associations/transitions and prevent approved metadata overwrite.
- Internal project document workspace with bounded upload controls, ZIP warning, checksum/scan/version table, review decisions, download actions, and replacement upload controls.
- Supplier-owned advance shipment notices against exact current acknowledged PO lines, with active shipped-quantity bounds and retained package references.
- Explicit versioned ASN submit, dispatch, arrive, and cancel commands with immutable transition history and transactional redacted audit evidence.
- Supplier ASN register/detail screens with server-side field allowlisting and secure packing-list/certificate uploads through the document service.
- Internal arrived-ASN receiving with draft receipts, received timestamp/location, quantity, heat number, batch number, manufacturer, package reference, and notes.
- Idempotent receipt posting that transactionally revalidates quantity, posts the receipt, creates one positive awaiting-inspection inventory lot per original line, and writes audit evidence.
- Database-immutable posted receipts, receipt lines, lots, adjustments, shipment lines, transitions, and retained operational history.
- Separate correcting receipt drafts with signed deltas and posting that appends traceable lot adjustments without rewriting original receipt or lot data.
- Internal tablet receiving screens with touch-sized controls, coarse-pointer spacing, card-based traceability capture, distinct post action, correction workflow, and secure camera/photo upload.
- ASN and goods-receipt document associations with supplier owner equality and internal-only receipt association policy.

# Partially completed capabilities

- None within the bounded Phase 5A document-storage scope.

# Not started

- Receiving inspection, quality disposition, NCR, operational material allocation, final readiness projection/dashboard, notifications, reporting, and scorecards remain absent.

# Active technical decisions

- ADR-0001 through ADR-0014 remain accepted and governing.
- Project scope is an explicit active project-member assignment. `SYSTEM_ADMIN` has internal-project oversight and `MECO_MANAGEMENT` has read oversight in its internal organization; roles/permissions alone do not grant ordinary project scope.
- Supplier assignment grants project read scope and, in Phase 4B, separately permissioned write access only to addressed PO acknowledgement and commitment append commands. Employee/member, internal transition, audit, requisition/allocation, and commercial-field visibility remains absent.
- Project state is a command-only field. Terminal-state reopening needs a separately designed and authorized future command; it is not implicitly implemented.
- The Phase 3A item master is a global internal catalog shared by active internal organizations. Item data is not organization-partitioned; the qualifying actor membership supplies audit organization context. Supplier and customer roles have no item-master access.
- Item-category, unit, and item codes are globally unique after uppercase normalization; specification-attribute codes are unique within their category. Retained inactive records continue to reserve their codes.
- Item category is immutable after item creation. Active reference masters cannot be deactivated, used attribute type/unit/precision cannot change, and inactive items cannot be edited or reactivated through Phase 3A routes.
- CSV export is separately permissioned and audited, preserves the active list filters except pagination, rejects more than 10,000 rows, and neutralizes spreadsheet formula prefixes.
- Phase 3B activates the transactional outbox only for BOM import parsing. Redis payloads and outbox payloads contain identifiers, never files, rows, credentials, or secrets.
- BOM release serializes on the BOM row, supersedes the prior release before releasing the target in one transaction, and remains independently constrained by a partial unique index.
- A unique exact item code is authoritative during import. Name-only matches require exactly one active item and produce a warning; ambiguous names are explicit errors.
- Requisition coverage counts exact retained BOM-line identifiers in `DRAFT`, `SUBMITTED`, or `APPROVED` requisitions. Rejected/cancelled requisitions retain history but release coverage.
- Requisition creation serializes on sorted BOM-line locks and snapshots need/coverage. Over-need is a strict decimal comparison and requires the independent override permission and reason.
- The Phase 4A lifecycle permits draft submission/cancellation, submitted approval/rejection/cancellation, and approved cancellation. Rejected/cancelled are terminal; requester and an already-recorded approver cannot be replaced.
- Only current revisions of non-cancelled POs consume approved requisition quantity. Revising appends a complete replacement revision, retires the prior current flag, and returns the aggregate to `DRAFT`; every earlier revision and commitment remains retained.
- A PO line contains one item/unit and its ordered quantity must equal its allocation sum. Required date is the earliest allocation snapshot date, derived from work-package planned start or project planned start.
- Supplier commitment revisions may be partial across PO lines; original/latest dates are calculated independently per line from all append-only revisions. A latest date strictly after required date is an internal exception.
- Document files deliberately exclude ZIP-based Word/Excel formats because Phase 5A's mandatory ZIP prohibition governs the allowlist. Generic associations are limited to already-implemented aggregate types and are server-validated within the document project.
- Upload and download presigned URLs are fixed at five minutes and two minutes respectively. Scanner configuration is mandatory in production; local disabled scanning demonstrates fail-closed quarantine rather than treating an unscanned file as clean.
- Active non-cancelled ASN drafts reserve PO shipped quantity. Supplier identity and revision scope derive from the authenticated addressed acknowledged PO, not request input.
- The ASN lifecycle is draft, submitted, in transit, arrived, or cancelled. Only internal warehouse authority records arrival.
- Receipt drafts are append-only snapshots. Posting is the only status command and requires a request-specific idempotency key; identical retries return the existing posted representation.
- Original receipt posting creates positive awaiting-inspection lots. Correction posting creates signed lot-adjustment history and cannot make effective received or lot quantity negative or exceed shipped quantity.

# Database migrations

- `20260715000000_phase_0_foundation` remains unchanged.
- `20260716000000_phase_1_identity_authorization` remains unchanged.
- `20260716010000_phase_2_projects_milestones` adds product categories, projects, project members, milestones, work packages, project-transition history, project/member/state enums, uniqueness and scope indexes, date/version checks, restrictive foreign keys, and database triggers rejecting project-transition update/delete.
- `20260716020000_phase_3a_item_master` adds item categories, units of measure, typed specification definitions and values, items, precision/version/type/reference checks, uniqueness/search indexes, restrictive foreign keys, typed-value validation triggers, and an item-delete prevention trigger.
- `20260718000000_phase_3b_bom_import` adds BOMs, revisions, lines, immutable transitions, stored-file/import/row metadata, outbox jobs, lifecycle/file/job enums, positive/version/checksum checks, restrictive and same-project-scope foreign keys, scope/revision/active-release uniqueness, draft-only/base-unit line and lifecycle guards, and the released-only official-line view.
- `20260718010000_phase_4a_purchase_requisitions` adds requisitions, immutable BOM-linked lines and transition history, lifecycle enum/timestamps/attribution, positive/snapshot/override checks, per-project numbering, restrictive foreign keys, indexes, valid-transition/requester/approver guards, and no-delete/immutable-history triggers.
- `20260719000000_phase_4b_purchase_orders_commitments` adds POs, retained revisions, immutable lines/allocations/transitions, supplier commitment revisions/lines, quantity/override/version checks, exact line-revision compound foreign keys, one-current-revision enforcement, deferred allocation-total validation, supplier-scope and lifecycle guards, and no-delete/append-only triggers.
- `20260720000000_phase_5a_document_storage` adds documents, private file-version metadata, associations, transition history, review/scan enums, size/checksum/type/version constraints, restrictive foreign keys, indexes, valid workflow/scan guards, approved metadata immutability, and no-delete/immutable-history triggers.
- `20260720010000_phase_5a_document_insert_guard` rejects direct creation of pre-approved, pre-scanned, or otherwise non-quarantined document versions.
- `20260720020000_phase_5b_asn_receiving` adds ASN/receipt/lot enums and tables, document association values, scope/quantity/version/idempotency constraints, restrictive foreign keys, indexes, workflow guards, and immutable-history triggers.
- `20260720030000_phase_5b_inventory_insert_guard` restricts inventory effects to posted receipt/correction transactions.
- `20260720040000_phase_5b_inventory_guard_fix` separates the table-specific inventory insert guards for PostgreSQL record-field safety.
- No production data migration/backfill is included. The migration is additive. Production down-migration is not authorized.

# Test status

- Unit coverage exhaustively checks every project-state source/target pair and the forbidden completed-to-active route.
- Integration coverage checks transition/audit atomicity and immutability, arbitrary-state-patch rejection, concurrent project edits, and Phase 2 seed idempotency.
- Authorization coverage checks Supplier A explicit access, Supplier B/nonexistent equivalence, supplier field filtering, read-only denial, and CSRF enforcement.
- Browser coverage creates, edits, and explicitly transitions a project through accessible controls.
- Phase 3A unit coverage exercises unit/attribute precision, definition shapes, typed/required values, duplicate values, and CSV escaping/formula neutralization.
- Phase 3A integration coverage exercises duplicate codes, active-reference rules, category immutability, full specification replacement, search, CSV limits/audits, optimistic concurrency, reasoned deactivation, inactive read-only behavior, unavailable delete routes, database delete prevention, transactional audit evidence, and seed idempotency.
- Phase 3A authorization coverage exercises internal read/write/export separation, supplier denial, read-only denial, CSRF on unsafe routes, safe item identifiers, and export audit scope.
- Phase 3A browser coverage creates reference masters and a typed item, edits and searches it, downloads filtered CSV, and deactivates it through accessible controls.
- Phase 3B unit coverage exercises every lifecycle edge, release rules, secure upload validation, CSV/XLSX templates, retained rows, invalid quantity/unit, ambiguity, duplicates, and non-evaluated formula content.
- Phase 3B integration coverage exercises duplicate revisions, released-only official lines, transactional audit/release, auto-supersede, the one-release constraint, concurrent same-version release, and private-object background parsing/checksum/row/audit/outbox completion.
- Phase 3B authorization coverage exercises unauthenticated denial, supplier real/nonexistent equivalence, internal unassigned real/nonexistent equivalence, allowed internal project scope, and pre-storage CSRF denial.
- Phase 3B browser coverage uploads an invalid file, displays its row error, uploads and confirms a corrected dry run, corrects a draft line, reviews, releases, and displays official-readiness and procurement-placeholder state.
- Phase 4A unit coverage exhausts the transition matrix and exact/under/over/already-covered/invalid quantity boundaries.
- Phase 4A integration coverage proves released-only creation, live coverage/outstanding calculation, authorized/unauthorized override behavior and audit evidence, requester/approver preservation, invalid transition rejection, rejection/cancellation coverage release, database immutability, and concurrent double-book prevention.
- Phase 4A authorization coverage proves authentication, supplier denial, real/nonexistent equivalence, unassigned internal scope, CSRF-before-write, and independent override permission behavior.
- Phase 4A browser coverage releases a BOM requirement, creates a requisition from displayed outstanding need, submits and approves it, and verifies attribution and status.
- Phase 4B unit coverage exhausts the PO transition matrix and approved/available/over-order quantity boundaries.
- Phase 4B integration coverage proves approved-source allocation, exact allocation totals, authorized/unauthorized override and audit evidence, concurrent double-order prevention, PO revision retention, send/acknowledge lifecycle, append-only original/latest commitment history, late exception projection, approved-requisition cancellation protection, and database immutability.
- Phase 4B authorization coverage proves Supplier A access, Supplier B/nonexistent equivalence across PO/commitment/acknowledgement and absent attachment surfaces, exact project assignment, CSRF-before-write, and server-side internal-commercial-field absence.
- Phase 4B browser coverage creates an approved source, internally creates/sends a PO, acknowledges as the addressed supplier, appends two commitment revisions, and verifies retained original/latest dates and hidden internal fields.
- Phase 5A unit coverage exercises extension/MIME/size/checksum validation, ZIP/executable/binary/magic rejection, UTF-8 detection, ClamAV fail-closed behavior, and exact upload/download URL expiry.
- Phase 5A integration coverage exercises private signed PUT, stored metadata/size/SHA-256 verification, review/approval, audited download signing, replacement approval/automatic supersede, approved metadata immutability, tampered checksum rejection, and transactional audit evidence.
- Phase 5A authorization coverage proves unauthenticated and CSRF denial, Supplier A own access, Supplier B/nonexistent equivalence, supplier approval preflight denial, owner filtering, and storage-key absence.
- Phase 5A browser coverage uploads through the document UI and proves locally unavailable scanning leaves content non-downloadable in `SCAN_FAILED` state.
- Phase 5B unit coverage exhausts the shipment transition matrix.
- Phase 5B integration coverage proves owned PO-line ASN creation, transition history, transactional/idempotent posting, one-lot effects, posted immutability, corrections, audit-failure rollback, and secure document association.
- Phase 5B authorization coverage proves Supplier A access, Supplier B/nonexistent equivalence, foreign-line rejection, CSRF-before-write, active assignment, and server-side actor/internal-field absence.
- Phase 5B browser coverage uses a touch-enabled tablet viewport for supplier ASN creation/transitions and warehouse arrival, traceability capture, draft/post, and awaiting-inspection lot display.
- Exact final formatting, lint, type-check, unit, integration, authorization, build, OpenAPI, and browser command results are reported in the implementation handoff; no unrun gate is represented as successful here.

# Known defects

- No code defect is known in the bounded Phase 5B implementation after the final verification handoff. Environment-dependent command failures are reported rather than masked here.

# Security, concurrency, and data integrity

- Controllers call application services; services call policies/domain logic and repositories; only repositories access Prisma.
- Every unsafe Phase 2 route requires the existing session-bound CSRF proof. DTO validation rejects unknown properties, including arbitrary project-state patches.
- Scoped project queries preserve inaccessible/nonexistent equivalence. Supplier A/B negative evidence is automated and supplier responses filter employee/history fields.
- Version predicates are evaluated in database updates. Stale project/category/member/milestone/work-package/transition commands return the safe concurrency response and do not write partial audit evidence.
- Project transitions and audit events are written in the same database transaction as business state. Database triggers prevent transition-history and audit-event mutation/deletion.
- Database and repository validation protect project/work-package date ordering, project child boundaries, same-project milestone links, unique codes, active category use, active member scope, and the last active project manager.
- Item-master policies require active internal membership plus `item.read`, `item.write`, or `item.export`; suppliers are denied before item data is disclosed. All unsafe routes are CSRF protected.
- Version predicates protect every item-master edit and item deactivation. Row locking and transaction-time reference counts prevent concurrent deactivation or structural edits from invalidating active references.
- Item-master mutations and export evidence are atomic with redacted audit events. The audit organization is the qualifying actor membership and does not imply catalog ownership.
- Application validation plus database decimals, checks, unique indexes, restrictive foreign keys, typed-value triggers, and the no-delete trigger protect code, precision, type, category, and retention invariants.
- CSV output is fixed-column, fully quoted, formula-prefix neutralized, separately permissioned, and bounded to 10,000 rows.
- BOM/import policies require active internal membership, a specific `bom.*` permission, and existing project scope. Supplier roles receive no BOM grants and resolved identifiers are re-scoped server-side.
- Upload validation, private opaque storage, SHA-256 revalidation, quarantine state, bounded parser resources, macro/external/embedded rejection, and formula flagging fail closed without evaluating spreadsheet content.
- Import enqueue and audit commit together. Worker row/file/outbox/audit completion commits together. Confirmation creates all draft lines and the source/checksum link in one transaction.
- Release and automatic supersede commit together under a BOM lock. A partial unique index enforces one active release, immutable transition triggers retain history, and non-draft line mutation is database-rejected.
- Requisition policies require active internal membership, an operation-specific permission, and project scope. Permission checks precede protected detail/command object disclosure; unsafe commands require CSRF.
- Requisition creation locks project and selected released BOM lines, recalculates active coverage transactionally, validates unit precision and strict over-need authorization, and atomically writes immutable lines plus audit evidence.
- Expected versions and row locks protect explicit lifecycle transitions. Requester/approved approver guards, immutable transition/line triggers, restrictive foreign keys, positive decimals, unique source line per requisition, and retained cancellation/rejection preserve attribution and quantity history.
- PO policies require operation-specific internal permission plus project scope, or supplier-specific permission plus exact addressed organization and active exact project membership. Supplier A/B and nonexistent equivalence is automated before object disclosure.
- Sorted approved-requisition-line locks, current non-cancelled revision coverage, decimal precision checks, immutable availability snapshots, and a deferred line/allocation total constraint prevent over-order and partial quantity effects. Separately authorized overrides retain reason/actor/audit evidence.
- Send, revise, cancel, and supplier acknowledgement use explicit expected-version commands. PO revision content, lines, allocations, transitions, commitment revisions/lines, and aggregate deletion are database-retained; compound foreign keys prevent cross-revision commitment substitution.
- Supplier representations are constructed from explicit allowlists and exclude internal price, terms, notes, requisition/allocation identity, employee/transition/audit data, storage keys, and unrelated suppliers. Phase 4B exposes no attachment route.
- Commitment append locks and versions the PO, scopes every line to the current acknowledged revision, and commits the immutable revision plus redacted audit evidence atomically. Original/latest and late-date projections are derived from retained history.
- Document policy composes operation permission, project scope, owner organization, association scope, CSRF, expected version, clean scan state, and workflow state. Permission preflight and repository owner filters preserve supplier/nonexistent equivalence.
- Signed PUT constraints, authoritative object re-read, exact metadata/size/SHA-256 comparison, detected type, and ClamAV scanning form independent gates. Any missing/failed gate leaves content non-downloadable.
- Completion and lifecycle commands lock and expected-version check document rows. Replacement approval supersedes the previous approval in the same transaction; database triggers prevent invalid transitions, direct pre-approved inserts, metadata overwrite, and history deletion.
- Document success audits contain identifiers and bounded metadata/checksum/status evidence, never file contents, object keys, presigned URLs, scanner raw output, or credentials.
- ASN policies require exact supplier organization, active project assignment, operation permission, current acknowledged PO revision, CSRF, expected version, and supplier-safe allowlists. Sorted PO-line locks and active ASN coverage prevent concurrent over-shipment.
- Receipt policies require internal operation permission and project scope. Sorted ASN-line locks, final effective-quantity validation, global idempotency-key uniqueness, and expected versions prevent duplicate or over-receipt effects.
- Receipt status, lots/adjustments, and audit evidence commit in one transaction. Forced audit failure rollback is automated. Database triggers reject posted mutation, invalid inventory insertion, history update/delete, and cross-object line substitution.
- Packing lists, certificates, and photographs remain private document objects. Supplier ASN associations require owner equality; supplier receipt association fails closed.

# Assumptions and limitations

- The product requirements do not define Phase 2 project/category field catalogs, milestone status, or work-package status. Phase 2 therefore implements only the conservative descriptive and planned-date fields needed by this request; later BOM/readiness state was not anticipated.
- `SYSTEM_ADMIN` and `MECO_MANAGEMENT` oversight follows the seeded role descriptions and remains permission-gated. Other internal roles require explicit project assignment.
- Product requirements did not define the Phase 3A item field catalog, code scope, specification types, role mapping, or decimal bounds. The implementation conservatively uses a global internal catalog, the documented minimal fields, typed `TEXT`/`NUMBER`/`BOOLEAN` definitions, explicit item permissions, and zero-to-six decimal precision. These choices are documented here and in `ITEM_MASTER_API.md`.
- A global catalog means any active internal organization holding an item permission sees the same records. Audit organization identifies the acting membership; it is not tenant ownership. A future organization-partitioning change requires an explicit migration and authorization design.
- The 10,000-row CSV ceiling is a bounded synchronous Phase 3A export decision, not a general reporting limit. Larger/asynchronous exports remain later work.
- Locale message catalogs are still deferred, but all machine enums remain stable and date rendering is timezone-configured. The screens currently use English copy.
- No staging/production deployment, migration rehearsal, or production data backfill is part of this task.
- Receiving inspection, quality disposition, NCR, material allocation, final readiness/dashboard, and reporting workflows are explicitly deferred. Supplier item/requisition access and item reactivation/revision workflows also remain deferred.
- Phase 4A requirements do not define requisition field catalogs, role mapping, approval separation-of-duties, or superseded-BOM semantic remapping. The implementation uses minimal title/notes fields, the documented conservative role mapping, permits an authorized requester to approve, and retains exact BOM-line identity rather than heuristically transferring coverage to a replacement revision.
- The custom XLSX reader intentionally supports ordinary worksheet/shared-string/inline-string cells needed for the fixed template. Unsupported or unsafe workbook constructs fail closed rather than being normalized.
- Import correction is performed by retaining the invalid dry run and uploading a corrected source file. Phase 3B does not mutate source rows in place.
- Phase 4B requirements do not define a PO number format, currency catalog, tax/freight model, acknowledgement separation of duties, or partial commitment policy. The implementation uses per-project integer PO numbers rendered with a `PO-` prefix, optional IDR-oriented internal unit prices without persisted currency/tax calculations, permits both seeded supplier roles to acknowledge/commit, and permits partial commitment revisions with per-line original/latest projection.
- BOM lines have no explicit required-date field. Phase 4B conservatively snapshots work-package planned start for scoped BOMs and project planned start for project-wide BOMs; later required-date changes do not rewrite historical allocations.
- A newly appended PO revision returns the aggregate to `DRAFT`; the supplier sees the PO again only after the new current revision is sent. Prior sent revisions remain internally retained but are not a separate supplier-visible historical document while a replacement draft is pending.
- Phase 4B has no PO attachment model or route. Consequently supplier attachment isolation is fail-closed (the route is absent); attachment authorization requires Phase 5 design rather than anticipating it here.
- Phase 5A does not provision or operate a ClamAV container. It provides and verifies the integration contract; deployments must supply a reachable scanner and production startup rejects disabled scanning. Local disabled scanning intentionally cannot produce approvable content.
- Upload completion currently treats object-read/type/checksum exceptions as a terminal scan failure. A future operator-authorized rescan/retry command may be useful for transient storage/scanner outages but is not added in this bounded phase.
- Phase 5B requirements do not define carrier catalogs, ASN numbering, receipt-edit commands, warehouse catalogs, or zero-quantity metadata-only corrections. The implementation uses supplier references, immutable draft snapshots, bounded free-text location/traceability fields, and non-zero signed correction deltas.
- Awaiting-inspection is the only Phase 5B inventory-lot status. No accept/reject quantity, inspection command, NCR, allocation, or availability decision is anticipated.

# Next recommended task

Stop here. Begin inspection, NCR, allocation, readiness, or other later-phase work only after explicit user approval and a new bounded implementation request.
