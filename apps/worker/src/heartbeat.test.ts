import { describe, expect, it } from "vitest";
import { heartbeatPayload } from "./heartbeat.js";

describe("heartbeatPayload", () => {
  it("is deterministic for a supplied clock", () => {
    expect(
      heartbeatPayload("0.1.0", new Date("2026-07-15T00:00:00.000Z")),
    ).toBe('{"timestamp":"2026-07-15T00:00:00.000Z","version":"0.1.0"}');
  });
});
