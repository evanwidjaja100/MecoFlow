# UI/UX specification

MECO Flow uses a professional, information-dense industrial interface with configurable brand tokens. Internal desktop/tablet layouts use clear navigation, headings, breadcrumbs, environment indication outside production, explicit primary actions and visible blockers. Supplier layouts are mobile responsive and clearly identify the supplier organization.

Status is always text plus color. Controls are keyboard accessible with visible focus, semantic headings, labeled inputs, accessible validation/error summaries, named icon actions, useful loading/empty/error states, and sufficient contrast. Important lists use URL-backed filters, pagination and sorting. Warehouse and QA workflows prioritize tablet ergonomics.

Presentation is localization-ready for `en` and `id`; machine enums and API error codes remain untranslated. Dates/numbers/currency use locale formatting and configured `Asia/Jakarta` display timezone/`IDR` defaults. The current internal shell includes project and item-master workspaces; supplier navigation remains deliberately separate.

## Phase 3A item interfaces

The internal item directory keeps search, category, unit, active status, sort direction, page, and page size in the URL. It exposes sortable code/name/updated columns, bounded pagination, clear empty state, item-detail links, and a filtered CSV action only to principals with `item.export`. Status is visible as text and color. Item-master administration for categories, units, and specification definitions is shown only to principals with `item.write`.

The Phase 8B internal reports workspace keeps the reporting period and applicable scope filters in the URL, labels all three internal reports, and exposes CSV/XLSX controls only with export permission. Supplier scorecards present each KPI with numerator, denominator, unit, and null empty state. Original and latest commitment performance are adjacent and never merged into a composite grade.

Trend charts use text labels plus an accessible data table, do not encode meaning by color alone, and render null buckets as absent data. The supplier portal exposes only the own-organization scorecard; it contains no supplier selector or cross-supplier comparison.

The item detail identifies the immutable category, base unit, versioned edit state, and ordered structured specifications with units and definition status. Editors render text, numeric, and boolean controls from active definitions and use the configured decimal step. Inactive items retain a readable detail and specifications but hide normal edit controls. Deactivation is a separate reasoned action, has no delete equivalent, and explains the historical-retention effect.

## Phase 3B BOM interfaces

Each internal project overview links permitted users to its BOM workspace. The workspace separates import history from the revision register, offers project/work-package scope selection and CSV/XLSX templates, and displays file/checksum/status/counts. Queued/parsing dry runs refresh without arbitrary delays. Results retain every row and show machine error/warning codes with explanations. Invalid results direct users to correct and re-upload; the invalid result remains visible. A literal checkbox and title are required before draft creation.

Revision detail presents source integrity, status plus text/color, lifecycle history, released-only official-readiness inclusion, and explicit `NOT_STARTED` procurement placeholders. Draft line correction, review, release, supersede, and cancel controls are permission/state sensitive but remain server-authorized. Revision comparison shows added, removed, changed, and unchanged counts and before/after line values.

## Phase 4A purchase requisition interfaces

The project overview links authorized users to a purchase-requisition workspace. Its requirement table shows released BOM source, required, active covered, and outstanding quantities and lets writers select manual lines and enter quantities. Override-reason inputs appear only to principals with the separate override permission, while the API remains authoritative. The register shows requisition number, title, text-plus-color status, immutable requester, approver, and line count.

Requisition detail shows requester/approver attribution, immutable released-BOM trace, requested quantity, creation snapshots, live covered/outstanding quantities, any override authorizer/reason, and transition history. Submit, approve, reject, and cancel controls are permission/status sensitive and include a required reason and server-checked expected version.

## Phase 4B purchase-order and supplier interfaces

The internal project PO workspace shows approved requisition quantity, already ordered and available quantity, BOM-required date, assigned supplier selection, internal commercial inputs, and separately permissioned over-order reasons. The register identifies supplier, text-plus-color lifecycle status, current revision, and retained revision count. Detail shows explicit send/cancel commands, immutable requirement allocations, internal commercial fields, PO/commitment revision history, original/latest dates, and late status. An internal exception table lists only latest commitments after required dates.

The separate supplier portal lists only sent/acknowledged POs addressed to the signed-in supplier organization. Supplier detail contains supplier-safe project, item, quantity, required-date, supplier-message, acknowledgement, and commitment fields; internal price, terms, notes, requisition allocation identity, employee history, and audit data have no rendered or API representation. Acknowledgement is explicit and reasoned. Commitment submission appends a numbered revision and displays retained original and latest dates without offering edit/delete controls.

## Phase 5B ASN and receiving interfaces

Acknowledged supplier PO detail provides a labeled ASN form using only displayed current PO lines. The supplier ASN workspace shows text-plus-color lifecycle state, package references, submit/dispatch/cancel commands, retained history, and private packing-list/certificate upload controls. It never renders internal receipt, lot, commercial, employee, or audit data.

The internal project receiving workspace is optimized for touch-enabled tablets: wider content, 48–52 px controls, large primary actions, card-based line capture, coarse-pointer spacing, and a single-column fallback. Warehouse users record arrival, received quantity, heat, batch, manufacturer, package reference, and location before saving a draft. Posting is a distinct immutable action. Receipt detail shows traceable awaiting-inspection lots, secure camera/photo input, and separate correction creation without edit/delete controls on posted history.

## Phase 6A receiving-inspection interfaces

The project inspection workspace presents the open work queue before finalized history and exposes item-scoped check configuration only to authorized configurators. An awaiting lot that predates configuration offers an explicit inspection-creation action. Inspection detail renders the snapshotted checklist, measurement bounds/precision, and certificate decision with approved evidence; result controls disappear after finalization.

Disposition controls always show effective received quantity and accepted/rejected inputs, derive the quarantined remainder server-side, and require a reason. Conditional acceptance is shown only to principals holding its independent permission. Finalized detail remains read-only and displays received, accepted, rejected, and quarantined buckets with text-plus-color disposition state. Evidence upload continues through the existing private document workflow; linking a file does not imply approval or inspection conformity.

## Phase 6B NCR and allocation interfaces

A finalized non-accepted inspection exposes a labeled NCR-draft form. Supplier-visible description and internal disposition notes are separate inputs, and the internal-note sharing checkbox is unselected by default. The project quality workspace lists NCR number, supplier, source, lifecycle state, and response count. NCR detail displays internal disposition, issue/cancel/close commands, append-only supplier responses, and retained lifecycle history; closure requires an explicit sharing decision.

The supplier navigation has a separate NCR register/detail. It shows only project, NCR, traceable supplier-safe source information, description, response history, and any explicitly shared disposition text. It never renders internal note/control labels, internal actors, transitions, or audits. Open NCRs provide labeled message/root-cause/corrective-action inputs and append rather than edit a response revision.

The allocation workspace offers only accepted/conditionally accepted lots with server-calculated availability and current released BOM lines. It explains server matching and conditional authorization, shows retained condition/reason authority, and exposes release/consume commands only while active. Completed cards remain visible with status, exact quantity, and quantity-snapshot transition trace.

## Phase 8A notification interfaces

The internal shell links to an own-user notification inbox. Unread items are visually distinct without relying on color, include readable type/title/message/time, link to the authorized readiness view, and expose an explicit mark-read action. The empty state is informative.

Preferences group readiness status updates and daily reminders, with independent labeled in-app and email checkboxes and a clear save action. The server remains authoritative for recipient scope, preference versions, and SMTP availability; the UI does not display delivery credentials or operator dead-letter controls.
