# Operations runbook

## First response

Check process liveness, readiness, structured logs by request/correlation ID, PostgreSQL, Redis, object storage, worker heartbeat, queue depth and failed jobs. Do not expose dependency configuration through public probes or paste secrets into incidents.

## Common local recovery

- A failed readiness response: inspect the named dependency's container health and safe logs, then retry after recovery.
- Migration failure: stop application rollout, preserve data, inspect the failed migration and restore/test in an isolated environment; never edit an applied migration.
- Repeated job failure: stop retry amplification, retain the dead-letter record and idempotency key, fix the cause, then replay through a controlled procedure.
- Suspected credential exposure: revoke/rotate immediately, preserve audit evidence and follow the security incident channel.

Phase 0 exposes foundations only. Production alert thresholds, on-call ownership, dashboards and recovery rehearsals are Phase 9 deliverables.
