# Staging release checklist

This checklist authorizes a staging candidate only. Every item needs evidence;
unchecked production prerequisites block a production-readiness claim.

## Controlled-pilot evaluation — 2026-08-01

**Decision: NOT READY**

The clean restore, deployed pilot acceptance, supplier isolation, authorization
suite, OpenAPI check, dependency audit, `pnpm verify`, and the complete 15-test
browser gate passed. Go-live remains blocked because external security,
operations, and business approval evidence is incomplete. Exact commands,
counts, dataset evidence, owners, and required corrective actions are recorded
in [`PILOT_PLAN.md`](PILOT_PLAN.md). Unchecked items below remain open; this
recorded decision does not convert the checklist template into approval.

## Candidate and supply chain

- [ ] Approved source revision and semantic staging version recorded.
- [ ] Frozen install and `pnpm security:audit` results reviewed.
- [ ] `pnpm verify`, `pnpm test:authorization`, `pnpm openapi:check`, and
      relevant browser tests pass or have an explicit blocking defect.
- [ ] All purpose-built images build; OCI version, revision, and created labels
      match the candidate.
- [ ] Runtime images contain required runtime artifacts only; no source/tests,
      Git metadata, or embedded secret values.
- [ ] Container/image vulnerability gate passes for every release image, with
      no unapproved or expired HIGH/CRITICAL exception. The policy and CI gate
      exist; 2026-08-01 evidence is red on Keycloak 26.7.2.

## Configuration and security

- [ ] Public URL, DNS, CORS, OIDC issuer/callback, proxy trust hops, and
      Keycloak hostname agree.
- [ ] External secret files/manager bindings exist with deployment-only ACLs;
      no secret appears in Git, image history, Compose environment, or logs.
      The provider-neutral contract/preflight exists; real external files,
      reviewed ACL evidence, and manager bindings are not present locally.
- [ ] TLS certificate chain, SAN, expiry, key ACLs, TLS 1.2/1.3, and renewal
      procedure verified.
      Offline fail-closed validation exists; no production certificate, DNS,
      public-trust review, or renewal rehearsal evidence is present locally.
- [ ] Only the reverse proxy is published; administrative/dependency ports are
      private.
- [ ] Every runtime process is non-root; application files are non-writable;
      read-only roots/capability controls remain enabled where configured.
- [ ] Log rotation and sensitive-field redaction verified.

## Data and deployment

- [ ] Coordinated pre-deployment backup created, checksummed, validated, and
      copied to approved protected storage.
      The off-site KMS/checksum/retention evidence contract exists; no actual
      production off-site copy was performed from this workspace.
- [ ] Migration list reviewed; controlled one-shot migration and forward-fix
      owner approved; no automatic startup migration.
- [ ] Persistent database, Redis, object, scanner, and backup volume mappings
      reviewed.
- [ ] All dependency and application readiness checks reach healthy.
- [ ] Version metadata from API, web, worker heartbeat, and images agrees.

## Staging acceptance

- [ ] Real OIDC authentication passes without browser token storage.
- [ ] Core internal project/material flow passes.
- [ ] Supplier workflow passes with server-side field minimization.
- [ ] Supplier A and B can access only their own projects; foreign and
      nonexistent resources have equivalent 404 envelopes in both directions.
- [ ] Audit events exist for smoke mutations and no authorization guard was
      bypassed.
- [ ] Backup validation and persistence-recreation checks pass.
- [ ] Rollback path is reviewed and previous compatible images are retained.

## Production blockers after Phase 9C

- [ ] Isolated destructive backup restoration completed and witnessed.
- [ ] Business/user acceptance testing completed.
- [ ] Approved production RPO/RTO, retention, off-host encryption, monitoring,
      alerting, on-call, DNS/ingress, secret-manager, TLS renewal, capacity,
      and rollback ownership completed.
- [ ] Keycloak HIGH findings are removed by a clean supported image or covered
      by externally approved exact time-bound exceptions and compensating
      controls; current repository policy contains no exception.
- [ ] Formal production release approval recorded.

## Monitoring, on-call, and capacity

- [ ] Private Prometheus, Alertmanager, black-box, API, Keycloak, and public
      HTTPS targets are healthy; `/metrics` returns a public 4xx response.
- [ ] At least 17 reviewed alert rules load and the 30-day retention setting,
      recording queries, dashboards, and collection-gap behavior are verified.
- [ ] External receiver credentials are secret-file injected; a firing and
      resolved notification reach the primary schedule.
- [ ] Primary acknowledgement and no-ack secondary escalation drills pass
      within the targets in `ON_CALL.md`; alternate alert-delivery escalation
      is recorded.
- [ ] A production-equivalent read-only capacity run covers health, internal,
      and supplier scenarios for at least 30 minutes/10,000 requests with
      approved dataset and topology evidence.
- [ ] Capacity meets <=1% errors, <=1,000 ms p95, <=2,000 ms p99, >=30%
      resource headroom, and queue recovery within 300 seconds.
- [ ] `pnpm operations:preflight` passes against external current evidence and
      operations/security owners authenticate every provider reference.
