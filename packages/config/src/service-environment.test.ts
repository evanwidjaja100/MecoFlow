import { describe, expect, it } from "vitest";
import { parseServiceEnvironment } from "./service-environment.js";

const validEnvironment = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/mecoflow",
  REDIS_URL: "redis://localhost:6379",
  S3_ACCESS_KEY: "local-user",
  S3_BUCKET: "mecoflow-private",
  S3_ENDPOINT: "http://localhost:9000",
  S3_REGION: "us-east-1",
  S3_SECRET_KEY: "local-password",
};

describe("parseServiceEnvironment", () => {
  it("applies safe local defaults", () => {
    const result = parseServiceEnvironment(validEnvironment);
    expect(result.APP_TIMEZONE).toBe("Asia/Jakarta");
    expect(result.API_PORT).toBe(3001);
  });

  it("rejects a missing database URL without echoing secret values", () => {
    const missingDatabase: Record<string, string> = { ...validEnvironment };
    delete missingDatabase.DATABASE_URL;
    expect(() => parseServiceEnvironment(missingDatabase)).toThrow(
      "Invalid service environment: DATABASE_URL",
    );
  });
});
