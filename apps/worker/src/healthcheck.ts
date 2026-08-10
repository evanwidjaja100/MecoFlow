import { Redis } from "ioredis";
import { isFreshHeartbeat, WORKER_HEARTBEAT_KEY } from "./heartbeat.js";

const redisUrl = process.env.REDIS_URL;
const version = process.env.APP_VERSION;
if (!redisUrl || !version) process.exit(1);

const redis = new Redis(redisUrl, {
  connectTimeout: 2_000,
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 0,
});
redis.on("error", () => undefined);

try {
  await redis.connect();
  const heartbeat = await redis.get(WORKER_HEARTBEAT_KEY);
  process.exitCode = isFreshHeartbeat(heartbeat, version) ? 0 : 1;
} catch {
  process.exitCode = 1;
} finally {
  redis.disconnect();
}
