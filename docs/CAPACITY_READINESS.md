# Capacity readiness

## Purpose and current status

`pnpm capacity:run` is a dependency-free concurrent HTTP runner for bounded, read-only release-candidate scenarios. It measures error rate and p95/p99 latency for health, authenticated internal, and authenticated supplier reads. It never performs a write, follows a redirect, prints a response body, or writes authentication headers into evidence.

The existing Phase 9B calculator/query measurements remain useful engineering baselines, not production capacity evidence. No production-equivalent 30-minute run with real provider/resource observations has been supplied, so capacity readiness remains incomplete.

## Safe configuration

Copy `infra/monitoring/capacity.example.json` to an access-controlled directory outside the repository. Store internal and supplier cookies or authorization headers in separate JSON files in that directory. Only `accept`, `authorization`, and `cookie` headers are accepted. Header files are bounded regular files, cannot be symlinks or escape the configuration directory, and their values are never returned in evidence or errors.

Nonlocal runs require HTTPS plus all three scenario kinds:

- `health`: public dependency-aware readiness;
- `internal`: representative authorized readiness/report read using a dedicated non-administrator load principal;
- `supplier`: representative own-organization scorecard/project read using a dedicated supplier principal.

Only `GET` and `HEAD` are accepted. Secret-like query parameter names, credentials in URLs, redirects, traversal paths, and repository-local nonlocal configuration/evidence paths fail closed. Use fictional staging data and never use a production administrator or uncontrolled personal data.

## Required workload

The production gate currently requires at least:

- 30 minutes measured duration;
- 10 concurrent clients;
- 10,000 completed requests;
- no more than 1% errors;
- overall and per-scenario p95 no greater than 1,000 ms;
- overall and per-scenario p99 no greater than 2,000 ms;
- at least 30% observed resource headroom;
- queue recovery within 300 seconds after load stops.

These are initial release criteria, not a permanent SLA. The service owner and operations owner must approve the dataset and concurrency model against expected peak and growth. Capacity evidence must identify production-equivalent compute, database, Redis, object storage, network/TLS, scanner, identity, SMTP behavior, replica counts, limits, and observed CPU/memory/database-connection/queue peaks through a protected evidence reference.

## Execution

Set the trusted staging CA through the supported Node trust configuration when necessary; never disable TLS verification.

```powershell
$env:MECOFLOW_CAPACITY_FILE = 'D:\protected\mecoflow-capacity\capacity.json'
pnpm capacity:run
```

The command exits nonzero when any overall or scenario threshold fails. It writes a mode-0600 safe JSON summary to the configured external evidence directory. Preserve monitoring graphs and provider resource evidence separately, reference them in the configuration, and never edit a failed runner result into a pass.

After the run, stop synthetic traffic and measure queue recovery. Verify authentication, permissions, readiness, supplier isolation, and data integrity using the acceptance/smoke suites. A capacity pass cannot override a security, backup, restore, migration, isolation, or acceptance failure.

## Re-test triggers

Repeat production-equivalent capacity testing after material query/schema changes, runtime/framework upgrades, infrastructure-size or region changes, database/object/identity provider changes, worker concurrency changes, alert-threshold changes derived from capacity, or expected peak-load growth. Retain the failed evidence and corrective action alongside the eventual rerun.
