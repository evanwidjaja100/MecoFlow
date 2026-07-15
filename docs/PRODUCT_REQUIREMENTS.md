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
