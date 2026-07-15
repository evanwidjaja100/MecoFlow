# ADR-0001: Modular monolith

## Status

Accepted — 2026-07-15

## Context

The platform spans related operational workflows that need strong transactions and consistent policy enforcement.

## Decision

Build cohesive business modules in one deployable API codebase with a separate web process and worker, enforcing intentional module interfaces.

## Alternatives considered

Microservices, event sourcing, and a single unstructured application.

## Consequences

Deployment and transactions stay simple; module boundaries require ongoing tests and review. Modules may be extracted only through a later ADR.

## Security implications

Central policy enforcement reduces gaps; internal module access still cannot bypass authorization.

## Operational implications

Scale API and worker processes independently while deploying one coordinated application version.
