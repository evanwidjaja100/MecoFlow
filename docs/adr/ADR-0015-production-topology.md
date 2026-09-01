# ADR-0015: Proposed AWS Jakarta production topology

## Status

Proposed — 2026-08-20 — pending named human approval, procurement evidence,
and candidate-bound independent review

## Context

MECO Flow requires an exact production platform before Phase 0 can close.
Accepted ADR-0012 requires container deployment and the product requirements
exclude Kubernetes. Accepted ADR-0005 requires Keycloak, while ADR-0007
requires a private S3-compatible object store. Local Compose, local MinIO, and
the staging topology are not production evidence.

This proposal records the selected target architecture without claiming that
accounts, subscriptions, support contracts, endpoints, or provider controls
exist. The typed decision, supported-version, endpoint, procurement, and
approval records remain fail-closed until named humans supply that evidence.

## Proposed decision

- Run the API, web, worker, and ClamAV containers on AWS ECS Fargate in
  `ap-southeast-3` (Jakarta), in private subnets across multiple Availability
  Zones. Kubernetes and Helm are prohibited.
- Use AWS CloudFormation template format version `2010-09-09` as the production
  infrastructure definition and change-control boundary.
- Run Red Hat build of Keycloak `26.6.5` on at least two RHEL 9 x86_64 EC2
  nodes across separate Jakarta Availability Zones with OpenJDK 21. Store its
  authoritative data in a separate Amazon RDS for PostgreSQL 18 Multi-AZ
  database.
- Store application data in a separate Amazon RDS for PostgreSQL 18 Multi-AZ
  database. Use Amazon ElastiCache for Redis only as queue and coordination
  infrastructure; PostgreSQL remains authoritative.
- Store private objects in Amazon S3 in `ap-southeast-3` with a
  customer-managed KMS key, private access, versioning, and S3 Object Lock.
  Replicate the approved object and coordinated recovery sets across accounts
  to `ap-southeast-1` (Singapore) under separately approved keys and retention.
- Use Route 53, ACM, a public Application Load Balancer, and AWS WAF for the
  public boundary. Keep ECS tasks, EC2 identity nodes, databases, Redis, and
  administrative surfaces private. Use ECR for immutable application images
  and CloudWatch for platform logs and metrics.
- Treat the public and build-time API base as the exact HTTPS API origin. The
  web application appends versioned `/api/v1` paths. The OIDC callback is the
  API origin plus `/api/v1/auth/callback`; the issuer is the exact Keycloak
  `/realms/{realm}` URL. Exact DNS names, origins, proxy hops, and internal
  service names remain owned by `endpoint-matrix.json` and cannot be inferred
  from this ADR.
- Record the proposed AWS Basic Support limitation as R-12. It supplies no
  production response-time SLA or MECO Flow application/identity operational
  ownership, so internal on-call/runbook evidence and the time-bounded paid
  support procurement trigger require explicit acceptance.

## Alternatives considered

Single-host Docker Compose, Kubernetes/Helm, a different identity provider,
local or production MinIO, and an S3-compatible provider outside the selected
AWS accounts.

Kubernetes conflicts with the MVP exclusion and accepted container ADR. A
different identity provider requires a superseding accepted ADR. Production
MinIO is excluded by the Phase 0 provider decision boundary. Single-host
Compose does not provide the selected multi-AZ failure isolation.

## Consequences

The application keeps its existing modular-monolith and separate
web/API/worker processes, while production infrastructure becomes
provider-specific. ECS, EC2/RHBK, RDS, S3/KMS, cross-account replication, and
the public edge each require independent qualification, cost ownership,
monitoring, backup/restore, and rollback evidence in their assigned later
phases.

Changing region, compute platform, identity distribution/version, database
service, storage provider, replication target, public edge, or IaC tool
invalidates the associated supported-version, endpoint, build, security,
capacity, backup, staging, and release evidence.

## Security implications

Only the ALB is public. WAF, exact CORS and OIDC origins, trusted proxy counts,
private subnets, security groups, least-privilege task/node roles, Secrets
Manager delivery, KMS separation, immutable images, S3 private policy/Object
Lock, and cross-account recovery controls must fail closed. RHBK administrator
access, MFA/recovery, realm/client claims, key rotation, revocation, realm
backup, and break-glass behavior remain explicit D-08 approval inputs.

## Operational implications

Named platform, identity, data, privacy, security, SRE, procurement, and
release owners must approve the exact service tiers, quotas, maintenance,
support response, patch cadence, retention, RPO/RTO, capacity, endpoints, and
exit strategies. This proposed ADR does not unlock Phase 1, start procurement,
or authorize provider creation or production deployment.
