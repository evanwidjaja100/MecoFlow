import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import type { MonitoringSnapshot } from "./monitoring.types.js";
import { MONITORED_OUTBOX_EVENT_TYPES } from "./monitoring.types.js";

const HTTP_DURATION_BUCKETS = [
  0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];
const SAFE_METHODS = new Set([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
]);
const SAFE_ROUTE = /^\/[A-Za-z0-9_./:-]{1,200}$/;

interface HistogramState {
  buckets: number[];
  count: number;
  sum: number;
}

function escapeLabel(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll('"', '\\"');
}

function labels(values: Record<string, string>): string {
  return `{${Object.entries(values)
    .map(([key, value]) => `${key}="${escapeLabel(value)}"`)
    .join(",")}}`;
}

function metric(
  lines: string[],
  name: string,
  value: number,
  metricLabels?: Record<string, string>,
): void {
  lines.push(
    `${name}${metricLabels ? labels(metricLabels) : ""} ${Number.isFinite(value) ? value : 0}`,
  );
}

export function normalizeMetricRoute(
  routePath: unknown,
  requestPath: string,
  statusCode: number,
): string {
  if (statusCode === 404) return "/unmatched";
  if (typeof routePath === "string" && SAFE_ROUTE.test(routePath))
    return routePath;
  if (["/health/live", "/health/ready", "/metrics"].includes(requestPath))
    return requestPath;
  return "/unknown";
}

function safeEventType(value: string): string {
  return (MONITORED_OUTBOX_EVENT_TYPES as readonly string[]).includes(value)
    ? value
    : "OTHER";
}

@Injectable()
export class MetricsRegistry implements OnModuleDestroy {
  private readonly startedAt = performance.now();
  private readonly eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
  private readonly requestCounts = new Map<string, number>();
  private readonly requestDurations = new Map<string, HistogramState>();

  constructor() {
    this.eventLoopDelay.enable();
  }

  recordHttpRequest(input: {
    durationMs: number;
    method: string;
    route: string;
    statusCode: number;
  }): void {
    const method = SAFE_METHODS.has(input.method) ? input.method : "OTHER";
    const route = SAFE_ROUTE.test(input.route) ? input.route : "/unknown";
    const statusClass = `${Math.floor(input.statusCode / 100)}xx`;
    const countKey = JSON.stringify([method, route, statusClass]);
    this.requestCounts.set(
      countKey,
      (this.requestCounts.get(countKey) ?? 0) + 1,
    );

    const durationKey = JSON.stringify([method, route]);
    const state = this.requestDurations.get(durationKey) ?? {
      buckets: HTTP_DURATION_BUCKETS.map(() => 0),
      count: 0,
      sum: 0,
    };
    const durationSeconds = Math.max(0, input.durationMs / 1_000);
    state.count += 1;
    state.sum += durationSeconds;
    HTTP_DURATION_BUCKETS.forEach((bucket, index) => {
      if (durationSeconds <= bucket) state.buckets[index]! += 1;
    });
    this.requestDurations.set(durationKey, state);
  }

