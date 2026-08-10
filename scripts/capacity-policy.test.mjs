import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import {
  evaluateCapacityMeasurements,
  percentile,
  validateCapacityConfig,
} from "./capacity-policy.mjs";
import { executeCapacity } from "./run-capacity.mjs";

const revision = "b".repeat(40);

function config(overrides = {}) {
  return {
    schemaVersion: 1,
    environment: "local",
    candidate: { applicationVersion: "1.0.0", sourceRevision: revision },
    targetOrigin: "http://127.0.0.1:3001",
    datasetProfile: "local-capacity-smoke",
    productionEquivalent: false,
    durationSeconds: 1,
    warmupSeconds: 0,
    concurrency: 2,
    maxRequests: 20,
    requestTimeoutMs: 1000,
    thresholds: {
      maximumErrorRate: 0.01,
      maximumP95Milliseconds: 1000,
      maximumP99Milliseconds: 2000,
    },
    resourceObservation: {
      resourceHeadroomPercent: 50,
      queueRecoverySeconds: 0,
      evidenceReference: "local://capacity-smoke",
    },
    scenarios: [
      {
        name: "health-ready",
        kind: "health",
        method: "GET",
        path: "/health/ready",
        weight: 1,
        expectedStatuses: [200],
        headersFile: null,
        headers: {},
      },
    ],
    outputDirectory: ".runtime/capacity",
    ...overrides,
  };
}

test("validates read-only local scenarios and deterministic percentiles", () => {
  const value = config();
  const validationShape = {
    ...value,
    scenarios: value.scenarios.map(
      ({ headers: _headers, ...scenario }) => scenario,
    ),
  };
  assert.equal(validateCapacityConfig(validationShape), validationShape);
  assert.equal(percentile([10, 20, 30, 40], 0.95), 40);
  assert.equal(percentile([], 0.95), 0);
});

test("rejects mutating methods, secret query names, and external local targets", () => {
  const value = config({
    targetOrigin: "https://external.example.test",
    scenarios: [
      {
        name: "bad-scenario",
        kind: "internal",
        method: "POST",
        path: "/api/v1/projects?token=secret",
        weight: 1,
        expectedStatuses: [200],
        headersFile: null,
      },
    ],
  });
  assert.throws(() => validateCapacityConfig(value), /targetOrigin/);
  assert.throws(() => validateCapacityConfig(value), /scenarios\.0\.method/);
});

test("rejects raw, encoded, and double-encoded traversal path segments", () => {
  for (const path of [
    "/api/v1/../health/ready",
    "/api/v1/%2e%2e/health/ready",
    "/api/v1/%252e%252e/health/ready",
    "/api/v1/%2e%2e%2fhealth/ready",
  ]) {
    const value = config({
      scenarios: [{ ...config().scenarios[0], path }],
    });
    assert.throws(() => validateCapacityConfig(value), /scenarios\.0\.path/);
  }
});

test("requires health, internal, and supplier scenarios plus external auth files outside local mode", () => {
  const value = config({
    environment: "staging",
    targetOrigin: "https://mecoflow.example.test",
    scenarios: [
      {
        name: "health-ready",
        kind: "health",
        method: "GET",
        path: "/health/ready",
        weight: 1,
        expectedStatuses: [200],
        headersFile: null,
      },
    ],
  });
  assert.throws(() => validateCapacityConfig(value), /scenarios\.internal/);
});

test("evaluates every scenario and fails the evidence when latency or error gates fail", () => {
  const value = config();
  const passed = evaluateCapacityMeasurements(
    value,
    [
      {
        durationMilliseconds: 100,
        passed: true,
        scenario: "health-ready",
        status: 200,
      },
    ],
    new Date("2026-08-02T00:00:00.000Z"),
  );
  assert.equal(passed.result, "passed");
  assert.deepEqual(passed.statusCounts, { 200: 1 });

  const failed = evaluateCapacityMeasurements(value, [
    {
      durationMilliseconds: 2500,
      errorClassification: "timeout",
      passed: false,
      scenario: "health-ready",
    },
  ]);
  assert.equal(failed.result, "failed");
  assert.equal(failed.statusCounts.timeout, 1);
});

test("executes a bounded concurrent read-only HTTP capacity smoke", async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end('{"status":"ready"}');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const result = await executeCapacity(
      config({ targetOrigin: `http://127.0.0.1:${address.port}` }),
    );
    assert.equal(result.result, "passed");
    assert.equal(result.requestCount, 20);
    assert.equal(result.statusCounts["200"], 20);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
