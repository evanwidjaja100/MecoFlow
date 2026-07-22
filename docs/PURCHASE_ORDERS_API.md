# Purchase order and supplier commitment API

Phase 4B adds purchase orders, retained PO revisions, explicit approved-requirement allocations, supplier acknowledgement, append-only commitment revisions, and internal late-date exceptions. Every route is below `/api/v1`, uses the existing opaque session and CSRF design, and enforces object scope server-side. Shipment, ASN, receiving, inspection, inventory, documents, and attachments are absent.

## Quantity and revision integrity

`GET /projects/{projectId}/purchase-order-requirements` projects approved requisition-line quantity, quantity consumed by current non-cancelled PO revisions, and available quantity. Create/revise locks referenced requisition lines in deterministic UUID order and recalculates availability transactionally. Each PO line contains one item/unit, every allocation references an approved requisition line in the same project, and ordered quantity must exactly equal the allocation total. Above-available quantity requires `purchase-order.override`, a reason, authorizer attribution, snapshots, and `PURCHASE_ORDER_OVER_ORDER_OVERRIDE_USED` audit evidence.

PO revisions are numbered and retained. `revise` appends a new current draft revision; prior content, lines, allocations, sent timestamp, commitments, and audit history remain immutable. Only the current revision consumes approved quantity. A deferred database constraint checks line/allocation totals at transaction commit.

## Lifecycle and commitments

The lifecycle is `DRAFT -> SENT|CANCELLED`, `SENT -> ACKNOWLEDGED|DRAFT|CANCELLED`, and `ACKNOWLEDGED -> DRAFT|CANCELLED`; a transition to `DRAFT` from a sent state occurs only through `revise`. Send, cancel, acknowledge, and revise require expected versions and reasons. A sent current revision is visible only to its addressed active supplier organization with active exact project membership. Only that supplier can acknowledge it.

An acknowledged current revision accepts commitment submissions. Each submission appends the next `SupplierCommitmentRevision`; it never updates an earlier revision. Commitment lines may reference only PO lines in that PO revision. Responses derive each line's original (first) and latest commitment dates. The PO line's required date is the earliest retained allocation snapshot date, sourced from work-package planned start or project planned start; latest dates after it appear in the internal exception endpoint.

## Routes

| Route                                                          | Permission and behavior                                                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /projects/{projectId}/purchase-order-requirements`        | `purchase-order.read` plus project-read scope; approved/ordered/available projection                                                             |
| `GET /projects/{projectId}/purchase-orders`                    | `purchase-order.read` plus project-read scope; internal register                                                                                 |
| `POST /projects/{projectId}/purchase-orders`                   | `purchase-order.write` plus project-write scope and CSRF; draft R1 from approved allocations                                                     |
| `GET /purchase-orders/{purchaseOrderId}`                       | `purchase-order.read` plus resolved project scope; internal revisions, allocations, commercial fields, commitments, transitions                  |
| `POST /purchase-orders/{purchaseOrderId}/revise`               | `purchase-order.write` plus project-write scope, CSRF, expected version, full replacement allocation set and reason                              |
| `POST /purchase-orders/{purchaseOrderId}/send`                 | `purchase-order.send` plus project-write scope, CSRF, expected version and reason                                                                |
| `POST /purchase-orders/{purchaseOrderId}/cancel`               | `purchase-order.cancel` plus project-write scope, CSRF, expected version and reason                                                              |
| `GET /projects/{projectId}/purchase-order-exceptions`          | `purchase-order.exception.read` plus project-read scope; latest commitment after required date                                                   |
| `GET /supplier/purchase-orders`                                | `supplier.purchase-order.read`; addressed organization and exact active project membership                                                       |
| `GET /supplier/purchase-orders/{purchaseOrderId}`              | Same supplier object policy; explicit supplier-safe field allowlist                                                                              |
| `POST /supplier/purchase-orders/{purchaseOrderId}/acknowledge` | `supplier.purchase-order.acknowledge`, own organization/object scope, CSRF, sent state, expected version and reason                              |
| `POST /supplier/purchase-orders/{purchaseOrderId}/commitments` | `supplier.commitment.write`, own organization/object scope, CSRF, acknowledged state, expected version, current PO-line IDs and date-only values |

Supplier responses never contain internal unit price, internal commercial terms, internal buyer/line notes, requisition or allocation identifiers, employee attribution, internal transitions, audits, storage keys, or another supplier's objects. Inaccessible and nonexistent supplier PO identifiers use the same safe not-found response. There is no Phase 4B PO attachment route.
