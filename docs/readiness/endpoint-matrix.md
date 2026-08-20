# Production endpoint matrix

The exact matrix is a Phase 0 design input. No placeholder below is release
evidence. Values remain unapproved until the named network/platform, identity,
security, and application owners record the exact value and approval date.
`endpoint-matrix.json` is the authoritative typed record; this Markdown table
is its human-readable index. Closure validates HTTPS origins and callbacks,
DNS/zone coverage, proxy-hop consistency, internal service names, and the
build-time/public API match.

| Boundary                                   | Required exact value                                                                                                          | Status             | Accountable owner                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------- |
| Public web URL                             | `https://flow.meco.co.id`                                                                                                     | `REQUIRED-SIGNOFF` | Cloud/platform owner                     |
| Public API base URL                        | `https://api.flow.meco.co.id` (origin; application routes append `/api/v1`)                                                   | `REQUIRED-SIGNOFF` | Cloud/platform owner / application owner |
| Public DNS names and zones                 | `flow.meco.co.id`, `api.flow.meco.co.id`, `id.flow.meco.co.id`; delegated zone `flow.meco.co.id`                              | `REQUIRED-SIGNOFF` | Cloud/platform owner                     |
| Allowed CORS origins                       | `https://flow.meco.co.id`                                                                                                     | `REQUIRED-SIGNOFF` | Security owner / application owner       |
| OIDC issuer URL                            | `https://id.flow.meco.co.id/realms/mecoflow`                                                                                  | `REQUIRED-SIGNOFF` | Identity owner                           |
| OIDC callback URL set                      | `https://api.flow.meco.co.id/api/v1/auth/callback`                                                                            | `REQUIRED-SIGNOFF` | Identity owner / application owner       |
| Identity-provider hostname                 | `id.flow.meco.co.id`                                                                                                          | `REQUIRED-SIGNOFF` | Identity owner                           |
| External proxy chain and trusted hop count | `AWS Application Load Balancer`; `1` trusted hop. WAF/Route 53/ACM are not proxy hops                                         | `REQUIRED-SIGNOFF` | Security owner / cloud-platform owner    |
| Internal API service name                  | `api.svc.flow.meco.internal`                                                                                                  | `REQUIRED-SIGNOFF` | Cloud/platform owner                     |
| Internal web service name                  | `web.svc.flow.meco.internal`                                                                                                  | `REQUIRED-SIGNOFF` | Cloud/platform owner                     |
| Internal worker/service dependency names   | `worker`, `postgres`, `redis`, `object-storage`, `clamav`, `keycloak`, and `keycloak-postgres` under `svc.flow.meco.internal` | `REQUIRED-SIGNOFF` | Cloud/platform owner                     |
| Build-time `NEXT_PUBLIC_API_BASE_URL`      | `https://api.flow.meco.co.id`                                                                                                 | `REQUIRED-SIGNOFF` | Application/release owner                |

## Derivation boundary

The user-approved implementation plan supplies an exact proposed production
DNS, origin, issuer, callback, proxy, service-discovery, and build contract.
These values are recorded in `endpoint-matrix.json`, but they remain
`BLOCKED` rather than approved until named owners provide the DNS reservation,
change-control reference, stable identities, candidate-bound signatures, and
independent review. Local Compose and staging values remain unacceptable
substitutes.

## Approval and change control

- The Phase 0 owner must choose the supported production identity and object
  storage providers before approving this matrix; procurement starts in Phase
  0 and qualification/migration executes in Phase 14.
- Public values embedded in web artifacts must equal this approved matrix.
- Changes require security, identity, platform, and application review and
  invalidate affected build, OIDC, CORS, TLS, proxy, staging, and UAT evidence.
- Local and staging values are not acceptable substitutes for production
  values.

## Approval records

Rows may be approved individually or as one matrix version, but the record
must identify every covered boundary. The authoritative `approvals.json`
record must include all required named role signers with stable identities,
the primary approver, a distinct independent reviewer, the reviewed candidate
SHA, and a SHA-256 digest for the referenced evidence.

| Record ID | Covered boundaries | Named role signers / identities | Primary approver / role ID | Approval date | Reviewed source SHA | Matrix/evidence URI / SHA-256 | Independent reviewer / identity | Change-control ticket | Status    |
| --------- | ------------------ | ------------------------------- | -------------------------- | ------------- | ------------------- | ----------------------------- | ------------------------------- | --------------------- | --------- |
| _Pending_ |                    |                                 |                            |               |                     |                               |                                 |                       | `MISSING` |
