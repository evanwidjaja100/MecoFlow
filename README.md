# MECO Flow

MECO Flow is PT Meco Inoxprima's secure project-material-readiness and supplier-collaboration platform. Phase 0 contains architecture and repository foundations only; no operational business module or production authentication is enabled.

## Prerequisites

- Node.js 24 LTS
- Corepack and pnpm 11
- Docker Desktop with Compose v2
- Git (for normal source-control and hook setup)
- Optional GNU Make; all Make targets have pnpm/PowerShell equivalents

## Local setup

From the repository root:

```text
corepack enable
corepack prepare pnpm@11.13.0 --activate
Copy-Item .env.example .env
pnpm install
pnpm compose:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Review `.env` before use. Values in `.env.example` are explicitly local-only and must never be used outside local development. The setup helper performs the same non-destructive sequence and does not overwrite an existing `.env`:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/setup.ps1
```

## Local services

| Service                     | Address                            |
| --------------------------- | ---------------------------------- |
| Web                         | http://localhost:3000              |
| API liveness                | http://localhost:3001/health/live  |
| API readiness               | http://localhost:3001/health/ready |
| OpenAPI UI (non-production) | http://localhost:3001/api/docs     |
| Keycloak                    | http://localhost:8180              |
| MinIO console               | http://localhost:9001              |
| Mailpit                     | http://localhost:8025              |

`/health/live` proves only that the API process runs. `/health/ready` safely checks PostgreSQL, Redis and object storage. The worker writes a short-lived Redis heartbeat and performs no Phase 1+ jobs.

## Repository structure

```text
apps/
  api/                 NestJS REST, OpenAPI, probes and request logging
  web/                 Next.js App Router foundation screen
  worker/              validated worker/heartbeat foundation
packages/
  config/              startup environment validation
  contracts/           shared trust-boundary schemas
  database/            Prisma client, migration and seed framework
  eslint-config/       shared strict lint rules
  test-utils/          deterministic fixture helpers
  typescript-config/   strict shared compiler settings
  ui/                  local accessible UI primitives
docs/                  requirements, architecture, operations and ADRs
infra/                 local Keycloak, setup and infrastructure guidance
tests/                 Playwright, fixtures and security test roots
```

## Development commands

```text
pnpm dev
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm test:e2e
pnpm openapi:generate
pnpm verify
pnpm compose:down
```

Build before `pnpm test:e2e`; Playwright starts the built API and web processes. `pnpm db:migrate` safely applies committed migrations, while `pnpm db:migrate:dev` is the interactive local command for authoring a new migration. Other database commands are `pnpm db:deploy`, `pnpm db:seed`, and destructive local-only `pnpm db:reset`.

## Architecture and security

Read `AGENTS.md` before changes. The authoritative baseline is in `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/SECURITY_MODEL.md`, `docs/AUTHORIZATION_MATRIX.md`, and accepted records under `docs/adr/`. Secrets, tokens, production realm exports and customer data must not be committed.

## Current status

See `docs/IMPLEMENTATION_STATUS.md`. Do not begin Phase 1 without explicit instruction.
