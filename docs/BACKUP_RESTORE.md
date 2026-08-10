# Backup and restore

## Staging implementation

`infra/staging/backup.sh` creates an immutable, operator-quiesced backup set
containing custom-format application and Keycloak PostgreSQL dumps, both dump
catalogs, a Keycloak realm partial export, the private MinIO bucket, fixed
application and realm record counts, document and complete-bucket SHA-256
inventories, application/schema metadata, a complete-set SHA-256 manifest, and
a `COMPLETE` marker written only after validation.

The purpose-specific operations image runs as UID 70. Database, Keycloak
administrator, and object-store credentials are read from external Docker
secret mounts and are never written to a backup set. Backup sets and runtime
secrets remain under ignored Docker volumes or `.runtime/staging`; never copy
them into Git.

`infra/staging/restore.sh` defaults to validation-only. An actual restore
requires two explicit confirmations. With `RESTORE_REQUIRE_EMPTY=true`, it
fails before modifying either database unless the application schema,
Keycloak schema, and target object bucket are all empty. After restore it
compares the fixed record-count inventories, mirrors the restored bucket back
to a temporary directory, verifies document and full-bucket checksums, and
compares realm-specific Keycloak counts.

## Operator procedure

Prepare ignored staging secrets/TLS as documented in `DEPLOYMENT.md`, then run
the complete rehearsal from the repository root:

```powershell
pnpm staging:restore-rehearsal
```

An optional immutable identifier may be supplied directly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/run-backup-restore-rehearsal.ps1 `
  -BackupId restore-rehearsal-YYYYMMDDTHHMMSSZ
```

The script uses exactly these Compose project boundaries:

- source: `mecoflow-staging`;
- clean target: `mecoflow-restore-rehearsal`;
- source backup volume: `mecoflow-staging_backup-staging-data`, mounted
  read-only by the target restore service; and
- target database/object volumes: separately namespaced
  `mecoflow-restore-rehearsal_*` volumes, deleted and recreated before every
  attempt.

It builds the operations/application images, applies all migrations, seeds and
provisions fictional staging identities, creates two representative documents
through authenticated application/storage flows, quiesces proxy/web/API/worker
writes, creates and validates the backup, stops every source service, creates
fresh target volumes, restores with the empty-target guard, reruns migration
deployment, starts the target stack, and executes restored application smoke
tests. Recovery starts immediately before the actual restore command and ends
only after the restored browser checks pass.

Do not validate a restoration against the source services. Do not restart the
source during target verification. Do not reuse a failed backup identifier or
overwrite an existing set.

## Verified rehearsal evidence — 2026-08-01

Environment assumptions:

- local Docker Desktop on Windows, loopback staging URL
  `https://localhost:8443`, generated rehearsal CA, and external ignored
  file-injected secrets;
- source and target run on one Docker host for this rehearsal, but use distinct
  Compose projects and distinct persistent state volumes;
- application `0.1.0-staging.1`, OCI revision
  `4993b56f7baa690a7e78853b85a634a988a58a3b`;
- schema version `20260728030000_phase_9b_readiness_query_index`, 22 applied
  migrations; and
- backup set `restore-rehearsal-20260801T081143Z-r1`, created
  `2026-08-01T09:00:43Z`. The source document fixture identifier is
  `restore-rehearsal-20260801T081143Z`.

The accepted set recorded these source counts, all of which matched immediately
after restore and before the restored worker performed legitimate new work:

| Inventory                                     |      Count |
| --------------------------------------------- | ---------: |
| audit events                                  |         28 |
| document associations / versions / documents  |  5 / 5 / 5 |
| memberships / organizations / user profiles   |  3 / 3 / 3 |
| permissions / roles                           |    76 / 14 |
| project members / projects                    |      8 / 6 |
| readiness snapshots                           |          8 |
| Keycloak realm clients / credentials / groups |  7 / 3 / 0 |
| Keycloak realm rows / roles / users           | 1 / 31 / 3 |
| completed document checksum entries           |          2 |
| complete object-store checksum entries        |          3 |

The restored application showed both representative documents: one approved
certificate and one retained clean draft packing list. Both completed document
objects and the pre-existing persistence sentinel matched SHA-256. Failed
upload initiations remained auditable database records but were intentionally
excluded from the completed-object checksum inventory.

The final recovery started at `2026-08-01T09:03:02.1286604Z`, completed at
`2026-08-01T09:13:46.2581040Z`, and took **644.129 seconds**. The final
Playwright result was 4 passed and 1 source-only test skipped. Verification
proved:

- dependency-aware health and TLS/version metadata;
- restored Keycloak authentication for internal and both supplier personas;
- an authenticated internal core project flow;
- presence of both representative documents;
- sample-project readiness recalculated from restored authoritative inputs as
  `RED`, score `0`, line count `0`, with the expected no-current-requirements
  explanation;
- Supplier A denial of internal readiness with HTTP 403 / `ACCESS_DENIED`; and
- bidirectional Supplier A/Supplier B foreign/nonexistent equivalence and
  server-side supplier field minimization.

