# Phase 3A item-master API

All item-master endpoints use the authenticated server-managed session below `/api/v1`. The catalog is global across active internal organizations. It is not supplier-visible and is not partitioned by organization; the qualifying actor membership supplies the organization recorded on audit evidence.

Unsafe commands require the session-bound `X-CSRF-Token`. Versioned edits and item deactivation carry `expectedVersion`; stale versions return `CONCURRENT_MODIFICATION` without a partial business write or audit event. Request identifiers, safe errors, UUID validation, unknown-property rejection, and UTC timestamps follow `API_CONVENTIONS.md`.

## Permissions

- `item.read` allows internal category, unit, item-list, and item-detail reads.
- `item.write` allows internal category, unit, specification-definition, item, and deactivation commands.
- `item.export` allows the bounded filtered CSV export.

Each permission also requires an active membership in an active `INTERNAL` organization. Supplier and reserved customer roles receive no item permission. `SYSTEM_ADMIN` remains subject to authentication, active membership, CSRF, optimistic concurrency, validation, and audit requirements.

## Item categories and specification definitions

- `GET /item-categories` returns all categories and their ordered specification-attribute definitions to an internal principal with `item.read`.
- `POST /item-categories` creates a versioned category with normalized uppercase `code`, `name`, and optional `description`.
- `PATCH /item-categories/{categoryId}` edits `code`, `name`, `description`, and `active` using `expectedVersion`. Deactivation is rejected while an active item references the category.
- `POST /item-categories/{categoryId}/specification-attributes` creates an ordered typed definition in an active category.
- `PATCH /item-categories/{categoryId}/specification-attributes/{attributeId}` edits the definition using `expectedVersion`; the route pair prevents moving a definition between categories.

Category codes are globally unique. Attribute codes are unique within their category. Codes are normalized to uppercase and retained when a record is deactivated, so an inactive record continues to reserve its code.

Definitions use `TEXT`, `NUMBER`, or `BOOLEAN`. They also carry `required`, `sortOrder`, `active`, optional description, and a version. Numeric definitions require decimal precision from zero through six and may reference an active unit; their precision cannot exceed the unit's precision. Text and boolean definitions cannot have a unit or decimal precision. A required definition cannot be added after active category items exist, and a definition cannot become required/active while an active item lacks its value. Once any value uses a definition, its data type, unit, and precision are immutable.

## Units of measure

- `GET /units-of-measure` returns all units to an internal principal with `item.read`.
- `POST /units-of-measure` creates `code`, `name`, `symbol`, and `decimalPrecision`.
- `PATCH /units-of-measure/{unitId}` edits those fields and `active` using `expectedVersion`.

Unit codes are globally unique and normalized to uppercase. Decimal precision is an integer from zero through six. Reducing unit precision is rejected if an active specification definition needs greater precision. Deactivation is rejected while an active item or active specification definition references the unit.

## Items and search

- `GET /items` supports `q`, `categoryId`, `unitOfMeasureId`, `active`, `sort`, `direction`, `page`, and `pageSize` with a maximum page size of 100. Search is case-insensitive over item code and name. Sort fields are `code`, `name`, and `updatedAt`. The response contains `data`, `pagination`, and `meta.requestId`.
- `POST /items` creates an active item from `code`, `name`, optional `description`, `itemCategoryId`, `unitOfMeasureId`, and the full `specificationValues` array.
- `GET /items/{itemId}` returns category, base unit, version, status, and typed specification values. A nonexistent item uses the generic not-found response.
- `PATCH /items/{itemId}` edits an active item's code, name, description, base unit, and full specification-value set using `expectedVersion`. `itemCategoryId` is deliberately absent: category is immutable after item creation.
- `POST /items/{itemId}/deactivate` requires `expectedVersion` and a reason of 5â€“500 characters. It changes only an active item to inactive and increments the version.

Item codes are globally unique and normalized to uppercase. Item creation and editing require active category/unit references. Every supplied attribute must be active and belong to the immutable item category; duplicate attribute IDs, unknown/inactive definitions, missing required values, empty values, and type mismatches are rejected. Numeric values cross JSON as strings, are stored as PostgreSQL decimal values, and cannot exceed the definition's decimal precision. The full value set is replaced atomically on edit.

Inactive items remain readable for traceability but are read-only. There is no `DELETE` route, foreign keys are restrictive, and a PostgreSQL trigger rejects direct item deletion.

## CSV export

`GET /items/export.csv` requires `item.export` and accepts the same `q`, `categoryId`, `unitOfMeasureId`, `active`, `sort`, and `direction` filters as the item list. Pagination parameters are not accepted. The operation rejects a result larger than 10,000 rows rather than silently truncating it.

The UTF-8 attachment is named `items.csv` and uses fixed columns: Code, Name, Description, Category code, Category name, Unit code, Unit symbol, Unit decimal precision, Status, and Specifications. Every cell is quoted and embedded quotes are doubled. Cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return are prefixed with an apostrophe before CSV escaping to prevent spreadsheet formula execution.

An `ITEMS_EXPORTED` audit event is committed before the export is returned. It records actor, actor organization, request/correlation identifiers, row count, and a non-sensitive filter summary. It does not record the CSV or search text.

## Audit, concurrency, and asynchronous work

Mutations write one of `ITEM_CATEGORY_CREATED`, `ITEM_CATEGORY_UPDATED`, `UNIT_OF_MEASURE_CREATED`, `UNIT_OF_MEASURE_UPDATED`, `SPECIFICATION_ATTRIBUTE_CREATED`, `SPECIFICATION_ATTRIBUTE_UPDATED`, `ITEM_CREATED`, `ITEM_UPDATED`, or `ITEM_DEACTIVATED` in the same transaction as the business change. Changes are redacted to identifiers and relevant before/after fields; specification contents are not copied into audit records. Audit write failure fails the business transaction.

Expected-version predicates protect edits and deactivation. Reference-master operations lock rows when concurrent reference creation or deactivation could violate an invariant. Phase 3A starts no asynchronous work, so these transactions create no outbox event.

## Internal interfaces and exclusions

The internal list is `/internal/items`; item detail is `/internal/items/{itemId}`. URL-backed filters, sorting, and pagination survive navigation. The UI exposes create/edit/reference-master controls only with `item.write`, export only with `item.export`, and no supplier item route.

Phase 3A does not implement BOMs, BOM or item revisions, spreadsheet import, procurement, supplier item collaboration, or readiness behavior.
