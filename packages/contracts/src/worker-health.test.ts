import { describe, expect, it } from "vitest";
import {
  heartbeatPayload,
  isFreshHeartbeat,
  WORKER_HEARTBEAT_KEY,
  WORKER_HEARTBEAT_TTL_SECONDS,
} from "./worker-health.js";

describe("worker heartbeat contract", () => {
  it("produces the shared versioned heartbeat payload", () => {
    expect(WORKER_HEARTBEAT_KEY).toBe("mecoflow:worker:heartbeat");
    expect(WORKER_HEARTBEAT_TTL_SECONDS).toBe(30);
    expect(
      heartbeatPayload("0.1.0", new Date("2026-08-02T00:00:00.000Z")),
    ).toBe('{"timestamp":"2026-08-02T00:00:00.000Z","version":"0.1.0"}');
  });

  it("fails closed for missing, stale, future, malformed, or foreign versions", () => {
    const now = new Date("2026-08-02T00:00:30.000Z");
    const current = heartbeatPayload(
      "0.1.0",
      new Date("2026-08-02T00:00:05.000Z"),
    );
    expect(isFreshHeartbeat(current, "0.1.0", now)).toBe(true);
    expect(isFreshHeartbeat(current, "0.2.0", now)).toBe(false);
    expect(
      isFreshHeartbeat(
        heartbeatPayload("0.1.0", new Date("2026-08-01T23:59:59.000Z")),
        "0.1.0",
        now,
      ),
    ).toBe(false);
    expect(
      isFreshHeartbeat(
        heartbeatPayload("0.1.0", new Date("2026-08-02T00:00:31.000Z")),
        "0.1.0",
        now,
      ),
    ).toBe(false);
    expect(isFreshHeartbeat(null, "0.1.0", now)).toBe(false);
    expect(isFreshHeartbeat("not-json", "0.1.0", now)).toBe(false);
  });
});
