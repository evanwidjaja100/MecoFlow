# MECO Flow

MECO Flow is PT Meco Inoxprima's secure project-material-readiness and supplier-collaboration platform. Phase 2 adds scoped projects, milestones, work packages, and explicit project-state transitions. Phase 3A adds the governed internal item master. Phase 3B adds project/work-package BOM aggregates and secure revision imports. Phases 4–6 add traceable requisitions, purchase orders, commitments, shipments, receiving, documents, inspections, NCRs, and concurrency-safe material allocation. Phase 7 adds exact material projection, versioned readiness snapshots, and internal dashboards. Phase 8A adds transactional readiness notifications. Phase 8B adds scoped operational reports, secure audited CSV/XLSX exports, exact supplier KPIs, own-supplier scorecards, and accessible trends.

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
| API metrics (local/private) | http://localhost:3001/metrics      |
| OpenAPI UI (non-production) | http://localhost:3001/api/docs     |
| Keycloak                    | http://localhost:8180              |
| MinIO console               | http://localhost:9001              |
| Mailpit                     | http://localhost:8025              |

`/health/live` proves only that the API process runs. `/health/ready` safely checks PostgreSQL, Redis and the configured private object-storage bucket. The worker writes a short-lived Redis heartbeat and processes BOM imports, readiness recalculation, and Phase 8A notifications. Local SMTP is captured by Mailpit; per-user email delivery defaults off. Compose publishes local dependency ports only on `127.0.0.1`.

## Repository structure

```text
apps/
  api/                 NestJS REST, OpenAPI, probes and request logging
  web/                 Next.js App Router foundation screen
  worker/              outbox import/readiness/notification processing and heartbeat
packages/
  config/              startup environment validation
  contracts/           shared trust-boundary schemas
  database/            Prisma client, migration and seed framework
  eslint-config/       shared strict lint rules
  readiness/           pure versioned material/readiness calculators
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
pnpm performance:measure
pnpm capacity:test
pnpm capacity:run
pnpm monitoring:config
pnpm monitoring:validate
pnpm operations:preflight:test
pnpm operations:preflight
pnpm security:audit
pnpm staging:config
pnpm staging:build
pnpm test:staging-smoke
pnpm verify
pnpm compose:down
```

Build before `pnpm test:e2e`; Playwright starts the built API and web processes. `pnpm db:migrate` safely applies committed migrations, while `pnpm db:migrate:dev` is the interactive local command for authoring a new migration. Other database commands are `pnpm db:deploy`, `pnpm db:seed`, and destructive local-only `pnpm db:reset`.

## Architecture and security

Read `AGENTS.md` before changes. The authoritative baseline is in `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/SECURITY_MODEL.md`, `docs/AUTHORIZATION_MATRIX.md`, and accepted records under `docs/adr/`. Secrets, tokens, production realm exports and customer data must not be committed.

API documentation files are at `docs/PROJECTS_API.md`, `docs/ITEM_MASTER_API.md`, `docs/BOM_API.md`, `docs/PURCHASE_REQUISITIONS_API.md`, `docs/PURCHASE_ORDERS_API.md`, `docs/DOCUMENTS_API.md`, `docs/ASN_RECEIVING_API.md`, `docs/RECEIVING_INSPECTIONS_API.md`, `docs/NCR_MATERIAL_ALLOCATION_API.md`, `docs/MATERIAL_REQUIREMENT_STATUS_API.md`, `docs/READINESS_API.md`, and `docs/NOTIFICATIONS_API.md`.

## Current status

See `IMPLEMENTATION_STATUS.md`, `docs/SECURITY_REVIEW.md`, and
`docs/PERFORMANCE_REVIEW.md`. Phase 9C staging preparation and smoke testing
are implemented; see `docs/DEPLOYMENT.md`, `docs/BACKUP_RESTORE.md`,
`docs/ROLLBACK_RUNBOOK.md`, and `docs/RELEASE_CHECKLIST.md`. This is not a
production-readiness claim. Do not begin restore acceptance, production
release, or another later phase without explicit instruction.
