import { createHash, randomUUID } from "node:crypto";
import { basename } from "node:path";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
  type OnModuleDestroy,
} from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

export interface ValidatedUpload {
  body: Buffer;
  byteSize: number;
  extension: "csv" | "xlsx";
  mimeType: string;
  originalFileName: string;
  sha256: string;
  storageKey: string;
}

@Injectable()
export class BomStorageService implements OnModuleDestroy {
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
      requestHandler: { requestTimeout: 10_000 },
    });
  }

  validate(input: {
    contentBase64: string;
    fileName: string;
    mimeType: string;
  }): ValidatedUpload {
    const normalizedName = basename(input.fileName.replace(/\\/g, "/"));
    if (
      normalizedName !== input.fileName ||
      hasControlCharacter(normalizedName) ||
      normalizedName.startsWith(".")
    )
      throw new UnprocessableEntityException("Unsafe file name");
    const extension = normalizedName.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx")
      throw new UnprocessableEntityException(
        "Only CSV and XLSX files are allowed",
      );
    const body = Buffer.from(input.contentBase64, "base64");
    const canonical = body.toString("base64").replace(/=+$/, "");
    if (
      canonical !== input.contentBase64.replace(/=+$/, "") ||
      body.length === 0 ||
      body.length > MAX_UPLOAD_BYTES
    )
      throw new UnprocessableEntityException("Invalid or oversized upload");
    if (extension === "csv") {
      if (
        !["application/csv", "text/csv", "text/plain"].includes(
          input.mimeType,
        ) ||
        body.includes(0)
      )
        throw new UnprocessableEntityException(
          "File content does not match CSV metadata",
        );
    } else if (
      input.mimeType !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      body.length < 4 ||
      body.readUInt32LE(0) !== 0x04034b50
    )
      throw new UnprocessableEntityException(
        "File content does not match XLSX metadata",
      );
    return {
      body,
      byteSize: body.length,
      extension,
      mimeType: input.mimeType,
      originalFileName: normalizedName,
      sha256: createHash("sha256").update(body).digest("hex"),
      storageKey: `bom-imports/${randomUUID()}.${extension}`,
    };
  }

  async put(upload: ValidatedUpload): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Body: upload.body,
        Bucket: this.environment.S3_BUCKET,
        ContentLength: upload.byteSize,
        ContentType: upload.mimeType,
        Key: upload.storageKey,
        Metadata: { sha256: upload.sha256 },
        ServerSideEncryption:
          this.environment.NODE_ENV === "production" ? "AES256" : undefined,
      }),
    );
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
