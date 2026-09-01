# Decision log

These values are proposals, not approvals. An accountable human owner must
record approval and an independent reviewer must sign security-, data-, or
release-critical decisions. Codex does not approve decisions on the user's
behalf.
`decisions.json` is the authoritative typed closure input. It prevents a status
flip from concealing missing measurement windows, retention/capacity values,
provider contracts, procurement/support ownership, browser linkage, or endpoint
linkage.

| ID   | Decision                  | Phase 0 proposal or required choice                                                                                                                                                                                                                                                               | Status   | Required approvers                                     | Date recorded |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------ | ------------- |
| D-01 | Service objectives        | Rolling 30 days: availability ≥99.9%, p95 ≤750 ms, p99 ≤1,500 ms, server errors ≤0.5%; scope includes production web/API/identity/core worker journeys; user 4xx and pre-edge client-network failures excluded; 50% budget stops discretionary releases and 100% freezes non-remediation releases | APPROVED | Product, SRE, business sponsor                         | 2026-08-20    |
| D-02 | Recovery objectives       | Coordinated complete-set regional-disaster RPO ≤4 h and RTO ≤8 h; encrypted cross-account recovery copies in AWS Singapore require privacy approval and Phase 16 restore verification                                                                                                             | APPROVED | Data, privacy, SRE, product, business sponsor          | 2026-08-20    |
| D-03 | Retention                 | Audit/evidence and approved business documents 2,555 days; monitoring 30; notifications 180; backups 365; verified privacy erasure within 30 days unless retention/hold applies; legal hold until written privacy/data-owner release                                                              | APPROVED | Privacy/compliance, data, product, SRE                 | 2026-08-20    |
| D-04 | Capacity                  | 100 named/30 concurrent users, 25 projects, 50,000 items/BOM lines, 25,000 documents/250 GB, five reports, 20 jobs/minute, 200 queued, 25% annual growth, 12-month horizon, 2× peak, ≥30% headroom, queue recovery ≤300 s                                                                         | APPROVED | Product, SRE, business owners                          | 2026-08-20    |
| D-05 | Locale/time               | `en`/`id`, `Asia/Jakarta`, `IDR`, and metric units are governing requirements from PRODUCT_REQUIREMENTS.md and accepted ADR-0013; named operational support ownership and signoff remain required                                                                                                 | APPROVED | Product/business owners                                | 2026-08-10    |
| D-06 | Browsers/devices          | Chrome 151, Edge 151, Firefox 154, Safari 26.6; Windows 11 25H2 plus 26H1 on supported OEM hardware, macOS 26.6.1, iOS/iPadOS 26.6, Android 16; 390×844 phone, 768×1024 tablet, ≥1280 desktop; keyboard/touch; 200%/400% zoom; forced colors/reduced motion                                       | APPROVED | Product, QA, business owners                           | 2026-08-20    |
| D-07 | Accessibility             | WCAG 2.2 AA; stricter product targets of 44 CSS px generally and 48–52 px for warehouse/QA-QC controls; 44 px is not represented as the WCAG AA minimum                                                                                                                                           | APPROVED | Product, QA, accessibility reviewer                    | 2026-08-20    |
| D-08 | Production identity       | Red Hat build of Keycloak 26.6.5 on at least two RHEL 9 x86_64 EC2 nodes in separate Jakarta AZs, OpenJDK 21, ALB, clustered cache discovery, separate RDS PostgreSQL 18 Multi-AZ, Red Hat Premium support; procurement/contract references remain required                                       | APPROVED | Identity, security, platform, procurement              | 2026-08-20    |
| D-09 | Production object storage | Private AWS S3 in Jakarta with customer-managed KMS, versioning, Object Lock/legal hold, VPC endpoints, fail-closed scanning, and cross-account replication to Singapore; AWS Basic Support risk R-12 and procurement/compliance evidence remain required                                         | APPROVED | Storage/platform, privacy, security, data, procurement | 2026-08-20    |
| D-10 | Production endpoints      | `flow.meco.co.id`, `api.flow.meco.co.id`, and `id.flow.meco.co.id`; one ALB proxy hop; private `svc.flow.meco.internal` names; exact values are recorded in the endpoint matrix but remain unapproved                                                                                             | APPROVED | Platform, identity, security, application/release      | 2026-08-20    |

## Repository-derived field boundary

The accepted repository sources determine only the following non-approval
facts. They are already represented in `decisions.json`; this audit does not
change any decision status or create an approval.

| Decisions   | Repository-derived fields already recorded                                                                                                                   | Values that still require accountable humans                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `D-01–D-04` | Exact proposed service/recovery, retention, headroom, queue-recovery, capacity, growth, horizon, and complete-set values approved in the implementation plan | Named role identities, candidate-bound signoff, and privacy approval for Singapore recovery copies                        |
| `D-05`      | `en`/`id`, `Asia/Jakarta`, `IDR`, metric units, and `PRODUCT-OWNER` role from the product requirements and accepted ADR-0013                                 | Named owner identity and candidate-bound signoff                                                                          |
| `D-06–D-07` | Exact browser/OS/device/input/accessibility proposal, WCAG conformance target, stricter product target, and supported-version record reference               | Named reviewers and candidate-bound approval                                                                              |
| `D-08`      | Keycloak product, exact RHBK version, RHEL/EC2/RDS topology, support tier, owner role, and implemented OIDC contract                                         | Executed subscription/procurement evidence, named contacts, final MFA/recovery/rotation evidence, exit-strategy approval  |
| `D-09`      | AWS S3/KMS/Object Lock/replication design, MinIO development-only rule, Basic Support risk, and fixed malware/recovery contracts                             | Account/contract references, privacy approval, procurement evidence, operational owner identities, exit-strategy approval |
| `D-10`      | Exact public origins, DNS zone, issuer/callback, proxy hop, private service names, and authoritative endpoint-matrix reference                               | Change-control record, named signers, independent reviewer, and candidate-bound approval                                  |

Null fields are intentional fail-closed inputs. Local Compose values, staging
values, GitHub usernames, commits, pull requests, and diagnostic runs do not
truthfully supply the missing production choices or human authority.

## Approved decisions

None. Phase 0 cannot close, and Phase 1/2 are not unlocked, until each row is
complete and approved with named owners and required independent review.

## Approval records

Approval cannot be inferred from a proposal. Each decision requires one or
more records in `approvals.json` with all fields populated. The authoritative
record binds the exact decision subject and scope to the candidate SHA, a
content-addressed evidence URI, every required named `roleApprovals` signer,
and a distinct named `independentReviewer`; the table below is only an index.

| Record ID | Decision ID | Named role signers / stable identities | Primary approver / role ID | Approval date | Reviewed source SHA | Evidence URI / SHA-256 | Independent reviewer / role ID / identity | Status    |
| --------- | ----------- | -------------------------------------- | -------------------------- | ------------- | ------------------- | ---------------------- | ----------------------------------------- | --------- |
| _Pending_ |             |                                        |                            |               |                     |                        |                                           | `MISSING` |
