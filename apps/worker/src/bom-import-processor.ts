import { createHash } from "node:crypto";
import { GetObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import type { PrismaClient } from "@mecoflow/database";
import {
  ImportFileError,
  parseCsv,
  parseXlsx,
  validateImportRows,
} from "./bom-import-parser.js";

export interface ClaimedEvent {
  attempts: number;
  bomImportId: string;
  id: string;
}

export class BomImportProcessor {
  constructor(
    private readonly database: PrismaClient,
    private readonly objectStorage: S3Client,
    private readonly bucket: string,
  ) {}

  async claim(): Promise<ClaimedEvent | null> {
    return this.database.$transaction(async (transaction) => {
      const events = await transaction.$queryRaw<ClaimedEvent[]>`
        SELECT id, attempts, "aggregateId" AS "bomImportId"
        FROM outbox_events
        WHERE "eventType" = 'BOM_IMPORT_PARSE_REQUESTED'
          AND (
            ("status" = 'PENDING' AND "availableAt" <= CURRENT_TIMESTAMP AND attempts < 5) OR
            ("status" = 'PROCESSING' AND "lockedAt" < CURRENT_TIMESTAMP - INTERVAL '5 minutes')
          )
        ORDER BY "createdAt"
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      const event = events[0];
      if (!event) return null;
      const updated = await transaction.outboxEvent.update({
        data: {
          attempts: { increment: 1 },
          lastErrorCode: null,
          lockedAt: new Date(),
          status: "PROCESSING",
        },
        where: { id: event.id },
      });
      return {
        attempts: updated.attempts,
        bomImportId: event.bomImportId,
        id: updated.id,
      };
    });
  }

  async process(event: ClaimedEvent): Promise<void> {
    try {
      const bomImport = await this.database.bomImport.findUnique({
        include: { sourceFile: true },
        where: { id: event.bomImportId },
      });
      if (!bomImport) throw new ImportFileError("IMPORT_METADATA_MISSING");
      if (bomImport.status === "CONFIRMED") {
        await this.database.outboxEvent.update({
          data: { processedAt: new Date(), status: "PROCESSED" },
          where: { id: event.id },
        });
        return;
      }
      await this.database.bomImport.update({
        data: {
          failureCode: null,
          status: "PARSING",
          version: { increment: 1 },
        },
        where: { id: bomImport.id },
      });
      const response = await this.objectStorage.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: bomImport.sourceFile.storageKey,
        }),
      );
      if (!response.Body) throw new Error("OBJECT_BODY_MISSING");
      const bytes = await response.Body.transformToByteArray();
      if (bytes.byteLength > 5 * 1024 * 1024)
        throw new ImportFileError("FILE_SIZE_MISMATCH");
      const buffer = Buffer.from(bytes);
      const checksum = createHash("sha256").update(buffer).digest("hex");
      if (
        checksum !== bomImport.sourceFile.sha256 ||
        buffer.length !== bomImport.sourceFile.byteSize
      )
        throw new ImportFileError("CHECKSUM_MISMATCH");
      const rawRows =
        bomImport.sourceFile.extension === "csv"
          ? parseCsv(buffer)
          : parseXlsx(buffer);
      const items = await this.database.item.findMany({
        include: { unitOfMeasure: true },
        where: { active: true },
      });
      const rows = validateImportRows(rawRows, items);
      const errorCount = rows.reduce(
        (count, row) => count + row.errors.length,
        0,
      );
      const warningCount = rows.reduce(
        (count, row) => count + row.warnings.length,
        0,
      );
      await this.database.$transaction(async (transaction) => {
        await transaction.bomImportRow.deleteMany({
          where: { bomImportId: bomImport.id },
        });
        if (rows.length > 0)
          await transaction.bomImportRow.createMany({
            data: rows.map((row) => ({
              bomImportId: bomImport.id,
              criticality: row.criticality,
              errors: row.errors.map(({ code, field, message }) => ({
                code,
                field,
                message,
              })),
              itemId: row.itemId,
              notes: row.notes,
              quantity: row.quantity,
              rawData: row.rawData,
              rowNumber: row.rowNumber,
              unitOfMeasureId: row.unitOfMeasureId,
              warnings: row.warnings.map(({ code, field, message }) => ({
                code,
                field,
                message,
              })),
            })),
          });
        await transaction.bomImport.update({
          data: {
            errorCount,
            failureCode: null,
            parsedAt: new Date(),
            rowCount: rows.length,
            status: "READY",
            version: { increment: 1 },
            warningCount,
          },
          where: { id: bomImport.id },
        });
        await transaction.storedFile.update({
          data: { status: "VALIDATED" },
          where: { id: bomImport.sourceFileId },
        });
        await transaction.outboxEvent.update({
          data: {
            lastErrorCode: null,
            processedAt: new Date(),
            status: "PROCESSED",
          },
          where: { id: event.id },
        });
        await transaction.auditEvent.create({
          data: {
            action: "BOM_IMPORT_PARSED",
            actorUserId: bomImport.requestedByUserId,
            changes: { errorCount, rowCount: rows.length, warningCount },
            correlationId: `worker:${event.id}`,
            entityId: bomImport.id,
            entityType: "BomImport",
            organizationId: bomImport.auditOrganizationId,
            outcome: "SUCCESS",
            requestId: `worker:${event.id}`,
          },
        });
      });
    } catch (error) {
      await this.fail(event, error);
    }
  }

  private async fail(event: ClaimedEvent, error: unknown): Promise<void> {
    const code =
      error instanceof ImportFileError
        ? error.code
        : "IMPORT_PROCESSING_FAILED";
    const terminal = error instanceof ImportFileError || event.attempts >= 5;
    await this.database.$transaction(async (transaction) => {
      const bomImport = await transaction.bomImport.findUnique({
        where: { id: event.bomImportId },
      });
      if (bomImport) {
        await transaction.bomImport.update({
          data: {
            failureCode: code,
            status: terminal ? "FAILED" : "QUEUED",
            version: { increment: 1 },
          },
          where: { id: bomImport.id },
        });
        if (terminal)
          await transaction.storedFile.update({
            data: { status: "REJECTED" },
            where: { id: bomImport.sourceFileId },
          });
      }
      await transaction.outboxEvent.update({
        data: terminal
          ? {
              lastErrorCode: code,
              processedAt: new Date(),
              status: "FAILED",
            }
          : {
              availableAt: new Date(Date.now() + event.attempts * 2_000),
              lastErrorCode: code,
              lockedAt: null,
              status: "PENDING",
            },
        where: { id: event.id },
      });
      if (terminal && bomImport)
        await transaction.auditEvent.create({
          data: {
            action: "BOM_IMPORT_REJECTED",
            actorUserId: bomImport.requestedByUserId,
            changes: { failureCode: code },
            correlationId: `worker:${event.id}`,
            entityId: bomImport.id,
            entityType: "BomImport",
            organizationId: bomImport.auditOrganizationId,
            outcome: "FAILED",
            requestId: `worker:${event.id}`,
          },
        });
    });
  }
}
