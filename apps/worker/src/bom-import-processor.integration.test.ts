import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  parseServiceEnvironment,
  type ServiceEnvironment,
} from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import { BomImportProcessor } from "./bom-import-processor.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithServices = databaseUrl ? describe.sequential : describe.skip;

describeWithServices("background BOM import job", () => {
  let database: PrismaClient;
  let environment: ServiceEnvironment;
  let storage: S3Client;
  const keys: string[] = [];

  beforeAll(() => {
    environment = parseServiceEnvironment(process.env);
    database = createDatabaseClient(environment.DATABASE_URL);
    storage = new S3Client({
      credentials: {
        accessKeyId: environment.S3_ACCESS_KEY,
        secretAccessKey: environment.S3_SECRET_KEY,
      },
      endpoint: environment.S3_ENDPOINT,
      forcePathStyle: environment.S3_FORCE_PATH_STYLE,
      region: environment.S3_REGION,
    });
  });

  afterAll(async () => {
    for (const key of keys)
      await storage
        .send(
          new DeleteObjectCommand({ Bucket: environment.S3_BUCKET, Key: key }),
        )
        .catch(() => undefined);
    storage.destroy();
    await disconnectDatabaseClient();
  });

  it("reads a private object, verifies its checksum, and persists every dry-run row", async () => {
    const body = Buffer.from(
      "item_code,item_name,quantity,unit_code,criticality,notes\nPLATE-SS304-6MM,,1,EA,CRITICAL,worker test\n",
    );
    const sha256 = (await import("node:crypto"))
      .createHash("sha256")
      .update(body)
      .digest("hex");
    const key = `bom-imports/${randomUUID()}.csv`;
    keys.push(key);
    await storage.send(
      new PutObjectCommand({
        Body: body,
        Bucket: environment.S3_BUCKET,
        ContentType: "text/csv",
        Key: key,
      }),
    );
    const created = await database.$transaction(async (transaction) => {
      const sourceFile = await transaction.storedFile.create({
        data: {
          byteSize: body.length,
          extension: "csv",
          mimeType: "text/csv",
          originalFileName: "worker-test.csv",
          sha256,
          storageKey: key,
        },
      });
      const bomImport = await transaction.bomImport.create({
        data: {
          auditOrganizationId: localFixtures.internalOrganizationId,
          projectId: phaseTwoFixtures.demoProjectId,
          requestedByUserId: localFixtures.internalAdminUserId,
          sourceFileId: sourceFile.id,
        },
      });
      const event = await transaction.outboxEvent.create({
        data: {
          aggregateId: bomImport.id,
          aggregateType: "BomImport",
          attempts: 1,
          eventType: "BOM_IMPORT_PARSE_REQUESTED",
          payload: { bomImportId: bomImport.id },
          status: "PROCESSING",
        },
      });
      return { bomImport, event };
    });
    const processor = new BomImportProcessor(
      database,
      storage,
      environment.S3_BUCKET,
    );
    await processor.process({
      attempts: 1,
      bomImportId: created.bomImport.id,
      id: created.event.id,
    });
    const result = await database.bomImport.findUniqueOrThrow({
      include: { rows: true, sourceFile: true },
      where: { id: created.bomImport.id },
    });
    expect(result).toMatchObject({
      errorCount: 0,
      rowCount: 1,
      status: "READY",
      warningCount: 0,
    });
    expect(result.rows).toHaveLength(1);
    expect(result.sourceFile.status).toBe("VALIDATED");
    expect(
      await database.auditEvent.count({
        where: { action: "BOM_IMPORT_PARSED", entityId: result.id },
      }),
    ).toBe(1);
  });
});
