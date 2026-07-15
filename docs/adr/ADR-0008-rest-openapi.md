# ADR-0008: REST and OpenAPI

## Status

Accepted — 2026-07-15

## Context

Web, integrations and testing require stable, discoverable contracts.

## Decision

Expose versioned JSON REST below `/api/v1`, explicit command endpoints for transitions, shared schemas and generated OpenAPI checked in CI.

## Alternatives considered

GraphQL, RPC-only contracts and undocumented controllers.

## Consequences

Predictable HTTP semantics and tooling; representation changes require version discipline.

## Security implications

Documented validation/error contracts aid review; OpenAPI must not expose internal-only details or secrets.

## Operational implications

Generate and compare the contract in CI; use request/correlation IDs for support.
