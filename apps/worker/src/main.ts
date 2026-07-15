import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
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

loadEnvironment({
  path: resolve(process.cwd(), "../../.env"),
  quiet: true,
});
const environment = parseServiceEnvironment(process.env);
const logger = pino({
  base: { environment: environment.APP_ENV, service: "worker" },
  level: environment.LOG_LEVEL,
  redact: {
    paths: ["*.password", "*.token", "*.secret", "*.accessKey", "*.storageKey"],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
const database = createDatabaseClient(environment.DATABASE_URL);
const redis = new Redis(environment.REDIS_URL, { maxRetriesPerRequest: 1 });
const objectStorage = new S3Client({
  credentials: {
    accessKeyId: environment.S3_ACCESS_KEY,
    secretAccessKey: environment.S3_SECRET_KEY,
  },
  endpoint: environment.S3_ENDPOINT,
  forcePathStyle: environment.S3_FORCE_PATH_STYLE,
  region: environment.S3_REGION,
});

await database.$queryRaw`SELECT 1`;
await redis.ping();
await objectStorage.send(new ListBucketsCommand({}));

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
  void writeHeartbeat().catch((error: unknown) => {
    logger.error(
      {
        errorClassification: "dependency_failure",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      "Worker heartbeat failed",
    );
  });
}, 10_000);

async function shutdown(signal: string): Promise<void> {
  clearInterval(heartbeatTimer);
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
