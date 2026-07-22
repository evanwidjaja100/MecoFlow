# Test strategy

## Layers

- Unit tests cover pure configuration validation, policies, calculations, workflows, normalization, validation, sanitization and idempotency.
- Integration tests use isolated disposable PostgreSQL/Redis/object-storage dependencies for repositories, constraints, transactions, audit/outbox effects and operational workflows.
- Authorization tests exercise every protected command and supplier object with negative identifier manipulation.
- Playwright tests use accessible roles/labels for critical browser workflows and include accessibility smoke coverage without arbitrary sleeps.

Tests are deterministic, independent of order, use fictional fixtures, and clean up or isolate their state. A failing test is not weakened to obtain green status. Obsolete expectations require a documented behavior decision first.

## Phase 0 gates

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, Prisma migration/seed, and the Playwright landing-page smoke test form the foundation. `pnpm verify` is the shared local/CI primary quality chain. CI uses frozen installation, service containers, migration validation, checked-in OpenAPI drift detection, production builds, browser smoke, moderate-or-higher dependency audit, pull-request dependency review and container build checks.

## Phase 1 gates

`pnpm test:authorization` runs policy and live-PostgreSQL authorization tests, including inactive profile/membership denial, supplier administration denial, read-only write denial, safe identifier behavior, role-change atomicity, and database-enforced audit immutability. `pnpm test:e2e` runs a deterministic OIDC Authorization Code/PKCE provider and covers login, access denied, internal navigation, supplier navigation, and absence of browser local-storage tokens. The full gate remains `pnpm verify`, followed by `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check`.

Environment-blocked commands are reported with exact cause and residual risk; no command is reported successful unless it completed successfully.

## Phase 2 gates

The full existing gate remains mandatory. Unit tests exhaustively compare every source/target project-state pair with the accepted transition graph, including the forbidden completed-to-active path. Integration tests cover transactional transition/audit evidence, database immutability, arbitrary-state-patch rejection, category/project/child persistence, seed idempotency, and two simultaneous project edits using one expected version (exactly one succeeds). Authorization tests add Supplier A/B project-object isolation, safe nonexistent equivalence, supplier field filtering, read-only denial, and CSRF denial. Playwright creates, edits, and explicitly transitions a project through accessible controls while preserving URL-backed project filters, sorting, and pagination.

## Phase 3A gates

The full existing gate remains mandatory. Unit tests cover unit/attribute decimal precision, definition shapes, required and typed specification values, numeric bounds, duplicate values, and CSV quoting/formula sanitization. Integration tests cover global duplicate category/unit/item codes, per-category attribute-code uniqueness, active-reference and required-value rules, category immutability on item edits, optimistic concurrency, deactivation/read-only behavior, absence of a delete route, database-enforced item-delete rejection, filtered case-insensitive search, the 10,000-row CSV limit, transactional redacted audits, and deterministic Phase 3A seed idempotency.

