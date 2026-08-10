# Material requirement status projection API

## Scope and route

Phase 7A exposes one live, read-only, versioned projection:

```text
GET /api/v1/projects/{projectId}/material-requirement-status
```

The route requires an active internal membership with `bom.read` and existing project-read scope. Supplier memberships cannot satisfy the internal BOM policy. The response contains `modelVersion: "material-requirement-status-v1"` and one deterministically ordered row for every line in a currently `RELEASED` BOM revision in the project. Draft, in-review, cancelled, and superseded revisions are absent.

The projection is calculated from authoritative retained records in one PostgreSQL repeatable-read transaction. It creates no business record, audit event, outbox event, readiness score, snapshot, notification, report, or dashboard.

## Quantity definitions

All arithmetic is exact fixed-scale integer arithmetic using the requirement unit's configured decimal precision. Values are serialized as normalized decimal strings. A retained record is visited once through its primary trace path; no total is obtained by joining two independent one-to-many collections and multiplying rows.

| Field                         | Source and aggregation                                                                                                                                                | Inclusion and exclusion                                                                                                                                                                         | Double-counting prevention                                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requiredQuantity`            | The quantity on the released `BomLine`.                                                                                                                               | Current `RELEASED` revisions only.                                                                                                                                                              | A BOM line appears once; non-released and superseded revisions are not loaded.                                                                                                                 |
| `requisitionedQuantity`       | Sum of `PurchaseRequisitionLine.quantity` for the exact BOM-line identifier.                                                                                          | Parent requisitions in `DRAFT`, `SUBMITTED`, or `APPROVED`; `REJECTED` and `CANCELLED` are excluded because they released coverage.                                                             | Each requisition line is summed once by its retained BOM-line foreign key.                                                                                                                     |
| `orderedQuantity`             | Sum of explicit `PurchaseOrderAllocation.quantity` attributable to the requirement.                                                                                   | Only the current revision of a PO whose aggregate status is `SENT` or `ACKNOWLEDGED`. Draft, cancelled, and non-current revision plans are excluded.                                            | The explicit PO-allocation row, not the PO-line total, is the unit of aggregation. A pooled PO line therefore contributes only its stated amount to each requirement.                          |
| `confirmedQuantity`           | The same explicit current ordered allocation when its PO is `ACKNOWLEDGED` and that PO line has at least one supplier commitment revision containing the line.        | Current acknowledged PO revisions with a line commitment only.                                                                                                                                  | The allocation is counted once after selecting one latest commitment per PO line. Repeated commitment revisions change the date, not the confirmed quantity.                                   |
| `shippedQuantity`             | `AdvanceShipmentNoticeLine.shippedQuantity`, attributed across that PO line's complete explicit allocation set.                                                       | ASN status `IN_TRANSIT` or `ARRIVED`; draft, submitted-but-not-dispatched, and cancelled ASNs are excluded. Physical shipment history remains countable when its PO revision is later replaced. | Each ASN line is summed once, then distributed against PO-allocation capacity; the full allocation set includes official and non-official requirements so obsolete capacity is not reassigned. |
| `receivedQuantity`            | For each posted original lot, original quantity plus every retained signed `InventoryLotAdjustment`; the effective quantity is attributed through its ASN/PO line.    | Posted inventory effects only. Negative and positive corrections are included. Draft receipts have no lot and contribute zero.                                                                  | One inventory lot is the receipt segment. Its adjustment rows are applied once, and the resulting segment is distributed once across remaining PO-allocation capacity.                         |
| `acceptedQuantity`            | Retained `InventoryLot.acceptedQuantity` from finalized inspection disposition, attributed within the lot's received segment.                                         | Accepted and conditionally accepted buckets contribute; rejected, quarantined, and unresolved awaiting-inspection quantities do not.                                                            | Accepted is a partition of its exact received lot segment and cannot exceed it.                                                                                                                |
| `allocatedQuantity`           | Sum of `MaterialAllocation.quantity` tied directly to the current released BOM line.                                                                                  | `ALLOCATED` and `CONSUMED` count; `RELEASED` does not. Consumed quantity remains committed.                                                                                                     | The direct requirement allocation is summed once by allocation identity. Release never subtracts a historical row; it changes that row to an excluded terminal state.                          |
| `certificateCompleteQuantity` | The accepted quantity of a lot whose finalized inspection has every required snapshotted `CERTIFICATE` check completed, conforming, accepted, and linked to evidence. | If the retained inspection snapshot has no required certificate check, accepted quantity is certificate-complete by definition. Optional certificate checks do not gate the field.              | Certificate-complete quantity is a subset of the same accepted lot segment and can never exceed accepted quantity.                                                                             |
| `shortage`                    | `max(requiredQuantity - allocatedQuantity, 0)`.                                                                                                                       | Active and consumed material allocations reduce shortage; released allocations do not.                                                                                                          | Derived once from the two requirement-level totals; over-allocation or authorized upstream over-coverage never creates a negative shortage.                                                    |

Rejected, quarantined, and unresolved quantities are internal calculation inputs used for blocker selection but are not additional Phase 7A response fields.

## Pooled PO-line attribution

A PO line may supply several requisition lines and therefore several BOM requirements. Before physical quantities are attributed, its allocation rows are grouped by BOM-line identifier. Groups are ordered by:

1. earliest `requiredDateSnapshot` ascending;
2. BOM-line UUID ascending as a stable tie-breaker.

Shipment and receipt segments consume those capacities in that order. All allocations on the touched PO line participate, including allocations to requirements that are no longer official; their capacity is consumed but their result is not emitted. This prevents a later BOM release from silently reassigning historical physical supply.

Receipt lots are ordered by lot creation timestamp then UUID. Within each lot's received slices, quality buckets are assigned in the stable order accepted, rejected, quarantined, then unresolved. Certificate-complete quantity is assigned only within that lot's accepted slices. This is an attribution rule required because the current schema does not identify which subquantity of a pooled PO line or lot belongs to which requirement. It never changes inventory, allocation, or procurement records.

## Commitment-date rule

For a PO line, the operative source date is the `committedDate` on the highest-numbered supplier commitment revision that contains that line. Earlier revisions are retained but do not compete by date. For a requirement supplied by several eligible current acknowledged PO lines, `operativeCommitmentDate` is the latest of those selected dates because completion depends on the final committed tranche. A missing commitment on any ordered tranche leaves confirmed quantity short and produces the confirmation blocker even if another tranche supplies a date. If no eligible commitment exists, the date is `null`.

## Stage rule

`currentStage` is the furthest evidenced positive stage, not a percentage and not a readiness score. The precedence is:

```text
COMPLETE
ALLOCATED
CERTIFICATE_COMPLETE
ACCEPTED
RECEIVED
SHIPPED
CONFIRMED
ORDERED
REQUISITIONED
NOT_STARTED
```

`COMPLETE` is special: both allocated quantity and certificate-complete quantity must cover required quantity. Otherwise the first stage in the list with a positive quantity is returned. Partial downstream progress may therefore be visible while `blockerReason` identifies an earlier incomplete gate.

## Blocker rule

Exactly one stable blocker code or `null` is returned. `null` requires the `COMPLETE` gate. The deterministic priority is:

1. `REJECTED_MATERIAL` when shortage remains and any attributed quantity is rejected;
2. `QUARANTINED_MATERIAL` when shortage remains and any attributed quantity is quarantined;
3. `INSPECTION_PENDING` when accepted quantity is short and any received quantity is unresolved;
4. `REQUISITION_SHORTFALL`;
5. `ORDER_SHORTFALL`;
6. `SUPPLIER_CONFIRMATION_MISSING`;
7. `SHIPMENT_SHORTFALL`;
8. `RECEIPT_SHORTFALL`;
9. `ACCEPTANCE_SHORTFALL`;
10. `CERTIFICATE_INCOMPLETE`;
11. `ALLOCATION_SHORTFALL`.

For steps 4 through 11, the first quantity below required quantity wins. Quality-specific blockers deliberately outrank upstream shortages because they represent already received material requiring disposition.

## Determinism and failure behavior

- The response contains no calculation timestamp or random value.
- Rows are ordered by work-package code, BOM UUID, line number, then line UUID.
- Retained collections use explicit stable ordering before attribution.
- All source queries share one repeatable-read database snapshot, so a concurrent receipt or allocation cannot mix pre-change and post-change inputs in one response.
- The model version is fixed in code and changes only with a documented rule change and updated tests.
- Invalid persisted precision, negative buckets, bucket overflow, or supply beyond explicit PO-allocation capacity fails closed instead of returning a plausible partial projection.

The generated request/response contract is checked in `docs/generated/openapi.json`.
