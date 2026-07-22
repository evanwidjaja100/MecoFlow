# API conventions

Business APIs use REST/JSON below `/api/v1`. Operational probes remain `/health/live` and `/health/ready`; generated OpenAPI is served below `/api/docs` in non-production environments and emitted to an artifact in CI.

Use ISO 8601 UTC timestamps, explicit pagination/filtering/sorting, stable response contracts, validated UUIDs/enums/numbers/dates, bounded page sizes, and domain-specific error codes. List responses contain `data`, `pagination`, and `meta.requestId`. Errors contain `error.code`, a safe message, optional field errors, and `requestId`; stack traces and database details never cross the boundary.

Accept or generate `X-Request-Id` and `X-Correlation-Id`, validate them as bounded safe identifiers, return `X-Request-Id`, and include both in structured logs. Sensitive creation/posting commands use idempotency keys. Editable aggregate commands include expected versions and return `CONCURRENT_MODIFICATION` on conflict.

Workflow endpoints are commands such as `POST /boms/{id}/release`; generic arbitrary-status patches are prohibited. Any contract change updates shared schemas, OpenAPI, tests, and documentation.

Phase 2 project routes follow these conventions, including `POST /projects/{id}/transitions` and versioned detail/member/milestone/work-package edits. The complete Phase 2 route and policy summary is in `PROJECTS_API.md`; generated request schemas and paths are in `generated/openapi.json`.

Phase 3A item-master routes use the same conventions. Item categories, units of measure, specification-attribute definitions, and items use uppercase normalized codes and expected versions on edits. Items have an explicit `POST /items/{id}/deactivate` command with a reason; there is no item-delete route. `GET /items` provides bounded filtering, sorting, search, and pagination, while `GET /items/export.csv` applies the same filters without pagination, enforces a 10,000-row ceiling, requires `item.export`, and produces a formula-safe audited CSV. The complete contract and policy summary is in `ITEM_MASTER_API.md`.

Phase 3B BOM routes use explicit `review`, `release`, `supersede`, `cancel`, and import `confirm` commands; arbitrary status patching is absent. Upload bodies are bounded, metadata-validated base64 JSON because the API owns the private storage write. Dry-run status is polled through the import resource. Every correction/command uses CSRF and expected versions. See `BOM_API.md` and `generated/openapi.json`.

Phase 4A purchase requisitions use explicit `submit`, `approve`, `reject`, and `cancel` command endpoints; generic status patches are absent. Creation accepts bounded manual lines tied to released BOM-line UUIDs and decimal quantity strings. Requester, approver, live coverage, snapshots, workflow state, and override authorizer are response-only server decisions. See `PURCHASE_REQUISITIONS_API.md` and `generated/openapi.json`.

Phase 4B purchase orders use explicit `send`, `revise`, `cancel`, supplier `acknowledge`, and append-commitment endpoints; arbitrary status or commitment updates are absent. Creation/revision accepts bounded lines whose ordered quantity equals explicit approved-requisition allocation totals. Supplier identity, approved/ordered/available snapshots, required dates, status, attribution, override authorizer, commitment revision numbers, and original/latest date projections are server decisions. Supplier response schemas are field allowlists that omit all internal commercial fields. See `PURCHASE_ORDERS_API.md` and `generated/openapi.json`.

Phase 5A documents use explicit upload initiation/completion, submit-review, approve, reject, supersede, and download-URL commands. File state, scan state, storage key, detected type, uploader/reviewer attribution, current version, and superseded history are server decisions. Storage keys are never response fields; the only object address returned is a bounded private presigned URL after authorization. See `DOCUMENTS_API.md` and `generated/openapi.json`.

Phase 5B ASNs use explicit supplier `submit`, `dispatch`, and `cancel` plus internal `arrive` commands. Goods receipts use separate create-draft, `post`, and correction-create endpoints. Posting requires `Idempotency-Key` and expected version; repeated identical requests return the existing posted result without duplicate lots. Server decisions include supplier identity, PO revision, shipment/receipt status, receipt number, lot number/status, posting attribution, and all audit evidence. See `ASN_RECEIVING_API.md` and `generated/openapi.json`.
