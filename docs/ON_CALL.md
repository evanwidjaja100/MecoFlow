# On-call and incident response

## Required ownership

Before production approval, record named individuals or controlled schedule references outside Git for:

- service owner: product behavior and release/rollback decisions;
- primary operations on-call: first response and coordination;
- secondary operations on-call: escalation when the primary does not acknowledge;
- security on-call: suspected credential, authorization, isolation, malware, or data-exposure events;
- incident commander rotation: severity, communications, decision log, and closure;
- database/identity/provider escalation contacts.

The repository examples use role names only and contain no personal contact data. `operational-readiness.example.json` requires provider schedule and escalation references; a chat channel without acknowledgement/escalation is not an on-call system.

## Severity and response targets

| Severity | Examples                                                                                                                                                                         | Acknowledge |                Initial mitigation/decision |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------: | -----------------------------------------: |
| Critical | Public outage, required dependency down, stale worker plus material backlog, terminal queue failure, alert-delivery failure, suspected cross-supplier exposure or integrity loss |  15 minutes |                                 30 minutes |
| Warning  | Sustained latency/error increase, certificate within 30 days, email dead letter, memory/event-loop pressure, monitoring collection gap                                           |  60 minutes | 4 hours or documented next business window |

Security, supplier-isolation, authentication, audit-loss, and data-integrity signals are critical regardless of traffic impact. When evidence is uncertain, contain access and preserve state rather than downgrading severity.

## Escalation

1. Alertmanager sends firing notification to the primary schedule.
2. Primary acknowledges, opens an incident record, and becomes responder or hands off explicitly.
3. If unacknowledged after 15 minutes, page the secondary and incident commander.
4. Immediately involve security for suspected disclosure, credential compromise, field-filter failure, malicious document, or audit tampering.
5. Involve the database/provider owner before destructive recovery, failover, restore, or manual queue mutation.
6. If mitigation misses the target, the incident commander decides rollback, traffic closure, or continued bounded operation and records the basis.

Never paste cookies, tokens, receiver URLs, database/object credentials, file contents, private object keys, personal contact data, or supplier-private fields into an incident channel.

## Response lifecycle

1. Acknowledge the exact alert and record UTC start time, candidate version, environment, affected service, and correlation/request identifiers.
2. Validate impact using public readiness plus private metrics; a liveness-only response is insufficient.
3. Contain amplification. Stop rollout, close traffic, pause an external integration, or stop retries only through a controlled reversible procedure.
4. Diagnose with the alert's runbook section, structured redacted logs, immutable audit/outbox records, and dependency/provider evidence.
5. Mitigate using the least destructive action. Do not edit applied migrations, delete audit/dead-letter evidence, bypass authorization, automatically resend ambiguous SMTP work, or restore over the only copy.
6. Verify readiness, authentication, core internal flow, supplier flow/isolation, queue recovery, and monitoring recovery after mitigation.
7. Send resolved notification, close the incident only after verification, and record corrective actions, owner, due point, and rollback trigger.

## Paging drill

At least every 90 days and before initial production approval:

1. Schedule a non-business-impacting `MecoFlowPagingDrill` alert.
2. Confirm Prometheus changes from pending to firing and Alertmanager receives it.
3. Confirm the primary receives and acknowledges it within 15 minutes.
4. Run a separate controlled no-ack branch and confirm secondary escalation.
5. Resolve the alert and verify the resolved notification arrives.
6. Confirm the alert-delivery-failure path has an alternate escalation method.
7. Record safe provider evidence references, delivery/acknowledgement durations, participants by role, failures, and corrective actions outside Git.
8. Update the external on-call evidence JSON and run `pnpm operations:preflight`.

The staging observation-only receiver cannot pass this drill.

## Handoff checklist

- Active incidents, silences, degraded dependencies, dead letters, certificate/backup deadlines, and current release are reviewed.
- Primary and secondary schedules have no gap and the incident commander is reachable.
- Temporary mitigations include owner, expiry, rollback trigger, and evidence link.
- Silences are scoped to exact alerts/services, have an expiry, and do not cover security/isolation/integrity signals without security approval.
- The incoming responder can access the protected monitoring, logs, provider console, runbooks, and approved deployment/rollback procedures.
