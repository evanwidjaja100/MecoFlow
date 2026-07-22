import { describe, expect, it } from "vitest";
import type { ServiceEnvironment } from "@mecoflow/config";
import { DocumentStorageService } from "./document-storage.service.js";
import { ClamAvVirusScanner } from "./virus-scanner.js";

const environment: ServiceEnvironment = {
  API_PORT: 3001,
  APP_CURRENCY: "IDR",
  APP_ENV: "test",
  APP_TIMEZONE: "Asia/Jakarta",
  APP_VERSION: "test",
  CORS_ORIGINS: "http://localhost:3000",
  DATABASE_URL: "postgresql://user:password@localhost:5432/test",
  LOG_LEVEL: "info",
  NODE_ENV: "test",
  OIDC_CLIENT_ID: "test",
  OIDC_ISSUER: "http://localhost:8180/realms/test",
  OIDC_REDIRECT_URI: "http://localhost:3001/api/v1/auth/callback",
  REDIS_URL: "redis://localhost:6379",
  S3_ACCESS_KEY: "test",
  S3_BUCKET: "test-private",
  S3_ENDPOINT: "http://localhost:9000",
  S3_FORCE_PATH_STYLE: true,
  S3_REGION: "us-east-1",
  S3_SECRET_KEY: "test",
  SESSION_SECRET: "test_session_secret_at_least_32_chars",
  SESSION_TTL_SECONDS: 3600,
  VIRUS_SCANNER_ENABLED: false,
  VIRUS_SCANNER_HOST: "127.0.0.1",
  VIRUS_SCANNER_PORT: 3310,
  VIRUS_SCANNER_TIMEOUT_MS: 10000,
  WEB_BASE_URL: "http://localhost:3000",
};

describe("document presigned URL security", () => {
  it("fails closed when the virus scanner integration is disabled", async () => {
    await expect(
      new ClamAvVirusScanner(environment).scan(Buffer.from("document")),
    ).resolves.toEqual({ code: "SCANNER_UNAVAILABLE", status: "ERROR" });
  });

  it("uses fixed short expiry and signed upload constraints", async () => {
    const storage = new DocumentStorageService(environment);
    const sha256 = "a".repeat(64);
    const signed = await storage.uploadUrl({
      byteSize: 12,
      mimeType: "text/plain",
      sha256,
      storageKey: "documents/00000000-0000-4000-8000-000000000001",
    });
    const url = new URL(signed.url);
    expect(signed.expiresInSeconds).toBe(300);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("x-amz-checksum-sha256")).toBeDefined();
    expect(url.searchParams.get("x-amz-meta-sha256")).toBe(sha256);
    storage.onModuleDestroy();
  });

  it("limits download URLs to two minutes", async () => {
    const storage = new DocumentStorageService(environment);
    const signed = await storage.downloadUrl({
      extension: "pdf",
      storageKey: "documents/00000000-0000-4000-8000-000000000001",
      versionNumber: 1,
    });
    expect(signed.expiresInSeconds).toBe(120);
    expect(new URL(signed.url).searchParams.get("X-Amz-Expires")).toBe("120");
    storage.onModuleDestroy();
  });
});
