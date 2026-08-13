import { createHash } from "node:crypto";
import { relative, resolve } from "node:path";

const ID = /^[a-z0-9_]+$/u;
const SHA_1 = /^[0-9a-f]{40}$/u;
const APP_ENV = /^[a-z0-9][a-z0-9_-]{0,31}$/u;
const DATABASE_HOST =
  /^(?:[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?|[0-9a-f:]+)$/u;
const DATABASE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/u;
const PUBLIC_API_URL = /^https?:\/\/\S+$/u;
const EVIDENCE_JOBS = new Set(["verify", "container-security"]);
const SECRET_NAME =
  /(?:SECRET|TOKEN|PASSWORD|PRIVATE|DATABASE_URL|ACCESS_KEY)/iu;

function validatePublicApiBaseUrl(value, message) {
  if (value === null) return null;
  if (typeof value !== "string" || !PUBLIC_API_URL.test(value)) {
    throw new Error(message);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(message);
  }
  if (
    !new Set(["http:", "https:"]).has(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(message);
  }
  return value;
}

export function secretValues(env) {
  return Object.entries(env)
    .filter(
      ([name, value]) => SECRET_NAME.test(name) && (value?.length ?? 0) >= 8,
    )
    .map(([, value]) => value)
    .sort((left, right) => right.length - left.length);
}

export function redactOutput(output, secrets) {
  return secrets.reduce(
    (redacted, secret) => redacted.replaceAll(secret, "[REDACTED]"),
    output,
  );
}

export function resolveCommandEvidenceDirectory(
  root,
  requestedDirectory,
  job = "verify",
) {
  if (!EVIDENCE_JOBS.has(job)) {
    throw new Error("CI command evidence job identity is invalid");
  }
  const directory = resolve(root, requestedDirectory, job, "commands");
  const relativePath = relative(resolve(root), directory);
  if (relativePath.startsWith("..") || relativePath === "") {
    throw new Error("CI command evidence must remain inside the repository");
  }
  return directory;
}

export function buildEnvironmentIdentity(env) {
  const appEnv = env.APP_ENV?.trim().toLowerCase() ?? "";
  if (!APP_ENV.test(appEnv)) {
    throw new Error("command evidence requires a safe APP_ENV identity");
  }

  const publicApiBaseUrl = env.NEXT_PUBLIC_API_BASE_URL?.trim() || null;
  validatePublicApiBaseUrl(
    publicApiBaseUrl,
    "command evidence public API URL is unsafe",
  );

  if (!env.DATABASE_URL?.trim()) {
    return { appEnv, database: null, publicApiBaseUrl };
  }

  let databaseUrl;
  try {
    databaseUrl = new URL(env.DATABASE_URL ?? "");
  } catch {
    throw new Error("command evidence requires a valid DATABASE_URL identity");
  }
  if (!new Set(["postgres:", "postgresql:"]).has(databaseUrl.protocol)) {
    throw new Error("command evidence DATABASE_URL must use PostgreSQL");
  }

  const host = databaseUrl.hostname
    .replace(/^\[|\]$/gu, "")
    .trim()
    .toLowerCase();
  let name;
  try {
    const path = decodeURIComponent(databaseUrl.pathname);
    name = path.startsWith("/") ? path.slice(1) : path;
  } catch {
    throw new Error("command evidence database name is invalid");
  }
  if (!DATABASE_HOST.test(host) || !DATABASE_NAME.test(name)) {
    throw new Error("command evidence database host/name identity is invalid");
  }

  return { appEnv, database: { host, name }, publicApiBaseUrl };
}

function validateEnvironmentIdentity(environment) {
  if (environment === undefined) return undefined;
  const appEnv = environment?.appEnv;
  const database = environment?.database;
  const publicApiBaseUrl = environment?.publicApiBaseUrl;
  const host = database?.host;
  const name = database?.name;
  if (
    typeof appEnv !== "string" ||
    !APP_ENV.test(appEnv) ||
    (database !== null &&
      (typeof host !== "string" ||
        !DATABASE_HOST.test(host) ||
        typeof name !== "string" ||
        !DATABASE_NAME.test(name))) ||
    Object.keys(environment).some(
      (key) => !["appEnv", "database", "publicApiBaseUrl"].includes(key),
    ) ||
    (database !== null &&
      Object.keys(database).some((key) => !["host", "name"].includes(key)))
  ) {
    throw new Error("command evidence environment identity is invalid");
  }
  validatePublicApiBaseUrl(
    publicApiBaseUrl,
    "command evidence environment identity is invalid",
  );
  return database === null
    ? { appEnv, database: null, publicApiBaseUrl }
    : { appEnv, database: { host, name }, publicApiBaseUrl };
}

export function buildCommandEvidence({
  id,
  argv,
  sourceSha,
  startedAt,
  endedAt,
  exitCode,
  signal = null,
  stdout,
  stderr,
  environment,
}) {
  if (!ID.test(id)) throw new Error("command evidence ID is invalid");
  if (
    !Array.isArray(argv) ||
    argv.length === 0 ||
    argv.some((value) => !value)
  ) {
    throw new Error("command evidence requires a non-empty argv array");
  }
  if (!SHA_1.test(sourceSha)) {
    throw new Error("command evidence requires a full source SHA");
  }
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (
    !Number.isFinite(start.valueOf()) ||
    !Number.isFinite(end.valueOf()) ||
    end < start
  ) {
    throw new Error("command evidence timestamps are invalid");
  }
  if (exitCode !== null && (!Number.isInteger(exitCode) || exitCode < 0)) {
    throw new Error("command evidence exit code is invalid");
  }
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  const evidence = {
    schemaVersion: 1,
    id,
    argv,
    sourceSha,
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    durationMs: end.valueOf() - start.valueOf(),
    exitCode,
    signal,
    stdout: { path: `${id}.stdout.log`, sha256: digest(stdout) },
    stderr: { path: `${id}.stderr.log`, sha256: digest(stderr) },
  };
  const environmentIdentity = validateEnvironmentIdentity(environment);
  if (environmentIdentity) evidence.environment = environmentIdentity;
  return evidence;
}
