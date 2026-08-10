# Reports and supplier scorecards API

## Scope

Phase 8B defines the complete bounded MVP report catalog:

- Project Readiness Report: latest authorized project snapshot in the selected period.
- Material Exceptions Report: current released material lines with shortage, commitment, inspection, certificate, NCR, or allocation exceptions.
- Supplier Performance Report: authorized internal supplier KPI summaries and monthly trends.
- Own Supplier Scorecard: the authenticated supplier organization's aggregate KPI summary and trends.

No composite supplier grade or opaque weighted score is produced. Additional reports are later work.

## Period and filter rules

Every request requires inclusive `from` and `to` dates interpreted in `Asia/Jakarta`. A period contains at most 366 days and at most 12 calendar-month buckets. `generatedAt` is captured once in UTC. Empty KPI denominators return `null` and display as `No eligible data`.

Internal filters include optional project, readiness status, blocker type, item text, item category, work package, and supplier organization as applicable. Supplier requests may filter by an actively assigned project but cannot supply a supplier organization identifier; organization scope is derived from the authenticated membership.

## Routes

- `GET /api/v1/reports/project-readiness`
- `GET /api/v1/reports/material-exceptions`
- `GET /api/v1/reports/supplier-performance`
- `GET /api/v1/supplier/scorecard`
- `GET /api/v1/reports/{project-readiness|material-exceptions|supplier-performance}/export/{csv|xlsx}`
- `GET /api/v1/supplier/scorecard/export/{csv|xlsx}`

Internal reports require `report.read`, existing project/readiness/BOM scope, and source-specific permissions. Internal exports require `report.export`. Internal supplier performance additionally requires `scorecard.read` plus purchase-order, shipment, inspection, and NCR read grants. Supplier scorecards require `supplier.scorecard.read` or `supplier.scorecard.export`, exact active supplier organization membership, and active project assignment. Repository queries apply scope before returning rows.

## Supplier KPI model

The model version is `supplier-scorecard-calculator-v1`. Quantities use exact six-decimal arithmetic. Percentages are numerator divided by denominator times 100, rounded half-up to two decimals.

- Required-date delivery rate: quantity on arrived ASNs on or before the PO-line allocation required date divided by eligible ordered quantity due within the period and by the as-of date.
- Original-commitment on-time rate: quantity on arrived ASNs on or before the first retained supplier commitment date divided by eligible ordered quantity due within the period and by the as-of date.
- Latest-commitment on-time rate: quantity on arrived ASNs on or before the highest-numbered retained commitment date divided by eligible ordered quantity due within the period and by the as-of date.
- Commitment revision rate: committed PO lines whose latest date differs from their original date divided by committed PO lines whose original date is in the period.
- First-pass acceptance rate: accepted quantity from inspections finalized as `ACCEPTED` divided by finalized inspected quantity in the period.
- Usable acceptance rate: accepted quantity from `ACCEPTED` and `CONDITIONALLY_ACCEPTED` inspections divided by finalized inspected quantity in the period.
- NCR response rate: issued supplier NCRs with at least one supplier response divided by supplier NCRs issued in the period.

Current acknowledged PO lines represent outstanding obligations. A noncurrent line contributes only when it has retained arrived history, so superseded unshipped quantities do not double count while physical performance is retained. Arrived quantity is capped at ordered quantity. Cancelled ASNs and draft/unposted receipts do not contribute.

Monthly `Asia/Jakarta` trend buckets use the same definitions and selected period. Empty buckets retain `null`; they are not plotted as zero. Original and latest commitment performance are always separately labeled.

## Export security and audit

Synchronous exports fail above 10,000 data rows and never silently truncate. CSV contains report key, UTC generation timestamp, normalized applied filters, a blank row, then fixed headers and data. XLSX is a macro-free workbook with `Metadata`, `Data`, and `Trends` worksheets and no formulas, external links, hidden sheets, or embedded objects.

All text is treated as untrusted. A cell beginning, including after leading whitespace, with `=`, `+`, `-`, `@`, tab, or carriage return receives a leading apostrophe in CSV and XLSX. Only validated server-generated numeric values use numeric cells.

A successful export writes immutable `REPORT_EXPORTED` audit evidence with actor, qualifying organization, report key, format, authorized scope, normalized non-sensitive filters, generation timestamp, row count, request ID, and correlation ID. Export bytes, free-text search values, internal notes, prices, and sensitive row content are absent. Audit failure prevents the export response.

Supplier representations expose only own-organization aggregates, KPI numerators/denominators, monthly trends, model version, filters, and generation time. They never expose another supplier, internal prices/notes, employee identities, audit records, or inspection/NCR internal detail.
