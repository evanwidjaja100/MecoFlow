# BOM and import API

Phase 3B adds revision-controlled BOMs and secure dry-run imports. Every route is below `/api/v1`, requires an active authenticated internal principal, composes a BOM permission with project scope, and applies CSRF to unsafe methods. Supplier principals receive no BOM permission.

## Scope and lifecycle

A BOM is unique for either an entire project or one work package in that project. A composite foreign key prevents a work-package scope from crossing projects. Revisions have a monotonically increasing number and the command-only lifecycle `DRAFT -> IN_REVIEW -> RELEASED -> SUPERSEDED`, with cancellation allowed from `DRAFT` or `IN_REVIEW`. Release locks the BOM scope, supersedes any current release, releases the reviewed target, writes immutable transition/audit evidence, and commits as one PostgreSQL transaction. A partial unique index independently permits only one `RELEASED` revision per BOM scope.

Only draft lines can be corrected. The database trigger rejects line mutation after review. The `official_bom_lines` database view contains only lines whose revision is currently `RELEASED`; superseded lines therefore cannot enter new operational flows. Phase 3B exposes a zero-valued `NOT_STARTED` procurement-coverage placeholder only and creates no purchasing or allocation data.

## Routes

| Route                                                | Permission and behavior                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GET /projects/{projectId}/boms`                     | `bom.read` plus project-read scope; lists BOM scopes, revisions, and imports                                                   |
| `GET /projects/{projectId}/bom-import-template.csv`  | `bom.import` plus project-write scope; fixed six-column CSV template                                                           |
| `GET /projects/{projectId}/bom-import-template.xlsx` | `bom.import` plus project-write scope; macro-free XLSX template                                                                |
| `POST /projects/{projectId}/bom-imports`             | `bom.import`, project-write scope, CSRF; bounded base64 upload metadata/body                                                   |
| `GET /bom-imports/{importId}`                        | `bom.read` plus resolved project scope; all retained rows, errors, and warnings                                                |
| `POST /bom-imports/{importId}/confirm`               | `bom.import`, project-write scope, CSRF, expected version, and literal confirmation; creates one draft revision                |
| `GET /bom-revisions/{revisionId}`                    | `bom.read` plus resolved project scope; lines, source checksum, transitions, official-readiness flag, and coverage placeholder |
| `PATCH /bom-revisions/{revisionId}/lines/{lineId}`   | `bom.write`, project-write scope, CSRF, expected version; draft-only quantity/criticality/notes correction                     |
| `POST /bom-revisions/{revisionId}/review`            | `bom.review`, project-write scope, CSRF, expected version, reason                                                              |
| `POST /bom-revisions/{revisionId}/release`           | `bom.release`, project-write scope, CSRF, expected version, reason; transactional release                                      |
| `POST /bom-revisions/{revisionId}/supersede`         | `bom.release`, project-write scope, CSRF, expected version, reason                                                             |
| `POST /bom-revisions/{revisionId}/cancel`            | `bom.review`, project-write scope, CSRF, expected version, reason                                                              |
| `GET /boms/{bomId}/comparison`                       | `bom.read` plus project scope; validates both revision IDs belong to the BOM and returns added/removed/changed/unchanged lines |

## Import contract

The columns, in order, are `item_code,item_name,quantity,unit_code,criticality,notes`. Files are limited to 5 MiB and 5,000 data rows. CSV must be UTF-8 text without NUL bytes. XLSX is parsed as bounded ZIP/XML data; encrypted entries, path traversal, external links, embedded objects, macros, excessive expansion, and formula cells are rejected or surfaced without evaluation. `.xlsm`, executables, ZIP uploads, and MIME/extension mismatches are rejected before metadata is committed.

The API stores an opaque private object key, SHA-256, safe original name, MIME, size, and quarantine state, then atomically writes `BOM_IMPORT_UPLOADED`, the import record, and `BOM_IMPORT_PARSE_REQUESTED`. The worker verifies object size/checksum, validates every row against active items and base units, and atomically persists all row results, file state, audit evidence, and outbox completion. Retry payloads contain identifiers only.

Exact item code is authoritative. If code is blank, an exact case-insensitive name match may be used only when it resolves to one active item and produces a warning. Multiple matches produce `AMBIGUOUS_ITEM`; no item is selected. Invalid quantities/precision/units, formula-like content, empty rows, missing values, unexpected columns, and invalid criticality are row errors. Unexpected cell values remain in row `rawData`; duplicate item rows remain separate and produce a warning.
