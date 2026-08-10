import type { ServiceEnvironment } from "@mecoflow/config";

type ObjectStorageEncryptionEnvironment = Pick<
  ServiceEnvironment,
  "APP_ENV" | "S3_KMS_KEY_ID" | "S3_SERVER_SIDE_ENCRYPTION"
>;

export interface ObjectStorageEncryptionRequest {
  ServerSideEncryption?: "AES256" | "aws:kms";
  SSEKMSKeyId?: string;
}

export function objectStorageEncryptionRequest(
  environment: ObjectStorageEncryptionEnvironment,
): ObjectStorageEncryptionRequest {
  if (environment.APP_ENV !== "production") return {};
  if (!environment.S3_SERVER_SIDE_ENCRYPTION)
    throw new Error("PRODUCTION_OBJECT_ENCRYPTION_REQUIRED");
  if (environment.S3_SERVER_SIDE_ENCRYPTION === "aws:kms") {
    if (!environment.S3_KMS_KEY_ID)
      throw new Error("PRODUCTION_OBJECT_KMS_KEY_REQUIRED");
    return {
      ServerSideEncryption: "aws:kms",
      SSEKMSKeyId: environment.S3_KMS_KEY_ID,
    };
  }
  return { ServerSideEncryption: "AES256" };
}

export function objectStorageEncryptionHeaders(
  request: ObjectStorageEncryptionRequest,
): Record<string, string> {
  if (!request.ServerSideEncryption) return {};
  return {
    "x-amz-server-side-encryption": request.ServerSideEncryption,
    ...(request.SSEKMSKeyId
      ? {
          "x-amz-server-side-encryption-aws-kms-key-id": request.SSEKMSKeyId,
        }
      : {}),
  };
}

export function objectStorageEncryptionMatches(
  expected: ObjectStorageEncryptionRequest,
  actual: {
    ServerSideEncryption?: string | undefined;
    SSEKMSKeyId?: string | undefined;
  },
): boolean {
  if (!expected.ServerSideEncryption) return true;
  return (
    actual.ServerSideEncryption === expected.ServerSideEncryption &&
    (!expected.SSEKMSKeyId || actual.SSEKMSKeyId === expected.SSEKMSKeyId)
  );
}
