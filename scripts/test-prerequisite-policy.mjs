import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

function discover(root, suite) {
  const files = [];
  const visit = (directory) => {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (["node_modules", ".next", "dist", "generated"].includes(entry.name))
        continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else files.push(relative(root, path).replaceAll("\\", "/"));
    }
  };
  if (suite === "e2e") visit(join(root, "tests/e2e"));
  else {
    visit(join(root, "apps"));
    visit(join(root, "packages"));
  }
  return files
    .filter((file) => {
      if (suite === "e2e") return /\.spec\.ts$/u.test(file);
      if (suite === "integration")
        return /\.integration\.test\.ts$/u.test(file);
      if (suite === "authorization")
        return /\.authorization(?:\.integration)?\.test\.ts$/u.test(file);
      return (
        /\.(?:test|spec)\.tsx?$/u.test(file) &&
        !/\.(?:integration|authorization)\.test\.ts$/u.test(file)
      );
    })
    .sort();
}

export function validateDatabaseUrl(value, { githubActions = false } = {}) {
  if (!value)
    return [
      "DATABASE_URL must be explicitly set for required database-backed tests",
    ];
  let url;
  try {
    url = new URL(value);
  } catch {
    return ["DATABASE_URL must be a valid PostgreSQL URL"];
  }
  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    return ["DATABASE_URL must use PostgreSQL"];
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//u, ""));
  const forbidden = /(prod|production|staging|restore|shared)/iu;
  if (forbidden.test(database))
    return [
      "DATABASE_URL targets a forbidden shared/staging/restore/production database",
    ];
  if (!new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname)) {
    return [
      "Required tests must use a loopback isolated PostgreSQL host unless a future approved runner policy says otherwise",
    ];
  }
  if (githubActions) {
    if (database !== "mecoflow") {
      return [
        "GitHub Actions tests must use the ephemeral localhost mecoflow service database",
      ];
    }
  } else if (!/^mecoflow_verify_[a-z0-9_]+$/u.test(database)) {
    return [
      "Local required tests must target a newly created mecoflow_verify_* database",
    ];
  }
  return [];
}

function validateLoopbackServiceUrl(name, value, protocols) {
  if (!value) return [`${name} must be explicitly set`];
  let url;
  try {
    url = new URL(value);
  } catch {
    return [`${name} must be a valid URL`];
  }
  if (!protocols.has(url.protocol)) {
    return [`${name} uses an unsupported protocol`];
  }
  if (!new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname)) {
    return [`${name} must target an isolated loopback test service`];
  }
  return [];
}

export function validateTestEnvironment(suite, environment) {
  if (!new Set(["integration", "authorization", "e2e"]).has(suite)) {
    return [];
  }
  const errors = [];
  if (
    new Set(["integration", "authorization"]).has(suite) &&
    environment.APP_ENV !== "ci"
  ) {
    errors.push(`${suite}: APP_ENV must be exactly ci`);
  }
  if (suite === "e2e") return errors;

  errors.push(
    ...validateLoopbackServiceUrl(
      "REDIS_URL",
      environment.REDIS_URL,
      new Set(["redis:", "rediss:"]),
    ),
    ...validateLoopbackServiceUrl(
      "S3_ENDPOINT",
      environment.S3_ENDPOINT,
      new Set(["http:", "https:"]),
    ),
  );
  for (const name of [
    "S3_REGION",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_BUCKET",
  ]) {
    if (!environment[name]?.trim())
      errors.push(`${name} must be explicitly set`);
  }
  if (
    environment.S3_BUCKET &&
    !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/u.test(environment.S3_BUCKET)
  ) {
    errors.push("S3_BUCKET must be a valid nonempty test bucket name");
  }
  return errors;
}

export function validateRequiredSuite(root, suite) {
  const manifestPath = join(root, "tests/required-suites.json");
  if (!existsSync(manifestPath))
    return ["tests/required-suites.json is missing"];
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return ["tests/required-suites.json is invalid JSON"];
  }
  const required = manifest[suite];
  if (!Array.isArray(required) || required.length === 0)
    return [`required suite ${suite} is missing or empty`];
  const errors = required
    .filter((file) => !existsSync(join(root, file)))
    .map((file) => `${suite}: required test file is missing: ${file}`);
  const listed = new Set(required);
  if (listed.size !== required.length) {
    const seen = new Set();
    for (const file of required) {
      if (seen.has(file))
        errors.push(`${suite}: duplicate required-suite entry: ${file}`);
      seen.add(file);
    }
  }
  const discovered = new Set(discover(root, suite));
  for (const file of listed) {
    if (!discovered.has(file) && existsSync(join(root, file))) {
      errors.push(
        `${suite}: manifest entry is not a discovered ${suite} test file: ${file}`,
      );
    }
  }
  for (const file of discovered) {
    if (!listed.has(file))
      errors.push(
        `${suite}: discovered test file is missing from the required-suite manifest: ${file}`,
      );
  }
  return errors;
}
