# ADR-0012: Deployment with containers

## Status

Accepted — 2026-07-15

## Context

Development and deployment need repeatable infrastructure without Kubernetes complexity.

## Decision

Use Docker Compose locally and container images for web/API/worker, with externalized secrets, non-root runtime users, health checks and pinned base-image majors.

## Alternatives considered

Host-level manual installs, Kubernetes and serverless decomposition.

## Consequences

Reproducible environments and simple operations; Compose production sizing/failover is limited and must be documented.

## Security implications

Keep administrative ports private, images minimal/non-root and credentials injected rather than baked.

## Operational implications

Staging-like verification builds images, runs migrations separately and uses durable volumes plus backups.
