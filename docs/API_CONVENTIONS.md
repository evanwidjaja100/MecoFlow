# API conventions

Business APIs use REST/JSON below `/api/v1`. Operational probes remain `/health/live` and `/health/ready`; generated OpenAPI is served below `/api/docs` in non-production environments and emitted to an artifact in CI.

Use ISO 8601 UTC timestamps, explicit pagination/filtering/sorting, stable response contracts, validated UUIDs/enums/numbers/dates, bounded page sizes, and domain-specific error codes. List responses contain `data`, `pagination`, and `meta.requestId`. Errors contain `error.code`, a safe message, optional field errors, and `requestId`; stack traces and database details never cross the boundary.

Accept or generate `X-Request-Id` and `X-Correlation-Id`, validate them as bounded safe identifiers, return `X-Request-Id`, and include both in structured logs. Sensitive creation/posting commands use idempotency keys. Editable aggregate commands include expected versions and return `CONCURRENT_MODIFICATION` on conflict.

Workflow endpoints are commands such as `POST /boms/{id}/release`; generic arbitrary-status patches are prohibited. Any contract change updates shared schemas, OpenAPI, tests, and documentation.
