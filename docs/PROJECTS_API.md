# Phase 2 projects API

All endpoints use the authenticated server-managed session below `/api/v1`. Unsafe commands also require the session-bound `X-CSRF-Token`. Protected nonexistent and out-of-scope project identifiers use the same `RESOURCE_NOT_FOUND` response. Editable commands carry `expectedVersion`; stale versions return `CONCURRENT_MODIFICATION` without a partial write or audit event.

## Product categories and projects

- `GET /product-categories` lists categories. Supplier-only principals receive active categories only.
- `POST /product-categories` and `PATCH /product-categories/{categoryId}` require an internal `project.write` grant. Category edits are versioned and audited.
- `GET /projects` supports `q`, `state`, `categoryId`, `sort`, `direction`, `page`, and `pageSize` (maximum 100). The response contains `data`, `pagination`, and `meta.requestId`.
- `POST /projects` creates a `DRAFT` project within the actor's active internal organization and assigns the creator's membership as `PROJECT_MANAGER`.
- `GET /projects/{projectId}` returns the authorized project overview. Supplier responses omit project-member identity and transition-history fields.
- `PATCH /projects/{projectId}` edits category, code, name, description, and planned dates. `state` is deliberately not accepted.
- `POST /projects/{projectId}/transitions` accepts `expectedVersion`, `targetState`, and a required reason. It atomically changes state, increments the version, writes immutable transition history, and writes an audit event.

## Members, milestones, and work packages

- `GET /projects/{projectId}/member-candidates` and member commands require `project.membership.manage` plus writable project scope.
- `POST /projects/{projectId}/members` adds an active membership. Internal members must belong to the owning organization; supplier members use the `SUPPLIER` project role and receive explicit read scope only.
- `PATCH /projects/{projectId}/members/{memberId}` changes role/status with an expected version. The final active project manager cannot be removed or demoted.
- `POST` and versioned `PATCH` routes below `/projects/{projectId}/milestones` create/edit milestones. Target dates must fall within project dates.
- `POST` and versioned `PATCH` routes below `/projects/{projectId}/work-packages` create/edit work packages. Dates must be ordered and within project dates; any milestone link must belong to the same project.

Completed and cancelled projects are read-only. No normal transition leaves either terminal state; reopening a completed project requires a future separately authorized command and is not part of Phase 2.
