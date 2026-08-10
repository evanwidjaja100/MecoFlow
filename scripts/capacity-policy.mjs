import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const ALLOWED_HEADERS = new Set(["accept", "authorization", "cookie"]);
const ALLOWED_KINDS = new Set(["health", "internal", "supplier"]);
const ALLOWED_METHODS = new Set(["GET", "HEAD"]);

export class CapacityConfigError extends Error {
  constructor(fields) {
    const unique = [...new Set(fields)];
    super(`Capacity configuration failed: ${unique.join(", ")}`);
    this.name = "CapacityConfigError";
    this.fields = unique;
  }
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exact(value, keys) {
  return (
    object(value) &&
    keys.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => keys.includes(key))
  );
}

function text(value, minimum = 1, maximum = 500) {
  return (
    typeof value === "string" &&
    value.length >= minimum &&
    value.length <= maximum &&
    !/(?:replace[-_ ]?me|placeholder|\btbd\b|\btodo\b)/i.test(value)
  );
}

function integer(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function number(value, minimum, maximum) {
  return typeof value === "number" && value >= minimum && value <= maximum;
}

function within(parent, candidate) {
  const difference = relative(parent, candidate);
  return (
    difference === "" ||
    (!isAbsolute(difference) &&
      difference !== ".." &&
      !difference.startsWith(`..${sep}`))
  );
}

function safeOrigin(value, environment) {
  try {
    const url = new URL(value);
    if (
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      return false;
    if (environment === "local")
      return (
        ["http:", "https:"].includes(url.protocol) &&
        ["127.0.0.1", "localhost"].includes(url.hostname)
      );
    return (
      url.protocol === "https:" &&
      !["127.0.0.1", "localhost"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function safePath(value) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 500 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("\0")
  )
    return false;
  let decodedPath = value.split(/[?#]/u, 1)[0];
  for (let pass = 0; pass < 3; pass += 1) {
    if (decodedPath.split("/").some((part) => part === "." || part === ".."))
      return false;
    try {
      const next = decodeURIComponent(decodedPath);
      if (next === decodedPath) break;
      decodedPath = next;
    } catch {
      return false;
    }
  }
  try {
    const url = new URL(value, "https://capacity.invalid");
    if (
      url.origin !== "https://capacity.invalid" ||
      decodedPath.startsWith("//") ||
      decodedPath.includes("\\")
    )
      return false;
    for (const key of url.searchParams.keys())
      if (
        /(?:authorization|cookie|credential|key|password|secret|token)/i.test(
          key,
        )
      )
        return false;
    return true;
  } catch {
    return false;
  }
}

export function validateCapacityConfig(config) {
  const fields = [];
  const required = [
    "schemaVersion",
    "environment",
    "candidate",
    "targetOrigin",
    "datasetProfile",
    "productionEquivalent",
    "durationSeconds",
    "warmupSeconds",
    "concurrency",
    "maxRequests",
    "requestTimeoutMs",
    "thresholds",
    "resourceObservation",
    "scenarios",
    "outputDirectory",
  ];
  if (!exact(config, required)) fields.push("config");
  if (config?.schemaVersion !== 1) fields.push("schemaVersion");
  if (!new Set(["local", "staging", "production"]).has(config?.environment))
    fields.push("environment");
  if (!exact(config?.candidate, ["applicationVersion", "sourceRevision"]))
    fields.push("candidate");
  if (!text(config?.candidate?.applicationVersion, 3))
    fields.push("candidate.applicationVersion");
  if (
    typeof config?.candidate?.sourceRevision !== "string" ||
    !/^[a-f0-9]{40}$/.test(config.candidate.sourceRevision)
  )
    fields.push("candidate.sourceRevision");
  if (!safeOrigin(config?.targetOrigin, config?.environment))
    fields.push("targetOrigin");
  if (!text(config?.datasetProfile, 3)) fields.push("datasetProfile");
  if (typeof config?.productionEquivalent !== "boolean")
    fields.push("productionEquivalent");
  if (!integer(config?.durationSeconds, 1, 86_400))
    fields.push("durationSeconds");
  if (!integer(config?.warmupSeconds, 0, 600)) fields.push("warmupSeconds");
  if (!integer(config?.concurrency, 1, 500)) fields.push("concurrency");
  if (!integer(config?.maxRequests, config?.concurrency ?? 1, 10_000_000))
    fields.push("maxRequests");
  if (!integer(config?.requestTimeoutMs, 100, 120_000))
    fields.push("requestTimeoutMs");
  if (!text(config?.outputDirectory, 1, 1000)) fields.push("outputDirectory");

  if (
    !exact(config?.thresholds, [
      "maximumErrorRate",
      "maximumP95Milliseconds",
      "maximumP99Milliseconds",
    ])
  )
    fields.push("thresholds");
  if (!number(config?.thresholds?.maximumErrorRate, 0, 0.1))
    fields.push("thresholds.maximumErrorRate");
  if (!number(config?.thresholds?.maximumP95Milliseconds, 1, 60_000))
    fields.push("thresholds.maximumP95Milliseconds");
  if (
    !number(
      config?.thresholds?.maximumP99Milliseconds,
      config?.thresholds?.maximumP95Milliseconds ?? 1,
      120_000,
    )
  )
    fields.push("thresholds.maximumP99Milliseconds");

  if (
    !exact(config?.resourceObservation, [
      "resourceHeadroomPercent",
      "queueRecoverySeconds",
      "evidenceReference",
    ])
  )
    fields.push("resourceObservation");
  if (!number(config?.resourceObservation?.resourceHeadroomPercent, 0, 100))
    fields.push("resourceObservation.resourceHeadroomPercent");
  if (!number(config?.resourceObservation?.queueRecoverySeconds, 0, 3600))
    fields.push("resourceObservation.queueRecoverySeconds");
  if (!text(config?.resourceObservation?.evidenceReference, 3))
    fields.push("resourceObservation.evidenceReference");

  if (
    !Array.isArray(config?.scenarios) ||
    config.scenarios.length < 1 ||
    config.scenarios.length > 20
  )
    fields.push("scenarios");
  const names = new Set();
  for (const [index, scenario] of (config?.scenarios ?? []).entries()) {
    const prefix = `scenarios.${index}`;
    if (
      !exact(scenario, [
        "name",
        "kind",
        "method",
        "path",
        "weight",
        "expectedStatuses",
        "headersFile",
      ])
    )
      fields.push(prefix);
    if (
      !text(scenario?.name, 3, 80) ||
      !/^[a-z][a-z0-9-]+$/.test(scenario?.name ?? "") ||
      names.has(scenario?.name)
    )
      fields.push(`${prefix}.name`);
    names.add(scenario?.name);
    if (!ALLOWED_KINDS.has(scenario?.kind)) fields.push(`${prefix}.kind`);
    if (!ALLOWED_METHODS.has(scenario?.method)) fields.push(`${prefix}.method`);
    if (!safePath(scenario?.path)) fields.push(`${prefix}.path`);
    if (!integer(scenario?.weight, 1, 100)) fields.push(`${prefix}.weight`);
    if (
      !Array.isArray(scenario?.expectedStatuses) ||
      scenario.expectedStatuses.length < 1 ||
      scenario.expectedStatuses.length > 5 ||
      scenario.expectedStatuses.some((status) => !integer(status, 200, 499))
    )
      fields.push(`${prefix}.expectedStatuses`);
    if (scenario?.headersFile !== null && !text(scenario?.headersFile, 1, 500))
      fields.push(`${prefix}.headersFile`);
  }
  if (config?.environment !== "local") {
    for (const kind of ALLOWED_KINDS)
      if (!config?.scenarios?.some((scenario) => scenario.kind === kind))
        fields.push(`scenarios.${kind}`);
    for (const scenario of config?.scenarios ?? [])
      if (scenario.kind !== "health" && !scenario.headersFile)
        fields.push(`scenarios.${scenario.name}.headersFile`);
  }
  if (fields.length) throw new CapacityConfigError(fields);
  return config;
}

function loadHeaders(root, candidate, field, fields) {
  if (candidate === null) return {};
  const absolute = resolve(root, candidate);
  if (!within(root, absolute)) {
    fields.push(field);
    return {};
  }
  try {
    const metadata = lstatSync(absolute);
    if (
      metadata.isSymbolicLink() ||
      !metadata.isFile() ||
      metadata.size > 16 * 1024
    )
      throw new Error("invalid");
    const real = realpathSync(absolute);
    if (!within(root, real)) throw new Error("outside");
    const value = JSON.parse(readFileSync(real, "utf8"));
    if (
      !object(value) ||
      Object.keys(value).length < 1 ||
      Object.keys(value).length > 5
    )
      throw new Error("shape");
    const headers = {};
    for (const [name, headerValue] of Object.entries(value)) {
      const normalized = name.toLowerCase();
      if (
        !ALLOWED_HEADERS.has(normalized) ||
        !text(headerValue, 1, 8192) ||
        /[\r\n]/.test(headerValue)
      )
        throw new Error("header");
      headers[normalized] = headerValue;
    }
    return headers;
  } catch {
    fields.push(field);
    return {};
  }
}

export function loadCapacityConfig(configPath, repositoryRoot) {
  const fields = [];
  if (!isAbsolute(configPath)) throw new CapacityConfigError(["configPath"]);
  let realConfig;
  let root;
  try {
    const metadata = lstatSync(configPath);
    if (
      metadata.isSymbolicLink() ||
      !metadata.isFile() ||
      metadata.size > 1024 * 1024
    )
      throw new Error("invalid");
    realConfig = realpathSync(configPath);
    root = realpathSync(dirname(configPath));
  } catch {
    throw new CapacityConfigError(["configPath"]);
  }
  const config = validateCapacityConfig(
    JSON.parse(readFileSync(realConfig, "utf8")),
  );
  const repository = realpathSync(repositoryRoot);
  if (
    config.environment !== "local" &&
    (within(repository, realConfig) || within(repository, root))
  )
    fields.push("configPath.outsideRepository");
  const outputDirectory = resolve(root, config.outputDirectory);
  if (config.environment !== "local" && within(repository, outputDirectory))
    fields.push("outputDirectory.outsideRepository");
  const scenarios = config.scenarios.map((scenario, index) => ({
    ...scenario,
    headers: loadHeaders(
      root,
      scenario.headersFile,
      `scenarios.${index}.headersFile`,
      fields,
    ),
  }));
  if (fields.length) throw new CapacityConfigError(fields);
  return { ...config, outputDirectory, scenarios };
}

export function percentile(sorted, quantile) {
  if (sorted.length === 0) return 0;
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)
  ];
}

export function evaluateCapacityMeasurements(
  config,
  measurements,
  generatedAt = new Date(),
) {
  const sorted = measurements
    .map((item) => item.durationMilliseconds)
    .sort((left, right) => left - right);
  const requestCount = measurements.length;
  const errorCount = measurements.filter((item) => !item.passed).length;
  const errorRate = requestCount === 0 ? 1 : errorCount / requestCount;
  const statusCounts = {};
  for (const item of measurements) {
    const key = item.status
      ? String(item.status)
      : (item.errorClassification ?? "network_error");
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }
  const scenarioResults = config.scenarios.map((scenario) => {
    const selected = measurements.filter(
      (item) => item.scenario === scenario.name,
    );
    const durations = selected
      .map((item) => item.durationMilliseconds)
      .sort((left, right) => left - right);
    const failures = selected.filter((item) => !item.passed).length;
    const scenarioErrorRate =
      selected.length === 0 ? 1 : failures / selected.length;
    const p95 = percentile(durations, 0.95);
    const p99 = percentile(durations, 0.99);
    return {
      name: scenario.name,
      kind: scenario.kind,
      requestCount: selected.length,
      errorRate: scenarioErrorRate,
      p95Milliseconds: p95,
      p99Milliseconds: p99,
      passed:
        selected.length > 0 &&
        scenarioErrorRate <= config.thresholds.maximumErrorRate &&
        p95 <= config.thresholds.maximumP95Milliseconds &&
        p99 <= config.thresholds.maximumP99Milliseconds,
    };
  });
  const p95Milliseconds = percentile(sorted, 0.95);
  const p99Milliseconds = percentile(sorted, 0.99);
  const passed =
    requestCount > 0 &&
    errorRate <= config.thresholds.maximumErrorRate &&
    p95Milliseconds <= config.thresholds.maximumP95Milliseconds &&
    p99Milliseconds <= config.thresholds.maximumP99Milliseconds &&
    scenarioResults.every((result) => result.passed);
  return {
    schemaVersion: 1,
    evidenceId: `capacity-${generatedAt.toISOString().replaceAll(":", "-")}`,
    generatedAt: generatedAt.toISOString(),
    environment: config.environment,
    productionEquivalent: config.productionEquivalent,
    applicationVersion: config.candidate.applicationVersion,
    sourceRevision: config.candidate.sourceRevision,
    targetOrigin: config.targetOrigin,
    datasetProfile: config.datasetProfile,
    durationSeconds: config.durationSeconds,
    concurrency: config.concurrency,
    requestCount,
    errorRate,
    p95Milliseconds,
    p99Milliseconds,
    allScenariosPassed: scenarioResults.every((result) => result.passed),
    resourceHeadroomPercent: config.resourceObservation.resourceHeadroomPercent,
    queueRecoverySeconds: config.resourceObservation.queueRecoverySeconds,
    resourceEvidenceReference: config.resourceObservation.evidenceReference,
    scenarioResults,
    statusCounts,
    thresholds: config.thresholds,
    result: passed ? "passed" : "failed",
  };
}
