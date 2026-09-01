import type { ThrottlerStorage } from "@nestjs/throttler";
import { Redis } from "ioredis";

type ThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly redis: Redis;
  private readonly prefix = "throttle:";

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `${this.prefix}${throttlerName}:${key}`;
    const blockKey = `${redisKey}:block`;
    const blocked = await this.redis.get(blockKey);
    if (blocked) {
      const ttlMs = await this.redis.pttl(blockKey);
      return {
        totalHits: limit + 1,
        timeToExpire: ttlMs > 0 ? ttlMs : blockDuration,
        isBlocked: true,
        timeToBlockExpire: ttlMs > 0 ? ttlMs : blockDuration,
      };
    }
    const multi = this.redis.multi();
    multi.incr(redisKey);
    multi.pttl(redisKey);
    const results = (await multi.exec()) as
      [[Error | null, number], [Error | null, number]] | null;
    const totalHits = results?.[0]?.[1] ?? 1;
    let timeToExpire = results?.[1]?.[1] ?? -1;
    if (timeToExpire < 0) {
      await this.redis.pexpire(redisKey, ttl);
      timeToExpire = ttl;
    }
    if (totalHits > limit) {
      if (blockDuration > 0) {
        await this.redis.set(blockKey, "1", "PX", blockDuration);
      }
      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };
    }
    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
