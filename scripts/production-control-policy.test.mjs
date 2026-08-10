import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
  ProductionControlError,
  inspectTlsFiles,
  restrictTestFilePermissions,
  validateProductionControlManifest,
  verifyProductionControls,
} from "./production-control-policy.mjs";

const NOW = new Date("2026-08-02T04:00:00.000Z");
const SOURCE_REVISION = "a".repeat(40);

function validManifest() {
  return {
    schemaVersion: 1,
    environment: "production",
    applicationEnvironmentFile: "application.env",
    candidate: {
      applicationVersion: "1.0.0-rc.1",
      sourceRevision: SOURCE_REVISION,
    },
    publicEndpoints: {
      applicationUrl: "https://mecoflow.example.test",
      oidcIssuer: "https://identity.example.test/realms/mecoflow",
      expectedDnsNames: ["mecoflow.example.test"],
    },
    secrets: {
      files: {
        applicationDatabasePassword: "secrets/application-database-password",
        keycloakAdminPassword: "secrets/keycloak-admin-password",
        keycloakDatabasePassword: "secrets/keycloak-database-password",
        redisPassword: "secrets/redis-password",
        s3AccessKey: "secrets/s3-access-key",
        s3SecretKey: "secrets/s3-secret-key",
        sessionSecret: "secrets/session-secret",
      },
      manager: {
        provider: "test-secret-manager",
        referencePrefix: "secret-manager://production/mecoflow",
        aclEvidenceId: "ACL-2026-08-02-001",
        reviewedAt: "2026-08-02T03:00:00Z",
        rotationTestedAt: "2026-07-20T03:00:00Z",
      },
      smtpEnabled: false,
    },
    tls: {
      certificateChainFile: "tls/fullchain.pem",
      privateKeyFile: "tls/private-key.pem",
      minimumRemainingDays: 30,
      trustEvidenceId: "TLS-TRUST-2026-08-02-001",
      trustReviewedAt: "2026-08-02T03:00:00Z",
      renewalProcedure: "RUNBOOK-TLS-01",
      renewalTestedAt: "2026-07-20T03:00:00Z",
    },
    objectStorage: {
      endpoint: "https://objects.example.test",
      bucket: "mecoflow-production-private",
      applicationEncryption: "aws:kms",
      kmsKeyReference: "kms://production/object-storage-key",
      policyEvidenceFile: "evidence/object-storage.json",
      maximumEvidenceAgeDays: 7,
    },
    offsiteBackup: {
      targetUri: "s3://mecoflow-offsite-backups/production",
      kmsKeyReference: "kms://recovery/offsite-backup-key",
      retentionDays: 35,
      rpoHours: 24,
      rtoHours: 4,
      crossFailureDomain: true,
      immutableOrVersioned: true,
      latestEvidenceFile: "evidence/offsite-backup.json",
      maximumRestoreEvidenceAgeDays: 90,
    },
    owners: {
      security: "security-team",
      operations: "operations-team",
      backup: "database-operations",
      tlsRenewal: "platform-operations",
      releaseApprover: "release-authority",
    },
  };
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "mecoflow-production-controls-"));
  mkdirSync(join(root, "secrets"));
  mkdirSync(join(root, "tls"));
  mkdirSync(join(root, "evidence"));
  const manifest = validManifest();
  writeFileSync(
    join(root, manifest.applicationEnvironmentFile),
    [
      "APP_ENV=production",
      "NODE_ENV=production",
      `APP_VERSION=${manifest.candidate.applicationVersion}`,
      `WEB_BASE_URL=${manifest.publicEndpoints.applicationUrl}`,
      `CORS_ORIGINS=${manifest.publicEndpoints.applicationUrl}`,
      `OIDC_ISSUER=${manifest.publicEndpoints.oidcIssuer}`,
      `OIDC_REDIRECT_URI=${manifest.publicEndpoints.applicationUrl}/api/v1/auth/callback`,
      "DATABASE_PASSWORD_FILE=/run/secrets/application-database-password",
      "REDIS_PASSWORD_FILE=/run/secrets/redis-password",
      `S3_ENDPOINT=${manifest.objectStorage.endpoint}`,
      `S3_BUCKET=${manifest.objectStorage.bucket}`,
      "S3_ACCESS_KEY_FILE=/run/secrets/s3-access-key",
      "S3_SECRET_KEY_FILE=/run/secrets/s3-secret-key",
      `S3_SERVER_SIDE_ENCRYPTION=${manifest.objectStorage.applicationEncryption}`,
      `S3_KMS_KEY_ID=${manifest.objectStorage.kmsKeyReference}`,
      "SESSION_SECRET_FILE=/run/secrets/session-secret",
      "",
    ].join("\n"),
  );
  let counter = 0;
  for (const path of Object.values(manifest.secrets.files)) {
    counter += 1;
    const fullPath = join(root, path);
    writeFileSync(
      fullPath,
      `test-only-unique-secret-${counter}-${"x".repeat(40)}`,
      {
        mode: 0o600,
      },
    );
    restrictTestFilePermissions(fullPath);
  }
  writeFileSync(join(root, manifest.tls.certificateChainFile), "test chain", {
    mode: 0o600,
  });
  writeFileSync(join(root, manifest.tls.privateKeyFile), "test key", {
    mode: 0o600,
  });
  restrictTestFilePermissions(join(root, manifest.tls.privateKeyFile));
  const objectEvidence = {
    schemaVersion: 1,
    evidenceId: "OBJECT-KMS-2026-08-02-001",
    verifiedAt: "2026-08-02T03:30:00Z",
    endpoint: manifest.objectStorage.endpoint,
    bucket: manifest.objectStorage.bucket,
    applicationEncryption: manifest.objectStorage.applicationEncryption,
    kmsKeyReference: manifest.objectStorage.kmsKeyReference,
    kmsBackedProviderEncryption: true,
    writeProbeEncrypted: true,
    readProbeEncrypted: true,
    denyUnencryptedWrite: true,
    anonymousAccessDenied: true,
    versioningEnabled: true,
  };
  const backupEvidence = {
    schemaVersion: 1,
    evidenceId: "OFFSITE-2026-08-02-001",
    backupId: "production-predeploy-20260802T030000Z",
    applicationVersion: "0.9.0",
    databaseSchemaVersion: "20260728030000_phase_9b_readiness_query_index",
    createdAt: "2026-08-02T03:00:00Z",
    copiedOffsiteAt: "2026-08-02T03:20:00Z",
    targetUri: manifest.offsiteBackup.targetUri,
    kmsKeyReference: manifest.offsiteBackup.kmsKeyReference,
    manifestSha256: "b".repeat(64),
    remoteChecksumVerified: true,
    restoreRehearsalId: "RESTORE-2026-08-01-001",
    restoreVerifiedAt: "2026-08-01T12:00:00Z",
  };
  writeFileSync(
    join(root, manifest.objectStorage.policyEvidenceFile),
    JSON.stringify(objectEvidence),
  );
  writeFileSync(
    join(root, manifest.offsiteBackup.latestEvidenceFile),
    JSON.stringify(backupEvidence),
  );
  const configPath = join(root, "production-controls.json");
  writeFileSync(configPath, JSON.stringify(manifest));
  return { backupEvidence, configPath, manifest, objectEvidence, root };
}

