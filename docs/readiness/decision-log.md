# Decision log

These values are proposals, not approvals. An accountable human owner must
record approval and an independent reviewer must sign security-, data-, or
release-critical decisions. Codex does not approve decisions on the user's
behalf.
`decisions.json` is the authoritative typed closure input. It prevents a status
flip from concealing missing measurement windows, retention/capacity values,
provider contracts, procurement/support ownership, browser linkage, or endpoint
linkage.

| ID   | Decision                  | Phase 0 proposal or required choice                                                                                                                                                                                                                                                                | Status             | Required approvers                                | Date recorded |
| ---- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------- | ------------- |
| D-01 | Service objectives        | Availability ≥99.5%; p95 ≤1,000 ms; p99 ≤2,000 ms; capacity-test errors ≤1%; formal error-budget policy required                                                                                                                                                                                   | `PROPOSED`         | Product, SRE, business sponsor                    | 2026-08-10    |
| D-02 | Recovery objectives       | Coordinated complete-set RPO ≤4 h and RTO ≤8 h, verified by Phase 16 off-site restore                                                                                                                                                                                                              | `PROPOSED`         | Data, SRE, product, business sponsor              | 2026-08-10    |
| D-03 | Retention                 | Audit/evidence 12 months; monitoring ≥30 days; exact document, notification, backup, privacy, and legal-hold periods still required                                                                                                                                                                | `INCOMPLETE`       | Privacy/compliance, data, product, SRE            | 2026-08-10    |
| D-04 | Capacity                  | ≥30% headroom and queue recovery ≤300 s; exact user, project, item, document, report, queue, growth, and concurrency assumptions still required                                                                                                                                                    | `INCOMPLETE`       | Product, SRE, business owners                     | 2026-08-10    |
| D-05 | Locale/time               | `en`/`id`, `Asia/Jakarta`, `IDR`, and metric units are governing requirements from PRODUCT_REQUIREMENTS.md and accepted ADR-0013; named operational support ownership and signoff remain required                                                                                                  | `REQUIRED-SIGNOFF` | Product/business owners                           | 2026-08-10    |
| D-06 | Browsers/devices          | Exact browser/OS major versions remain to be named; proposed device matrix is 390×844 phone, 768×1024 tablet portrait/landscape, ≥1280 desktop; keyboard/touch; 200%/400% zoom; forced colors/reduced motion                                                                                       | `INCOMPLETE`       | Product, QA, business owners                      | 2026-08-11    |
| D-07 | Accessibility             | WCAG 2.2 AA; 44 px targets generally and 48–52 px for warehouse/QA-QC controls                                                                                                                                                                                                                     | `PROPOSED`         | Product, QA, accessibility reviewer               | 2026-08-10    |
| D-08 | Production identity       | Accepted ADR-0005 and SECURITY_MODEL.md mandate Keycloak with OIDC Authorization Code + PKCE. Phase 0 must approve its supported distribution/version, hosting model, support owner, MFA/recovery/realm contract, procurement, and exit strategy; changing IdP requires a superseding accepted ADR | `BLOCKED`          | Identity, security, platform, procurement         | 2026-08-11    |
| D-09 | Production object storage | MinIO remains development-only. Phase 0 must name a supported S3-compatible provider with KMS SSE, private policy, scanning, retention/versioning, replication/off-site recovery, support owner, procurement, and exit strategy; qualification/migration executes in Phase 14                      | `BLOCKED`          | Storage/platform, security, data, procurement     | 2026-08-11    |
| D-10 | Production endpoints      | Exact values are required in `endpoint-matrix.md`; none is currently assigned or approved                                                                                                                                                                                                          | `BLOCKED`          | Platform, identity, security, application/release | 2026-08-11    |

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
