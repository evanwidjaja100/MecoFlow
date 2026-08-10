import { describe, expect, it } from "vitest";
import { heartbeatPayload, isFreshHeartbeat } from "./heartbeat.js";

describe("heartbeatPayload", () => {
  it("is deterministic for a supplied clock", () => {
    expect(
      heartbeatPayload("0.1.0", new Date("2026-07-15T00:00:00.000Z")),
    ).toBe('{"timestamp":"2026-07-15T00:00:00.000Z","version":"0.1.0"}');
  });

  it("accepts only a current heartbeat from the deployed version", () => {
    const now = new Date("2026-07-30T00:00:30.000Z");
    const current = heartbeatPayload(
      "9.3.0-staging.1",
      new Date("2026-07-30T00:00:05.000Z"),
    );

    expect(isFreshHeartbeat(current, "9.3.0-staging.1", now)).toBe(true);
    expect(isFreshHeartbeat(current, "other-version", now)).toBe(false);
    expect(
      isFreshHeartbeat(
        heartbeatPayload(
          "9.3.0-staging.1",
          new Date("2026-07-29T23:59:59.000Z"),
        ),
        "9.3.0-staging.1",
        now,
      ),
    ).toBe(false);
    expect(isFreshHeartbeat("not-json", "9.3.0-staging.1", now)).toBe(false);
  });
});
