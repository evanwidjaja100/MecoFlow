# Deployment and local setup

## Local topology

Docker Compose runs PostgreSQL on 5432, Redis on 6379, MinIO API/console on 9000/9001, Keycloak on 8180, and Mailpit SMTP/UI on 1025/8025. Applications normally run from pnpm on ports 3000 (web) and 3001 (API); the worker is headless. The non-default Keycloak host port avoids common local port collisions and is configurable through `KEYCLOAK_HTTP_PORT`.

Local Compose ports bind to `127.0.0.1` so development databases and administrative consoles are not exposed on LAN interfaces. Copy `.env.example` to `.env` only when `.env` does not exist and change local credentials as appropriate. Then run:

```text
corepack prepare pnpm@11.13.0 --activate
pnpm install --frozen-lockfile
pnpm compose:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`infra/scripts/setup.ps1` automates the non-blocking initialization sequence through database seed and then tells the developer to run `pnpm dev`. It resolves the repository root from its own location and never overwrites `.env`. Production-mode application startup rejects documented local placeholder values. Production/staging must use an external secret manager or injected secrets, TLS/reverse proxy, non-default Keycloak administrators, durable volumes, backups, monitoring and restricted administrative ports.

## Health

Use `/health/live` only for process liveness. `/health/ready` checks PostgreSQL, Redis and the configured private object-storage bucket and returns 503 when unavailable without credentials or detailed endpoints. Container health checks use service-native probes. No production deployment is authorized or performed by Phase 0.
