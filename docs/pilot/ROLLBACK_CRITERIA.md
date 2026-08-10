# Pilot rollback criteria

Rollback immediately for confirmed/suspected cross-supplier exposure,
authentication/authorization bypass, committed secret exposure, audit-history
loss, checksum/restore failure, irreconcilable material quantity, illegal workflow
state, destructive migration behavior, or loss of the controlled recovery path.

Pause and obtain the pilot owner’s decision for sustained critical workflow
unavailability, repeated 5xx errors, stale/unavailable readiness needed for a
decision, scanner/object-store failure blocking secure documents, or a SEV-2
without a safe time-bounded workaround.

Use `docs/ROLLBACK_RUNBOOK.md`: stop new mutations, declare incident, capture
version/time/correlation evidence, identify the last compatible image/config and
verified backup, prefer application-image rollback when schema-compatible, and
use clean restore only through the guarded rehearsal process. Never reverse SQL
ad hoc or validate against the original live services. After rollback verify
health, auth, permissions, record/checksum integrity, readiness, supplier
isolation, and smoke tests before reopening. Record decision owner and duration.
