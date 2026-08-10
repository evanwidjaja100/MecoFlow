# Domain model

## Aggregate boundaries

Planned aggregate roots are Organization, UserProfile, Project, Item, BOM, PurchaseRequisition, PurchaseOrder, AdvanceShipmentNotice, GoodsReceipt, ReceivingInspection, InventoryLot, NCR, Document, and ReadinessSnapshot. Important editable roots use UUID identifiers, UTC timestamps, and integer `version` fields. Operational history is corrected, cancelled, superseded, or deactivated rather than hard-deleted.

## Material lifecycle

```text
Project/work package -> released BOM requirement -> requisition -> PO allocation -> supplier commitment
-> ASN/shipment -> posted receipt -> inspection -> traceable inventory lot -> material allocation -> readiness
```

Only released, active BOM requirements affect official readiness. PO lines may supply several BOM lines through explicit allocation. Supplier commitments are append-only revisions. Posted receipts use traceable corrections. Accepted or explicitly conditionally accepted lots alone may be allocated, and allocation must be concurrency safe.

## Quantity invariants

Quantities are positive decimals. Received quantity cannot exceed valid ordered quantity without an authorized recorded override. Accepted plus rejected cannot exceed received. Allocated cannot exceed accepted available quantity. Availability never becomes negative. Idempotency and uniqueness prevent duplicate receipt, commitment, and allocation effects.

## Readiness model

Every released requirement projects ordered, confirmed, shipped, received, accepted, allocated, document-complete and shortage quantities plus dates, stage, risk and blocker explanations. Stage scores are criticality weighted (`CRITICAL=8`, `HIGH=4`, `NORMAL=2`, `LOW=1`). RED/AMBER/GREEN/COMPLETE gates override aggregate percentages when critical conditions require it. Calculations are pure, versioned, deterministic, independently tested, and retain explanations and recommended actions.

Phase 7A implements only the prerequisite per-requirement status projection, versioned as `material-requirement-status-v1`. It adds active requisition quantity and uses certificate-complete as the implemented document-complete definition. Scores, weights, risk colors, recommendations, persisted snapshots, and aggregate readiness remain unimplemented.

Phase 7B implements `ReadinessSnapshot` as immutable project aggregate history with project or work-package scope, batch identity, explicit calculation date, material/calculator/rule versions, input hash, minimized reproducible inputs, weighted score, overriding status, counts, blockers, reasons, actions, and line explanations. `readiness-calculator-v1` uses stage scores and criticality weights `8/4/2/1`; `readiness-rules-v1` applies documented critical gates before score bands. Full rules are in `READINESS_API.md`.

## Phase 8A notification scope

`NotificationPreference` is a versioned per-user/per-type choice whose defaults are in-app enabled and email disabled. `Notification` is a retained per-user projection of one source outbox event and project; `(sourceOutboxEventId, userId)` is unique. In-app visibility and email creation are decided from the preference snapshot when the event is processed.

`NotificationEmailDelivery` retains a unique notification/message identity and bounded `PENDING`, `PROCESSING`, `SENT`, `SKIPPED`, or `DEAD_LETTER` lifecycle. A stale `PROCESSING` delivery is not automatically resent because SMTP cannot prove whether the remote server accepted it; it enters dead letter to prevent duplicates and permit controlled recovery. Daily reminders are derived only from the existing once-per-date changed scheduled project readiness snapshot.

## Phase 8B report and scorecard scope

Reports and supplier scorecards are read models, not new aggregates. They read retained readiness snapshots and authoritative PO, commitment, ASN, inspection, and NCR history. `supplier-scorecard-calculator-v1` produces separate exact required-date, original-commitment, latest-commitment, commitment-revision, first-pass-acceptance, usable-acceptance, and NCR-response rates plus monthly trends.

Current acknowledged lines represent outstanding obligations. Noncurrent lines contribute only with retained arrived history. Zero-denominator rates are null and no composite grade is persisted. Report generation creates only immutable audit evidence for successful exports; no report row, score, workbook, or generated file is persisted.