  render(version: string, snapshot: MonitoringSnapshot): string {
    const lines: string[] = [];
    lines.push(
      "# HELP mecoflow_build_info Deployed MECO Flow application version.",
    );
    lines.push("# TYPE mecoflow_build_info gauge");
    metric(lines, "mecoflow_build_info", 1, { service: "api", version });
    lines.push("# HELP mecoflow_process_uptime_seconds API process uptime.");
    lines.push("# TYPE mecoflow_process_uptime_seconds gauge");
    metric(
      lines,
      "mecoflow_process_uptime_seconds",
      (performance.now() - this.startedAt) / 1_000,
    );
    lines.push(
      "# HELP mecoflow_process_resident_memory_bytes API resident memory.",
    );
    lines.push("# TYPE mecoflow_process_resident_memory_bytes gauge");
    metric(
      lines,
      "mecoflow_process_resident_memory_bytes",
      process.memoryUsage().rss,
    );
    lines.push(
      "# HELP mecoflow_process_heap_used_bytes API used JavaScript heap.",
    );
    lines.push("# TYPE mecoflow_process_heap_used_bytes gauge");
    metric(
      lines,
      "mecoflow_process_heap_used_bytes",
      process.memoryUsage().heapUsed,
    );
    lines.push(
      "# HELP mecoflow_nodejs_event_loop_lag_seconds Current mean event-loop delay.",
    );
    lines.push("# TYPE mecoflow_nodejs_event_loop_lag_seconds gauge");
    metric(
      lines,
      "mecoflow_nodejs_event_loop_lag_seconds",
      this.eventLoopDelay.mean / 1e9,
    );

    lines.push("# HELP mecoflow_http_requests_total Completed HTTP requests.");
    lines.push("# TYPE mecoflow_http_requests_total counter");
    for (const [key, value] of [...this.requestCounts].sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      const [method, route, statusClass] = JSON.parse(key) as string[];
      metric(lines, "mecoflow_http_requests_total", value, {
        method: method!,
        route: route!,
        status_class: statusClass!,
      });
    }

    lines.push(
      "# HELP mecoflow_http_request_duration_seconds Completed HTTP request duration.",
    );
    lines.push("# TYPE mecoflow_http_request_duration_seconds histogram");
    for (const [key, state] of [...this.requestDurations].sort(
      ([left], [right]) => left.localeCompare(right),
    )) {
      const [method, route] = JSON.parse(key) as string[];
      HTTP_DURATION_BUCKETS.forEach((bucket, index) => {
        metric(
          lines,
          "mecoflow_http_request_duration_seconds_bucket",
          state.buckets[index]!,
          {
            le: String(bucket),
            method: method!,
            route: route!,
          },
        );
      });
      metric(
        lines,
        "mecoflow_http_request_duration_seconds_bucket",
        state.count,
        {
          le: "+Inf",
          method: method!,
          route: route!,
        },
      );
      metric(
        lines,
        "mecoflow_http_request_duration_seconds_count",
        state.count,
        { method: method!, route: route! },
      );
      metric(lines, "mecoflow_http_request_duration_seconds_sum", state.sum, {
        method: method!,
        route: route!,
      });
    }

    lines.push(
      "# HELP mecoflow_dependency_up Whether an API dependency readiness check succeeded.",
    );
    lines.push("# TYPE mecoflow_dependency_up gauge");
    for (const dependency of ["database", "redis", "objectStorage"] as const) {
      metric(
        lines,
        "mecoflow_dependency_up",
        snapshot.dependencies[dependency] ? 1 : 0,
        { dependency },
      );
    }
    lines.push(
      "# HELP mecoflow_monitoring_collection_success Whether an operational metric source was collected.",
    );
    lines.push("# TYPE mecoflow_monitoring_collection_success gauge");
    metric(
      lines,
      "mecoflow_monitoring_collection_success",
      snapshot.dependencyCollectionSuccessful ? 1 : 0,
      { source: "dependencies" },
    );
    metric(
      lines,
      "mecoflow_monitoring_collection_success",
      snapshot.queue ? 1 : 0,
      { source: "queues" },
    );
    metric(
      lines,
      "mecoflow_monitoring_collection_success",
      snapshot.workerHeartbeatCollectionSuccessful ? 1 : 0,
      { source: "worker_heartbeat" },
    );
    lines.push(
      "# HELP mecoflow_worker_heartbeat_fresh Whether the matching deployed worker heartbeat is fresh.",
    );
    lines.push("# TYPE mecoflow_worker_heartbeat_fresh gauge");
    metric(
      lines,
      "mecoflow_worker_heartbeat_fresh",
      snapshot.workerHeartbeatFresh ? 1 : 0,
    );

    if (snapshot.queue) {
      lines.push(
        "# HELP mecoflow_outbox_events Current actionable outbox event count.",
      );
      lines.push("# TYPE mecoflow_outbox_events gauge");
      for (const row of snapshot.queue.outboxCounts)
        metric(lines, "mecoflow_outbox_events", row.count, {
          event_type: safeEventType(row.eventType),
          status: row.status,
        });
      lines.push(
        "# HELP mecoflow_outbox_oldest_pending_age_seconds Age of the oldest available pending event.",
      );
      lines.push("# TYPE mecoflow_outbox_oldest_pending_age_seconds gauge");
      for (const row of snapshot.queue.oldestPending)
        metric(
          lines,
          "mecoflow_outbox_oldest_pending_age_seconds",
          row.ageSeconds,
          { event_type: safeEventType(row.eventType) },
        );
      lines.push(
        "# HELP mecoflow_outbox_stuck_processing Current events locked for more than five minutes.",
      );
      lines.push("# TYPE mecoflow_outbox_stuck_processing gauge");
      for (const row of snapshot.queue.stuckProcessing)
        metric(lines, "mecoflow_outbox_stuck_processing", row.count, {
          event_type: safeEventType(row.eventType),
        });
      lines.push(
        "# HELP mecoflow_notification_email_deliveries Current actionable email delivery count.",
      );
      lines.push("# TYPE mecoflow_notification_email_deliveries gauge");
      for (const row of snapshot.queue.emailCounts)
        metric(lines, "mecoflow_notification_email_deliveries", row.count, {
          status: row.status,
        });
    }

    return `${lines.join("\n")}\n`;
  }

  onModuleDestroy(): void {
    this.eventLoopDelay.disable();
  }
}
