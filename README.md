# MECO Flow

MECO Flow is PT Meco Inoxprima's secure project-material-readiness and supplier-collaboration platform. Phase 2 adds scoped projects, milestones, work packages, and explicit project-state transitions. Phase 3A adds the governed internal item master. Phase 3B adds project/work-package BOM aggregates, revision lifecycle and comparison, private CSV/XLSX dry-run imports, background validation, row-level results, explicit draft confirmation, transactional release/supersede, and released-only official requirements. Phase 4A adds project-scoped purchase requisitions, outstanding-need coverage, separately authorized over-need overrides, and explicit submit/approve/reject/cancel history. Phase 4B adds approved-quantity purchase orders, immutable requirement allocations and PO revisions, supplier-scoped acknowledgement, append-only commitment revisions, field filtering, and late-date exceptions. Phase 5A adds private scanned document workflows. Phase 5B adds supplier ASNs, shipment transitions, tablet receiving, immutable idempotent receipt posting, correcting entries, and awaiting-inspection lots. Inspection, NCR, allocation, and later operational modules remain intentionally unavailable.

## Prerequisites

- Node.js 24 LTS
- Corepack and pnpm 11
- Docker Desktop with Compose v2
- Git (for normal source-control and hook setup)
- Optional GNU Make; all Make targets have pnpm/PowerShell equivalents

## Local setup

From the repository root:

```text
corepack prepare pnpm@11.13.0 --activate
Copy-Item .env.example .env
pnpm install --frozen-lockfile
pnpm compose:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Review `.env` before use. Values in `.env.example` are explicitly local-only and must never be used outside local development. Production-mode service startup rejects these known local placeholders. The setup helper performs the same non-destructive initialization steps and does not overwrite an existing `.env`:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/setup.ps1
```

The helper initializes infrastructure and the database, then exits. Run `pnpm dev` afterward to start the web, API, and worker processes.
The web process reloads browser-facing changes automatically. Restart `pnpm dev` after changing API or worker source so their direct development processes reload cleanly on Windows and Unix-like systems.

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

`/health/live` proves only that the API process runs. `/health/ready` safely checks PostgreSQL, Redis and the configured private object-storage bucket. The worker writes a short-lived Redis heartbeat and performs no Phase 2 or Phase 3A asynchronous jobs. Compose publishes local dependency ports only on `127.0.0.1`.

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
pnpm test:authorization
pnpm build
pnpm test:e2e
pnpm openapi:generate
pnpm openapi:check
pnpm security:audit
pnpm verify
pnpm compose:down
```

Build before `pnpm test:e2e`; Playwright starts the built API and web processes. `pnpm db:migrate` safely applies committed migrations, while `pnpm db:migrate:dev` is the interactive local command for authoring a new migration. Other database commands are `pnpm db:deploy`, `pnpm db:seed`, and destructive local-only `pnpm db:reset`.

## Architecture and security

Read `AGENTS.md` before changes. The authoritative baseline is in `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/SECURITY_MODEL.md`, `docs/AUTHORIZATION_MATRIX.md`, and accepted records under `docs/adr/`. Secrets, tokens, production realm exports and customer data must not be committed.

## Current status

See `docs/IMPLEMENTATION_STATUS.md`. Work stops after Phase 5B ASN and receiving; do not begin receiving inspection, NCR, allocation, readiness, or another later phase without explicit instruction.
