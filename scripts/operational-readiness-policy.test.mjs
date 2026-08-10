import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  OperationalReadinessError,
  verifyOperationalReadiness,
} from "./operational-readiness-policy.mjs";

const now = new Date("2026-08-02T04:00:00.000Z");
const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const revision = "a".repeat(40);

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "mecoflow-operations-"));
  const monitoring = {
    schemaVersion: 1,
    evidenceId: "monitoring-evidence-20260802",
    observedAt: "2026-08-02T03:30:00.000Z",
    applicationVersion: "1.0.0",
    sourceRevision: revision,
    prometheusHealthy: true,
    alertmanagerHealthy: true,
    blackboxHealthy: true,
    retentionDays: 30,
    metricsPrivate: true,
    publicMetricsStatus: 404,
    loadedAlertRuleCount: 17,
    jobsUp: [
      "alertmanager",
      "blackbox",
      "mecoflow-api",
      "mecoflow-keycloak",
      "mecoflow-public-https",
      "prometheus",
    ],
    dashboardReviewed: true,
    testAlertFired: true,
    testAlertResolved: true,
    collectionGapTested: true,
    evidenceReference: "evidence://monitoring/20260802",
  };
  const onCall = {
    schemaVersion: 1,
    evidenceId: "oncall-drill-20260802",
    testedAt: "2026-08-02T03:00:00.000Z",
    provider: "Example paging provider",
    receiverReference: "provider://receiver/mecoflow-production",
    testAlertName: "MecoFlowPagingDrill",
    firingDelivered: true,
    resolvedDelivered: true,
    primaryAcknowledged: true,
    secondaryEscalationTested: true,
    deliverySeconds: 12,
    acknowledgementSeconds: 90,
    incidentEvidenceReference: "evidence://incident/paging-drill-20260802",
  };
  const capacity = {
    schemaVersion: 1,
    evidenceId: "capacity-20260802",
    generatedAt: "2026-08-02T03:45:00.000Z",
    environment: "staging",
    productionEquivalent: true,
    applicationVersion: "1.0.0",
    sourceRevision: revision,
    targetOrigin: "https://mecoflow.example.test",
    datasetProfile: "approved-pilot-volume-profile-v1",
    durationSeconds: 1800,
    concurrency: 20,
    requestCount: 20_000,
    errorRate: 0.002,
    p95Milliseconds: 450,
    p99Milliseconds: 900,
    allScenariosPassed: true,
    resourceHeadroomPercent: 40,
    queueRecoverySeconds: 120,
    resourceEvidenceReference: "evidence://capacity/resources-20260802",
    scenarioResults: [
      {
        name: "health-ready",
        kind: "health",
        requestCount: 6000,
        errorRate: 0,
        p95Milliseconds: 100,
        p99Milliseconds: 200,
        passed: true,
      },
      {
        name: "internal-readiness",
        kind: "internal",
        requestCount: 7000,
        errorRate: 0.002,
        p95Milliseconds: 450,
        p99Milliseconds: 900,
        passed: true,
      },
      {
        name: "supplier-scorecard",
        kind: "supplier",
        requestCount: 7000,
        errorRate: 0.002,
        p95Milliseconds: 400,
        p99Milliseconds: 850,
        passed: true,
      },
    ],
    statusCounts: { 200: 19960, 500: 40 },
    thresholds: {
      maximumErrorRate: 0.01,
      maximumP95Milliseconds: 1000,
      maximumP99Milliseconds: 2000,
    },
    result: "passed",
  };
  const manifest = {
    schemaVersion: 1,
    environment: "production",
    candidate: { applicationVersion: "1.0.0", sourceRevision: revision },
    monitoring: {
      evidenceFile: "monitoring.json",
      maximumEvidenceAgeHours: 24,
      minimumRetentionDays: 30,
      minimumAlertRuleCount: 17,
    },
    onCall: {
      evidenceFile: "oncall.json",
      maximumDrillAgeDays: 90,
      primaryScheduleReference: "https://paging.example.test/schedules/primary",
      secondaryScheduleReference:
        "https://paging.example.test/schedules/secondary",
      escalationPolicyReference:
        "https://paging.example.test/escalations/mecoflow",
      owners: {
        service: "MECO Flow service owner",
        operations: "Operations lead",
        security: "Security lead",
        incidentCommander: "Incident commander rotation",
      },
    },
    capacity: {
      evidenceFile: "capacity.json",
      maximumEvidenceAgeDays: 30,
      minimumDurationSeconds: 1800,
      minimumRequests: 10_000,
      minimumConcurrency: 10,
      maximumErrorRate: 0.01,
      maximumP95Milliseconds: 1000,
      maximumP99Milliseconds: 2000,
      minimumResourceHeadroomPercent: 30,
    },
  };
  writeFileSync(path.join(root, "monitoring.json"), JSON.stringify(monitoring));
  writeFileSync(path.join(root, "oncall.json"), JSON.stringify(onCall));
  writeFileSync(path.join(root, "capacity.json"), JSON.stringify(capacity));
  const configPath = path.join(root, "manifest.json");
  writeFileSync(configPath, JSON.stringify(manifest));
  return { capacity, configPath, manifest, monitoring, onCall, root };
}

