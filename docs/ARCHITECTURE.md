# Architecture

## System shape

MECO Flow is a TypeScript modular monolith in a pnpm/Turborepo workspace. Deployable processes share contracts and infrastructure but remain independently startable:

```text
Browser -> Next.js web -> NestJS REST API -> application services -> policies/domain services -> repositories -> Prisma -> PostgreSQL
                                      |                                                    |
                                      +-> private S3-compatible storage                    +-> transactional outbox
                                                                                                      |
                                                                                               Redis-backed worker
```

`apps/web` is the App Router frontend, `apps/api` owns REST/OpenAPI and synchronous application behavior, and `apps/worker` owns bounded asynchronous work. `packages/contracts` contains transport-neutral schemas, `packages/database` owns Prisma, `packages/config` validates configuration, `packages/ui` contains local shared UI, and `packages/test-utils` contains deterministic fixtures.

## Boundaries

Controllers never access Prisma. The dependency direction is controller → application service → domain service/policy → repository → Prisma. Modules expose intentional public interfaces and may not import private implementation details from another module. Shared packages remain free of deployable-specific state.

PostgreSQL is the source of truth. Redis is coordination/queue infrastructure, not authoritative storage. MinIO supplies local private object storage. Keycloak is the identity source. Mailpit captures local mail. Asynchronous domain events use a transactional outbox once operational modules begin.

## Runtime foundations

- Strict TypeScript and startup environment validation.
- JSON request logs with request/correlation identifiers and secret redaction.
- `/health/live` reports process liveness; `/health/ready` checks PostgreSQL, Redis, and object storage without exposing credentials or detailed topology.
- REST resources live below `/api/v1`; OpenAPI is generated from the API and checked in CI.
- UTC crosses API and persistence boundaries; presentation uses configured locale and timezone.

## Security boundaries

Browser input, HTTP payloads, identity claims, environment values, files, spreadsheets, queue payloads, database JSON, and external responses are untrusted. Authentication uses Keycloak OIDC Authorization Code with PKCE and secure server-managed sessions in Phase 1. Authorization is permission and policy based, organization and project scoped, deny-by-default, and independently testable.

## Deployment

Local development uses Docker Compose for PostgreSQL, Redis, MinIO, Keycloak, and Mailpit while applications run through pnpm. Container definitions provide a staging-like path. Kubernetes and microservices are explicitly excluded. See `DEPLOYMENT.md` and accepted ADRs.
