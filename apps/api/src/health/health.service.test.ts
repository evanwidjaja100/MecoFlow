import { describe, expect, it, vi } from "vitest";
import { createLivenessResponse } from "./health.service.js";

describe("createLivenessResponse", () => {
  it("returns the stable API liveness shape", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));
    expect(createLivenessResponse("0.1.0")).toEqual({
      service: "api",
      status: "ok",
      timestamp: "2026-07-15T00:00:00.000Z",
      version: "0.1.0",
    });
    vi.useRealTimers();
  });
});
