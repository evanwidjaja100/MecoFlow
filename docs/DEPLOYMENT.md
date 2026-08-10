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

The local example explicitly enables SMTP against loopback Mailpit (`SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025`, `SMTP_SECURE=false`). Omitting `SMTP_ENABLED` disables delivery safely. Production enabled SMTP requires a nonlocal host, implicit TLS, nonlocal sender address, username, and injected password; none of those secrets belongs in source control.

## Phase 9A runtime security

The API, worker, and web production images execute as the unprivileged
`node` user. Runtime application code and dependency artifacts remain
root-owned and non-writable by that user. Do not override `USER`, mount a
writable source tree over `/workspace`, or make deployed artifacts writable.
Use a read-only root filesystem where the target platform supports it and add
only explicit writable temporary mounts if a verified runtime need appears.

The web image emits the repository security-header policy, including HSTS.
Production must terminate HTTPS correctly and preserve the original host and
scheme. The API permits only configured exact CORS origins and all production
origins/redirects must use HTTPS. Configure trusted proxy behavior and
upstream/global rate limiting as part of the deployment topology; the
application limiter is process-local.

The repository supports dependency audit and production image builds but does
not currently provide an image-OS CVE scanner. A deployment pipeline must add a
maintained scanner and a documented severity/exception policy before release.

## Health

Use `/health/live` only for process liveness. `/health/ready` checks PostgreSQL, Redis and the configured private object-storage bucket and returns 503 when unavailable without credentials or detailed endpoints. Container health checks use service-native probes. No production deployment is authorized or performed by Phase 0.

## Phase 9C staging topology

`compose.staging.yaml` is the production-oriented staging topology. It is not a
production-readiness claim. Only nginx publishes a host port
(`127.0.0.1:8443` by default). PostgreSQL, Keycloak PostgreSQL, Redis, MinIO,
ClamAV, Keycloak, API, worker, and web remain on private Compose networks.
nginx terminates TLS and routes the web application, API health/API routes,
and the required Keycloak realm/static routes; `/admin/` is not exposed.

All long-running containers are configured and verified with non-root users.
The API, worker, web, migration, MinIO, ClamAV, and operations images have
separate build/runtime stages or derive a minimal purpose-specific runtime
from pinned service images. Application images contain compiled/standalone
runtime artifacts rather than source or tests. Images carry OCI created,
revision, title, and application-version labels. Every service uses Docker
`json-file` rotation at 10 MiB and five files.

Durable named volumes are:

- `postgres-staging-data` for the application database;
- `keycloak-postgres-staging-data` for Keycloak;
- `redis-staging-data` for Redis AOF data;
- `minio-staging-data` for private object data;
- `clamav-staging-data` for signature databases; and
- `backup-staging-data` for local staging backup sets.

The backup volume is not an off-host or encrypted production backup. Export it
to approved protected storage before relying on it for recovery.

## External staging configuration and secrets

Run the preparation script from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/prepare-staging.ps1
```

It creates ignored `.runtime/staging/staging.env`, secret files under
`.runtime/staging/secrets`, and a 30-day self-signed certificate under
`.runtime/staging/tls`. Existing secrets are retained unless
`-RotateSecrets`; S3 credentials alone can be rotated with
`-RotateS3Credentials`. `.runtime/` is ignored by Git. No secret value is
placed in Compose environment metadata or an image: services receive Docker
secret file mounts and construct connection strings in memory.

The generated material is for a local staging rehearsal. A shared staging
host must replace it with values from the organization secret manager and
restrict host-file ACLs to the deployment identity. Do not copy `.env.example`
credentials, commit `.runtime`, pass a secret as a build argument, or paste
secret values into commands/logs.

## TLS

Local rehearsal uses `https://mecoflow.localhost:8443`. nginx enables TLS 1.2
and 1.3, HSTS, bounded request bodies, and forwarded host/protocol headers.
The API receives only the public local CA certificate so it can validate the
public HTTPS OIDC issuer; the private key is mounted only into nginx.

For shared staging, install a certificate and key issued for
`STAGING_PUBLIC_URL` at the external runtime paths represented by
`tls/tls.crt` and `tls/tls.key`. Include the full intermediate chain, protect
the key with deployment-only ACLs, verify the hostname/SAN and expiry, then
recreate nginx and API. Confirm `/health/ready`, OIDC login/callback, HSTS, and
the smoke suite after rotation. Production certificates, DNS, ingress policy,
renewal automation, and external load-balancer behavior remain unverified.

## Controlled deployment

Do not configure an application container to run migrations on every start.
Use the explicit one-shot jobs, stop immediately on failure, and preserve the
failed migration record:

```powershell
pnpm staging:config
pnpm staging:build
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml --profile operations up -d --wait postgres keycloak-db redis minio clamav keycloak
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml run --rm minio-init
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml --profile operations run --rm migrate
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml --profile operations run --rm seed
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml --profile operations run --rm staging-smoke-prepare
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml up -d --wait api worker web proxy
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/run-staging-smoke.ps1
```

