# Production external-control contract

This directory contains non-secret templates only. It does not provision a cloud provider or authorize production deployment.

Copy the three JSON templates and `application.env.example` to an access-controlled directory outside the repository. Rename the copies without the `.example` suffix. A secret-manager delivery job must write the required secret files below that external directory without printing their values. The TLS automation must write the leaf-plus-intermediate chain and matching private key. Provider-specific object-storage and backup jobs must write safe evidence JSON after performing the checks represented by each boolean; operators must not set booleans without executing the corresponding provider command.

The external directory has this shape:

```text
production-controls.json
application.env
evidence/
  object-storage.json
  offsite-backup.json
secrets/
  application-database-password
  keycloak-admin-password
  keycloak-database-password
  redis-password
  s3-access-key
  s3-secret-key
  session-secret
tls/
  fullchain.pem
  private-key.pem
```

If production SMTP is enabled, set `secrets.smtpEnabled` to `true` and add `secrets.smtpPassword` to the file map. Secret values must be unique, non-placeholder values. On POSIX, secret files and the TLS private key must be owner-only. Windows deployments require reviewed ACL evidence because portable Node file modes cannot prove Windows ACL membership.

The TLS check rejects a self-signed leaf, incomplete or invalid chain, hostname mismatch, expired or near-expiry certificate, and mismatched private key. The external trust/revocation review and renewal rehearsal identifiers remain mandatory because offline certificate parsing cannot establish public trust, revocation status, DNS control, or successful automated renewal.

Object-storage evidence must prove a KMS-backed encrypted write and read, rejection of an unencrypted write, private access, and versioning. `applicationEncryption` must match `S3_SERVER_SIDE_ENCRYPTION`: use `aws:kms` with `S3_KMS_KEY_ID` for an explicit S3 KMS key, or `AES256` only when the provider proves that SSE-S3 is backed by the approved external KMS (for example, a reviewed MinIO KMS deployment).

Off-site backup evidence must identify a recent coordinated backup, remote checksum verification, approved KMS key, immutable/versioned target in a separate failure domain, and a recent clean restore rehearsal. The repository verifier checks freshness against the declared RPO and restore-evidence window but does not replace independent inspection of the provider audit trail.

Run:

```powershell
$env:MECOFLOW_PRODUCTION_CONTROL_FILE = 'D:\mecoflow-production\production-controls.json'
pnpm production:preflight
```

The command emits only a safe ignored summary below `.runtime/production-preflight/`. A pass means the supplied files and evidence satisfy the repository contract; security, operations, and release owners must still authenticate the external evidence and approve it.
