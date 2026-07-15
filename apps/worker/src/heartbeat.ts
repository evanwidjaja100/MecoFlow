export const WORKER_HEARTBEAT_KEY = "mecoflow:worker:heartbeat";
export const WORKER_HEARTBEAT_TTL_SECONDS = 30;

export function heartbeatPayload(version: string, now = new Date()): string {
  return JSON.stringify({ timestamp: now.toISOString(), version });
}