## Phase 0 database scope

Phase 0 intentionally creates only `SystemMetadata`, a technical table used to prove migration, connectivity and deterministic seed mechanics. Business entities begin in their designated phases; this avoids creating an unreviewed partial operational schema.

## Phase 1 identity and authorization scope

`UserProfile` mirrors a Keycloak issuer/subject identity without storing passwords. `Organization` and `Membership` establish active internal or supplier scope. Seeded `Role`, `Permission`, `RolePermission`, and `MembershipRole` records provide grants; scope remains a separate policy decision. Opaque `Session` and short-lived `OidcAuthTransaction` records support authentication. `AuditEvent` is append-only and transactionally records membership and role changes. No project aggregate or operational entity is introduced in Phase 1.

## Phase 2 project scope

`Project` is the Phase 2 aggregate root. It belongs to one active internal organization and one product category, owns project-member assignments, milestones, work packages, and immutable transition history, and carries an integer version. Project, category, member, milestone, and work-package edits use optimistic versions. Planned and child dates are stored as PostgreSQL dates; timestamps remain UTC.

Project state is changed only by an explicit transition operation: `DRAFT` to `PLANNED`/`CANCELLED`; `PLANNED` to `ACTIVE`/`ON_HOLD`/`CANCELLED`; `ACTIVE` to `ON_HOLD`/`COMPLETED`/`CANCELLED`; and `ON_HOLD` to `ACTIVE`/`CANCELLED`. `COMPLETED` and `CANCELLED` are terminal and read-only in Phase 2. Each transition stores actor, UTC timestamp, source, target, and reason and is immutable at the database layer.

An active `ProjectMember` links a project to an active organization membership. Internal members must belong to the owning organization. Supplier membership is an explicit read-sharing boundary; assignment never grants supplier write permission. A project always retains at least one active project manager. Milestones fall within project dates. Work-package dates fall within project dates and optional milestone links cannot cross project boundaries.

## Phase 3A item-master scope

`Item` is the Phase 3A aggregate root. The item master is a single global internal catalog shared by active internal organizations rather than partitioned by organization. `ItemCategory`, `UnitOfMeasure`, `SpecificationAttributeDefinition`, and `Item` are versioned. Item-category, unit, and item codes are normalized to uppercase and globally unique; an attribute code is unique within its category. Deactivation retains every record, so a code remains reserved.

An item belongs to exactly one item category for its lifetime and uses one active base unit of measure. Its category association cannot be changed after creation. Categories define ordered `TEXT`, `NUMBER`, or `BOOLEAN` specification attributes. Text and boolean attributes cannot carry a unit or decimal precision. Numeric attributes have precision from zero through six, may reference an active unit, and cannot be more precise than that unit. Item values are stored in typed columns and must match an active definition in the item's category, contain no duplicate attribute, satisfy every active required definition, and respect text and numeric bounds.

Active item and attribute references prevent category or unit deactivation. A used attribute's data type, unit, and precision cannot change; making a definition required is rejected while an active item lacks its value. Items can only move from active to inactive through the explicit versioned deactivation command with a reason. Inactive items are read-only, no normal delete route exists, restrictive foreign keys retain their values, and a PostgreSQL trigger rejects item deletion.

Phase 3A creates no BOM, item revision, import, or procurement aggregate and emits no outbox record because it starts no asynchronous work.

## Phase 3B BOM and import scope

`BOM` is the aggregate root for one project-wide or work-package-specific material scope. A partial project-scope uniqueness constraint handles the nullable work-package key. Its numbered `BomRevision` children own positive decimal `BomLine` requirements referencing one active item and that item's active base unit. Revision status is command-only: draft revisions enter review, reviewed revisions release, released revisions supersede, and draft/reviewed revisions may cancel. Transition rows are immutable.

