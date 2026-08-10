import { describe, expect, it } from "vitest";
import { MetricsRegistry, normalizeMetricRoute } from "./metrics-registry.js";
import type { MonitoringSnapshot } from "./monitoring.types.js";

const snapshot: MonitoringSnapshot = {
  dependencies: { database: true, objectStorage: false, redis: true },
  dependencyCollectionSuccessful: true,
  queue: {
    emailCounts: [{ count: 2, status: "PENDING" }],
    oldestPending: [
      { ageSeconds: 65, eventType: "READINESS_RECALCULATION_REQUESTED" },
    ],
    outboxCounts: [
      {
        count: 3,
        eventType: "READINESS_RECALCULATION_REQUESTED",
        status: "PENDING",
      },
      { count: 1, eventType: "attacker-secret-value", status: "FAILED" },
    ],
    stuckProcessing: [
      {
        count: 1,
        eventType: "BOM_IMPORT_PARSE_REQUESTED",
        status: "PROCESSING",
      },
    ],
  },
  workerHeartbeatCollectionSuccessful: true,
  workerHeartbeatFresh: true,
};

describe("Prometheus metrics", () => {
  it("uses only bounded route templates and collapses attacker-controlled paths", () => {
    expect(
      normalizeMetricRoute(
        "/api/v1/projects/:projectId",
        "/api/v1/projects/018f65aa-aaaa-bbbb-cccc-123456789abc",
        200,
      ),
    ).toBe("/api/v1/projects/:projectId");
    expect(
      normalizeMetricRoute(undefined, "/attacker-generated-value", 404),
    ).toBe("/unmatched");
    expect(normalizeMetricRoute("/route\nmalformed", "/anything", 500)).toBe(
      "/unknown",
    );
  });

  it("renders counters, histograms, dependency, heartbeat, and queue signals without unsafe labels", () => {
    const registry = new MetricsRegistry();
    registry.recordHttpRequest({
      durationMs: 125,
      method: "GET",
      route: "/api/v1/projects/:projectId",
      statusCode: 200,
    });
    registry.recordHttpRequest({
      durationMs: 250,
      method: "TRACE",
      route: normalizeMetricRoute(undefined, "/attacker-generated-value", 404),
      statusCode: 500,
    });

    const output = registry.render("0.1.0", snapshot);
    expect(output).toContain(
      'mecoflow_http_requests_total{method="GET",route="/api/v1/projects/:projectId",status_class="2xx"} 1',
    );
    expect(output).toContain(
      'mecoflow_http_requests_total{method="OTHER",route="/unmatched",status_class="5xx"} 1',
    );
    expect(output).toContain(
      'mecoflow_dependency_up{dependency="objectStorage"} 0',
    );
    expect(output).toContain("mecoflow_worker_heartbeat_fresh 1");
    expect(output).toContain(
      'mecoflow_outbox_oldest_pending_age_seconds{event_type="READINESS_RECALCULATION_REQUESTED"} 65',
    );
    expect(output).toContain('event_type="OTHER"');
    expect(output).not.toContain("attacker-secret-value");
    expect(output).not.toContain("018f65aa-aaaa-bbbb-cccc-123456789abc");
    registry.onModuleDestroy();
  });

  it("reports failed collection sources without inventing queue values", () => {
    const registry = new MetricsRegistry();
    const output = registry.render("0.1.0", {
      dependencies: { database: false, objectStorage: false, redis: false },
      dependencyCollectionSuccessful: false,
      queue: null,
      workerHeartbeatCollectionSuccessful: false,
      workerHeartbeatFresh: false,
    });
    expect(output).toContain(
      'mecoflow_monitoring_collection_success{source="queues"} 0',
    );
    expect(output).not.toContain("mecoflow_outbox_events{");
    registry.onModuleDestroy();
  });
});
