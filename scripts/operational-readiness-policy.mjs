import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const DAY_MS = 86_400_000;
const REQUIRED_JOBS = [
  "alertmanager",
  "blackbox",
  "mecoflow-api",
  "mecoflow-keycloak",
  "mecoflow-public-https",
  "prometheus",
];

export class OperationalReadinessError extends Error {
  constructor(fields) {
    const unique = [...new Set(fields)];
    super(`Operational readiness preflight failed: ${unique.join(", ")}`);
    this.name = "OperationalReadinessError";
    this.fields = unique;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exact(value, required) {
  return (
    isObject(value) &&
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => required.includes(key))
  );
}

function text(value, minimum = 3) {
  return (
    typeof value === "string" &&
    value.length >= minimum &&
    value.length <= 500 &&
    !/(?:replace[-_ ]?me|placeholder|\btbd\b|\btodo\b)/i.test(value)
  );
}

function revision(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function integer(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function number(value, minimum, maximum) {
  return typeof value === "number" && value >= minimum && value <= maximum;
}

function recent(value, now, maximumAgeDays) {
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    timestamp <= now.getTime() + 5 * 60_000 &&
    timestamp >= now.getTime() - maximumAgeDays * DAY_MS
  );
}

function httpsReference(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && text(url.hostname);
  } catch {
    return false;
  }
}

function pathWithin(parent, candidate) {
  const difference = relative(parent, candidate);
  return (
    difference === "" ||
    (!isAbsolute(difference) &&
      difference !== ".." &&
      !difference.startsWith(`..${sep}`))
  );
}

function controlledFile(root, candidate, field, fields) {
  if (!text(candidate, 1)) {
    fields.push(field);
    return undefined;
  }
  const absolute = resolve(root, candidate);
  if (!pathWithin(root, absolute)) {
    fields.push(field);
    return undefined;
  }
  try {
    const metadata = lstatSync(absolute);
    if (
      metadata.isSymbolicLink() ||
      !metadata.isFile() ||
      metadata.size > 1024 * 1024
    ) {
      fields.push(field);
      return undefined;
    }
    const real = realpathSync(absolute);
    if (!pathWithin(root, real)) {
      fields.push(field);
      return undefined;
    }
    return real;
  } catch {
    fields.push(field);
    return undefined;
  }
}

function readEvidence(path, field, fields) {
  if (!path) return undefined;
  try {
    if (statSync(path).size > 1024 * 1024) throw new Error("too large");
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    fields.push(field);
    return undefined;
  }
}

export function validateOperationalManifest(manifest, now = new Date()) {
  const fields = [];
  if (
    !exact(manifest, [
      "schemaVersion",
      "environment",
      "candidate",
      "monitoring",
      "onCall",
      "capacity",
    ])
  )
    fields.push("manifest");
  if (manifest?.schemaVersion !== 1) fields.push("schemaVersion");
  if (manifest?.environment !== "production") fields.push("environment");

  if (!exact(manifest?.candidate, ["applicationVersion", "sourceRevision"]))
    fields.push("candidate");
  if (!text(manifest?.candidate?.applicationVersion))
    fields.push("candidate.applicationVersion");
  if (!revision(manifest?.candidate?.sourceRevision))
    fields.push("candidate.sourceRevision");

  const monitoring = manifest?.monitoring;
  if (
    !exact(monitoring, [
      "evidenceFile",
      "maximumEvidenceAgeHours",
      "minimumRetentionDays",
      "minimumAlertRuleCount",
    ])
  )
    fields.push("monitoring");
  if (!text(monitoring?.evidenceFile, 1))
    fields.push("monitoring.evidenceFile");
  if (!integer(monitoring?.maximumEvidenceAgeHours, 1, 168))
    fields.push("monitoring.maximumEvidenceAgeHours");
  if (!integer(monitoring?.minimumRetentionDays, 7, 400))
    fields.push("monitoring.minimumRetentionDays");
  if (!integer(monitoring?.minimumAlertRuleCount, 10, 200))
    fields.push("monitoring.minimumAlertRuleCount");

  const onCall = manifest?.onCall;
  if (
    !exact(onCall, [
      "evidenceFile",
      "maximumDrillAgeDays",
      "primaryScheduleReference",
      "secondaryScheduleReference",
      "escalationPolicyReference",
      "owners",
    ])
  )
    fields.push("onCall");
  if (!text(onCall?.evidenceFile, 1)) fields.push("onCall.evidenceFile");
  if (!integer(onCall?.maximumDrillAgeDays, 1, 365))
    fields.push("onCall.maximumDrillAgeDays");
  for (const key of [
    "primaryScheduleReference",
    "secondaryScheduleReference",
    "escalationPolicyReference",
  ]) {
    if (!httpsReference(onCall?.[key])) fields.push(`onCall.${key}`);
  }
  if (
    !exact(onCall?.owners, [
      "service",
      "operations",
      "security",
      "incidentCommander",
    ])
  )
    fields.push("onCall.owners");
  for (const key of [
    "service",
    "operations",
    "security",
    "incidentCommander",
  ]) {
    if (!text(onCall?.owners?.[key])) fields.push(`onCall.owners.${key}`);
  }

  const capacity = manifest?.capacity;
  if (
    !exact(capacity, [
      "evidenceFile",
      "maximumEvidenceAgeDays",
      "minimumDurationSeconds",
      "minimumRequests",
      "minimumConcurrency",
      "maximumErrorRate",
      "maximumP95Milliseconds",
      "maximumP99Milliseconds",
      "minimumResourceHeadroomPercent",
    ])
  )
    fields.push("capacity");
  if (!text(capacity?.evidenceFile, 1)) fields.push("capacity.evidenceFile");
  if (!integer(capacity?.maximumEvidenceAgeDays, 1, 90))
    fields.push("capacity.maximumEvidenceAgeDays");
  if (!integer(capacity?.minimumDurationSeconds, 300, 86400))
    fields.push("capacity.minimumDurationSeconds");
  if (!integer(capacity?.minimumRequests, 1000, 10_000_000))
    fields.push("capacity.minimumRequests");
  if (!integer(capacity?.minimumConcurrency, 1, 1000))
    fields.push("capacity.minimumConcurrency");
  if (!number(capacity?.maximumErrorRate, 0, 0.1))
    fields.push("capacity.maximumErrorRate");
  if (!number(capacity?.maximumP95Milliseconds, 1, 60_000))
    fields.push("capacity.maximumP95Milliseconds");
  if (
    !number(capacity?.maximumP99Milliseconds, 1, 120_000) ||
    capacity?.maximumP99Milliseconds < capacity?.maximumP95Milliseconds
  )
    fields.push("capacity.maximumP99Milliseconds");
  if (!number(capacity?.minimumResourceHeadroomPercent, 10, 80))
    fields.push("capacity.minimumResourceHeadroomPercent");

  if (fields.length) throw new OperationalReadinessError(fields);
  return manifest;
}

function validateMonitoringEvidence(evidence, manifest, now, fields) {
  const required = [
    "schemaVersion",
    "evidenceId",
    "observedAt",
    "applicationVersion",
    "sourceRevision",
    "prometheusHealthy",
    "alertmanagerHealthy",
    "blackboxHealthy",
    "retentionDays",
    "metricsPrivate",
    "publicMetricsStatus",
    "loadedAlertRuleCount",
    "jobsUp",
    "dashboardReviewed",
    "testAlertFired",
    "testAlertResolved",
    "collectionGapTested",
    "evidenceReference",
  ];
  if (!exact(evidence, required)) fields.push("monitoring.evidenceFile");
  if (evidence?.schemaVersion !== 1)
    fields.push("monitoring.evidence.schemaVersion");
  if (!text(evidence?.evidenceId) || !text(evidence?.evidenceReference))
    fields.push("monitoring.evidence.identity");
  if (
    !recent(
      evidence?.observedAt,
      now,
      manifest.monitoring.maximumEvidenceAgeHours / 24,
    )
  )
    fields.push("monitoring.evidence.observedAt");
  if (evidence?.applicationVersion !== manifest.candidate.applicationVersion)
    fields.push("monitoring.evidence.applicationVersion");
  if (evidence?.sourceRevision !== manifest.candidate.sourceRevision)
    fields.push("monitoring.evidence.sourceRevision");
  for (const key of [
    "prometheusHealthy",
    "alertmanagerHealthy",
    "blackboxHealthy",
    "metricsPrivate",
    "dashboardReviewed",
    "testAlertFired",
    "testAlertResolved",
    "collectionGapTested",
  ]) {
    if (evidence?.[key] !== true) fields.push(`monitoring.evidence.${key}`);
  }
  if (!integer(evidence?.publicMetricsStatus, 400, 499))
    fields.push("monitoring.evidence.publicMetricsStatus");
  if (
    !integer(
      evidence?.retentionDays,
      manifest.monitoring.minimumRetentionDays,
      400,
    )
  )
    fields.push("monitoring.evidence.retentionDays");
  if (
    !integer(
      evidence?.loadedAlertRuleCount,
      manifest.monitoring.minimumAlertRuleCount,
      500,
    )
  )
    fields.push("monitoring.evidence.loadedAlertRuleCount");
  if (
    !Array.isArray(evidence?.jobsUp) ||
    REQUIRED_JOBS.some((job) => !evidence.jobsUp.includes(job)) ||
    evidence.jobsUp.some((job) => !REQUIRED_JOBS.includes(job))
  )
    fields.push("monitoring.evidence.jobsUp");
}

function validateOnCallEvidence(evidence, manifest, now, fields) {
  const required = [
    "schemaVersion",
    "evidenceId",
    "testedAt",
    "provider",
    "receiverReference",
    "testAlertName",
    "firingDelivered",
    "resolvedDelivered",
    "primaryAcknowledged",
    "secondaryEscalationTested",
    "deliverySeconds",
    "acknowledgementSeconds",
    "incidentEvidenceReference",
  ];
  if (!exact(evidence, required)) fields.push("onCall.evidenceFile");
  if (evidence?.schemaVersion !== 1)
    fields.push("onCall.evidence.schemaVersion");
  for (const key of [
    "evidenceId",
    "provider",
    "receiverReference",
    "testAlertName",
    "incidentEvidenceReference",
  ])
    if (!text(evidence?.[key])) fields.push(`onCall.evidence.${key}`);
  if (!recent(evidence?.testedAt, now, manifest.onCall.maximumDrillAgeDays))
    fields.push("onCall.evidence.testedAt");
  for (const key of [
    "firingDelivered",
    "resolvedDelivered",
    "primaryAcknowledged",
    "secondaryEscalationTested",
  ])
    if (evidence?.[key] !== true) fields.push(`onCall.evidence.${key}`);
  if (!number(evidence?.deliverySeconds, 0, 300))
    fields.push("onCall.evidence.deliverySeconds");
  if (!number(evidence?.acknowledgementSeconds, 0, 900))
    fields.push("onCall.evidence.acknowledgementSeconds");
}

function validateCapacityEvidence(evidence, manifest, now, fields) {
  const required = [
    "schemaVersion",
    "evidenceId",
    "generatedAt",
    "environment",
    "productionEquivalent",
    "applicationVersion",
    "sourceRevision",
    "targetOrigin",
    "datasetProfile",
    "durationSeconds",
    "concurrency",
    "requestCount",
    "errorRate",
    "p95Milliseconds",
    "p99Milliseconds",
    "allScenariosPassed",
    "resourceHeadroomPercent",
    "queueRecoverySeconds",
    "resourceEvidenceReference",
    "scenarioResults",
    "statusCounts",
    "thresholds",
    "result",
  ];
  if (!exact(evidence, required)) fields.push("capacity.evidenceFile");
  if (evidence?.schemaVersion !== 1)
    fields.push("capacity.evidence.schemaVersion");
  for (const key of [
    "evidenceId",
    "datasetProfile",
    "resourceEvidenceReference",
  ])
    if (!text(evidence?.[key])) fields.push(`capacity.evidence.${key}`);
  if (
    !recent(
      evidence?.generatedAt,
      now,
      manifest.capacity.maximumEvidenceAgeDays,
    )
  )
    fields.push("capacity.evidence.generatedAt");
  if (
    !new Set(["production", "staging"]).has(evidence?.environment) ||
    evidence?.productionEquivalent !== true
  )
    fields.push("capacity.evidence.environment");
  if (evidence?.applicationVersion !== manifest.candidate.applicationVersion)
    fields.push("capacity.evidence.applicationVersion");
  if (evidence?.sourceRevision !== manifest.candidate.sourceRevision)
    fields.push("capacity.evidence.sourceRevision");
  if (!httpsReference(evidence?.targetOrigin))
    fields.push("capacity.evidence.targetOrigin");
  if (
    !number(
      evidence?.durationSeconds,
      manifest.capacity.minimumDurationSeconds,
      172800,
    )
  )
    fields.push("capacity.evidence.durationSeconds");
  if (
    !integer(evidence?.concurrency, manifest.capacity.minimumConcurrency, 5000)
  )
    fields.push("capacity.evidence.concurrency");
  if (
    !integer(
      evidence?.requestCount,
      manifest.capacity.minimumRequests,
      100_000_000,
    )
  )
    fields.push("capacity.evidence.requestCount");
  if (!number(evidence?.errorRate, 0, manifest.capacity.maximumErrorRate))
    fields.push("capacity.evidence.errorRate");
  if (
    !number(
      evidence?.p95Milliseconds,
      0,
      manifest.capacity.maximumP95Milliseconds,
    )
  )
    fields.push("capacity.evidence.p95Milliseconds");
  if (
    !number(
      evidence?.p99Milliseconds,
      0,
      manifest.capacity.maximumP99Milliseconds,
    )
  )
    fields.push("capacity.evidence.p99Milliseconds");
  if (evidence?.allScenariosPassed !== true || evidence?.result !== "passed")
    fields.push("capacity.evidence.result");
  if (
    !number(
      evidence?.resourceHeadroomPercent,
      manifest.capacity.minimumResourceHeadroomPercent,
      100,
    )
  )
    fields.push("capacity.evidence.resourceHeadroomPercent");
  if (!number(evidence?.queueRecoverySeconds, 0, 300))
    fields.push("capacity.evidence.queueRecoverySeconds");
  if (
    !Array.isArray(evidence?.scenarioResults) ||
    evidence.scenarioResults.length < 3 ||
    ["health", "internal", "supplier"].some(
      (kind) =>
        !evidence.scenarioResults.some(
          (result) =>
            exact(result, [
              "name",
              "kind",
              "requestCount",
              "errorRate",
              "p95Milliseconds",
              "p99Milliseconds",
              "passed",
            ]) &&
            result.kind === kind &&
            text(result.name) &&
            integer(result.requestCount, 1, 100_000_000) &&
            result.passed === true,
        ),
    )
  )
    fields.push("capacity.evidence.scenarioResults");
  if (!isObject(evidence?.statusCounts))
    fields.push("capacity.evidence.statusCounts");
  if (
    !exact(evidence?.thresholds, [
      "maximumErrorRate",
      "maximumP95Milliseconds",
      "maximumP99Milliseconds",
    ]) ||
    evidence.thresholds.maximumErrorRate !==
      manifest.capacity.maximumErrorRate ||
    evidence.thresholds.maximumP95Milliseconds !==
      manifest.capacity.maximumP95Milliseconds ||
    evidence.thresholds.maximumP99Milliseconds !==
      manifest.capacity.maximumP99Milliseconds
  )
    fields.push("capacity.evidence.thresholds");
}

export function verifyOperationalReadiness({
  configPath,
  manifest,
  repositoryRoot,
  now = new Date(),
}) {
  validateOperationalManifest(manifest, now);
  if (!isAbsolute(configPath))
    throw new OperationalReadinessError(["configPath"]);
  let root;
  let realConfig;
  try {
    const metadata = lstatSync(configPath);
    if (
      metadata.isSymbolicLink() ||
      !metadata.isFile() ||
      metadata.size > 1024 * 1024
    )
      throw new Error("invalid");
    root = realpathSync(dirname(configPath));
    realConfig = realpathSync(configPath);
  } catch {
    throw new OperationalReadinessError(["configPath"]);
  }
  const repository = realpathSync(repositoryRoot);
  if (
    !pathWithin(root, realConfig) ||
    pathWithin(repository, root) ||
    pathWithin(repository, realConfig)
  )
    throw new OperationalReadinessError(["configPath.outsideRepository"]);

  const fields = [];
  const monitoringEvidence = readEvidence(
    controlledFile(
      root,
      manifest.monitoring.evidenceFile,
      "monitoring.evidenceFile",
      fields,
    ),
    "monitoring.evidenceFile",
    fields,
  );
  const onCallEvidence = readEvidence(
    controlledFile(
      root,
      manifest.onCall.evidenceFile,
      "onCall.evidenceFile",
      fields,
    ),
    "onCall.evidenceFile",
    fields,
  );
  const capacityEvidence = readEvidence(
    controlledFile(
      root,
      manifest.capacity.evidenceFile,
      "capacity.evidenceFile",
      fields,
    ),
    "capacity.evidenceFile",
    fields,
  );
  if (monitoringEvidence)
    validateMonitoringEvidence(monitoringEvidence, manifest, now, fields);
  if (onCallEvidence)
    validateOnCallEvidence(onCallEvidence, manifest, now, fields);
  if (capacityEvidence)
    validateCapacityEvidence(capacityEvidence, manifest, now, fields);
  if (fields.length) throw new OperationalReadinessError(fields);

  return {
    schemaVersion: 1,
    result: "passed",
    verifiedAt: now.toISOString(),
    applicationVersion: manifest.candidate.applicationVersion,
    sourceRevision: manifest.candidate.sourceRevision,
    monitoringEvidenceId: monitoringEvidence.evidenceId,
    onCallEvidenceId: onCallEvidence.evidenceId,
    capacityEvidenceId: capacityEvidence.evidenceId,
    owners: manifest.onCall.owners,
    limitations: [
      "Provider evidence and paging identities require independent operations and security approval.",
    ],
  };
}

export function loadOperationalManifest(configPath, now = new Date()) {
  return validateOperationalManifest(
    JSON.parse(readFileSync(configPath, "utf8")),
    now,
  );
}
