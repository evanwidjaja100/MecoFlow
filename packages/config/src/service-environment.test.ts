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

const validProductionEnvironment = {
  ...validEnvironment,
  APP_ENV: "production",
  CORS_ORIGINS: "https://mecoflow.example.com",
  DATABASE_URL:
    "postgresql://mecoflow_service:production-secret@database.internal:5432/mecoflow",
  NODE_ENV: "production",
  S3_ACCESS_KEY: "production-access-key",
  S3_ENDPOINT: "https://objects.internal",
  S3_SECRET_KEY: "production-secret-key",
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

  it("rejects malformed CORS origins", () => {
    expect(() =>
      parseServiceEnvironment({ ...validEnvironment, CORS_ORIGINS: "*" }),
    ).toThrow("Invalid service environment: CORS_ORIGINS");
  });

  it("rejects an invalid display timezone", () => {
    expect(() =>
      parseServiceEnvironment({
        ...validEnvironment,
        APP_TIMEZONE: "Not/A_Timezone",
      }),
    ).toThrow("Invalid service environment: APP_TIMEZONE");
  });

  it("accepts explicit production configuration", () => {
    expect(parseServiceEnvironment(validProductionEnvironment).APP_ENV).toBe(
      "production",
    );
  });

  it("rejects local environment defaults in production", () => {
    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        APP_ENV: undefined,
      }),
    ).toThrow("Invalid service environment: APP_ENV");
  });

  it("rejects local development credentials in production without echoing them", () => {
    const localPassword = "local_only_change_me";
    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        DATABASE_URL: `postgresql://mecoflow_service:${localPassword}@database.internal:5432/mecoflow`,
      }),
    ).toThrow("Invalid service environment: DATABASE_URL");

    try {
      parseServiceEnvironment({
        ...validProductionEnvironment,
        DATABASE_URL: `postgresql://mecoflow_service:${localPassword}@database.internal:5432/mecoflow`,
      });
    } catch (error) {
      expect(String(error)).not.toContain(localPassword);
    }
  });

  it("requires HTTPS browser origins in production", () => {
    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        CORS_ORIGINS: "http://mecoflow.example.com",
      }),
    ).toThrow("Invalid service environment: CORS_ORIGINS");
  });

  it("rejects the documented local object-storage credentials in production", () => {
    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        S3_ACCESS_KEY: "mecoflow_local",
        S3_SECRET_KEY: "local_only_minio_change_me",
      }),
    ).toThrow("Invalid service environment: S3_ACCESS_KEY, S3_SECRET_KEY");
  });

  it("reports malformed production URLs as safe field errors", () => {
    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        DATABASE_URL: "not-a-url",
      }),
    ).toThrow("Invalid service environment: DATABASE_URL");
  });
});
