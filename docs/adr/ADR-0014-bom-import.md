# ADR-0014: BOM import strategy

## Status

Accepted — 2026-07-15

## Context

BOM spreadsheets are untrusted, potentially large, ambiguous and operationally critical.

## Decision

Store uploads privately, parse `.xlsx`/`.csv` asynchronously without executing formulas/macros, produce row-level dry-run results, require confirmation, then create a draft revision transactionally with audit/outbox records.

## Alternatives considered

Synchronous request parsing, direct overwrite of BOMs and silent best-effort row import.

## Consequences

Safe reviewable imports and full error visibility; workflow is multi-step and needs job/status UX.

## Security implications

Validate MIME/extension/size/checksum, quarantine files, reject ZIP/executables and prevent spreadsheet formula injection in exports.

## Operational implications

Jobs use bounded resources, idempotency, retry/dead-letter behavior and cleanup for expired temporary uploads.
