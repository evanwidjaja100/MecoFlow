import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { parseServiceEnvironment } from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
} from "@mecoflow/database";
import { config as loadEnvironment } from "dotenv";
import { Redis } from "ioredis";
import pino from "pino";
import { resolve } from "node:path";
import {
  heartbeatPayload,
  WORKER_HEARTBEAT_KEY,
  WORKER_HEARTBEAT_TTL_SECONDS,
} from "./heartbeat.js";
import { BomImportProcessor } from "./bom-import-processor.js";
import { ReadinessProcessor } from "./readiness-processor.js";
import { NotificationProcessor } from "./notification-processor.js";
import { SmtpEmailSender } from "./smtp-email-sender.js";

loadEnvironment({
  path: resolve(process.cwd(), "../../.env"),
  quiet: true,
});
const environment = parseServiceEnvironment(process.env);
const logger = pino({
  base: { environment: environment.APP_ENV, service: "worker" },
  level: environment.LOG_LEVEL,
  redact: {
    paths: [
      "password",
      "token",
      "secret",
      "accessKey",
      "storageKey",
      "*.password",
      "*.token",
      "*.secret",
      "*.accessKey",
      "*.storageKey",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
const database = createDatabaseClient(environment.DATABASE_URL);
const redis = new Redis(environment.REDIS_URL, {
  connectTimeout: 2_000,
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 0,
});
redis.on("error", () => undefined);
const objectStorage = new S3Client({
  credentials: {
    accessKeyId: environment.S3_ACCESS_KEY,
    secretAccessKey: environment.S3_SECRET_KEY,
  },
  endpoint: environment.S3_ENDPOINT,
  forcePathStyle: environment.S3_FORCE_PATH_STYLE,
  region: environment.S3_REGION,
  requestHandler: { requestTimeout: 2_000 },
});

await database.$queryRaw`SELECT 1`;
await redis.connect();
await redis.ping();
await objectStorage.send(
  new HeadBucketCommand({ Bucket: environment.S3_BUCKET }),
);

async function writeHeartbeat(): Promise<void> {
  await redis.set(
    WORKER_HEARTBEAT_KEY,
    heartbeatPayload(environment.APP_VERSION),
    "EX",
    WORKER_HEARTBEAT_TTL_SECONDS,
  );
}

await writeHeartbeat();
logger.info(
  { event: "worker.started", version: environment.APP_VERSION },
  "Worker foundation started",
);
const heartbeatTimer = setInterval(() => {
  void writeHeartbeat().catch(() => {
    logger.error(
      { errorClassification: "dependency_failure" },
      "Worker heartbeat failed",
    );
  });
}, 10_000);

const bomImportProcessor = new BomImportProcessor(
  database,
  objectStorage,
  environment.S3_BUCKET,
);
const readinessProcessor = new ReadinessProcessor(database);
const emailSender = environment.SMTP_ENABLED
  ? new SmtpEmailSender({
      connectTimeoutMs: environment.SMTP_CONNECT_TIMEOUT_MS,
      from: environment.SMTP_FROM_EMAIL,
      host: environment.SMTP_HOST,
      password: environment.SMTP_PASSWORD,
      port: environment.SMTP_PORT,
      secure: environment.SMTP_SECURE,
      username: environment.SMTP_USERNAME,
    })
  : null;
const notificationProcessor = new NotificationProcessor(
  database,
  emailSender,
  environment.SMTP_ENABLED,
  environment.WEB_BASE_URL,
);
let processing = false;
async function processBomImport(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    const event = await bomImportProcessor.claim();
    if (!event) return;
    const lockKey = `mecoflow:bom-import:${event.id}`;
    const lock = await redis.set(lockKey, "processing", "EX", 60, "NX");
    if (!lock) {
      await database.outboxEvent.update({
        data: { lockedAt: null, status: "PENDING" },
        where: { id: event.id },
      });
      return;
    }
    try {
      await bomImportProcessor.process(event);
    } finally {
      await redis.del(lockKey);
    }
  } finally {
    processing = false;
  }
}

void processBomImport();
const importTimer = setInterval(() => {
  void processBomImport().catch(() => {
    logger.error(
      { errorClassification: "bom_import_failure" },
      "BOM import processing cycle failed",
    );
  });
}, 1_000);

let readinessProcessing = false;
async function processReadiness(): Promise<void> {
  if (readinessProcessing) return;
  readinessProcessing = true;
  try {
    const event = await readinessProcessor.claim();
    if (event) await readinessProcessor.process(event);
  } finally {
    readinessProcessing = false;
  }
}

let scheduledReadinessProcessing = false;
async function recalculateReadinessSafetySweep(): Promise<void> {
  if (scheduledReadinessProcessing) return;
  scheduledReadinessProcessing = true;
  try {
    const projectIds = await readinessProcessor.scheduledProjectIds();
    for (const projectId of projectIds)
      await readinessProcessor.recalculateScheduled(projectId);
  } finally {
    scheduledReadinessProcessing = false;
  }
}

void processReadiness();
const readinessTimer = setInterval(() => {
  void processReadiness().catch(() => {
    logger.error(
      { errorClassification: "readiness_calculation_failure" },
      "Readiness event processing cycle failed",
    );
  });
}, 250);

void recalculateReadinessSafetySweep().catch(() => {
  logger.error(
    { errorClassification: "readiness_schedule_failure" },
    "Initial readiness safety sweep failed",
  );
});
const scheduledReadinessTimer = setInterval(() => {
  void recalculateReadinessSafetySweep().catch(() => {
    logger.error(
      { errorClassification: "readiness_schedule_failure" },
      "Scheduled readiness safety sweep failed",
    );
  });
}, 5 * 60_000);

let notificationProcessing = false;
async function processNotification(): Promise<void> {
  if (notificationProcessing) return;
  notificationProcessing = true;
  const startedAt = Date.now();
  try {
    const event = await notificationProcessor.claim();
    if (!event) return;
    const result = await notificationProcessor.process(event);
    logger.info(
      {
        attempt: event.attempts,
        created: result.created,
        deadLettered: result.deadLettered,
        durationMs: Date.now() - startedAt,
        event: "notification.processed",
        eventId: event.eventId,
        sent: result.sent,
        skipped: result.skipped,
      },
      "Notification event processing completed",
    );
  } finally {
    notificationProcessing = false;
  }
}

void processNotification();
const notificationTimer = setInterval(() => {
  void processNotification().catch((error: unknown) => {
    logger.error(
      {
        errorClassification: "notification_processing_failure",
        errorCode: error instanceof Error ? error.name : "UNKNOWN",
        event: "notification.failed",
      },
      "Notification processing cycle failed",
    );
  });
}, 500);

const notificationObservabilityTimer = setInterval(() => {
  void notificationProcessor
    .observability()
    .then((counts) => {
      logger.info(
        { counts, event: "notification.queue.snapshot" },
        "Notification queue state",
      );
    })
    .catch(() => {
      logger.error(
        { event: "notification.observability.failed" },
        "Notification queue observation failed",
      );
    });
}, 60_000);

async function shutdown(signal: string): Promise<void> {
  clearInterval(heartbeatTimer);
  clearInterval(importTimer);
  clearInterval(readinessTimer);
  clearInterval(scheduledReadinessTimer);
  clearInterval(notificationTimer);
  clearInterval(notificationObservabilityTimer);
  logger.info(
    { event: "worker.stopping", signal },
    "Worker foundation stopping",
  );
  redis.disconnect();
  objectStorage.destroy();
  await disconnectDatabaseClient();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal).finally(() => process.exit(0));
  });
}
