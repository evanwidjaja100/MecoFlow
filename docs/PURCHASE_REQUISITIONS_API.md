# Purchase requisition API

Phase 4A adds purchase requisitions only. Every route is below `/api/v1`, requires an active authenticated internal principal, composes an operation-specific `requisition.*` permission with existing project scope, and applies CSRF to unsafe methods. Suppliers receive no requisition permission. Purchase orders, supplier commitments, shipment, and receiving remain absent.

## Need and coverage

Only lines in the current `RELEASED` BOM revisions may be selected. `GET /projects/{projectId}/requisition-requirements` returns required, covered, and outstanding quantities for each released BOM line. Coverage is the sum of that BOM line's requisition lines in `DRAFT`, `SUBMITTED`, or `APPROVED`; `REJECTED` and `CANCELLED` requisitions release coverage. Each selected BOM line may appear once in a requisition.

Creation locks every selected BOM line in deterministic identifier order, recalculates coverage inside the transaction, validates unit precision, and inserts the requisition and audit evidence together. This serializes concurrent creators and prevents double booking. A strict over-need quantity fails unless the actor independently holds `requisition.override` and supplies a reason. The line snapshots required, covered, and outstanding quantities, the override authorizer/reason, and a dedicated override audit event.

## Lifecycle and attribution

The explicit lifecycle is `DRAFT -> SUBMITTED -> APPROVED|REJECTED|CANCELLED`, with `DRAFT -> CANCELLED` and `APPROVED -> CANCELLED` also allowed. Every command requires an expected version and reason. Invalid/stale transitions fail without partial audit or history. Requester attribution is immutable. Approval records an approver and timestamp; once present, the approver cannot be replaced, including after cancellation. Requisition lines and transition rows are immutable at the database boundary.

## Routes

| Route                                                 | Permission and behavior                                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `GET /projects/{projectId}/requisition-requirements`  | `requisition.read` plus project-read scope; released need, active coverage, and outstanding quantity             |
| `GET /projects/{projectId}/requisitions`              | `requisition.read` plus project-read scope; optional status filter                                               |
| `POST /projects/{projectId}/requisitions`             | `requisition.write` plus project-write scope and CSRF; immutable manual lines tied to released BOM lines         |
| `GET /purchase-requisitions/{requisitionId}`          | `requisition.read` plus resolved project scope; requester, approver, lines, snapshots, live outstanding, history |
| `POST /purchase-requisitions/{requisitionId}/submit`  | `requisition.submit` plus project-write scope, CSRF, expected version, valid transition, and reason              |
| `POST /purchase-requisitions/{requisitionId}/approve` | `requisition.approve` plus project-write scope, CSRF, expected version, valid transition, and reason             |
| `POST /purchase-requisitions/{requisitionId}/reject`  | `requisition.approve` plus project-write scope, CSRF, expected version, valid transition, and reason             |
| `POST /purchase-requisitions/{requisitionId}/cancel`  | `requisition.cancel` plus project-write scope, CSRF, expected version, valid transition, and reason              |

The request body never accepts status, requester, approver, coverage, snapshot, or override-authorizer fields. Those are server decisions.
