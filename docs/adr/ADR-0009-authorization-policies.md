# ADR-0009: Authorization policy architecture

## Status

Accepted — 2026-07-15

## Context

Role checks alone cannot enforce supplier, organization, project, object, workflow and field scope.

## Decision

Compose authentication, active-profile/membership, permission, organization, project, object, state and field policies in server-side guards/services. Deny by default and make policies independently testable.

## Alternatives considered

UI route hiding, controller role strings and database-wide access per employee.

## Consequences

Explicit secure decisions and stronger tests; every endpoint requires policy design and scoped repository queries.

## Security implications

Inaccessible/not-found equivalence and Supplier A/B negative tests are mandatory.

## Operational implications

Permission and policy changes are reviewed, seeded, migrated where needed and audited.
