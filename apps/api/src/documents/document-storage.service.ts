import { createHash } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import {
  detectDocumentMimeType,
  MAX_DOCUMENT_BYTES,
  type AllowedDocumentExtension,
} from "./document-file-validation.js";

export const UPLOAD_URL_TTL_SECONDS = 300;
export const DOWNLOAD_URL_TTL_SECONDS = 120;

@Injectable()
export class DocumentStorageService implements OnModuleDestroy {
  private readonly client: S3Client;

  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
  ) {
    this.client = new S3Client({
      credentials: {
        accessKeyId: environment.S3_ACCESS_KEY,
        secretAccessKey: environment.S3_SECRET_KEY,
      },
      endpoint: environment.S3_ENDPOINT,
      forcePathStyle: environment.S3_FORCE_PATH_STYLE,
      region: environment.S3_REGION,
      requestHandler: { requestTimeout: 15_000 },
    });
  }

  async uploadUrl(input: {
    byteSize: number;
    mimeType: string;
    sha256: string;
    storageKey: string;
  }): Promise<{
    expiresInSeconds: number;
    headers: Record<string, string>;
    url: string;
  }> {
    const checksumBase64 = Buffer.from(input.sha256, "hex").toString("base64");
    const command = new PutObjectCommand({
      Bucket: this.environment.S3_BUCKET,
      ChecksumSHA256: checksumBase64,
      ContentLength: input.byteSize,
      ContentType: input.mimeType,
      Key: input.storageKey,
      Metadata: { sha256: input.sha256 },
      ServerSideEncryption:
        this.environment.NODE_ENV === "production" ? "AES256" : undefined,
    });
    return {
      expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
      headers: {
        "content-type": input.mimeType,
      },
      url: await getSignedUrl(this.client, command, {
        expiresIn: UPLOAD_URL_TTL_SECONDS,
      }),
    };
  }

  async verifiedObject(input: {
    byteSize: number;
    extension: AllowedDocumentExtension;
    mimeType: string;
    sha256: string;
    storageKey: string;
  }): Promise<{ body: Buffer; detectedMimeType: string }> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.environment.S3_BUCKET,
        Key: input.storageKey,
      }),
    );
    if (
      response.ContentLength !== input.byteSize ||
      response.ContentLength < 1 ||
      response.ContentLength > MAX_DOCUMENT_BYTES ||
      response.ContentType?.toLowerCase().split(";", 1)[0] !== input.mimeType ||
      response.Metadata?.sha256 !== input.sha256 ||
      !response.Body
    )
      throw new Error("OBJECT_METADATA_MISMATCH");
    const body = Buffer.from(await response.Body.transformToByteArray());
    if (
      body.length !== input.byteSize ||
      createHash("sha256").update(body).digest("hex") !== input.sha256
    )
      throw new Error("OBJECT_CHECKSUM_MISMATCH");
    return {
      body,
      detectedMimeType: detectDocumentMimeType(body, input.extension),
    };
  }

  async downloadUrl(input: {
    extension: string;
    storageKey: string;
    versionNumber: number;
  }): Promise<{ expiresInSeconds: number; url: string }> {
    return {
      expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
      url: await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.environment.S3_BUCKET,
          Key: input.storageKey,
          ResponseContentDisposition: `attachment; filename="document-v${input.versionNumber}.${input.extension}"`,
        }),
        { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
      ),
    };
  }

  async remove(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.environment.S3_BUCKET,
        Key: storageKey,
      }),
    );
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}
