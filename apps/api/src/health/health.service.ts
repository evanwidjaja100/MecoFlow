import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  type PrismaClient,
} from "@mecoflow/database";
import type { HealthResponse, ReadinessResponse } from "@mecoflow/contracts";
import type { ServiceEnvironment } from "@mecoflow/config";
import { Redis } from "ioredis";
import { SERVICE_ENVIRONMENT } from "../tokens.js";

export function createLivenessResponse(version: string): HealthResponse {
  return {
    service: "api",
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
  };
}

export function createObjectStorageReadinessCommand(
  bucket: string,
): HeadBucketCommand {
  return new HeadBucketCommand({ Bucket: bucket });
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly database: PrismaClient;
  private readonly redis: Redis;
  private readonly objectStorage: S3Client;

  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
  ) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
    this.redis = new Redis(environment.REDIS_URL, {
      connectTimeout: 2_000,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
    });
    this.redis.on("error", () => undefined);
    this.objectStorage = new S3Client({
      credentials: {
        accessKeyId: environment.S3_ACCESS_KEY,
        secretAccessKey: environment.S3_SECRET_KEY,
      },
      endpoint: environment.S3_ENDPOINT,
      forcePathStyle: environment.S3_FORCE_PATH_STYLE,
      region: environment.S3_REGION,
      requestHandler: { requestTimeout: 2_000 },
    });
  }

  liveness(): HealthResponse {
    return createLivenessResponse(this.environment.APP_VERSION);
  }

  async readiness(): Promise<ReadinessResponse> {
    const checks = await Promise.allSettled([
      this.database.$queryRaw`SELECT 1`,
      this.checkRedis(),
      this.objectStorage.send(
        createObjectStorageReadinessCommand(this.environment.S3_BUCKET),
      ),
    ]);
    const names = ["database", "redis", "objectStorage"] as const;
    const statuses = names.reduce<Record<string, "up" | "down">>(
      (result, name, index) => {
        result[name] = checks[index]?.status === "fulfilled" ? "up" : "down";
        return result;
      },
      {},
    );
    const ready = Object.values(statuses).every((status) => status === "up");

    return {
      checks: statuses,
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
    };
  }

  private async checkRedis(): Promise<void> {
    if (this.redis.status === "wait") await this.redis.connect();
    await this.redis.ping();
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
    this.objectStorage.destroy();
    await disconnectDatabaseClient();
  }
}
