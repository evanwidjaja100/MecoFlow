# ASN and receiving API

Phase 5B adds supplier-owned advance shipment notices, explicit shipment transitions, internal goods receipts, idempotent posting, separate correcting entries, and awaiting-inspection inventory lots. It does not add inspection decisions, NCRs, material allocation, or readiness calculations.

## ASN lifecycle and scope

An ASN snapshots the current acknowledged PO revision and accepts only positive, unit-precision quantities from lines in that revision. Active draft/submitted/in-transit/arrived ASN quantity cannot exceed the ordered PO-line quantity; cancellation releases unshipped reservation. Supplier organization identity comes from the authenticated membership and addressed PO, never from the request body.

The command lifecycle is `DRAFT -> SUBMITTED|CANCELLED`, `SUBMITTED -> IN_TRANSIT|CANCELLED`, and `IN_TRANSIT -> ARRIVED`. Supplier users create, submit, dispatch, or cancel only their own organization's ASNs with exact active project assignment. Arrival is an internal warehouse command. Every command requires CSRF and expected version and writes immutable transition and audit evidence transactionally.

## Receipt posting and corrections

An internal draft receipt references an arrived ASN and contains positive quantities plus heat number, batch number, manufacturer, package reference, and notes. Posting requires an `Idempotency-Key` header of 8–128 safe characters and an expected version. The receipt lock, ASN-line locks, final received-quantity check, status change, lot/adjustment creation, and audit event share one PostgreSQL transaction.

Original receipt posting creates one positive `AWAITING_INSPECTION` lot per line. Posted receipt headers and lines, lots, and adjustment history are database-immutable. Corrections are new draft receipts tied to one posted original receipt. Their signed quantity deltas cannot make effective received or lot quantity negative or exceed shipped quantity. Posting a correction appends immutable lot adjustments; it never rewrites the original receipt or lot.

## Secure files

Packing lists and certificates use the Phase 5A private document service with `ADVANCE_SHIPMENT_NOTICE` associations. A supplier association is valid only when the ASN belongs to the document owner organization and project. Receiving photographs use `GOODS_RECEIPT` associations and are internal-only. All existing extension/MIME/size/checksum/quarantine/scanning/download authorization controls continue to apply.

## Routes

| Route                                                   | Policy and behavior                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET /supplier/asns`                                    | `supplier.asn.read`; repository-filtered own organization and active project assignment |
| `POST /supplier/purchase-orders/{purchaseOrderId}/asns` | `supplier.asn.write`, own acknowledged PO, current PO-line scope, CSRF                  |
| `GET /supplier/asns/{asnId}`                            | Own supplier ASN; explicit supplier-safe allowlist                                      |
| `POST /supplier/asns/{asnId}/submit`                    | `supplier.asn.transition`, CSRF, expected version, valid draft transition               |
| `POST /supplier/asns/{asnId}/dispatch`                  | Same policy; valid submitted transition                                                 |
| `POST /supplier/asns/{asnId}/cancel`                    | Same policy; draft/submitted cancellation only                                          |
| `GET /projects/{projectId}/asns`                        | Internal `shipment.read` plus project-read scope                                        |
| `GET /asns/{asnId}`                                     | Internal `shipment.read` plus resolved project scope                                    |
| `POST /asns/{asnId}/arrive`                             | Internal `shipment.arrive`, project-write scope, CSRF, expected version                 |
| `GET /projects/{projectId}/goods-receipts`              | `receiving.read` plus project-read scope                                                |
| `POST /projects/{projectId}/goods-receipts`             | `receiving.write`, project-write scope, arrived ASN, CSRF                               |
| `GET /goods-receipts/{receiptId}`                       | `receiving.read` plus resolved project scope                                            |
| `POST /goods-receipts/{receiptId}/post`                 | `receiving.post`, project-write scope, CSRF, expected version, `Idempotency-Key`        |
| `POST /goods-receipts/{receiptId}/corrections`          | `receiving.correct`, project-write scope, posted original receipt, CSRF                 |

Protected real and nonexistent identifiers are indistinguishable outside object scope. Supplier representations omit internal employee actors, audit records, internal PO fields, receipt data, inventory data, and other suppliers' records.