Release serializes on the BOM, supersedes the current release, releases the target, increments aggregate versions, and writes transition/audit evidence in one transaction. A partial unique index permits one released revision per scope even if application concurrency fails. Non-draft line mutation is rejected by a database trigger. The `official_bom_lines` view contains only current released lines; superseded/cancelled/draft/review lines do not affect official readiness. Phase 3B has no allocation or purchasing entity, so superseded lines have no operational allocation surface.

`StoredFile`, `BomImport`, and `BomImportRow` retain private upload metadata, checksum, job state, and every source row's normalized values/errors/warnings. Confirmation of an error-free ready dry run creates exactly one draft revision, links the source file/checksum/import, and marks the import confirmed transactionally. `OutboxEvent` carries identifier-only asynchronous work with attempts, backoff, locking, and terminal failure state.

## Phase 4A purchase requisition scope

`PurchaseRequisition` is a project-scoped aggregate with a per-project number, immutable requester, optional immutable approver, version, explicit timestamps, immutable `PurchaseRequisitionLine` children, and immutable transition history. Every line references exactly one current released `BomLine`, uses that line's unit precision, and snapshots required, covered, and outstanding quantities at creation. The source BOM line remains the retained trace even if a later BOM revision supersedes it.

`DRAFT`, `SUBMITTED`, and `APPROVED` lines reserve coverage. `REJECTED` and `CANCELLED` lines do not. The lifecycle is `DRAFT` to `SUBMITTED`/`CANCELLED`; `SUBMITTED` to `APPROVED`/`REJECTED`/`CANCELLED`; and `APPROVED` to `CANCELLED`. Rejection and cancellation retain all history while releasing coverage. Concurrent creation serializes on selected BOM-line rows before coverage is recalculated. A strict over-need quantity requires the separate override permission, reason, authorizer attribution, and dedicated audit evidence.

## Phase 4B purchase order and supplier commitment scope

`PurchaseOrder` is a project- and supplier-organization-scoped aggregate with a per-project number, explicit `DRAFT`, `SENT`, `ACKNOWLEDGED`, and `CANCELLED` lifecycle, optimistic version, current revision number, creator attribution, and immutable transition history. Each retained `PurchaseOrderRevision` snapshots its supplier message and internal commercial fields and owns immutable `PurchaseOrderLine` records. Every ordered line has one item/unit and its ordered quantity must equal the sum of explicit `PurchaseOrderAllocation` children tied to approved `PurchaseRequisitionLine` records.

Only current revisions of non-cancelled POs consume approved quantity. Allocation creation locks sorted approved requisition lines and snapshots approved, already ordered, available, and BOM-required date values. Quantity beyond available approval requires `purchase-order.override`, a reason, an authorizer, and dedicated audit evidence. Revision replaces the current allocation set for coverage purposes but retains every prior revision and its allocation history. Approved requisitions allocated to an active current PO cannot be cancelled through the application command.

A sent current revision may be acknowledged only by the addressed supplier organization with active project assignment. An acknowledged revision accepts append-only numbered `SupplierCommitmentRevision` records; their lines reference only PO lines in that revision. Original commitment date is the first recorded date for a PO line and latest is the most recently appended date. The earliest allocation-required date on a PO line is its required date; a latest commitment after it is an internal exception. Commitment revision/line, PO line/allocation/transition, and prior revision history cannot be updated or deleted.

## Phase 5A document scope

`Document` is a project- and owner-organization-scoped logical record with title, category, description, optimistic version, validated generic associations to existing `PROJECT`, `WORK_PACKAGE`, `BOM`, `PURCHASE_REQUISITION`, and `PURCHASE_ORDER` objects, and immutable numbered `DocumentVersion` children. Supplier-owned documents may associate only with the shared project and purchase orders addressed to that supplier.

Each version retains opaque storage identity, safe original name, extension, declared and detected MIME, byte size, SHA-256, upload expiry, uploader, quarantine/scan state, reviewer attribution, and immutable transition history. New versions begin quarantined. Clean verified content may move from draft to review and then approval or rejection. Superseding appends a version; approving that replacement atomically marks the previous approval superseded. Approved bytes and metadata are never overwritten.

