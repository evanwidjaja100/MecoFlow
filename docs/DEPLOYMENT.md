# Deployment and local setup

## Local topology

Docker Compose runs PostgreSQL on 5432, Redis on 6379, MinIO API/console on 9000/9001, Keycloak on 8180, and Mailpit SMTP/UI on 1025/8025. Applications normally run from pnpm on ports 3000 (web) and 3001 (API); the worker is headless. The non-default Keycloak host port avoids common local port collisions and is configurable through `KEYCLOAK_HTTP_PORT`.

Copy `.env.example` to `.env` only when `.env` does not exist and change local credentials as appropriate. Then run:

```text
corepack enable
pnpm install
pnpm compose:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`infra/scripts/setup.ps1` automates the non-destructive local sequence. It never overwrites `.env`. Production/staging must use an external secret manager or injected secrets, TLS/reverse proxy, non-default Keycloak administrators, durable volumes, backups, monitoring and restricted administrative ports.

## Health

Use `/health/live` only for process liveness. `/health/ready` checks required dependencies and returns 503 when unavailable without credentials or detailed endpoints. Container health checks use service-native probes. No production deployment is authorized or performed by Phase 0.
