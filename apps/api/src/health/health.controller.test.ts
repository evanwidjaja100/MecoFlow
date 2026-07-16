import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";

describe("HealthController dependency metadata", () => {
  it("declares its dependency explicitly for development transpilers", () => {
    const dependencies = Reflect.getMetadata(
      "self:paramtypes",
      HealthController,
    ) as Array<{ index: number; param: unknown }> | undefined;

    expect(dependencies).toEqual([{ index: 0, param: HealthService }]);
  });
});
