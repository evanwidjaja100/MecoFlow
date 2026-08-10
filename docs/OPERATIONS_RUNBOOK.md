# Operations runbook

## First response

Check process liveness, readiness, structured logs by request/correlation ID, PostgreSQL, Redis, object storage, worker heartbeat, queue depth and failed jobs. Do not expose dependency configuration through public probes or paste secrets into incidents.

## Common local recovery

- A failed readiness response: inspect the named dependency's container health and safe logs, then retry after recovery.
- Migration failure: stop application rollout, preserve data, inspect the failed migration and restore/test in an isolated environment; never edit an applied migration.
- Repeated job failure: stop retry amplification, retain the dead-letter record and idempotency key, fix the cause, then replay through a controlled procedure.
- Suspected credential exposure: revoke/rotate immediately, preserve audit evidence and follow the security incident channel.

Production thresholds, on-call ownership, paging drills, monitoring topology,
and capacity evidence are defined in `MONITORING.md`, `ON_CALL.md`, and
`CAPACITY_READINESS.md`. The tracked staging Alertmanager receiver is
observation-only and cannot satisfy production paging evidence.

## Monitoring first response

Use private Prometheus/Alertmanager access; never expose `/metrics` publicly.
Confirm whether the alert is firing, whether collection itself is healthy, and
whether public dependency-aware readiness agrees. Record UTC time, candidate
version, affected service/event type, request/correlation IDs, and the alert
fingerprint. Do not put request bodies, queue payloads, provider receiver URLs,
cookies, tokens, object keys, or supplier identifiers into incident records.

| Alert                                  | First response and safe mitigation                                                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `MecoFlowPublicEndpointDown`           | Verify DNS/TLS/proxy and `/health/ready`; close rollout/traffic if dependency readiness fails.                                |
| `MecoFlowTlsCertificateExpiring`       | Verify current chain and renewal automation; rehearse replacement and rerun OIDC/TLS smoke before expiry.                     |
| `MecoFlowApiMetricsTargetDown`         | Compare API readiness/container health; restore private scrape routing without publishing metrics.                            |
| `MecoFlowDependencyDown`               | Identify the dependency label, inspect its private health/logs, and preserve data before restart/failover.                    |
| `MecoFlowMonitoringCollectionFailed`   | Treat queue/dependency dashboards as incomplete; repair collection and use authoritative database/provider checks meanwhile.  |
| `MecoFlowHighServerErrorRatio`         | Identify route templates/status classes and correlate redacted logs; rollback when tied to the candidate.                     |
| `MecoFlowHighRequestLatency`           | Inspect database/object latency, statement timeouts, event-loop lag, and resource headroom before scaling or changing limits. |
| `MecoFlowApiMemoryPressure`            | Capture workload/heap/resource evidence; scale or controlled-restart only after checking leak and recurrence risk.            |
| `MecoFlowEventLoopLag`                 | Identify CPU-bound synchronous work and current traffic; apply bounded traffic reduction or rollback.                         |
| `MecoFlowWorkerHeartbeatStale`         | Verify deployed version, worker/container health, and Redis; restart only after checking claimed work/idempotency.            |
| `MecoFlowOutboxBacklog*`               | Identify event type and oldest age, repair its dependency, and measure drain/recovery before adding concurrency.              |
| `MecoFlowOutboxProcessingStuck`        | Preserve the exact row/lock and confirm worker death plus idempotency before releasing or replaying.                          |
| `MecoFlowOutboxTerminalFailure`        | Preserve dead-letter/failure evidence; controlled replay requires cause correction and approval.                              |
| `MecoFlowEmailDeadLetter`              | Determine ambiguous-send risk; never automatically resend a stale `PROCESSING` delivery.                                      |
| `MecoFlowPrometheusConfigReloadFailed` | Keep the last valid config, run `pnpm monitoring:validate`, and correct the rejected change.                                  |
| `MecoFlowAlertDeliveryFailures`        | Use the alternate escalation path, protect receiver credentials, and restore then drill firing/resolved delivery.             |

Warnings require acknowledgement within 60 minutes; critical alerts within 15
minutes. Authentication, supplier isolation, audit, security, or data-integrity
impact is always critical. Follow `ON_CALL.md` for escalation and closure.

## Phase 8A notification operations

Structured worker logs emit `notification.processed`, `notification.failed`, and one-minute `notification.queue.snapshot` records. Monitor pending age/count, processing rows older than five minutes, retry error codes, and both outbox/email `DEAD_LETTER` counts. Logs deliberately omit recipient addresses, subjects, bodies, credentials, and project content.

SMTP is optional. Local `.env.example` enables loopback Mailpit at port 1025 and Mailpit UI is at `http://localhost:8025`. Production SMTP must use injected credentials and implicit TLS; startup fails closed for localhost, local sender, missing credentials, or insecure enabled configuration. Disabling SMTP records requested email deliveries as `SKIPPED` while in-app delivery continues.

For a dead letter, retain the row, correlate by event/message ID, fix the dependency or data defect, and determine whether an SMTP `PROCESSING` attempt may already have been accepted. Never automatically resend an ambiguous attempt. Recovery is a controlled database/operator procedure against the exact row; record the approval and outcome. Phase 8A does not expose an end-user or public dead-letter replay endpoint.

## Phase 8B report and export operations

