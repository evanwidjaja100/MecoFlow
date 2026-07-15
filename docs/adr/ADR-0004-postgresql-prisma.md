# ADR-0004: PostgreSQL and Prisma

## Status

Accepted — 2026-07-15

## Context

Operational quantities, workflow history and concurrency require relational integrity and transactions.

## Decision

Use PostgreSQL as source of truth and Prisma behind repositories. All schema changes are immutable committed migrations; decimals, constraints, transactions, UUIDs and versions protect integrity.

## Alternatives considered

Document databases, raw SQL as the primary access layer, and schema push without migrations.

## Consequences

Strong consistency and typed access; advanced locking may need carefully reviewed parameterized SQL/repository extensions.

## Security implications

Central repositories and parameterized access reduce injection and scope mistakes; database credentials stay server-side.

## Operational implications

Deployments run validated migrations, backups and restore checks before application rollout.
