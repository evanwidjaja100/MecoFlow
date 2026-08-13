# Supported version baseline

This Phase 0 record fixes the exact provisional repository execution baseline;
it is not a human-approved product support matrix until the approval record
below is complete. A version or digest change invalidates affected source,
build, image, security, staging, and release evidence according to the
master-plan invalidation matrix.
`supported-versions.json` is the authoritative typed closure input. It requires
exact application/data versions, browser majors, OS versions, and a supported
production deployment platform/tool/version bound to the candidate lockfile.

## Application toolchain

| Component         | Supported version | Enforcement                                                 |
| ----------------- | ----------------- | ----------------------------------------------------------- |
| Node.js           | `24.18.0`         | exact `package.json` engine and CI setup                    |
| pnpm              | `11.13.0`         | exact `packageManager`, engine, and frozen lockfile         |
| TypeScript        | `6.0.3`           | exact workspace dependency, strict mode                     |
| Turborepo         | `2.10.5`          | exact workspace dependency                                  |
| Prisma CLI/client | `7.9.0`           | exact package manifests and lockfile                        |
| Playwright        | `1.61.1`          | exact workspace dependency; bundled browser installed by CI |

The lockfile SHA-256 at the initial source baseline is
`99CA92F59DC8DC6F441CBD300A549AE7990F9DB081B775B4A7610B43A840B1BB`.

## Data and deployment tools

| Component                                       | Supported reference                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| PostgreSQL                                      | `postgres:18-alpine@sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15` |
| Redis                                           | `redis:8.2-alpine@sha256:a7859ed111db3c1f5404a973a4747505d559fb5ca32d37e447afc0ef845a2103`   |
| Docker CLI used for local diagnostics           | `29.6.1`                                                                                     |
| Docker Engine/server used for local diagnostics | `29.6.1` (available on the continuation probe)                                               |
| Docker Compose used for local evidence          | `5.2.0`                                                                                      |
| Git used for local evidence                     | `2.55.0.windows.2`                                                                           |
| GitHub CLI used for control-plane inspection    | `2.97.0`                                                                                     |
| ripgrep used for repository inventory           | `15.1.0`                                                                                     |
| Standalone PostgreSQL client (`psql`)           | Unavailable; Dockerized PostgreSQL tooling is required for local evidence                    |

Container base and service versions are further frozen by the sha256 digests
in Dockerfiles, Compose files, CI, and `security/container-scan-policy.json`.
Project-owned release images remain source-built candidate artifacts in this
phase; registry digest, provenance, signing, and final artifact freeze remain
Phase 14 responsibilities.

## Supported user environment decisions

| User component  | Exact supported version/status                         |
| --------------- | ------------------------------------------------------ |
| Chromium/Chrome | `BLOCKED` — exact major versions unapproved            |
| Microsoft Edge  | `BLOCKED` — exact major versions unapproved            |
| Firefox         | `BLOCKED` — exact major versions unapproved            |
| Safari/WebKit   | `BLOCKED` — exact macOS/iOS/Safari versions unapproved |

The proposed locale, timezone, device, and accessibility matrix is in
`decision-log.md` (D-05 through D-07). It remains unapproved; Playwright's
bundled Chromium is test tooling and does not define the product support
matrix.

## Approval record

The exact support matrix is not owner-approved until this row references a
complete record in `approvals.json` bound to the reviewed source SHA. The
record must contain all required named role signers and stable identities, a
primary approver, a distinct independent reviewer, and a digest-bound evidence
URI.

| Record ID | Scope | Named role signers / identities | Primary approver / role ID | Approval date | Reviewed source SHA | Evidence URI / SHA-256 | Independent reviewer / role ID / identity | Status    |
| --------- | ----- | ------------------------------- | -------------------------- | ------------- | ------------------- | ---------------------- | ----------------------------------------- | --------- |
| _Pending_ |       |                                 |                            |               |                     |                        |                                           | `MISSING` |

## Maintenance rule

Do not broaden an exact version range or move a digest without dependency,
security, compatibility, and maintenance review plus the invalidated tests.
The governance check fails if Node/pnpm drift, required gate files disappear,
or third-party Actions and external base/service images become mutable.
