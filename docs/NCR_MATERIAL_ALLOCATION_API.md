# NCR and material allocation API

## Scope

Phase 6B adds project-scoped nonconformance reports (NCRs), supplier corrective responses, and traceable allocation of accepted inventory-lot quantity to current released BOM lines. It does not calculate Phase 7 material requirements or readiness dashboards.

## NCR workflow

Internal users create an NCR draft through `POST /api/v1/projects/{projectId}/ncrs` with exactly one source type: `PROJECT`, `INVENTORY_LOT`, or `RECEIVING_INSPECTION`. Project sources require an explicit active supplier organization assigned to the project; lot and inspection sources derive the supplier from retained ASN/receipt lineage. Inspection sources require a finalized non-accepted disposition.

The command-only lifecycle is `DRAFT -> ISSUED -> SUPPLIER_RESPONDED -> CLOSED`, with `DRAFT -> CANCELLED`, `ISSUED -> CANCELLED`, and authorized direct `ISSUED -> CLOSED` also supported. Every transition uses an expected version, reason, immutable transition row, and same-transaction audit event. Supplier responses are append-only numbered revisions and the first response advances an issued NCR to `SUPPLIER_RESPONDED`.

Supplier list, detail, and response routes require `supplier.ncr.read` or `supplier.ncr.respond`, exact active organization ownership, and an active exact-project assignment. Supplier representations are built from an allowlist. They never contain internal note field names, sharing-control state, internal actors/transitions, or audits. `internalDispositionNotes` is exposed only as the separate `sharedDispositionNotes` field when an authorized internal close command explicitly sets `shareInternalNotes=true`; otherwise that supplier field is `null`.

## Material allocation workflow

`POST /api/v1/projects/{projectId}/material-allocations` accepts an inventory lot, BOM line, and positive decimal-string quantity. The server requires the same project, item, unit, current `RELEASED` BOM revision, configured unit precision, and an `ACCEPTED` or `CONDITIONALLY_ACCEPTED` lot. Only `acceptedQuantity` is available; rejected and quarantined buckets are never counted.

Creation locks the inventory-lot row before recalculating the sum of `ALLOCATED` and `CONSUMED` history. A database insert trigger takes the same lock and independently verifies lot disposition, BOM scope, precision, conditional evidence, and accepted availability. Competing requests therefore cannot both consume the same availability.

Conditionally accepted lots require `allocation.conditional-use`, the inspection's retained conditional-acceptance authorizer, and a bounded use reason. The allocation retains the authorizer/reason and writes a dedicated audit event in addition to the ordinary allocation audit.

An allocation starts as `ALLOCATED` and can transition exactly once to `RELEASED` or `CONSUMED`. Release returns its quantity to available accepted inventory. Consumption remains committed and represents permanently issued quantity. Both commands lock the lot and allocation, require an expected version and reason, and retain an immutable transition with a quantity snapshot plus a same-transaction audit event.

All unsafe endpoints require the existing session-bound CSRF token. Inaccessible and nonexistent object identifiers remain equivalent within the applicable internal or supplier policy.
