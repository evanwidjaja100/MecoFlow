# Controlled pilot plan

The controlled-pilot package is indexed in [`docs/pilot/PILOT_SCOPE.md`](pilot/PILOT_SCOPE.md).
It combines fictional staging data, role-specific operating guides, executable
acceptance evidence, daily control checks, and explicit go-live/rollback gates.

This package does not assert production readiness. A pilot decision must use the
classification and evidence recorded in `docs/IMPLEMENTATION_STATUS.md`, and
must remain `NOT READY` whenever restoration, security, isolation, acceptance,
or critical data-integrity evidence is missing.

No real secret, personal data, supplier commercial data, or backup content may
be copied into any file under `docs/pilot`.

## Release-candidate decision — 2026-08-01

**NOT READY**

The release candidate is not authorized for pilot go-live. The purpose-built
staging acceptance test, clean backup/restore rehearsal, full integration gate,
and full browser gate passed, but required external security, operations, and
business controls remain incomplete.

### Passing evidence

| Evidence                                                                                | Result                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm pilot:check`                                                                      | Passed; all 19 pilot package files and safe template constraints verified.                                                                                                                                                                                                                                                                                             |
| `$env:COMPOSE_PROJECT_NAME='mecoflow-restore-rehearsal'; pnpm staging:pilot-acceptance` | Passed 3/3 in 1.8 minutes against HTTPS staging. Covered real OIDC, four active pilot projects, two BOM criticalities, requisition/PO, supplier acknowledgement, partial ASN/receipt, warehouse posting, failed QA/QC inspection, quarantine, NCR response, readiness/reports, field minimization, and bidirectional Supplier A/B foreign/nonexistent 404 equivalence. |
| Isolated backup/restore rehearsal                                                       | Passed in 644.129 seconds for backup `restore-rehearsal-20260801T081143Z-r1`; PostgreSQL, Keycloak, and object checksums plus application-level authentication, permissions, readiness, documents, and supplier isolation verified.                                                                                                                                    |
| `pnpm test:authorization`                                                               | Passed 14 files / 53 tests on an isolated verification database.                                                                                                                                                                                                                                                                                                       |
| `pnpm openapi:check`                                                                    | Passed.                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm security:audit`                                                                   | Passed; no known vulnerabilities at the configured moderate threshold.                                                                                                                                                                                                                                                                                                 |
| `pnpm verify`                                                                           | Passed on a fresh isolated database after serializing transaction-client queries; formatting, lint, type checks, unit tests, all 104 API integration tests, and all 9 build tasks completed successfully.                                                                                                                                                              |
| `pnpm build`                                                                            | Passed all 9 build tasks, including optimized Next.js production output and API TypeScript build.                                                                                                                                                                                                                                                                      |
| `pnpm test:e2e`                                                                         | Passed 15/15 in 2.6 minutes on a fresh migrated/seeded database. The run covered OIDC/PKCE, internal and supplier authorization, BOM, documents, items, notifications, projects, requisitions, purchase orders, receiving, QA/QC/NCR/allocation, readiness, reports, and supplier-only scorecards.                                                                     |

### Blocking evidence

| Gate                    | Result and required corrective action                                                                                                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| External pilot controls | Image vulnerability scanning, approved external TLS/secret-manager/KMS controls, monitoring/alerting/on-call ownership, capacity evidence, named pilot users/training, and formal business/security/operations approval remain unrecorded. Operations, security, and the pilot owner must close these before go-live. |

The green repository gates do not substitute for the missing external controls
or formal approval. Any cross-supplier exposure, authorization failure,
checksum or restore failure, audit loss, or irreconcilable quantity remains an
immediate rollback trigger under
[`docs/pilot/ROLLBACK_CRITERIA.md`](pilot/ROLLBACK_CRITERIA.md).

## Candidate dataset evidence

The guarded, idempotent `pilot-prepare` job creates four fictional project
baselines and exactly ten representative supplier organizations without real
personal data or secrets. The acceptance test transitions the four projects to
`ACTIVE` through the application command API and creates the operational
scenario. Post-test database evidence recorded four active pilot projects, ten
representative suppliers, one `CRITICAL` and one `NORMAL` released BOM line,
required checklist and certificate definitions, three open inspections, one
finalized quarantined inspection, and one supplier-responded NCR. Re-running the
acceptance scenario appends new operational evidence; it does not rewrite
retained workflow history.
