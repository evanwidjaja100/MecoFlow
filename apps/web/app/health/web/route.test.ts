import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("web health route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("reports the deployed application version without caching", async () => {
    vi.stubEnv("APP_VERSION", "9.3.0-staging.1");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));

    const response = GET();

    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      service: "web",
      status: "ok",
      timestamp: "2026-07-30T00:00:00.000Z",
      version: "9.3.0-staging.1",
    });
  });
});
