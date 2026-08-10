# Receiving inspection API

Phase 6A adds item-scoped inspection-check configuration, automatic and explicit inspection creation, the project work queue, checklist/measurement/certificate results, secure evidence, and one-time inventory-lot disposition. It does not add NCR supplier response or material allocation.

## Inspection-required material and snapshots

An item is inspection-required when it has at least one active inspection-check definition. Definitions are global internal item-master configuration with an immutable item/code identity, optimistic version, active flag, required flag, and one of these shapes:

- `CHECKLIST` records pass/fail.
- `MEASUREMENT` configures zero-to-six decimal precision and optional inclusive minimum/maximum values, plus an optional active unit whose precision is not exceeded.
- `CERTIFICATE` records accepted/rejected review and requires an approved, clean document linked to the inspection.

Posting an original goods receipt creates the inventory lot and, when active definitions exist, its `OPEN` inspection plus immutable definition snapshots in the same transaction. This means later definition edits do not rewrite work already issued. An authorized explicit command creates the inspection for an awaiting lot that predates its active definitions. The one-inspection-per-lot database key makes both paths idempotent with respect to inspection identity.

## Results and evidence

Result recording locks and expected-version checks the open inspection. Checklist results accept only pass/fail, measurements enforce the snapshotted precision and derive conformance from inclusive limits, and certificate results require a decision plus an evidence document.

Evidence uploads reuse the private document service through a `RECEIVING_INSPECTION` association. The association is internal-only and must resolve to the same project. Upload metadata, private object retrieval, checksum/type/malware scanning, quarantine, review, approval, and download rules are unchanged. A certificate result accepts only the current `APPROVED/CLEAN` version of a document already associated with that exact inspection; uploading or linking a quarantined/unapproved file does not satisfy the check.

## Finalization and inventory integrity

Finalization requires every required check to be completed. Ordinary acceptance also requires every required result to conform. Conditional acceptance can record nonconformance but requires the independent `inspection.conditional-accept` permission and writes dedicated authorization audit evidence.

The command accepts exact decimal strings for accepted and rejected quantity. It locks the inspection and inventory lot, derives current received quantity from the immutable original lot quantity plus all pre-disposition correction adjustments, and enforces:

- accepted and rejected quantities are nonnegative and use the lot unit's configured precision;
- accepted plus rejected never exceeds effective received quantity;
- quarantined quantity is derived exactly as received minus accepted minus rejected;
- `REJECTED` rejects the full quantity;
- `QUARANTINED` retains a positive quarantined remainder; and
- `ACCEPTED` and `CONDITIONALLY_ACCEPTED` accept a positive quantity with no quarantined remainder, while allowing an explicitly rejected portion.

The inspection transition, immutable final quantities/attribution, lot status and quantity buckets, conditional-authorization audit where applicable, and finalization audit commit in one PostgreSQL transaction. A row lock plus expected version and database transition guards allow finalization only once. Correction posting and finalization serialize on the same inventory-lot row; whichever commits first forces the other command to revalidate current status and effective quantity. Corrections to a dispositioned lot are rejected and their receipt-posting transaction rolls back.

## Routes

| Route                                                        | Policy and behavior                                                                                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/inspection-check-definitions?itemId={id}`       | Internal `inspection.configure`; list global/item definitions                                                                                  |
| `POST /api/v1/items/{itemId}/inspection-check-definitions`   | `inspection.configure`, CSRF, active item/configuration validation, audit                                                                      |
| `PATCH /api/v1/inspection-check-definitions/{definitionId}`  | `inspection.configure`, CSRF, expected version, immutable identity, audit                                                                      |
| `GET /api/v1/projects/{projectId}/receiving-inspections`     | `inspection.read` plus project-read scope; optional `OPEN`/`FINALIZED` status                                                                  |
| `POST /api/v1/inventory-lots/{lotId}/receiving-inspections`  | `inspection.create`, project-write scope, CSRF, awaiting lot, active definitions                                                               |
| `GET /api/v1/receiving-inspections/{inspectionId}`           | `inspection.read` plus resolved project-read scope                                                                                             |
| `POST /api/v1/receiving-inspections/{inspectionId}/results`  | `inspection.write`, project-write scope, CSRF, expected version, open state                                                                    |
| `POST /api/v1/receiving-inspections/{inspectionId}/finalize` | `inspection.finalize`, project-write scope, CSRF, expected version, quantity/result/transaction checks; conditional permission when applicable |

Permission checks precede protected inspection/lot identifier resolution. Suppliers receive no inspection permissions or representation, and inaccessible/nonexistent targets preserve the documented safe-error behavior.
