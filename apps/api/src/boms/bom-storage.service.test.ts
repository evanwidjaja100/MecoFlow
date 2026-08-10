import { describe, expect, it } from "vitest";
import type { ServiceEnvironment } from "@mecoflow/config";
import {
  objectStorageEncryptionMatches,
  objectStorageEncryptionRequest,
} from "../object-storage-encryption.js";
import { BomStorageService } from "./bom-storage.service.js";
import { createBomXlsxTemplate } from "./bom-template.js";

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
  WEB_BASE_URL: "http://localhost:3000",
  VIRUS_SCANNER_ENABLED: false,
  VIRUS_SCANNER_HOST: "127.0.0.1",
  VIRUS_SCANNER_PORT: 3310,
  VIRUS_SCANNER_TIMEOUT_MS: 10000,
};

describe("secure BOM upload validation", () => {
  const storage = new BomStorageService(environment);

  it("accepts bounded CSV and XLSX content and computes checksums", () => {
    const csv = storage.validate({
      contentBase64: Buffer.from(
        "item_code,item_name,quantity,unit_code,criticality,notes\n",
      ).toString("base64"),
      fileName: "bom.csv",
      mimeType: "text/csv",
    });
    expect(csv.extension).toBe("csv");
    expect(csv.sha256).toMatch(/^[0-9a-f]{64}$/);

    const xlsxBody = createBomXlsxTemplate();
    const xlsx = storage.validate({
      contentBase64: xlsxBody.toString("base64"),
      fileName: "bom.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(xlsx.extension).toBe("xlsx");
  });

  it("rejects macro extensions, executable masquerades, binary CSV, traversal, and oversized bodies", () => {
    const cases = [
      {
        contentBase64: Buffer.from("PK\u0003\u0004").toString("base64"),
        fileName: "bom.xlsm",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      {
        contentBase64: Buffer.from("MZ executable").toString("base64"),
        fileName: "bom.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      {
        contentBase64: Buffer.from([0, 1, 2]).toString("base64"),
        fileName: "bom.csv",
        mimeType: "text/csv",
      },
      {
        contentBase64: Buffer.from("headers").toString("base64"),
        fileName: "../bom.csv",
        mimeType: "text/csv",
      },
      {
        contentBase64: Buffer.alloc(5 * 1024 * 1024 + 1, 65).toString("base64"),
        fileName: "bom.csv",
        mimeType: "text/csv",
      },
    ];
    for (const input of cases) expect(() => storage.validate(input)).toThrow();
  });

  it("requires the configured object encryption only in the production application environment", () => {
    expect(
      objectStorageEncryptionRequest({
        APP_ENV: "staging",
        S3_KMS_KEY_ID: "",
        S3_SERVER_SIDE_ENCRYPTION: undefined,
      }),
    ).toEqual({});
    expect(
      objectStorageEncryptionRequest({
        APP_ENV: "production",
        S3_KMS_KEY_ID: "",
        S3_SERVER_SIDE_ENCRYPTION: "AES256",
      }),
    ).toEqual({ ServerSideEncryption: "AES256" });
    expect(
      objectStorageEncryptionRequest({
        APP_ENV: "production",
        S3_KMS_KEY_ID: "kms://production/object-storage-key",
        S3_SERVER_SIDE_ENCRYPTION: "aws:kms",
      }),
    ).toEqual({
      ServerSideEncryption: "aws:kms",
      SSEKMSKeyId: "kms://production/object-storage-key",
    });
    expect(() =>
      objectStorageEncryptionRequest({
        APP_ENV: "production",
        S3_KMS_KEY_ID: "",
        S3_SERVER_SIDE_ENCRYPTION: undefined,
      }),
    ).toThrow("PRODUCTION_OBJECT_ENCRYPTION_REQUIRED");
    expect(
      objectStorageEncryptionMatches(
        {
          ServerSideEncryption: "aws:kms",
          SSEKMSKeyId: "kms://production/object-storage-key",
        },
        {
          ServerSideEncryption: "aws:kms",
          SSEKMSKeyId: "kms://production/object-storage-key",
        },
      ),
    ).toBe(true);
    expect(
      objectStorageEncryptionMatches(
        {
          ServerSideEncryption: "aws:kms",
          SSEKMSKeyId: "kms://production/object-storage-key",
        },
        { ServerSideEncryption: "AES256" },
      ),
    ).toBe(false);
  });
});
