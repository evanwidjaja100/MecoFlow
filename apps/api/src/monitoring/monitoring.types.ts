export const MONITORED_OUTBOX_EVENT_TYPES = [
  "BOM_IMPORT_PARSE_REQUESTED",
  "READINESS_ALERT_REQUESTED",
  "READINESS_RECALCULATION_REQUESTED",
  "READINESS_REMINDER_REQUESTED",
] as const;

export type OutboxStatusMetric =
  "DEAD_LETTER" | "FAILED" | "PENDING" | "PROCESSING";

export type EmailStatusMetric = "DEAD_LETTER" | "PENDING" | "PROCESSING";

export interface CountMetric {
  count: number;
  status: string;
}

export interface OutboxCountMetric extends CountMetric {
  eventType: string;
}

export interface OutboxAgeMetric {
  ageSeconds: number;
  eventType: string;
}

export interface QueueMetricsSnapshot {
  emailCounts: CountMetric[];
  oldestPending: OutboxAgeMetric[];
  outboxCounts: OutboxCountMetric[];
  stuckProcessing: OutboxCountMetric[];
}

export interface MonitoringSnapshot {
  dependencies: Record<"database" | "objectStorage" | "redis", boolean>;
  dependencyCollectionSuccessful: boolean;
  queue: QueueMetricsSnapshot | null;
  workerHeartbeatCollectionSuccessful: boolean;
  workerHeartbeatFresh: boolean;
}