test("accepts current private monitoring, on-call drill, and capacity evidence", () => {
  const item = fixture();
  try {
    const result = verifyOperationalReadiness({ ...item, repositoryRoot, now });
    assert.equal(result.result, "passed");
    assert.equal(result.capacityEvidenceId, "capacity-20260802");
    assert.equal(JSON.stringify(result).includes("provider://receiver"), false);
  } finally {
    rmSync(item.root, { force: true, recursive: true });
  }
});

test("requires the manifest and evidence directory outside the repository", () => {
  const item = fixture();
  try {
    assert.throws(
      () =>
        verifyOperationalReadiness({
          configPath: path.join(repositoryRoot, "package.json"),
          manifest: item.manifest,
          repositoryRoot,
          now,
        }),
      /outsideRepository/,
    );
  } finally {
    rmSync(item.root, { force: true, recursive: true });
  }
});

test("rejects stale, incomplete, public, or untested monitoring evidence", () => {
  const item = fixture();
  try {
    writeFileSync(
      path.join(item.root, "monitoring.json"),
      JSON.stringify({
        ...item.monitoring,
        observedAt: "2026-07-01T00:00:00.000Z",
        metricsPrivate: false,
        testAlertResolved: false,
      }),
    );
    assert.throws(
      () => verifyOperationalReadiness({ ...item, repositoryRoot, now }),
      (error) =>
        error instanceof OperationalReadinessError &&
        error.fields.includes("monitoring.evidence.observedAt") &&
        error.fields.includes("monitoring.evidence.metricsPrivate") &&
        error.fields.includes("monitoring.evidence.testAlertResolved"),
    );
  } finally {
    rmSync(item.root, { force: true, recursive: true });
  }
});

test("rejects paging without resolved delivery, acknowledgement, and escalation", () => {
  const item = fixture();
  try {
    writeFileSync(
      path.join(item.root, "oncall.json"),
      JSON.stringify({
        ...item.onCall,
        resolvedDelivered: false,
        primaryAcknowledged: false,
        secondaryEscalationTested: false,
      }),
    );
    assert.throws(
      () => verifyOperationalReadiness({ ...item, repositoryRoot, now }),
      /onCall\.evidence\.resolvedDelivered/,
    );
  } finally {
    rmSync(item.root, { force: true, recursive: true });
  }
});

test("rejects capacity claims that miss latency, error, duration, equivalence, or headroom gates", () => {
  const item = fixture();
  try {
    writeFileSync(
      path.join(item.root, "capacity.json"),
      JSON.stringify({
        ...item.capacity,
        productionEquivalent: false,
        durationSeconds: 60,
        errorRate: 0.02,
        p95Milliseconds: 1500,
        resourceHeadroomPercent: 5,
        result: "failed",
      }),
    );
    assert.throws(
      () => verifyOperationalReadiness({ ...item, repositoryRoot, now }),
      (error) =>
        error instanceof OperationalReadinessError &&
        error.fields.includes("capacity.evidence.environment") &&
        error.fields.includes("capacity.evidence.errorRate") &&
        error.fields.includes("capacity.evidence.resourceHeadroomPercent"),
    );
  } finally {
    rmSync(item.root, { force: true, recursive: true });
  }
});

test("does not disclose receiver or evidence reference values in failures", () => {
  const item = fixture();
  try {
    item.manifest.onCall.primaryScheduleReference =
      "replace-me-secret-reference";
    assert.throws(
      () => verifyOperationalReadiness({ ...item, repositoryRoot, now }),
      (error) =>
        error instanceof OperationalReadinessError &&
        !error.message.includes("replace-me-secret-reference") &&
        error.message.includes("onCall.primaryScheduleReference"),
    );
  } finally {
    rmSync(item.root, { force: true, recursive: true });
  }
});
