export const WORKER_HEARTBEAT_KEY = "mecoflow:worker:heartbeat";
export const WORKER_HEARTBEAT_TTL_SECONDS = 30;

export function heartbeatPayload(version: string, now = new Date()): string {
  return JSON.stringify({ timestamp: now.toISOString(), version });
}

export function isFreshHeartbeat(
  value: string | null,
  expectedVersion: string,
  now = new Date(),
): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value) as {
      timestamp?: unknown;
      version?: unknown;
    };
    if (
      parsed.version !== expectedVersion ||
      typeof parsed.timestamp !== "string"
    )
      return false;
    const age = now.getTime() - new Date(parsed.timestamp).getTime();
    return Number.isFinite(age) && age >= 0 && age <= 30_000;
  } catch {
    return false;
  }
}
