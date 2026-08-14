# Production endpoint matrix

The exact matrix is a Phase 0 design input. No placeholder below is release
evidence. Values remain unapproved until the named network/platform, identity,
security, and application owners record the exact value and approval date.
`endpoint-matrix.json` is the authoritative typed record; this Markdown table
is its human-readable index. Closure validates HTTPS origins and callbacks,
DNS/zone coverage, proxy-hop consistency, internal service names, and the
build-time/public API match.

| Boundary                                   | Required exact value | Status    | Accountable owner                        |
| ------------------------------------------ | -------------------- | --------- | ---------------------------------------- |
| Public web URL                             | Unassigned           | `BLOCKED` | Cloud/platform owner                     |
| Public API base URL                        | Unassigned           | `BLOCKED` | Cloud/platform owner / application owner |
| Public DNS names and zones                 | Unassigned           | `BLOCKED` | Cloud/platform owner                     |
| Allowed CORS origins                       | Unassigned           | `BLOCKED` | Security owner / application owner       |
| OIDC issuer URL                            | Unassigned           | `BLOCKED` | Identity owner                           |
| OIDC callback URL set                      | Unassigned           | `BLOCKED` | Identity owner / application owner       |
| Identity-provider hostname                 | Unassigned           | `BLOCKED` | Identity owner                           |
| External proxy chain and trusted hop count | Unassigned           | `BLOCKED` | Security owner / cloud-platform owner    |
| Internal API service name                  | Unassigned           | `BLOCKED` | Cloud/platform owner                     |
| Internal web service name                  | Unassigned           | `BLOCKED` | Cloud/platform owner                     |
| Internal worker/service dependency names   | Unassigned           | `BLOCKED` | Cloud/platform owner                     |
| Build-time `NEXT_PUBLIC_API_BASE_URL`      | Unassigned           | `BLOCKED` | Application/release owner                |

## Derivation boundary

Repository sources define the required boundaries and consistency rules, but
they do not define a production DNS zone, origin, issuer, callback, proxy path,
service-discovery namespace, or public build value. Local Compose and staging
names are deliberately non-production and cannot populate
`endpoint-matrix.json`. Every exact value therefore remains `null`/`BLOCKED`
until the provisioned production topology is supplied and approved by named
owners.

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