`staging-smoke-prepare` is fail-closed unless `APP_ENV=staging` and
`STAGING_SMOKE_FIXTURES=true`; never run it in production. Seed follows schema
migration and reconciles the authoritative role/permission matrix.

Prisma migrations are forward-only in deployed environments. On failure,
leave traffic closed, inspect `_prisma_migrations` and database logs, and test
the repair against a restored copy. Use `prisma migrate resolve` only after an
operator establishes whether a transactional migration was rolled back or a
manual forward fix completed. Never edit an already accepted/applied
migration. See `ROLLBACK_RUNBOOK.md`.

## Phase 9C staging evidence (2026-07-30)

Before starting a candidate, build every project-owned image and run the
fail-closed image gate described in `CONTAINER_SECURITY.md`:

```powershell
pnpm staging:build
pnpm security:image-scan:test
pnpm security:image-scan
```

Do not deploy when the scan exits nonzero. Raw reports remain under ignored
`.runtime/security-scans`; copy only the reviewed summary to the approved
release-evidence store. As of 2026-08-01, ten of eleven images are clean and
Keycloak 26.7.0 blocks the candidate, so the following historical staging
evidence does not authorize production or a new release.

The exact controlled commands above built version
`0.1.0-staging.1` at revision
`4993b56f7baa690a7e78853b85a634a988a58a3b`, applied all 22 migrations,
provisioned isolated smoke principals, and brought every service to healthy.
Runtime inspection found no root process and no secret value in Docker inspect
metadata. The Playwright staging suite passed 3/3 after authentication, an
internal project creation, Supplier A and Supplier B scorecard/project access,
and bidirectional foreign-project 404 checks.

Backup set `phase9c-smoke-20260730T1415Z` passed archive checksums and
`pg_restore --list` validation. Recreating the application database, Keycloak
database, Redis, and MinIO containers retained a smoke project, the staging
realm, and an object-storage sentinel. A destructive restore was deliberately
not performed in that Phase 9C run.

## Isolated restore evidence (2026-08-01)

`pnpm staging:restore-rehearsal` now creates representative secured documents,
quiesces and stops the source, mounts its immutable backup volume read-only,
recreates separately namespaced target volumes, proves all target data stores
are empty, restores application/Keycloak PostgreSQL and MinIO, and executes the
restored browser suite. Set `restore-rehearsal-20260801T081143Z-r1` restored
with matching fixed counts and three object checksums. Authentication,
documents, sample readiness, permission denial, internal flow, and
bidirectional supplier isolation passed in 644.129 seconds. Exact commands,
counts, failures, and corrective actions are in `BACKUP_RESTORE.md`.

The local MinIO rehearsal has no KMS and is not encrypted at rest; production
continues to require a KMS-capable object store. Production readiness remains
blocked on acceptance testing, externally managed TLS/secrets/KMS, off-host
encrypted backup, monitoring/alert ownership, the unresolved combined-suite
authorization flake, and release approval.

## Production external-control preflight

Production deployment must use the external contract in
`PRODUCTION_CONTROLS.md`. Runtime images accept secret-manager files through
the documented `_FILE` variables; the non-secret production environment
template and evidence schemas are under `infra/production/`. Production object
storage must use HTTPS and explicitly select `aws:kms` with a key identifier or
`AES256` backed by an externally proven provider KMS. Before opening traffic,
run `pnpm production:preflight` against a manifest outside the repository and
retain its safe ignored summary.

The verifier validates delivered secret files without printing them, the TLS
chain/hostname/validity/key match, current private/versioned KMS object-storage
evidence, and a recent encrypted cross-failure-domain backup plus restore
evidence. A repository-only or placeholder manifest fails closed. A passing
static preflight still requires owners to authenticate the external provider
audit trail and does not override the Keycloak image gate, monitoring, capacity,
acceptance, or formal approval blockers.

## Monitoring overlay and operational preflight

`compose.monitoring.yaml` adds private Prometheus, Alertmanager, and HTTPS
black-box probing without publishing another host port. Validate and start it
only after the controlled application deployment:

```powershell
pnpm monitoring:config
pnpm monitoring:validate
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml -f compose.monitoring.yaml --profile monitoring up -d --wait alertmanager blackbox prometheus
```

Prometheus retains up to 30 days or 8 GB in a named volume. The tracked
Alertmanager configuration is observation-only. A production deployment must
mount an external secret-backed receiver configuration, protect monitoring UI
access, retain provider evidence, and complete the firing/resolved/escalation
drill in `ON_CALL.md`.

After a production-equivalent read-only capacity run, point
`MECOFLOW_OPERATIONAL_READINESS_FILE` to the external evidence manifest and
run `pnpm operations:preflight`. A failed monitoring, paging, or capacity check
keeps traffic closed. A passing repository verifier still requires provider
record authentication and formal operations/security/release approval.
