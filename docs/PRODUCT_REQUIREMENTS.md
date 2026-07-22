# Product requirements

## Purpose

MECO Flow is PT Meco Inoxprima's operational project-material-readiness and supplier-collaboration platform. Its primary MVP question is whether every critical material, with the correct specification and required documentation, will be available before fabrication begins.

## Users and outcomes

Internal users include management, project management, engineering, PPIC, purchasing, warehouse, QA/QC, production, finance-readonly, auditors, and administrators. Supplier users collaborate only within their organization. A future customer viewer role is reserved but has no MVP screens.

The MVP covers projects and milestones, work packages, item master, revision-controlled BOMs, requisitions and purchase orders, supplier commitments, shipments, receipts, inspection, documents, NCRs, inventory lots, allocations, deterministic readiness, notifications, reports, supplier scorecards, localization readiness, and immutable audit history.

## Foundational requirements

- PostgreSQL is authoritative; quantities and money use decimal types and timestamps use UTC.
- Business workflow transitions, readiness, quantity integrity, authorization, and field filtering are server decisions.
- Supplier access is organization scoped and must not reveal inaccessible records.
- Files use private S3-compatible storage with opaque keys and validated metadata.
- Business changes that trigger asynchronous work atomically write audit and outbox records.
- Readiness is deterministic, explainable, versioned, and never hides critical blockers behind a score.
- English and Indonesian are the initial locales; default timezone is `Asia/Jakarta`, currency is `IDR`, and units are metric.

## Phase 0 scope

Phase 0 delivers only repository and architecture foundations: monorepo tooling, web/API/worker skeletons, shared packages, local infrastructure, environment validation, health and logging, Prisma migration/seed framework, tests, CI, and documentation. It must not implement identity synchronization, organizations, roles, permissions, audit persistence, or operational business modules.

## Phase 3B BOM scope

Phase 3B delivers project/work-package BOM aggregates, positive item/unit/quantity lines, numbered revision review/release/supersede/cancel lifecycle, one active released revision per scope, source-linked CSV/XLSX dry-run imports, explicit confirmation, and revision comparison. Every input row remains visible with errors/warnings; ambiguous item matches and formulas fail explicitly and spreadsheet content is never executed. Only released lines become official requirements. Procurement coverage remains a labeled placeholder and Phase 3B creates no purchasing, shipment, receiving, allocation, final-readiness, or dashboard data.

## Phase 4A purchase requisition scope

Phase 4A delivers purchase requisitions sourced only from current released BOM lines, manual positive requisition quantities tied to those lines, live covered/outstanding need, separately authorized and audited over-need overrides, immutable requester/approver attribution, and explicit submit/approve/reject/cancel commands. Active requisitions reserve coverage and rejected/cancelled requisitions release it. Phase 4A creates no purchase order, supplier commitment, shipment, receipt, or later-phase operational record.

## Phase 4B purchase order and commitment scope

Phase 4B converts approved requisition quantities into supplier-addressed purchase-order lines with explicit requirement allocations. Current non-cancelled PO revisions consume approved quantity; over-ordering requires a separate permission, a bounded reason, immutable authorizer attribution, and audit evidence. Purchase orders use explicit draft, send, supplier-acknowledge, revise, and cancel commands, and every revision is retained.

Only the addressed active supplier organization with active project assignment can list or read a sent PO, acknowledge it, or append commitment revisions. Supplier commitment revisions are append-only, preserve original and latest dates per line, and identify latest dates after the BOM scope's required start date for internal exception lists. Supplier representations omit internal prices, commercial terms, buyer notes, requisition allocation identity, employee history, audits, and all unrelated supplier objects. Phase 4B creates no shipment, ASN, receipt, inspection, inventory, or attachment workflow.

## Phase 5A document-storage scope

Phase 5A delivers project-scoped document metadata and generic associations to existing project/work-package/BOM/requisition/purchase-order records, private S3-compatible storage, opaque keys, short-lived presigned upload/download URLs, independent size/type/SHA-256 verification, quarantine and malware-scan state, and explicit review/approval/rejection/supersede commands. ZIP files are prohibited. Approved versions are immutable and replacement approval retains and supersedes the prior version. Supplier access is limited to documents owned by its assigned organization. Phase 5A creates no shipment, ASN, receiving, inspection, NCR, inventory, allocation, or readiness record.

## Phase 5B ASN and receiving scope

Phase 5B delivers supplier-created ASNs against supplier-owned current acknowledged PO lines, explicit submit/dispatch/arrive/cancel shipment commands, secure packing-list/certificate associations, internal draft and posted goods receipts, traceability fields and photographs, separate correcting entries, and awaiting-inspection inventory lots. Posting is idempotent and transactionally couples the immutable receipt, inventory effects, and audit evidence. Phase 5B creates no inspection decision, NCR, material allocation, or readiness calculation.

## MVP exclusions

The MVP excludes accounting, valuation, HR/payroll, native mobile apps, customer portal, IoT, AI, CAD authoring, detailed production scheduling, maintenance, legally binding signatures, banking, full WMS, supplier payments, microservices, Kubernetes, event sourcing, blockchain, GraphQL, public registration, and social login.

## Phase sequence

1. Identity, organizations, authorization, and audit foundation.
2. Projects, milestones, and work packages.
3. Item master and BOM.
4. Procurement and supplier commitments.
5. Shipments, receiving, and documents.
6. Quality, NCR, and allocation.
7. Readiness and dashboards.
8. Notifications, reporting, and scorecards.
9. Hardening and pilot release.

Do not begin a later phase without explicit instruction.
