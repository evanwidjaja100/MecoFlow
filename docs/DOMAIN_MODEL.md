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

## Phase 0 database scope

Phase 0 intentionally creates only `SystemMetadata`, a technical table used to prove migration, connectivity and deterministic seed mechanics. Business entities begin in their designated phases; this avoids creating an unreviewed partial operational schema.
