# Container image security gate

## Release policy

Every unique image deployed by `compose.staging.yaml` or its monitoring overlay must be built or pulled
before a release decision and scanned by the repository gate. The gate covers
`CRITICAL` and `HIGH` operating-system and language-package vulnerabilities,
fails when an image cannot be scanned, and fails on every finding that does not
have an exact approved exception. A successful process exit or an empty report
is not treated as a pass.

The scanner is Trivy 0.72.0 pinned by image digest in
`security/container-scan-policy.json`. The digest, rather than a mutable action
tag, is deliberate supply-chain containment. Trivy refreshes its vulnerability
databases by default and stores only its cache in the local
`mecoflow-trivy-cache` Docker volume. Raw JSON/log evidence is written under
ignored `.runtime/security-scans/<timestamp>/`; reports and any registry
credentials must not be committed.

Run the policy tests and gate with:

```powershell
pnpm security:image-scan:test
$env:APP_VERSION = '<candidate-version>'
pnpm security:image-scan
```

`IMAGE_SCAN_IMAGES` may contain a comma-separated image list for a bounded
diagnostic scan. It must not replace the default policy image list for release
evidence. `TRIVY_TIMEOUT` may raise the per-image timeout when the Java database
needs its first download; it does not alter the vulnerability threshold.

CI rebuilds every project-owned release image, pulls Redis, Keycloak,
Prometheus, Alertmanager, and black-box exporter, tests
the policy evaluator, and runs the same gate. A red container-security job is a
release blocker.

## Exception control

No exception is currently approved. An exception may be added only as one
exact entry in `security/container-scan-policy.json`; broad CVE, severity,
vendor, image-prefix, or `ignore-unfixed` rules are prohibited. Each entry must
identify the exact image, vulnerability ID, package, accountable owner,
approver, UTC expiry date, rationale, and compensating controls, with
`status: "approved"`. Optional `target` further narrows duplicate package
locations. The gate rejects pending, malformed, and expired entries.

Approval must come from the named security/release authority outside the code
change. The approver reviews exploitability in MECO Flow's configuration,
vendor status, network exposure, authentication/authorization effect, data
impact, monitoring, rollback trigger, and the shortest practical expiry.
Renewal requires fresh evidence and approval. Remove the entry immediately
when a patched image is available.

## Image hardening and provenance

- Node application and migration runtime stages remove bundled npm, npx,
  Corepack, Yarn, and pnpm. Build stages retain package tooling; runtime
  commands invoke `node` or the installed Prisma executable directly.
- PostgreSQL and nginx images apply current Alpine fixes during the candidate
  build. PostgreSQL runs as `postgres`; the unused root-only `gosu` binary is
  removed. The proxy runs as UID/GID `101:101`.
- MinIO server is built from the upstream authorization-fix commit
  `9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a` (release
  `RELEASE.2025-10-15T17-29-55Z`). Its codeload archive must match SHA-256
  `45521908307306e925c98d629e1c17d78c8b72b6ee242b1bfb1409f7d8ee5841`.
- MinIO client is built from commit
  `77f82e18b5401a65958f1619df6ebb994634bd88`; its archive must match SHA-256
  `167415edd21bc29f5360943dac64272aa5cda0a39f3070b15cfeca671c43d975`.
- The MinIO builds explicitly upgrade scanner-identified Go modules to fixed
  versions. Compilation, zero-finding scans, and the staging object/backup
  workflows are mandatory because this is a maintained downstream rebuild of
  archived upstream source, not a new upstream release.

## Evidence — 2026-08-01

Candidate tag `0.1.0-security-scan` was built locally. Runtime inspection
confirmed users `node` (API/worker/web/migrations), `postgres`
(operations/PostgreSQL), `1000:1000` (MinIO), `clamav` (ClamAV), and `101:101`
(proxy). npm/Corepack were absent from all four Node runtimes; `gosu` was absent
from PostgreSQL and operations.

The exact release-image command was:

```powershell
$env:APP_VERSION = '0.1.0-security-scan'
pnpm security:image-scan
```

Historical Trivy 0.72.0 evidence scanned 11 images. API, worker, web, migrations, operations,
MinIO, ClamAV, PostgreSQL, proxy, and Redis passed with zero HIGH/CRITICAL
findings and zero exceptions. Keycloak 26.7.0 failed with 15 occurrences (12
unique findings): one unfixed Red Hat OpenJDK finding and findings in Jackson,
Microsoft JDBC, Netty, and PostgreSQL JDBC packages for which no newer official
Keycloak image was available during the rehearsal. Evidence summary:
`.runtime/security-scans/2026-08-01T17-02-48.813Z/summary.json`.

The rebuilt staging stack reached healthy for PostgreSQL, Redis, MinIO,
ClamAV, Keycloak 26.7.0, API, worker, web, and proxy. Migration, seed,
MinIO-policy initialization, and smoke-fixture jobs exited 0. Backup set
`20260801T164855Z` completed and validated through the patched operations
image. The targeted browser smoke passed 3/3 in 18.6 seconds: readiness and
version metadata, real OIDC/internal project flow, supplier flow, and
bidirectional Supplier A/B isolation.

Two operator-command failures were retained as corrective evidence. A broad
`up --profile operations` incorrectly started every one-shot job; restore
failed closed without `BACKUP_SET`, pilot provisioning exceeded its existing
five-second transaction limit, and the documented controlled per-service/run
sequence was used thereafter. The first direct web build omitted
`NEXT_PUBLIC_API_BASE_URL`, producing a localhost login link and a two-failure
browser run; rebuilding with the Compose-supplied staging URL corrected it and
the targeted suite passed. CI now supplies an explicit non-local build URL.

The release remains blocked. Do not add an exception merely to make CI green.
Resolution is either a clean newer official Keycloak image or an externally
approved, narrowly scoped, time-bound risk exception after exploitability and
compensating-control review.

The monitoring overlay adds three images to the policy, for 14 unique current
release images. They require a fresh complete scan before release; the earlier
11-image evidence does not cover them.

## Maintenance

At every candidate and at least weekly while a pilot/production environment is
active: rebuild without relying on an old runtime layer, refresh scanner data,
scan the complete policy list, review exception expiry, and archive the
summary in the approved release-evidence store. Update source references,
checksums, module overrides, image versions, and this document together.
MinIO's archived upstream status is a strategic replacement risk; select and
rehearse a supported S3-compatible service before production approval.
