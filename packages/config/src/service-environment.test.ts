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
  S3_KMS_KEY_ID: "kms://production/object-storage-key",
  S3_SERVER_SIDE_ENCRYPTION: "aws:kms",
  S3_SECRET_KEY: "production-secret-key",
  WEB_BASE_URL: "https://mecoflow.example.com",
  OIDC_ISSUER: "https://identity.example.com/realms/mecoflow",
  OIDC_REDIRECT_URI: "https://api.mecoflow.example.com/api/v1/auth/callback",
  SESSION_SECRET: "a-production-session-secret-with-at-least-32-characters",
  VIRUS_SCANNER_ENABLED: "true",
};

describe("parseServiceEnvironment", () => {
  it("applies safe local defaults", () => {
    const result = parseServiceEnvironment(validEnvironment);
    expect(result.APP_TIMEZONE).toBe("Asia/Jakarta");
    expect(result.API_PORT).toBe(3001);
    expect(result.SMTP_ENABLED).toBe(false);
    expect(result.VIRUS_SCANNER_ENABLED).toBe(false);
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

  it("rejects insecure OIDC and session configuration in production", () => {
    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        OIDC_ISSUER: "http://identity.example.com/realms/mecoflow",
        SESSION_SECRET: "local_only_session_secret_change_me_32_chars",
      }),
    ).toThrow("Invalid service environment: OIDC_ISSUER, SESSION_SECRET");
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

  it("requires HTTPS and an explicit valid production object-encryption contract", () => {
    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        S3_ENDPOINT: "http://objects.internal",
        S3_SERVER_SIDE_ENCRYPTION: undefined,
      }),
    ).toThrow(
      "Invalid service environment: S3_ENDPOINT, S3_SERVER_SIDE_ENCRYPTION",
    );

    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        S3_KMS_KEY_ID: "",
      }),
    ).toThrow("Invalid service environment: S3_KMS_KEY_ID");

    expect(
      parseServiceEnvironment({
        ...validProductionEnvironment,
        S3_KMS_KEY_ID: "",
        S3_SERVER_SIDE_ENCRYPTION: "AES256",
      }).S3_SERVER_SIDE_ENCRYPTION,
    ).toBe("AES256");
  });

  it("keeps the production-mode staging runtime compatible with internal unencrypted MinIO", () => {
    const staging = parseServiceEnvironment({
      ...validProductionEnvironment,
      APP_ENV: "staging",
      S3_ENDPOINT: "http://minio:9000",
      S3_KMS_KEY_ID: undefined,
      S3_SERVER_SIDE_ENCRYPTION: undefined,
    });
    expect(staging.APP_ENV).toBe("staging");
    expect(staging.S3_SERVER_SIDE_ENCRYPTION).toBeUndefined();
  });

  it("requires virus scanning in production", () => {
    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        VIRUS_SCANNER_ENABLED: "false",
      }),
    ).toThrow("Invalid service environment: VIRUS_SCANNER_ENABLED");
  });

  it("supports local Mailpit but rejects insecure production SMTP", () => {
    const local = parseServiceEnvironment({
      ...validEnvironment,
      SMTP_ENABLED: "true",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1025",
    });
    expect(local.SMTP_ENABLED).toBe(true);
    expect(local.SMTP_PORT).toBe(1025);

    expect(() =>
      parseServiceEnvironment({
        ...validProductionEnvironment,
        SMTP_ENABLED: "true",
        SMTP_HOST: "smtp.example.com",
        SMTP_FROM_EMAIL: "notifications@example.com",
        SMTP_PASSWORD: "secret",
        SMTP_SECURE: "false",
        SMTP_USERNAME: "mecoflow",
      }),
    ).toThrow("Invalid service environment: SMTP_ENABLED");
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
