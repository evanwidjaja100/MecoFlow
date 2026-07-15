# ADR-0006: Redis queue and transactional outbox

## Status

Accepted — 2026-07-15

## Context

Notifications, imports and projections need asynchronous work without publishing uncommitted state.

## Decision

Use PostgreSQL transactional outbox records and Redis-backed bounded worker jobs. Workers re-read authoritative state and use deterministic names/idempotency keys, backoff, timeouts and dead-letter states.

## Alternatives considered

Publishing directly inside requests, database polling without queue coordination, and external event streaming.

## Consequences

Reliable commit coupling and replay at the cost of outbox/worker operations and eventual delivery.

## Security implications

Queue payloads contain identifiers/minimal metadata, never secrets, tokens, files or large domain objects.

## Operational implications

Monitor queue depth, heartbeat, retries and dead letters; Redis loss does not replace PostgreSQL state.
