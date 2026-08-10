# Monitoring and alerting

## Status and boundary

MECO Flow now exposes private Prometheus metrics and supplies a private staging monitoring profile with Prometheus, Alertmanager, and HTTPS black-box probing. Seventeen alert rules cover public/API availability, TLS expiry, dependency readiness, metric collection gaps, error ratio, latency, process pressure, worker heartbeat, queue age/stalls/terminal failures, email dead letters, configuration reloads, and notification delivery failures.

The tracked Alertmanager configuration is staging observation only. It retains alerts but deliberately has no external receiver. Production must mount an access-controlled configuration with a secret-backed receiver, complete the on-call drill in `ON_CALL.md`, and pass `pnpm operations:preflight`. Repository configuration alone is not paging evidence or production readiness.

## Signal flow

```text
public HTTPS /health/ready -> black-box exporter --+
API /metrics -------------------------------------+-> Prometheus -> alert rules -> Alertmanager -> external on-call receiver
Keycloak /metrics --------------------------------+
Prometheus/Alertmanager/black-box self metrics ---+
```

All monitoring services remain on private Compose networks and publish no host port. nginx explicitly returns 404 for `/metrics`; Prometheus scrapes the API directly on the backend network. Metrics must never be exposed through the public proxy merely to make dashboard access convenient. Use an authenticated administrative tunnel or the provider's protected monitoring UI.

## Application metrics

The API metrics controller calls a monitoring service, which obtains persisted queue facts only through `MonitoringRepository`. No controller or service accesses Prisma directly. The endpoint emits:

- build version, process uptime, RSS, heap use, and mean event-loop delay;
- completed HTTP count and duration histograms by method, route template, and status class;
- PostgreSQL, Redis, and private-object-storage readiness;
- metric-source collection success, distinguished from an empty queue;
- version-matching worker-heartbeat freshness;
- actionable outbox counts, oldest available pending age, processing locks older than five minutes, and notification-email queue counts.

HTTP labels use framework route templates. Unmatched or unsafe paths collapse to `/unmatched` or `/unknown`; UUIDs, query values, project/supplier identifiers, cookies, tokens, request bodies, exception messages, storage keys, email addresses, and queue payloads are never labels. Unknown persisted event types collapse to `OTHER`. This bounds time-series cardinality and disclosure even under hostile requests.

## Staging operation

Validate the merged topology and upstream syntax before startup:

```powershell
pnpm monitoring:config
pnpm monitoring:validate
```

Start the application through the controlled sequence in `DEPLOYMENT.md`, then add the monitoring profile:

```powershell
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml -f compose.monitoring.yaml --profile monitoring up -d --wait alertmanager blackbox prometheus
```

Verify health and targets without publishing ports:

```powershell
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml -f compose.monitoring.yaml --profile monitoring ps
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml -f compose.monitoring.yaml --profile monitoring exec prometheus wget -qO- http://127.0.0.1:9090/api/v1/targets
docker compose --env-file .runtime/staging/staging.env -f compose.staging.yaml -f compose.monitoring.yaml --profile monitoring exec alertmanager wget -qO- http://127.0.0.1:9093/api/v2/status
```

Prometheus retains up to 30 days or 8 GB in the `prometheus-staging-data` volume. Alertmanager state uses `alertmanager-staging-data`. Both are operational state, not substitutes for business/audit backups. Docker JSON logs retain the existing 10 MiB by five-file rotation.

## Production receiver and evidence

`infra/monitoring/alertmanager.production.example.yml` demonstrates `url_file`; the URL/token belongs in an external secret file and never in Git, evidence JSON, Compose environment values, or command output. The actual configuration must live outside the repository and be supplied using `ALERTMANAGER_CONFIG_FILE` or the production platform's equivalent secret/config mount.

Copy `operational-readiness.example.json` and its evidence templates to an access-controlled directory outside the repository. Replace placeholders only after observing actual results. `pnpm operations:preflight` requires:

- healthy Prometheus, Alertmanager, and black-box services;
- every expected scrape job up, at least 17 loaded rules, private metrics, reviewed dashboard/query coverage, and 30-day retention;
- a witnessed firing, resolved notification, collection-gap test, primary acknowledgement, and secondary escalation;
- current production-equivalent capacity evidence meeting the candidate thresholds and resource-headroom requirements.

The verifier validates schema, recency, consistency, and declared results. Operations and security must still authenticate the provider records and named schedules.

## Maintenance

Run configuration validation on every change. Scan Prometheus, Alertmanager, and black-box images through the complete container gate. Review thresholds after every production-equivalent capacity run and after material architecture/workload changes. Do not tune an alert merely because it fires; first determine whether the signal, threshold, expected workload, or service behavior is wrong and preserve the incident evidence.
