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

## Phase 6A receiving-inspection scope

Phase 6A delivers item-scoped configurable checklist, measurement, and certificate-review definitions; automatic or explicit inspection creation for inspection-required received material; a project work queue; server-authoritative results and evidence validation; and accepted, conditionally accepted, quarantined, or rejected lot dispositions. Finalization is expected-version and row-lock protected, can occur once, uses exact configured unit precision, and commits the disposition, accepted/rejected/quarantined lot quantity buckets, conditional-acceptance authority, and audit evidence in one transaction. Evidence reuses the private quarantined document workflow and an approved clean certificate is required before it can satisfy certificate review. Phase 6A creates no NCR response or material allocation.

## Phase 6B NCR and material-allocation scope

Phase 6B delivers NCR creation from a project, traceable inventory lot, or finalized non-accepted receiving inspection; explicit issue, supplier-response, close, and cancel commands; append-only supplier responses; and server-side supplier organization/field isolation. Internal disposition notes are absent from supplier representations unless an authorized internal command explicitly shares them.

Accepted inventory-lot quantity may be allocated only to matching current released BOM lines. Creation is lot-lock serialized and database guarded so accepted availability cannot be exceeded under concurrency. Quarantined/rejected material is ineligible. Conditionally accepted material additionally requires its retained inspection disposition, an independent allocation permission, a reason, authorizer attribution, and audit evidence. Allocation release restores availability; consumption retains permanently committed quantity and both transitions retain quantity history. Phase 6B creates no readiness projection or dashboard.

## Phase 7A material-requirement status scope

Phase 7A delivers a deterministic, versioned, internal read projection for every current released BOM line. It exposes required, active-requisitioned, commercially ordered, supplier-confirmed, dispatched, corrected-received, accepted, active-or-consumed allocated, and certificate-complete quantities; allocation shortage; operative commitment date; furthest evidenced stage; and one deterministic blocker reason.

Explicit PO allocations prevent double counting across split sourcing and pooled PO lines. Current sent/acknowledged PO revisions govern ordered and confirmed plans, while retained shipment, receipt, correction, inspection, and allocation history governs physical progress. Superseded and non-released BOM lines are absent. Phase 7A creates no dashboard, readiness/risk score, notification, report, worker job, or persisted readiness snapshot.

## Phase 7B readiness and dashboard scope

Phase 7B delivers the pure versioned criticality-weighted readiness calculator, documented RED/AMBER/GREEN/COMPLETE gates, deterministic reason codes and recommended actions, immutable reproducible project/work-package snapshots, event-primary and scheduled-safety recalculation, and internal management/project/material/history dashboards. Every score is inseparable from its blockers, reasons, actions, explanation, input hash, and model versions. Supplier access is absent. Phase 7B creates no notification, report, supplier scorecard, or Phase 8 behavior.

## Phase 8A notification scope

Phase 8A delivers transactionally enqueued in-app readiness alerts and daily reminders for active internal project members, per-user in-app/email preferences, optional bounded SMTP delivery, replay-safe recipient uniqueness, retry/dead-letter state, and worker queue observability. A project readiness snapshot and its identifier-only notification event commit atomically. Notification reads recheck current project assignment, and SMTP is disabled by default unless explicitly configured; local development uses Mailpit. Phase 8A creates no report, export, supplier scorecard, or Phase 8B behavior.

## Phase 8B reporting and supplier-scorecard scope

Phase 8B delivers the complete bounded MVP report catalog: Project Readiness, Material Exceptions, internal Supplier Performance, and the Own Supplier Scorecard. Reports use inclusive `Asia/Jakarta` periods of at most 366 days and 12 calendar-month trend buckets, capture one UTC generation timestamp, enforce existing project/source permissions, and repository-scope every row. Supplier organization is server-derived for supplier requests.

Supplier KPIs are exact quantity- or count-based required-date delivery, original-commitment on-time, latest-commitment on-time, commitment revision, first-pass acceptance, usable acceptance, and NCR response rates. Original and latest commitments remain separate; a zero denominator is `null`, and no composite supplier grade is created. Full definitions are in `REPORTS_SCORECARDS_API.md`.

CSV and macro-free XLSX exports include report identity, applied filters, and UTC generation timestamp; fail rather than truncate above 10,000 rows; neutralize formula-triggering text; and write immutable export audit evidence. Phase 8B creates no Phase 9 hardening, deployment, or performance-tuning behavior.

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
