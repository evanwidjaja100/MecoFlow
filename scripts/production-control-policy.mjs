import {
  X509Certificate,
  createPrivateKey,
  createPublicKey,
  timingSafeEqual,
} from "node:crypto";
import {
  chmodSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const DAY_MS = 24 * 60 * 60 * 1000;
const REQUIRED_SECRET_FILES = {
  applicationDatabasePassword: 24,
  keycloakAdminPassword: 24,
  keycloakDatabasePassword: 24,
  redisPassword: 24,
  s3AccessKey: 16,
  s3SecretKey: 24,
  sessionSecret: 32,
};
const OPTIONAL_SECRET_FILES = { smtpPassword: 24 };
const ALLOWED_OFFSITE_SCHEMES = new Set(["az:", "gs:", "https:", "s3:"]);
const ALLOWED_ENCRYPTION = new Set(["AES256", "aws:kms"]);

export class ProductionControlError extends Error {
  constructor(fields) {
    super(
      `Production control preflight failed: ${[...new Set(fields)].join(", ")}`,
    );
    this.name = "ProductionControlError";
    this.fields = [...new Set(fields)];
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, required, optional = []) {
  if (!isObject(value)) return false;
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
}

function isNonPlaceholder(value, minimum = 1) {
  return (
    typeof value === "string" &&
    value.length >= minimum &&
    !/(?:replace[-_ ]?me|placeholder|\btbd\b|\btodo\b)/i.test(value)
  );
}

function isRecentTimestamp(value, now, maximumAgeDays, allowFutureMinutes = 5) {
  const parsed = Date.parse(value);
  return (
    Number.isFinite(parsed) &&
    parsed <= now.getTime() + allowFutureMinutes * 60_000 &&
    parsed >= now.getTime() - maximumAgeDays * DAY_MS
  );
}

function isPositiveInteger(value, maximum) {
  return Number.isInteger(value) && value > 0 && value <= maximum;
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isKmsReference(value) {
  if (!isNonPlaceholder(value, 8)) return false;
  try {
    const url = new URL(value);
    return url.protocol.length > 1 && url.protocol !== "file:";
  } catch {
    return false;
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isOffsiteUri(value) {
  try {
    return ALLOWED_OFFSITE_SCHEMES.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

function pathIsWithin(parent, candidate) {
  const difference = relative(parent, candidate);
  return (
    difference === "" ||
    (!isAbsolute(difference) &&
      !difference.startsWith(`..${sep}`) &&
      difference !== "..")
  );
}

function resolveControlledPath(controlRoot, candidate, field, fields) {
  if (!isNonPlaceholder(candidate)) {
    fields.push(field);
    return undefined;
  }
  const absolute = resolve(controlRoot, candidate);
  if (!pathIsWithin(controlRoot, absolute)) {
    fields.push(field);
    return undefined;
  }
  try {
    const metadata = lstatSync(absolute);
    if (metadata.isSymbolicLink() || !metadata.isFile()) {
      fields.push(field);
      return undefined;
    }
    const real = realpathSync(absolute);
    if (!pathIsWithin(controlRoot, real)) {
      fields.push(field);
      return undefined;
    }
    return real;
  } catch {
    fields.push(field);
    return undefined;
  }
}

function readJsonEvidence(path, field, fields) {
  if (!path) return undefined;
  try {
    if (statSync(path).size > 1024 * 1024)
      throw new Error("EVIDENCE_TOO_LARGE");
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    fields.push(field);
    return undefined;
  }
}

function inspectSecretFile(path, minimumLength, field, fields) {
  if (!path) return undefined;
  try {
    const metadata = statSync(path);
    if (metadata.size > 8192) {
      fields.push(field);
      return undefined;
    }
    if (process.platform !== "win32" && (metadata.mode & 0o077) !== 0)
      fields.push(`${field}.permissions`);
    const value = readFileSync(path, "utf8").trim();
    if (
      value.length < minimumLength ||
      value.length > 4096 ||
      value.includes("\0") ||
      /(?:local_only|change_me|replace[-_ ]?me|placeholder)/i.test(value)
    )
      fields.push(field);
    return value;
  } catch {
    fields.push(field);
    return undefined;
  }
}

function certificateBlocks(pem) {
  return (
    pem.match(
      /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,
    ) ?? []
  );
}

export function inspectTlsFiles({
  certificateChainPath,
  privateKeyPath,
  expectedHostnames,
  minimumRemainingDays,
  now,
}) {
  if (
    statSync(certificateChainPath).size > 1024 * 1024 ||
    statSync(privateKeyPath).size > 1024 * 1024
  )
    throw new Error("TLS_FILE_TOO_LARGE");
  const chain = certificateBlocks(
    readFileSync(certificateChainPath, "utf8"),
  ).map((block) => new X509Certificate(block));
  if (chain.length < 2) throw new Error("TLS_CHAIN_INCOMPLETE");
  const leaf = chain[0];
  const validFrom = Date.parse(leaf.validFrom);
  const validTo = Date.parse(leaf.validTo);
  if (
    !Number.isFinite(validFrom) ||
    !Number.isFinite(validTo) ||
    validFrom > now.getTime() ||
    validTo < now.getTime() + minimumRemainingDays * DAY_MS
  )
    throw new Error("TLS_CERTIFICATE_VALIDITY");
  if (leaf.subject === leaf.issuer) throw new Error("TLS_SELF_SIGNED_LEAF");
  for (const hostname of expectedHostnames) {
    if (!leaf.checkHost(hostname)) throw new Error("TLS_HOSTNAME_MISMATCH");
  }
  for (let index = 0; index < chain.length - 1; index += 1) {
    if (
      !chain[index + 1].ca ||
      !chain[index].verify(chain[index + 1].publicKey)
    )
      throw new Error("TLS_CHAIN_INVALID");
  }
  const privateKey = createPrivateKey(readFileSync(privateKeyPath, "utf8"));
  const keyPublic = createPublicKey(privateKey).export({
    format: "der",
    type: "spki",
  });
  const certificatePublic = leaf.publicKey.export({
    format: "der",
    type: "spki",
  });
  if (
    keyPublic.length !== certificatePublic.length ||
    !timingSafeEqual(keyPublic, certificatePublic)
  )
    throw new Error("TLS_PRIVATE_KEY_MISMATCH");
  return {
    fingerprint256: leaf.fingerprint256,
    subject: leaf.subject,
    validTo: new Date(validTo).toISOString(),
  };
}

export function validateProductionControlManifest(manifest, now = new Date()) {
  const fields = [];
  if (
    !hasExactKeys(manifest, [
      "schemaVersion",
      "environment",
      "applicationEnvironmentFile",
      "candidate",
      "publicEndpoints",
      "secrets",
      "tls",
      "objectStorage",
      "offsiteBackup",
      "owners",
    ])
  )
    fields.push("manifest");
  if (manifest?.schemaVersion !== 1) fields.push("schemaVersion");
  if (manifest?.environment !== "production") fields.push("environment");
  if (!isNonPlaceholder(manifest?.applicationEnvironmentFile))
    fields.push("applicationEnvironmentFile");

  const candidate = manifest?.candidate;
  if (!hasExactKeys(candidate, ["applicationVersion", "sourceRevision"]))
    fields.push("candidate");
  if (!isNonPlaceholder(candidate?.applicationVersion, 3))
    fields.push("candidate.applicationVersion");
  if (
    typeof candidate?.sourceRevision !== "string" ||
    !/^[a-f0-9]{40}$/.test(candidate.sourceRevision)
  )
    fields.push("candidate.sourceRevision");

  const endpoints = manifest?.publicEndpoints;
  if (
    !hasExactKeys(endpoints, [
      "applicationUrl",
      "oidcIssuer",
      "expectedDnsNames",
    ])
  )
    fields.push("publicEndpoints");
  if (!isHttpsUrl(endpoints?.applicationUrl))
    fields.push("publicEndpoints.applicationUrl");
  if (!isHttpsUrl(endpoints?.oidcIssuer))
    fields.push("publicEndpoints.oidcIssuer");
  if (
    !Array.isArray(endpoints?.expectedDnsNames) ||
    endpoints.expectedDnsNames.length === 0 ||
    endpoints.expectedDnsNames.some((value) => !isNonPlaceholder(value, 3))
  )
    fields.push("publicEndpoints.expectedDnsNames");
  try {
    const hostname = new URL(endpoints?.applicationUrl).hostname;
    if (!endpoints?.expectedDnsNames?.includes(hostname))
      fields.push("publicEndpoints.expectedDnsNames");
  } catch {
    // The URL field already records the failure.
  }

  const secrets = manifest?.secrets;
  if (!hasExactKeys(secrets, ["files", "manager", "smtpEnabled"]))
    fields.push("secrets");
  const requiredSecretKeys = Object.keys(REQUIRED_SECRET_FILES);
  const optionalSecretKeys = secrets?.smtpEnabled
    ? Object.keys(OPTIONAL_SECRET_FILES)
    : [];
  if (
    !hasExactKeys(secrets?.files, [
      ...requiredSecretKeys,
      ...optionalSecretKeys,
    ])
  )
    fields.push("secrets.files");
  for (const key of [...requiredSecretKeys, ...optionalSecretKeys]) {
    if (!isNonPlaceholder(secrets?.files?.[key]))
      fields.push(`secrets.files.${key}`);
  }
  if (typeof secrets?.smtpEnabled !== "boolean")
    fields.push("secrets.smtpEnabled");
  if (
    !hasExactKeys(secrets?.manager, [
      "provider",
      "referencePrefix",
      "aclEvidenceId",
      "reviewedAt",
      "rotationTestedAt",
    ])
  )
    fields.push("secrets.manager");
  for (const key of ["provider", "referencePrefix", "aclEvidenceId"]) {
    if (!isNonPlaceholder(secrets?.manager?.[key], 3))
      fields.push(`secrets.manager.${key}`);
  }
  if (!isRecentTimestamp(secrets?.manager?.reviewedAt, now, 90))
    fields.push("secrets.manager.reviewedAt");
  if (!isRecentTimestamp(secrets?.manager?.rotationTestedAt, now, 365))
    fields.push("secrets.manager.rotationTestedAt");

  const tls = manifest?.tls;
  if (
    !hasExactKeys(tls, [
      "certificateChainFile",
      "privateKeyFile",
      "minimumRemainingDays",
      "trustEvidenceId",
      "trustReviewedAt",
      "renewalProcedure",
      "renewalTestedAt",
    ])
  )
    fields.push("tls");
  for (const key of [
    "certificateChainFile",
    "privateKeyFile",
    "trustEvidenceId",
    "renewalProcedure",
  ]) {
    if (!isNonPlaceholder(tls?.[key], 3)) fields.push(`tls.${key}`);
  }
  if (!isPositiveInteger(tls?.minimumRemainingDays, 120))
    fields.push("tls.minimumRemainingDays");
  if (!isRecentTimestamp(tls?.trustReviewedAt, now, 30))
    fields.push("tls.trustReviewedAt");
  if (!isRecentTimestamp(tls?.renewalTestedAt, now, 365))
    fields.push("tls.renewalTestedAt");

  const objectStorage = manifest?.objectStorage;
  if (
    !hasExactKeys(objectStorage, [
      "endpoint",
      "bucket",
      "applicationEncryption",
      "kmsKeyReference",
      "policyEvidenceFile",
      "maximumEvidenceAgeDays",
    ])
  )
    fields.push("objectStorage");
  if (!isHttpsUrl(objectStorage?.endpoint))
    fields.push("objectStorage.endpoint");
  if (!isNonPlaceholder(objectStorage?.bucket, 3))
    fields.push("objectStorage.bucket");
  if (!ALLOWED_ENCRYPTION.has(objectStorage?.applicationEncryption))
    fields.push("objectStorage.applicationEncryption");
  if (!isKmsReference(objectStorage?.kmsKeyReference))
    fields.push("objectStorage.kmsKeyReference");
  if (!isNonPlaceholder(objectStorage?.policyEvidenceFile))
    fields.push("objectStorage.policyEvidenceFile");
  if (!isPositiveInteger(objectStorage?.maximumEvidenceAgeDays, 30))
    fields.push("objectStorage.maximumEvidenceAgeDays");

  const backup = manifest?.offsiteBackup;
  if (
    !hasExactKeys(backup, [
      "targetUri",
      "kmsKeyReference",
      "retentionDays",
      "rpoHours",
      "rtoHours",
      "crossFailureDomain",
      "immutableOrVersioned",
      "latestEvidenceFile",
      "maximumRestoreEvidenceAgeDays",
    ])
  )
    fields.push("offsiteBackup");
  if (!isOffsiteUri(backup?.targetUri)) fields.push("offsiteBackup.targetUri");
  if (!isKmsReference(backup?.kmsKeyReference))
    fields.push("offsiteBackup.kmsKeyReference");
  if (!isPositiveInteger(backup?.retentionDays, 3650))
    fields.push("offsiteBackup.retentionDays");
  if (!isPositiveInteger(backup?.rpoHours, 4))
    fields.push("offsiteBackup.rpoHours");
  if (!isPositiveInteger(backup?.rtoHours, 8))
    fields.push("offsiteBackup.rtoHours");
  if (backup?.crossFailureDomain !== true)
    fields.push("offsiteBackup.crossFailureDomain");
  if (backup?.immutableOrVersioned !== true)
    fields.push("offsiteBackup.immutableOrVersioned");
  if (!isNonPlaceholder(backup?.latestEvidenceFile))
    fields.push("offsiteBackup.latestEvidenceFile");
  if (!isPositiveInteger(backup?.maximumRestoreEvidenceAgeDays, 365))
    fields.push("offsiteBackup.maximumRestoreEvidenceAgeDays");

  const owners = manifest?.owners;
  if (
    !hasExactKeys(owners, [
      "security",
      "operations",
      "backup",
      "tlsRenewal",
      "releaseApprover",
    ])
  )
    fields.push("owners");
  for (const key of [
    "security",
    "operations",
    "backup",
    "tlsRenewal",
    "releaseApprover",
  ]) {
    if (!isNonPlaceholder(owners?.[key], 3)) fields.push(`owners.${key}`);
  }

  if (fields.length > 0) throw new ProductionControlError(fields);
  return manifest;
}

function validateObjectEvidence(evidence, configuration, now, fields) {
  const required = [
    "schemaVersion",
    "evidenceId",
    "verifiedAt",
    "endpoint",
    "bucket",
    "applicationEncryption",
    "kmsKeyReference",
    "kmsBackedProviderEncryption",
    "writeProbeEncrypted",
    "readProbeEncrypted",
    "denyUnencryptedWrite",
    "anonymousAccessDenied",
    "versioningEnabled",
  ];
  if (!hasExactKeys(evidence, required))
    fields.push("objectStorage.policyEvidenceFile");
  if (evidence?.schemaVersion !== 1)
    fields.push("objectStorage.evidence.schemaVersion");
  if (!isNonPlaceholder(evidence?.evidenceId, 3))
    fields.push("objectStorage.evidence.evidenceId");
  if (
    !isRecentTimestamp(
      evidence?.verifiedAt,
      now,
      configuration.maximumEvidenceAgeDays,
    )
  )
    fields.push("objectStorage.evidence.verifiedAt");
  for (const key of [
    "endpoint",
    "bucket",
    "applicationEncryption",
    "kmsKeyReference",
  ]) {
    if (evidence?.[key] !== configuration[key])
      fields.push(`objectStorage.evidence.${key}`);
  }
  for (const key of [
    "kmsBackedProviderEncryption",
    "writeProbeEncrypted",
    "readProbeEncrypted",
    "denyUnencryptedWrite",
    "anonymousAccessDenied",
    "versioningEnabled",
  ]) {
    if (evidence?.[key] !== true) fields.push(`objectStorage.evidence.${key}`);
  }
}

function validateBackupEvidence(evidence, configuration, now, fields) {
  const required = [
    "databaseSchemaVersion",
    "evidenceId",
    "backupId",
    "applicationVersion",
    "schemaVersion",
    "createdAt",
    "copiedOffsiteAt",
    "targetUri",
    "kmsKeyReference",
    "manifestSha256",
    "remoteChecksumVerified",
    "restoreRehearsalId",
    "restoreVerifiedAt",
  ];
  if (!hasExactKeys(evidence, required))
    fields.push("offsiteBackup.latestEvidenceFile");
  if (evidence?.schemaVersion !== 1)
    fields.push("offsiteBackup.evidence.schemaVersion");
  for (const key of [
    "evidenceId",
    "backupId",
    "applicationVersion",
    "databaseSchemaVersion",
    "restoreRehearsalId",
  ]) {
    if (!isNonPlaceholder(evidence?.[key], 3))
      fields.push(`offsiteBackup.evidence.${key}`);
  }
  if (
    !isRecentTimestamp(
      evidence?.createdAt,
      now,
      configuration.rpoHours / 24 + 1,
    )
  )
    fields.push("offsiteBackup.evidence.createdAt");
  if (
    !isRecentTimestamp(
      evidence?.copiedOffsiteAt,
      now,
      configuration.rpoHours / 24,
    )
  )
    fields.push("offsiteBackup.evidence.copiedOffsiteAt");
  if (evidence?.targetUri !== configuration.targetUri)
    fields.push("offsiteBackup.evidence.targetUri");
  if (evidence?.kmsKeyReference !== configuration.kmsKeyReference)
    fields.push("offsiteBackup.evidence.kmsKeyReference");
  if (!isSha256(evidence?.manifestSha256))
    fields.push("offsiteBackup.evidence.manifestSha256");
  if (evidence?.remoteChecksumVerified !== true)
    fields.push("offsiteBackup.evidence.remoteChecksumVerified");
  if (
    !isRecentTimestamp(
      evidence?.restoreVerifiedAt,
      now,
      configuration.maximumRestoreEvidenceAgeDays,
    )
  )
    fields.push("offsiteBackup.evidence.restoreVerifiedAt");
}

function parseApplicationEnvironment(content, fields) {
  const environment = {};
  const directSecretKeys = new Set([
    "DATABASE_URL",
    "KEYCLOAK_ADMIN_PASSWORD",
    "REDIS_URL",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "SESSION_SECRET",
    "SMTP_PASSWORD",
  ]);
  for (const [index, rawLine] of content.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) {
      fields.push(`applicationEnvironmentFile.line${index + 1}`);
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || Object.hasOwn(environment, key)) {
      fields.push(`applicationEnvironmentFile.${key || `line${index + 1}`}`);
      continue;
    }
    if (
      directSecretKeys.has(key) ||
      (!key.endsWith("_FILE") &&
        /(?:PASSWORD|PRIVATE_KEY|SECRET|TOKEN)$/.test(key))
    )
      fields.push(`applicationEnvironmentFile.${key}`);
    environment[key] = value;
  }
  return environment;
}

function validateApplicationEnvironment(environment, manifest, fields) {
  const expected = {
    APP_ENV: "production",
    NODE_ENV: "production",
    APP_VERSION: manifest.candidate.applicationVersion,
    WEB_BASE_URL: manifest.publicEndpoints.applicationUrl,
    CORS_ORIGINS: manifest.publicEndpoints.applicationUrl,
    OIDC_ISSUER: manifest.publicEndpoints.oidcIssuer,
    OIDC_REDIRECT_URI: `${manifest.publicEndpoints.applicationUrl}/api/v1/auth/callback`,
    S3_ENDPOINT: manifest.objectStorage.endpoint,
    S3_BUCKET: manifest.objectStorage.bucket,
    S3_SERVER_SIDE_ENCRYPTION: manifest.objectStorage.applicationEncryption,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (environment[key] !== value)
      fields.push(`applicationEnvironmentFile.${key}`);
  }
  if (
    manifest.objectStorage.applicationEncryption === "aws:kms" &&
    environment.S3_KMS_KEY_ID !== manifest.objectStorage.kmsKeyReference
  )
    fields.push("applicationEnvironmentFile.S3_KMS_KEY_ID");
  if (
    manifest.objectStorage.applicationEncryption === "AES256" &&
    environment.S3_KMS_KEY_ID
  )
    fields.push("applicationEnvironmentFile.S3_KMS_KEY_ID");
  const requiredSecretBindings = [
    "DATABASE_PASSWORD_FILE",
    "REDIS_PASSWORD_FILE",
    "S3_ACCESS_KEY_FILE",
    "S3_SECRET_KEY_FILE",
    "SESSION_SECRET_FILE",
  ];
  if (manifest.secrets.smtpEnabled)
    requiredSecretBindings.push("SMTP_PASSWORD_FILE");
  for (const key of requiredSecretBindings) {
    if (!environment[key]?.startsWith("/run/secrets/"))
      fields.push(`applicationEnvironmentFile.${key}`);
  }
}

export function verifyProductionControls({
  configPath,
  manifest,
  repositoryRoot,
  now = new Date(),
  tlsInspector = inspectTlsFiles,
}) {
  validateProductionControlManifest(manifest, now);
  if (!isAbsolute(configPath)) throw new ProductionControlError(["configPath"]);
  let controlRoot;
  let realConfigPath;
  try {
    const configMetadata = lstatSync(configPath);
    if (configMetadata.isSymbolicLink() || !configMetadata.isFile())
      throw new Error("INVALID_CONFIG_FILE");
    controlRoot = realpathSync(dirname(configPath));
    realConfigPath = realpathSync(configPath);
  } catch {
    throw new ProductionControlError(["configPath"]);
  }
  const repository = realpathSync(repositoryRoot);
  if (
    !pathIsWithin(controlRoot, realConfigPath) ||
    pathIsWithin(repository, controlRoot) ||
    pathIsWithin(repository, realConfigPath)
  )
    throw new ProductionControlError(["configPath.outsideRepository"]);

  const fields = [];
  const applicationEnvironmentPath = resolveControlledPath(
    controlRoot,
    manifest.applicationEnvironmentFile,
    "applicationEnvironmentFile",
    fields,
  );
  if (applicationEnvironmentPath) {
    try {
      if (statSync(applicationEnvironmentPath).size > 64 * 1024)
        throw new Error("APPLICATION_ENVIRONMENT_TOO_LARGE");
      const applicationEnvironment = parseApplicationEnvironment(
        readFileSync(applicationEnvironmentPath, "utf8"),
        fields,
      );
      validateApplicationEnvironment(applicationEnvironment, manifest, fields);
    } catch {
      fields.push("applicationEnvironmentFile");
    }
  }
  const secretValues = [];
  const secretDefinitions = {
    ...REQUIRED_SECRET_FILES,
    ...(manifest.secrets.smtpEnabled ? OPTIONAL_SECRET_FILES : {}),
  };
  for (const [key, minimumLength] of Object.entries(secretDefinitions)) {
    const field = `secrets.files.${key}`;
    const path = resolveControlledPath(
      controlRoot,
      manifest.secrets.files[key],
      field,
      fields,
    );
    const value = inspectSecretFile(path, minimumLength, field, fields);
    if (value) secretValues.push(value);
  }
  if (new Set(secretValues).size !== secretValues.length)
    fields.push("secrets.files.uniqueValues");

  const certificateChainPath = resolveControlledPath(
    controlRoot,
    manifest.tls.certificateChainFile,
    "tls.certificateChainFile",
    fields,
  );
  const privateKeyPath = resolveControlledPath(
    controlRoot,
    manifest.tls.privateKeyFile,
    "tls.privateKeyFile",
    fields,
  );
  if (privateKeyPath && process.platform !== "win32") {
    try {
      if ((statSync(privateKeyPath).mode & 0o077) !== 0)
        fields.push("tls.privateKeyFile.permissions");
    } catch {
      fields.push("tls.privateKeyFile.permissions");
    }
  }
  let tlsSummary;
  if (certificateChainPath && privateKeyPath) {
    try {
      tlsSummary = tlsInspector({
        certificateChainPath,
        privateKeyPath,
        expectedHostnames: manifest.publicEndpoints.expectedDnsNames,
        minimumRemainingDays: manifest.tls.minimumRemainingDays,
        now,
      });
    } catch {
      fields.push("tls.certificateValidation");
    }
  }

  const objectEvidencePath = resolveControlledPath(
    controlRoot,
    manifest.objectStorage.policyEvidenceFile,
    "objectStorage.policyEvidenceFile",
    fields,
  );
  const objectEvidence = readJsonEvidence(
    objectEvidencePath,
    "objectStorage.policyEvidenceFile",
    fields,
  );
  if (objectEvidence)
    validateObjectEvidence(objectEvidence, manifest.objectStorage, now, fields);

  const backupEvidencePath = resolveControlledPath(
    controlRoot,
    manifest.offsiteBackup.latestEvidenceFile,
    "offsiteBackup.latestEvidenceFile",
    fields,
  );
  const backupEvidence = readJsonEvidence(
    backupEvidencePath,
    "offsiteBackup.latestEvidenceFile",
    fields,
  );
  if (backupEvidence)
    validateBackupEvidence(backupEvidence, manifest.offsiteBackup, now, fields);

  if (fields.length > 0) throw new ProductionControlError(fields);
  return {
    schemaVersion: 1,
    result: "passed",
    verifiedAt: now.toISOString(),
    applicationVersion: manifest.candidate.applicationVersion,
    sourceRevision: manifest.candidate.sourceRevision,
    secretFileCount: Object.keys(secretDefinitions).length,
    applicationEnvironmentValidated: true,
    secretManagerProvider: manifest.secrets.manager.provider,
    secretAclEvidenceId: manifest.secrets.manager.aclEvidenceId,
    tls: tlsSummary,
    objectStorageEvidenceId: objectEvidence.evidenceId,
    objectStorageEncryption: manifest.objectStorage.applicationEncryption,
    offsiteBackupEvidenceId: backupEvidence.evidenceId,
    backupId: backupEvidence.backupId,
    restoreRehearsalId: backupEvidence.restoreRehearsalId,
    owners: manifest.owners,
    limitations: [
      "External provider assertions require independent security and operations approval.",
      ...(process.platform === "win32"
        ? [
            "Windows file ACLs are represented by the required reviewed ACL evidence identifier.",
          ]
        : []),
    ],
  };
}

export function loadProductionControlManifest(configPath, now = new Date()) {
  const manifest = JSON.parse(readFileSync(configPath, "utf8"));
  return validateProductionControlManifest(manifest, now);
}

export function restrictTestFilePermissions(path) {
  if (process.platform !== "win32") chmodSync(path, 0o600);
}