const tlsInspector = () => ({
  fingerprint256: "AA:BB:CC",
  subject: "CN=mecoflow.example.test",
  validTo: "2026-12-31T00:00:00.000Z",
});

test("accepts complete external production evidence without returning secret values", () => {
  const fixture = createFixture();
  try {
    const summary = verifyProductionControls({
      configPath: fixture.configPath,
      manifest: fixture.manifest,
      repositoryRoot: resolve(import.meta.dirname, ".."),
      now: NOW,
      tlsInspector,
    });
    assert.equal(summary.result, "passed");
    assert.equal(summary.secretFileCount, 7);
    const serialized = JSON.stringify(summary);
    assert.doesNotMatch(serialized, /test-only-unique-secret/);
    assert.equal(summary.backupId, fixture.backupEvidence.backupId);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("rejects staging, placeholder, insecure endpoint, and incomplete ownership configuration", () => {
  const manifest = validManifest();
  manifest.environment = "staging";
  manifest.candidate.sourceRevision = "replace-me";
  manifest.objectStorage.endpoint = "http://objects.example.test";
  manifest.owners.security = "TBD";
  assert.throws(
    () => validateProductionControlManifest(manifest, NOW),
    (error) =>
      error instanceof ProductionControlError &&
      error.fields.includes("environment") &&
      error.fields.includes("candidate.sourceRevision") &&
      error.fields.includes("objectStorage.endpoint") &&
      error.fields.includes("owners.security"),
  );
});

test("requires the control directory to remain outside the repository", () => {
  const repositoryRoot = resolve(import.meta.dirname, "..");
  const controlRoot = join(
    repositoryRoot,
    ".runtime",
    "invalid-production-control-test",
  );
  mkdirSync(controlRoot, { recursive: true });
  const configPath = join(controlRoot, "production-controls.json");
  const manifest = validManifest();
  writeFileSync(configPath, JSON.stringify(manifest));
  try {
    assert.throws(
      () =>
        verifyProductionControls({
          configPath,
          manifest,
          repositoryRoot,
          now: NOW,
          tlsInspector,
        }),
      (error) =>
        error instanceof ProductionControlError &&
        error.fields.includes("configPath.outsideRepository"),
    );
  } finally {
    rmSync(controlRoot, { force: true, recursive: true });
  }
});

test("rejects stale or mismatched KMS and off-site backup evidence", () => {
  const fixture = createFixture();
  try {
    fixture.objectEvidence.verifiedAt = "2026-01-01T00:00:00Z";
    fixture.objectEvidence.kmsKeyReference = "kms://wrong/key";
    fixture.backupEvidence.copiedOffsiteAt = "2026-07-30T00:00:00Z";
    fixture.backupEvidence.remoteChecksumVerified = false;
    writeFileSync(
      join(fixture.root, fixture.manifest.objectStorage.policyEvidenceFile),
      JSON.stringify(fixture.objectEvidence),
    );
    writeFileSync(
      join(fixture.root, fixture.manifest.offsiteBackup.latestEvidenceFile),
      JSON.stringify(fixture.backupEvidence),
    );
    assert.throws(
      () =>
        verifyProductionControls({
          configPath: fixture.configPath,
          manifest: fixture.manifest,
          repositoryRoot: resolve(import.meta.dirname, ".."),
          now: NOW,
          tlsInspector,
        }),
      (error) =>
        error instanceof ProductionControlError &&
        error.fields.includes("objectStorage.evidence.verifiedAt") &&
        error.fields.includes("objectStorage.evidence.kmsKeyReference") &&
        error.fields.includes("offsiteBackup.evidence.copiedOffsiteAt") &&
        error.fields.includes("offsiteBackup.evidence.remoteChecksumVerified"),
    );
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("rejects duplicate secret values without disclosing them", () => {
  const fixture = createFixture();
  try {
    const duplicate = "never-print-this-production-like-secret-value";
    for (const key of ["redisPassword", "s3SecretKey"]) {
      const path = join(fixture.root, fixture.manifest.secrets.files[key]);
      writeFileSync(path, duplicate, { mode: 0o600 });
      restrictTestFilePermissions(path);
    }
    assert.throws(
      () =>
        verifyProductionControls({
          configPath: fixture.configPath,
          manifest: fixture.manifest,
          repositoryRoot: resolve(import.meta.dirname, ".."),
          now: NOW,
          tlsInspector,
        }),
      (error) => {
        assert.equal(String(error).includes(duplicate), false);
        return (
          error instanceof ProductionControlError &&
          error.fields.includes("secrets.files.uniqueValues")
        );
      },
    );
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("rejects direct secrets and configuration drift in the application environment", () => {
  const fixture = createFixture();
  try {
    writeFileSync(
      join(fixture.root, fixture.manifest.applicationEnvironmentFile),
      [
        "APP_ENV=production",
        "NODE_ENV=production",
        "APP_VERSION=wrong-version",
        `WEB_BASE_URL=${fixture.manifest.publicEndpoints.applicationUrl}`,
        `CORS_ORIGINS=${fixture.manifest.publicEndpoints.applicationUrl}`,
        `OIDC_ISSUER=${fixture.manifest.publicEndpoints.oidcIssuer}`,
        `OIDC_REDIRECT_URI=${fixture.manifest.publicEndpoints.applicationUrl}/api/v1/auth/callback`,
        "DATABASE_URL=postgresql://user:secret@database/mecoflow",
        "DATABASE_PASSWORD_FILE=/run/secrets/application-database-password",
        "REDIS_PASSWORD_FILE=/run/secrets/redis-password",
        `S3_ENDPOINT=${fixture.manifest.objectStorage.endpoint}`,
        `S3_BUCKET=${fixture.manifest.objectStorage.bucket}`,
        "S3_ACCESS_KEY_FILE=/run/secrets/s3-access-key",
        "S3_SECRET_KEY_FILE=/run/secrets/s3-secret-key",
        `S3_SERVER_SIDE_ENCRYPTION=${fixture.manifest.objectStorage.applicationEncryption}`,
        "S3_KMS_KEY_ID=kms://wrong/key",
        "SESSION_SECRET_FILE=/run/secrets/session-secret",
      ].join("\n"),
    );
    assert.throws(
      () =>
        verifyProductionControls({
          configPath: fixture.configPath,
          manifest: fixture.manifest,
          repositoryRoot: resolve(import.meta.dirname, ".."),
          now: NOW,
          tlsInspector,
        }),
      (error) =>
        error instanceof ProductionControlError &&
        error.fields.includes("applicationEnvironmentFile.DATABASE_URL") &&
        error.fields.includes("applicationEnvironmentFile.APP_VERSION") &&
        error.fields.includes("applicationEnvironmentFile.S3_KMS_KEY_ID") &&
        !String(error).includes("postgresql://user:secret"),
    );
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("bounds external configuration and evidence files before parsing", () => {
  const fixture = createFixture();
  try {
    writeFileSync(
      join(fixture.root, fixture.manifest.applicationEnvironmentFile),
      "#".repeat(70 * 1024),
    );
    writeFileSync(
      join(fixture.root, fixture.manifest.objectStorage.policyEvidenceFile),
      " ".repeat(1024 * 1024 + 1),
    );
    assert.throws(
      () =>
        verifyProductionControls({
          configPath: fixture.configPath,
          manifest: fixture.manifest,
          repositoryRoot: resolve(import.meta.dirname, ".."),
          now: NOW,
          tlsInspector,
        }),
      (error) =>
        error instanceof ProductionControlError &&
        error.fields.includes("applicationEnvironmentFile") &&
        error.fields.includes("objectStorage.policyEvidenceFile"),
    );
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("fails closed when certificate files are not parseable", () => {
  const fixture = createFixture();
  try {
    assert.throws(() =>
      inspectTlsFiles({
        certificateChainPath: join(
          fixture.root,
          fixture.manifest.tls.certificateChainFile,
        ),
        privateKeyPath: join(fixture.root, fixture.manifest.tls.privateKeyFile),
        expectedHostnames: fixture.manifest.publicEndpoints.expectedDnsNames,
        minimumRemainingDays: 30,
        now: NOW,
      }),
    );
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});
