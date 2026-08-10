# Production external controls

## Status and boundary

MECO Flow now has a provider-neutral, fail-closed repository contract for production secret delivery, trusted TLS, KMS-backed object encryption, and encrypted off-site backups. This contract does not create provider resources, authenticate provider audit records, or authorize production. The release remains `NOT READY` until named owners supply and approve real external evidence and every other release blocker is closed.

Tracked examples live in `infra/production/`. They contain no usable credential, certificate private key, KMS key, backup, or provider secret. Copy them to an access-controlled directory outside the repository and replace every placeholder there. `pnpm production:preflight` deliberately rejects a manifest inside the workspace, a tracked example, stale evidence, missing files, symlinks, unsafe POSIX modes, duplicate/placeholder secret values, and inconsistent provider evidence.

## External runtime directory

Use the layout documented in `infra/production/README.md`. The deployment secret manager must atomically deliver the seven required secret files and an eighth SMTP password file only when SMTP is enabled. Application containers already support `_FILE` inputs and construct database/Redis URLs in memory. Do not place secret values in `application.env`, Compose environment values, image build arguments, image labels, command output, evidence JSON, or Git.

On POSIX, secret files and the TLS private key must be owner-only. On Windows, the manifest requires a recent reviewed ACL evidence identifier because portable Node file modes cannot prove Windows ACL membership. Provider references and evidence identifiers are non-secret metadata; restrict them because they reveal infrastructure topology.

## Trusted TLS

Supply a PEM leaf-plus-intermediate chain and matching unencrypted-at-mount-time private key to the reverse proxy through the deployment secret mechanism. The preflight verifies:

- the manifest application hostname is present in the certificate;
- the leaf is not self-signed and is currently valid for at least the configured remaining days;
- every supplied chain link verifies and issuer certificates are CAs;
- the private key matches the leaf public key;
- a recent external trust/revocation review and renewal rehearsal are recorded.

The external review must independently verify DNS ownership, public/client trust, revocation/OCSP behavior where applicable, TLS 1.2/1.3, key ACLs, renewal automation, expiry alerts, and emergency rotation. Offline parsing cannot prove those external facts.

## KMS-backed object storage

Production startup now requires HTTPS object storage plus an explicit `S3_SERVER_SIDE_ENCRYPTION` value. Set:

```text
S3_SERVER_SIDE_ENCRYPTION=aws:kms
S3_KMS_KEY_ID=<provider KMS key identifier>
```

for explicit S3 KMS encryption. Presigned document uploads return and sign both required encryption headers, BOM uploads pass the same KMS request directly, and document completion rejects an object whose reported encryption algorithm/key does not match the configured contract.

`AES256` remains supported for an S3-compatible provider only when provider evidence proves its SSE-S3 implementation is backed by the approved external KMS. `S3_KMS_KEY_ID` must be absent in that mode. The provider evidence must also prove encrypted write/read probes, denial of unencrypted writes, anonymous-access denial, and versioning. Local staging MinIO cannot produce this evidence.

## Encrypted off-site backup

The existing operations backup creates a coordinated, checksummed application PostgreSQL, Keycloak PostgreSQL/realm, and object-storage set. A provider-specific job must then copy that complete set to the approved target in a separate failure domain, encrypt it with the independently approved backup KMS key, verify the remote checksum, and apply the approved immutable/versioned retention policy. Backup contents and encryption credentials must never enter Git or evidence JSON.

The safe evidence JSON records the backup ID, application/schema versions, creation/copy timestamps, target and KMS references, checksum-manifest hash, remote verification result, and the most recent clean restore rehearsal. Preflight rejects a copy older than the declared RPO or restore evidence older than the configured window. It does not substitute for a provider audit-log review or a witnessed restore from the off-site copy.

## Preflight procedure

1. Freeze the candidate version and 40-character source revision.
2. Have the secret manager deliver fresh files outside the repository and record ACL/rotation evidence.
3. Install the production certificate chain/key and complete the trust plus renewal checks.
4. Execute provider-specific KMS/private-bucket probes and write `object-storage.json` from actual results.
5. Create the coordinated backup, transfer it off-site with KMS encryption, verify it remotely, and update `offsite-backup.json` only after the remote check succeeds.
6. Set `MECOFLOW_PRODUCTION_CONTROL_FILE` to the external manifest and run `pnpm production:preflight`.
7. Retain the ignored safe summary from `.runtime/production-preflight/` in the approved release-evidence system. Never copy secret files or raw backup content with it.
8. Security, operations, backup, TLS, and release owners authenticate the referenced provider evidence and sign the release checklist.

Any preflight failure closes traffic and blocks deployment. Correct the external control and rerun; do not edit the verifier, weaken freshness windows, copy controls into the repository, or assert an evidence boolean without executing the represented check.

This preflight covers secrets, TLS, object encryption, and off-site backup. It
does not cover monitoring delivery or capacity. After it passes, the same
candidate must separately pass `pnpm operations:preflight` using the external
monitoring, on-call drill, and production-equivalent capacity evidence defined
in `MONITORING.md`, `ON_CALL.md`, and `CAPACITY_READINESS.md`.

## Repository verification evidence — 2026-08-02

- `pnpm production:preflight:test` passed eight policy tests covering a complete safe contract, staging/placeholder denial, the outside-repository requirement, bounded external inputs, application-environment drift/direct-secret denial, stale/mismatched KMS and backup evidence, duplicate secret denial without disclosure, and malformed TLS denial.
- `pnpm --filter @mecoflow/config test` passed 15 tests, including HTTPS and explicit KMS/AES256 production configuration plus the intentional staging-MinIO boundary.
- Focused document/BOM storage tests passed seven tests, including signed KMS headers, fail-closed missing encryption, and encryption-result matching.
- Running the preflight against the tracked example failed as designed on every unresolved placeholder and produced no secret value.
- The exact `pnpm verify` rerun passed formatting, lint, strict typecheck, unit,
  all 24 API integration files / 104 tests, and all nine build tasks.
  Authorization passed 14 files / 53 tests; OpenAPI drift and dependency audit
  passed. An initial aggregate integration attempt failed transiently but a
  direct rerun and the exact full rerun both passed; no test was changed.
- The first browser attempt used the accumulated local database and failed five
  state/timing scenarios (10/15 passed). A new explicitly named database was
  migrated and seeded without deleting existing data; the unchanged complete
  browser suite then passed 15/15 in 1.9 minutes.
- Two API container-build attempts were blocked while Corepack downloaded the
  pinned pnpm package because Docker could not reach `registry.npmjs.org`.
  Runtime image inspection and a fresh image scan were therefore not completed
  for this change; the preceding container-security work remains historical
  evidence, not verification of this new image content.

No real secret manager, trusted certificate, DNS zone, KMS key, off-site target, or provider audit trail was available in this workspace. Therefore there is no successful production preflight evidence and no production-readiness claim.