Authorization tests cover permission-specific read/write/export access, supplier denial, inactive/read-only principal denial, CSRF on every write path, safe item identifiers, and export audit evidence. Playwright creates supporting master data and a typed item through accessible controls, edits and searches it through URL-backed query state, downloads the filtered CSV, and deactivates the item without exposing a delete control. The final gate is `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. Exact command results belong in the implementation handoff; documentation does not represent an unrun command as successful.

## Phase 3B gates

Unit tests cover the complete BOM lifecycle matrix, release preconditions, upload name/type/magic/size checks, fixed CSV/XLSX templates, retained duplicates/blank rows, invalid quantity/unit, ambiguous item matching, and non-evaluated CSV/XLSX formulas. Integration tests cover revision-number uniqueness, draft-only line mutation, immutable history, released-only official lines, same-transaction release/audit, automatic supersede, one active release, and concurrent same-version release. Worker integration verifies private-object retrieval, checksum, row persistence, file state, outbox state, and audit evidence.

Authorization tests cover authentication, internal project scope, supplier real/nonexistent equivalence, unassigned internal real/nonexistent equivalence, and CSRF before upload storage. Playwright uploads an invalid import, displays its row error, uploads a corrected import, confirms the draft, corrects a line, reviews, releases, and observes released-only readiness plus zero-valued procurement placeholders. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration/seed.

## Phase 4A gates

Unit tests exhaust the requisition transition matrix and cover exact-need, under-need, over-need, already-covered, and invalid quantity boundaries. Integration tests create from a released BOM line, prove active coverage/outstanding calculations, authorized and unauthorized over-need behavior, dedicated audit evidence, requester/approver preservation, invalid transition rejection, coverage release on rejection/cancellation, database immutability, and two concurrent creates that cannot both reserve the same outstanding need.

Authorization tests cover authentication, supplier real/nonexistent equivalence, unassigned internal real/nonexistent equivalence, CSRF before creation, and the independent internal override permission. Playwright releases a BOM requirement, creates the requisition from displayed outstanding need, submits it, approves it, and verifies status and attribution. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation.

## Phase 4B gates

Unit tests exhaust the PO lifecycle matrix and cover exact-approved, partially available, fully consumed, over-order, and invalid quantity boundaries. Integration tests cover approved-source enforcement, line/allocation equality, separately authorized reasoned overrides, concurrent double-order prevention, PO revision retention, send/acknowledge/cancel lifecycle, approved-requisition cancellation protection, original/latest commitment dates, late-date exception projection, append-only database guards, and transactional audit evidence.

Authorization tests cover Supplier A list/detail access, Supplier B/nonexistent equivalence for PO detail, acknowledgement, commitments and absent attachment routes, active project assignment, CSRF-before-write, and server-side absence of internal prices, terms, notes, requisition allocation identity, and employee/audit fields. Playwright creates an approved source, creates and internally sends a PO, signs in as the addressed supplier, acknowledges it, appends two commitment revisions, and verifies original/latest dates and internal-field absence. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. Shipment, ASN, receiving, inspection, and inventory tests remain Phase 5 or later.

## Phase 5A gates

Unit tests cover allowlisted extension/MIME/size/checksum handling, ZIP/executable/binary/magic rejection, UTF-8 detection, and exact presigned URL expiry. Integration tests use private MinIO and PostgreSQL to exercise a signed PUT, independent object/checksum verification, clean review/approval, audited download signing, replacement approval/automatic supersede, approved metadata immutability, failed checksum, rejection, and concurrent expected-version behavior.

Authorization tests cover unauthenticated and CSRF denial, Supplier A own access, Supplier B/nonexistent equivalence, server-side storage-key absence, supplier approval denial before identifier disclosure, project scope, and own-organization filtering. Playwright uploads a file through the document component and confirms scanner-unavailable content fails closed in the security table. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed validation. ASN, receiving, inspection, NCR, allocation, and readiness remain later work.

## Phase 5B gates

Unit tests exhaust the ASN transition matrix. Integration tests cover supplier-owned current PO-line scope, shipped and received quantity bounds, transition/audit history, idempotent posting, one-lot-per-line creation, posted immutability, separate corrections and adjustments, database guards, and forced audit failure rollback of receipt plus lot effects. Document-association tests cover supplier ASN attachment acceptance, supplier receipt denial, and internal receipt photograph association.

Authorization tests cover Supplier A creation/read/commands, Supplier B/nonexistent equivalence for PO and ASN targets, foreign PO-line rejection, CSRF-before-write, active exact project assignment, and supplier field allowlisting. Playwright uses a touch-enabled 1024×768 context to create/submit/dispatch an ASN, record arrival, enter traceability data, create/post a draft receipt, and observe an awaiting-inspection lot. The cumulative gate remains `pnpm verify`, `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check` after migration and seed. Inspection, NCR, allocation, and readiness remain deferred.
