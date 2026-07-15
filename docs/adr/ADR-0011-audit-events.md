# ADR-0011: Audit-event strategy

## Status

Accepted — 2026-07-15

## Context

Operational and security-relevant changes require immutable traceability tied to committed business state.

## Decision

Append immutable audit events in the same database transaction as business changes, including actor/scope/action/entity/request/correlation/outcome and redacted changes.

## Alternatives considered

Application logs only, mutable history tables and asynchronous best-effort audit.

## Consequences

Reliable evidence and investigation support; storage and redaction schemas require discipline.

## Security implications

Never record secrets, tokens, full files or unnecessary personal data; normal application code cannot update/delete events.

## Operational implications

Retention, export access and backup are controlled; audit write failure fails the related transaction.