All target services reported healthy after verification. API, worker, and web
ran as `node`; nginx ran as `101:101`. Only nginx published a host port. Every
source service was stopped during and after target verification.

### Commands and results

The accepted run used the scripted sequence above plus these evidence and
regression commands:

```powershell
docker compose --project-name mecoflow-staging --env-file .runtime/staging/staging.env --file compose.staging.yaml stop
docker compose --project-name mecoflow-restore-rehearsal --env-file .runtime/staging/staging.env --file compose.staging.yaml --file compose.restore-rehearsal.yaml --profile operations down --volumes --remove-orphans
docker compose --project-name mecoflow-restore-rehearsal --env-file .runtime/staging/staging.env --file compose.staging.yaml --file compose.restore-rehearsal.yaml --profile operations run --rm -e BACKUP_SET=restore-rehearsal-20260801T081143Z-r1 -e RESTORE_VALIDATE_ONLY=false -e RESTORE_CONFIRM=RESTORE_STAGING -e RESTORE_ALLOW_OBJECT_DELETE=true -e RESTORE_REQUIRE_EMPTY=true restore
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/run-staging-smoke.ps1 -RuntimeDirectory .runtime/staging -Mode RestoredTarget -BackupRehearsalId restore-rehearsal-20260801T081143Z
pnpm format:check
pnpm lint
pnpm typecheck
pnpm --filter @mecoflow/api test -- document-storage.service.test.ts
pnpm test:authorization
pnpm --filter @mecoflow/api exec vitest run -c vitest.authorization.config.ts src/boms/boms.authorization.integration.test.ts -t "keeps every Phase 7B dashboard internal, scoped, and explanation complete" --reporter=verbose
```

Results: backup manifest/dump validation passed; clean-target proof passed;
record-count and checksum comparison passed; all 22 migrations were already
applied after restore; restored browser smoke passed 4/4 applicable tests;
format, lint, and strict typecheck passed; focused storage tests passed 4/4.
The full authorization run passed 52/53, with one readiness-management test
returning 500 under the combined suite; that same test passed 1/1 in isolation.
This unresolved full-suite flake is not hidden and remains a release risk.

### Failures and corrective actions

1. The first backup attempts failed because the checksum query used snake-case
   names for Prisma camel-case columns, `psql -c` did not expand a realm
   variable, and Keycloak 26 stores lowercase PostgreSQL identifiers. The
   queries now use validated identifiers and the actual schemas.
2. The initial object-empty proof used an unsupported `mc find --type` flag,
   and a pipeline masked its exit status. Restore now runs `mc ls --recursive
--json` into a temporary file before either database restore and fails on
   any command error or object row.
3. Staging document uploads initially failed because the Next.js server lacked
   backend-network access and the signed content-type/encryption header contract
   was incomplete. Network attachment and presigned headers were corrected and
   covered by focused tests.
4. The pinned local MinIO cannot provide SSE-S3 without an external KMS.
   Production (`APP_ENV=production`) still requires the encryption request;
   this local staging rehearsal is explicitly unencrypted at rest and is not a
   production-readiness claim.
5. Two rehearsal assertions incorrectly expected a synthetic `AMBER/88`
   snapshot and error code `FORBIDDEN`. The running worker correctly
   recalculated the project from authoritative inputs as `RED/0`, and the
   documented denial code is `ACCESS_DENIED`. Tests now verify actual stable
   application behavior without disabling the worker.
6. The first authorization regression attempt lacked a prepared local database;
   after migration and seed, 52/53 passed. The remaining combined-suite
   readiness 500 passes alone and is recorded as unresolved rather than
   bypassed.

## Recovery policy and remaining risks

This exercise proves one local, single-host restore. It does not prove an
approved production RPO/RTO, encrypted/off-host media, KMS integration,
cross-host transfer, retention/legal hold, automated backup monitoring,
multi-node object storage, production CA/secret manager, or business
acceptance. The measured 644.129 seconds is evidence, not an approved RTO.

Business owners must approve RPO/RTO, retention, legal hold, encryption,
off-host replication, monitoring, access ownership, and restore-drill
frequency. Export local sets only to approved encrypted, access-controlled
storage. Production rollback remains forward-fix for database migrations; do
not run unreviewed down-migrations or restore over an active/shared system.

## Production off-site handoff contract

`infra/production/offsite-backup-evidence.example.json` defines the safe
handoff record for a provider-specific off-site copy. The copy job must consume
only a completed/checksummed coordinated set, write to a separate failure
domain using the approved backup KMS key, apply immutable/versioned retention,
verify the remote checksum, and retain the provider audit record. Backup bytes,
database credentials, object credentials, and encryption material never belong
in the evidence JSON or Git.

`pnpm production:preflight` rejects an off-site copy older than the declared
RPO, a mismatched target/KMS reference, an unverified checksum, or stale restore
evidence. This repository cannot execute a provider transfer without an
approved target and credentials; a successful local backup or local restore
does not satisfy this production control. See `PRODUCTION_CONTROLS.md`.
