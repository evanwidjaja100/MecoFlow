import { Inject, Injectable } from "@nestjs/common";
import { createDatabaseClient, type PrismaClient } from "@mecoflow/database";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import {
  MONITORED_OUTBOX_EVENT_TYPES,
  type QueueMetricsSnapshot,
} from "./monitoring.types.js";

const PROCESSING_STALE_AFTER_MS = 5 * 60_000;

@Injectable()
export class MonitoringRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  async queueSnapshot(now = new Date()): Promise<QueueMetricsSnapshot> {
    const staleBefore = new Date(now.getTime() - PROCESSING_STALE_AFTER_MS);
    const [outboxCounts, oldestPending, stuckProcessing, emailCounts] =
      await Promise.all([
        this.database.outboxEvent.groupBy({
          _count: { _all: true },
          by: ["eventType", "status"],
          where: {
            eventType: { in: [...MONITORED_OUTBOX_EVENT_TYPES] },
            status: {
              in: ["PENDING", "PROCESSING", "FAILED", "DEAD_LETTER"],
            },
          },
        }),
        this.database.outboxEvent.groupBy({
          _min: { createdAt: true },
          by: ["eventType"],
          where: {
            availableAt: { lte: now },
            eventType: { in: [...MONITORED_OUTBOX_EVENT_TYPES] },
            status: "PENDING",
          },
        }),
        this.database.outboxEvent.groupBy({
          _count: { _all: true },
          by: ["eventType", "status"],
          where: {
            eventType: { in: [...MONITORED_OUTBOX_EVENT_TYPES] },
            lockedAt: { lt: staleBefore },
            status: "PROCESSING",
          },
        }),
        this.database.notificationEmailDelivery.groupBy({
          _count: { _all: true },
          by: ["status"],
          where: { status: { in: ["PENDING", "PROCESSING", "DEAD_LETTER"] } },
        }),
      ]);

    return {
      emailCounts: emailCounts.map((row) => ({
        count: row._count._all,
        status: row.status,
      })),
      oldestPending: oldestPending.map((row) => ({
        ageSeconds: row._min.createdAt
          ? Math.max(0, (now.getTime() - row._min.createdAt.getTime()) / 1_000)
          : 0,
        eventType: row.eventType,
      })),
      outboxCounts: outboxCounts.map((row) => ({
        count: row._count._all,
        eventType: row.eventType,
        status: row.status,
      })),
      stuckProcessing: stuckProcessing.map((row) => ({
        count: row._count._all,
        eventType: row.eventType,
        status: row.status,
      })),
    };
  }
}
