import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./health.js";

describe("healthResponseSchema", () => {
  it("accepts the stable liveness contract", () => {
    expect(
      healthResponseSchema.parse({
        service: "api",
        status: "ok",
        timestamp: "2026-07-15T00:00:00.000Z",
        version: "0.1.0",
      }),
    ).toBeDefined();
  });
});