## Phase 5B ASN and receiving scope

`AdvanceShipmentNotice` belongs to one project, addressed supplier organization, acknowledged purchase order, and exact current PO revision. Its positive lines reference only PO lines in that revision and active non-cancelled ASN quantity cannot exceed ordered quantity. The retained lifecycle is `DRAFT`, `SUBMITTED`, `IN_TRANSIT`, `ARRIVED`, or `CANCELLED`; transitions and lines are immutable.

`GoodsReceipt` is either an original `RECEIPT` or a `CORRECTION`. Draft originals contain positive ASN-line quantities and traceability metadata. Posting is a one-way idempotent command. It creates positive `AWAITING_INSPECTION` lots in the same transaction. A correction references one posted original and uses non-zero signed line deltas; posting appends `InventoryLotAdjustment` records without changing the original receipt or lot. Effective received/lot quantity cannot be negative or exceed shipped quantity. Inspection disposition and allocation do not exist in Phase 5B.

## Phase 6A receiving-inspection scope

`InspectionCheckDefinition` is item-scoped configuration. Active definitions make that item inspection-required and are snapshotted as immutable `ReceivingInspectionCheck` children when the one-per-lot `ReceivingInspection` is created. Definition changes affect future inspections only. Checks are required or optional checklist, configured-precision measurement, or certificate-review shapes. Certificate completion references an approved clean `Document` associated with that inspection.

An inspection is `OPEN` or `FINALIZED` and carries an optimistic version. Finalization records one of `ACCEPTED`, `CONDITIONALLY_ACCEPTED`, `QUARANTINED`, or `REJECTED`, immutable inspector/conditional-authorizer attribution, effective received quantity, accepted/rejected quantities, and the derived quarantined remainder. The matching inventory lot receives the same disposition and quantity buckets in the same transaction. Accepted plus rejected cannot exceed effective received quantity, and corrections cannot alter a dispositioned lot. NCR and allocation relationships remain absent in Phase 6A.

## Phase 6B NCR and material-allocation scope

`Ncr` is a project and supplier scoped aggregate with one source (`PROJECT`, `INVENTORY_LOT`, or `RECEIVING_INSPECTION`), per-project numbering, an optimistic version, retained lifecycle actors/timestamps, immutable transitions, and append-only numbered `NcrSupplierResponse` revisions. Its lifecycle is draft, issued, supplier responded, closed, or cancelled. Internal disposition notes and the share decision remain internal fields; a supplier read model conditionally maps the text to a separate shared field.

`MaterialAllocation` links one accepted inventory lot to one matching current released BOM line with a positive precision-valid quantity. It is `ALLOCATED`, `RELEASED`, or `CONSUMED`; release returns quantity to lot availability while consumption remains committed. Core identity/quantity, conditional-use reason/authorizer, creator, and transition quantity snapshots are immutable. Lot availability is accepted quantity minus all allocated and consumed history and can never be negative. Rejected, quarantined, and awaiting-inspection material contributes zero allocatable quantity.

## Phase 7A material-requirement status scope

The Phase 7A projection is not a new aggregate. It is a pure live read over released `BomLine` roots and retained trace records. Active requisition lines aggregate by exact BOM-line identity. Current sent/acknowledged PO revisions aggregate through explicit requirement allocations. Physical ASN, corrected lot, inspection, and material-allocation history follows retained identities even after a PO revision changes.

When a PO line supplies several requirements, all of its allocation capacities are grouped by BOM line and consumed in earliest-required-date order with UUID tie-breaking. Receipt lots use creation/UUID order and partition accepted, rejected, quarantined, and unresolved quantities without exceeding their effective corrected receipt. Required accepted certificate checks define certificate completeness; no required certificate check is vacuously complete for accepted quantity. Full definitions are in `MATERIAL_REQUIREMENT_STATUS_API.md`.