Report and scorecard exports are synchronous and fail closed above 10,000 data
rows; they never truncate silently. Investigate repeated limit failures by
confirming the caller's authorized filters and narrowing the date or project
scope. Do not raise the limit without a capacity and data-exposure review.

Every delivered CSV or XLSX has a corresponding immutable `REPORT_EXPORTED`
audit event. Treat an export response without audit evidence as an incident;
the application is designed to withhold bytes if the audit write fails. Audit
metadata contains the report key, format, normalized non-sensitive filters,
generation timestamp, row count, request ID, and correlation ID. It must not
contain report rows, prices, internal notes, or free-text search values.

For disputed supplier results, preserve the selected filters and
`generatedAt`, then compare the source facts with model version
`supplier-scorecard-calculator-v1`. Original and latest commitment performance
are intentionally separate. Empty denominators display as `No eligible data`
and must not be interpreted as zero. Report queries are live reads; Phase 8B
does not create a historical report snapshot or background export job.

## Phase 9A security operations

Treat repeated `REQUEST_TOO_LARGE` (413), `RATE_LIMIT_EXCEEDED` (429), rejected
CORS origins, OIDC claim failures, CSRF failures, or object-scope denials as
signals to correlate by request/correlation ID. Logs deliberately omit raw
exception text, traces, credentials, tokens, storage keys, notification
content, and export rows; do not disable redaction during incident response.

Run `pnpm security:audit` with the frozen lockfile during dependency review and
before release. A newly reported advisory requires affected-path analysis,
patched-version verification, complete tests/builds, and an explicit residual
risk if no patch exists. Do not use a broad override without documenting its
compatibility and maintenance impact.

Verify production application images still run as non-root and that
`/workspace` code is not writable by the runtime user. Unexpected writable
code, changed image user, weakened browser headers, or cacheable authenticated
API responses is a release blocker. The complete review and current residual
risks are in `SECURITY_REVIEW.md`.

## Phase 9C staging operations

Use `compose.staging.yaml` only with the ignored external runtime directory.
The controlled start, migration, seed, smoke-fixture, and test sequence is in
`DEPLOYMENT.md`; backup/restore commands are in `BACKUP_RESTORE.md`; rollback
is in `ROLLBACK_RUNBOOK.md`.

First-response staging commands:

```powershell
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml --profile operations ps
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml logs --since=15m --no-color <service>
curl.exe -k --resolve mecoflow.localhost:8443:127.0.0.1 https://mecoflow.localhost:8443/health/ready
```

`/health/live` is process-only. `/health/ready` verifies application database,
password-protected Redis, and authenticated access to the configured private
bucket. Web health verifies the built web version; worker health verifies a
matching, fresh Redis heartbeat. Keycloak and its database, ClamAV, MinIO,
Redis, PostgreSQL, nginx, and web/API use actual service/readiness probes.

The only published endpoint is loopback TLS port 8443. Do not publish database,
Redis, MinIO console, Keycloak management, or ClamAV ports. Docker rotates each
service's JSON logs at 10 MiB with five files. Correlate API entries by request
and correlation ID and retain migration/backup/deployment evidence without
copying secret files.

For credential exposure, close traffic, preserve safe evidence, rotate the
external secret, reprovision the dependent account where required, and
recreate affected services. S3 access-key identifiers are credentials even
when the secret key is not printed; suppress provisioning output and rotate
both values after exposure.

Before backup, stop proxy/web/API/worker to quiesce writes. The restore service
validates by default and requires two explicit destructive confirmations for
database/object replacement. A validated archive is not proof of recovery;
Phase 9C still requires a witnessed isolated full restore before any production
readiness claim.

Before each deployment, run the complete image gate in
`CONTAINER_SECURITY.md`. On failure, keep traffic closed, retain the ignored
JSON summary, identify the image/package/fixed version, and prefer a supported
upstream image or rebuilt project-owned image. Never use `--ignore-unfixed`,
lower the severity threshold, delete a finding, or add a broad exception.
Where no supported fix exists, the security/release owner must document and
approve an exact expiring exception plus compensating controls; a pending or
expired exception blocks release. Rebuild and rescan after remediation, then
exercise health, authentication, supplier isolation, object storage, backup,
and restore paths affected by the changed image.

## Production secret, TLS, KMS, and off-site controls

Before any production mutation or traffic opening, run
`pnpm production:preflight` with `MECOFLOW_PRODUCTION_CONTROL_FILE` pointing to
the access-controlled manifest outside the repository. Retain only the safe
summary. A missing/stale evidence file, secret symlink or unsafe POSIX mode,
placeholder/duplicate secret, TLS chain/hostname/key failure, unencrypted KMS
probe, public bucket, stale off-site copy, checksum failure, or stale restore
rehearsal blocks deployment.

For a secret delivery failure, keep traffic closed, inspect the secret-manager
job and ACLs without printing values, rotate any possibly exposed credential,
and recreate the affected containers. For TLS failure, do not use insecure
client flags; correct DNS/certificate/chain/key/renewal automation and rerun.
For KMS failure, deny writes until the bucket policy and key grants pass both
encrypted and deliberately unencrypted probes. For backup failure, preserve
the complete local set, do not overwrite the last good off-site copy, repair
transfer/encryption/retention, verify the remote checksum, and perform a clean
restore before approval. Detailed ownership and evidence fields are in
`PRODUCTION_CONTROLS.md`.
