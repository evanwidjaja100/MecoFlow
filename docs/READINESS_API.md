# Readiness engine and dashboard API

Phase 7B uses the pure `readiness-calculator-v1` calculator with `readiness-rules-v1`. It consumes the exact `material-requirement-status-v1` line projection and persists immutable project/work-package snapshot batches. A rule change requires a new calculator or rule version, new tests, documentation, and an explicit recalculation plan; existing snapshots remain interpretable.

## Calculation inputs and reproducibility

Every calculation receives an explicit UTC date, scope identity/type, current released requirement lines, and unresolved project NCR count. Each line persists the Phase 7A quantities and stage, criticality, required date, operative commitment date, certificate-required flag, blocker, linked unresolved NCR count, item/unit labels, and work-package identity. The snapshot stores those inputs, a SHA-256 input hash, material projection/calculator/rule versions, the calculation result, line explanations, blockers, reason codes, actions, and trigger. This is sufficient to rerun the pure calculator without reading mutable current records.

The UTC date is an explicit input because due-date risk can change when no business row changes. Inputs are sorted by stable BOM-line identity before calculation. Fixed-scale quantities accept no more than six decimals; inconsistent shortage or certificate quantities fail closed.

Only current `RELEASED` BOM revisions are loaded. Superseded, draft, review, and cancelled revisions cannot affect a new snapshot. Required date is the current work-package planned start for work-package lines or current project planned start for project-wide lines. Phase 7A remains authoritative for pooled PO attribution, corrections, quality buckets, certificate-complete quantity, allocation release, and consumption.

An NCR is unresolved only in `ISSUED` or `SUPPLIER_RESPONDED`. Lot/inspection NCRs are attributed through their retained PO allocation trace to current requirements. A project-source unresolved NCR applies to the project snapshot. `CLOSED` and `CANCELLED` NCRs contribute no readiness blocker.

Certificate requirement is derived from the active required item certificate definition. Certificate-complete quantity remains derived from retained required inspection certificate checks and approved conforming evidence under Phase 7A.

## Scores

Each line contributes its stage score multiplied by criticality weight. The aggregate is `sum(stage score × weight) / sum(weight)`, rounded once to two decimal places.

| Criticality | Weight |
| ----------- | -----: |
| CRITICAL    |      8 |
| HIGH        |      4 |
| NORMAL      |      2 |
| LOW         |      1 |

| Stage                | Score |
| -------------------- | ----: |
| NOT_STARTED          |     0 |
| REQUISITIONED        |    15 |
| ORDERED              |    30 |
| CONFIRMED            |    45 |
| SHIPPED              |    60 |
| RECEIVED             |    70 |
| ACCEPTED             |    80 |
| CERTIFICATE_COMPLETE |    90 |
| ALLOCATED            |    95 |
| COMPLETE             |   100 |

## Critical gates and status

Gates override the weighted score. The result is `RED` when any critical line has rejected material, quarantined material, missing required certificate completeness, an unresolved linked NCR, a commitment later than required, or an allocation shortage on/past the calculation date. A score below 60 is also `RED`.

`COMPLETE` requires every line at `COMPLETE`, zero shortage, no line blocker, no unresolved NCR, no late commitment, and no unresolved project NCR. Without a RED gate, scores below 85 or scopes with current blockers are `AMBER`.

The future-low-priority exception is deterministic: when every critical line is complete and the only remaining issue is a LOW line shortage whose required date is more than 30 calendar days after the calculation date, a score of at least 85 is `GREEN`. The same shortage due in 30 days or less is `AMBER`. Other noncritical incomplete conditions prevent this exception. A scope without released requirements is conservatively `RED` with `NO_RELEASED_REQUIREMENTS`; it is never presented as complete.

## Reason codes and actions

Persisted reason codes include no-requirement, critical rejected/quarantined/certificate/NCR/late/due-shortage gates, ordinary late commitment or open NCR, partial acceptance, due-soon shortage, future LOW shortage, and score-band reasons. Every underlying Phase 7A blocker is retained with BOM-line identity and explanation.

Recommended actions are deterministic mappings: release a requirement, raise a requisition, place an order, obtain supplier confirmation, expedite shipment/late commitment, receive material, complete inspection, replace rejected material, resolve quarantine, complete certificate review, allocate accepted material, or resolve an NCR. Duplicate line/action pairs are removed without discarding other explanations.

## Snapshot and recalculation behavior

One changed project calculation creates a UUID batch containing the project snapshot and every work package represented by a current released line. An immutable database trigger rejects snapshot update/delete. A redacted `READINESS_RECALCULATED` audit event commits with a changed batch.

Relevant project/work-package, BOM revision, requisition, purchase order, ASN, receipt, inspection, NCR, and allocation changes atomically enqueue identifier-only `READINESS_RECALCULATION_REQUESTED` events. The worker coalesces pending events per project, takes a transaction-scoped project advisory lock, re-reads authoritative inputs, and writes the batch plus event completion in one serializable transaction. Events created after a claim remain pending for a later pass.

The worker also sweeps projects with released BOMs every five minutes. Scheduled and event calculations use the same path. If the explicit calculation date, source input hash, and versions match the latest project snapshot, no new batch or audit is written. A new UTC date may legitimately create a new snapshot because due-date rules changed. This is the only Phase 7B outbox consumer; Phase 8 notifications/general dispatch remain absent.

## Authorization and routes

All routes require an active internal membership with `readiness.read` and `project.read`. Project routes additionally require existing project-read scope. System-administrator and management oversight follow existing project policy; other roles require active assignment. Supplier roles receive no readiness permission and are denied before protected project resolution.

| Route                                                  | Purpose                                                |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `GET /api/v1/readiness/management?page=1&pageSize=20`  | Latest authorized project snapshots, paged 1–100       |
| `GET /api/v1/projects/{projectId}/readiness`           | Latest project and same-batch work-package snapshots   |
| `GET /api/v1/projects/{projectId}/readiness/materials` | Latest persisted material inputs and line explanations |
| `GET /api/v1/projects/{projectId}/readiness/history`   | Latest 100 immutable project/work-package snapshots    |

Every serialized score includes status, blockers, reason codes, recommended actions, and explanation. Snapshot responses exclude raw supplier identity, prices/terms, actors, traceability notes, internal NCR disposition, document metadata/keys, and audit rows. Material-board inputs contain only the minimized operational fields required to explain readiness.

Management pagination defaults to 20 rows and rejects page sizes outside
1–100. The response includes `page`, `pageSize`, `total`, and `totalPages`.
The page and count use the same repeatable-read transaction and retain the
principal-derived project predicate. Synchronous management reads use a
five-second PostgreSQL statement timeout and fail without returning a partial
portfolio.
