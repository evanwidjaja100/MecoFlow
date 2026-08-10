import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import {
  createDatabaseClient,
  Prisma,
  type PrismaClient,
} from "@mecoflow/database";
import type { RequestContext } from "../identity/identity.types.js";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type { AllowedDocumentExtension } from "./document-file-validation.js";

export type AssociationInput = {
  entityId: string;
  entityType:
    | "ADVANCE_SHIPMENT_NOTICE"
    | "BOM"
    | "GOODS_RECEIPT"
    | "RECEIVING_INSPECTION"
    | "PROJECT"
    | "PURCHASE_ORDER"
    | "PURCHASE_REQUISITION"
    | "WORK_PACKAGE";
};

export type UploadMetadata = {
  byteSize: number;
  extension: AllowedDocumentExtension;
  mimeType: string;
  originalFileName: string;
  sha256: string;
  storageKey: string;
  uploadExpiresAt: Date;
};

type ActorInput = {
  actorUserId: string;
  auditOrganizationId: string;
  context: RequestContext;
};

const documentInclude = {
  associations: { orderBy: [{ entityType: "asc" }, { entityId: "asc" }] },
  createdBy: { select: { displayName: true, id: true } },
  ownerOrganization: {
    select: { code: true, id: true, name: true, type: true },
  },
  versions: {
    include: {
      createdBy: { select: { displayName: true, id: true } },
      reviewedBy: { select: { displayName: true, id: true } },
      transitions: {
        include: { actor: { select: { displayName: true, id: true } } },
        orderBy: { occurredAt: "asc" as const },
      },
    },
    orderBy: { versionNumber: "desc" },
  },
} satisfies Prisma.DocumentInclude;

type DocumentPayload = Prisma.DocumentGetPayload<{
  include: typeof documentInclude;
}>;

function present(document: DocumentPayload) {
  return {
    ...document,
    versions: document.versions.map(({ storageKey, ...version }) => {
      void storageKey;
      return version;
    }),
  };
}

@Injectable()
export class DocumentsRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private audit(
    transaction: Prisma.TransactionClient,
    input: ActorInput & {
      action: string;
      changes: Prisma.InputJsonValue;
      entityId: string;
      entityType: string;
    },
  ) {
    return transaction.auditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: input.entityType,
        organizationId: input.auditOrganizationId,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
      },
    });
  }

  async projectIdForDocument(id: string): Promise<string | null> {
    const record = await this.database.document.findUnique({
      select: { projectId: true },
      where: { id },
    });
    return record?.projectId ?? null;
  }

  async scopeForVersion(id: string) {
    return this.database.documentVersion.findUnique({
      select: {
        document: {
          select: { ownerOrganizationId: true, projectId: true },
        },
      },
      where: { id },
    });
  }

  list(projectId: string, ownerOrganizationId?: string) {
    return this.database.document
      .findMany({
        include: documentInclude,
        orderBy: { updatedAt: "desc" },
        where: {
          projectId,
          ...(ownerOrganizationId ? { ownerOrganizationId } : {}),
        },
      })
      .then((documents) => documents.map(present));
  }

  async detail(id: string, ownerOrganizationId?: string) {
    const document = await this.database.document.findFirst({
      include: documentInclude,
      where: {
        id,
        ...(ownerOrganizationId ? { ownerOrganizationId } : {}),
      },
    });
    return document ? present(document) : null;
  }

  private async validateAssociations(
    transaction: Prisma.TransactionClient,
    projectId: string,
    ownerOrganizationId: string,
    ownerType: "INTERNAL" | "SUPPLIER",
    associations: AssociationInput[],
  ): Promise<AssociationInput[]> {
    const suppliedKeys = associations.map(
      (value) => `${value.entityType}:${value.entityId}`,
    );
    if (new Set(suppliedKeys).size !== suppliedKeys.length)
      throw new UnprocessableEntityException("Duplicate document association");
    const values = [
      { entityId: projectId, entityType: "PROJECT" as const },
      ...associations,
    ];
    const unique = new Map(
      values.map((value) => [`${value.entityType}:${value.entityId}`, value]),
    );
    for (const association of unique.values()) {
      let valid =
        association.entityType === "PROJECT" &&
        association.entityId === projectId;
      if (association.entityType === "WORK_PACKAGE")
        valid = Boolean(
          await transaction.workPackage.findFirst({
            select: { id: true },
            where: { id: association.entityId, projectId },
          }),
        );
      if (association.entityType === "BOM")
        valid = Boolean(
          await transaction.bom.findFirst({
            select: { id: true },
            where: { id: association.entityId, projectId },
          }),
        );
      if (association.entityType === "PURCHASE_REQUISITION")
        valid = Boolean(
          await transaction.purchaseRequisition.findFirst({
            select: { id: true },
            where: { id: association.entityId, projectId },
          }),
        );
      if (association.entityType === "PURCHASE_ORDER")
        valid = Boolean(
          await transaction.purchaseOrder.findFirst({
            select: { id: true },
            where: {
              id: association.entityId,
              projectId,
              ...(ownerType === "SUPPLIER"
                ? { supplierOrganizationId: ownerOrganizationId }
                : {}),
            },
          }),
        );
      if (association.entityType === "ADVANCE_SHIPMENT_NOTICE")
        valid = Boolean(
          await transaction.advanceShipmentNotice.findFirst({
            select: { id: true },
            where: {
              id: association.entityId,
              projectId,
              ...(ownerType === "SUPPLIER"
                ? { supplierOrganizationId: ownerOrganizationId }
                : {}),
            },
          }),
        );
      if (association.entityType === "GOODS_RECEIPT")
        valid =
          ownerType === "INTERNAL" &&
          Boolean(
            await transaction.goodsReceipt.findFirst({
              select: { id: true },
              where: { id: association.entityId, projectId },
            }),
          );
      if (association.entityType === "RECEIVING_INSPECTION")
        valid =
          ownerType === "INTERNAL" &&
          Boolean(
            await transaction.receivingInspection.findFirst({
              select: { id: true },
              where: { id: association.entityId, projectId },
            }),
          );
      if (
        ownerType === "SUPPLIER" &&
        !["PROJECT", "PURCHASE_ORDER", "ADVANCE_SHIPMENT_NOTICE"].includes(
          association.entityType,
        )
      )
        valid = false;
      if (!valid)
        throw new UnprocessableEntityException("Invalid document association");
    }
    return [...unique.values()];
  }

  async create(
    input: ActorInput & {
      associations: AssociationInput[];
      category: string;
      description: string;
      ownerOrganizationId: string;
      ownerType: "INTERNAL" | "SUPPLIER";
      projectId: string;
      title: string;
      upload: UploadMetadata;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      const project = await transaction.project.findUnique({
        where: { id: input.projectId },
      });
      if (
        !project ||
        ["CANCELLED", "COMPLETED"].includes(project.state) ||
        (input.ownerType === "INTERNAL" &&
          project.organizationId !== input.ownerOrganizationId)
      )
        throw new UnprocessableEntityException(
          "Project cannot accept documents",
        );
      const associations = await this.validateAssociations(
        transaction,
        input.projectId,
        input.ownerOrganizationId,
        input.ownerType,
        input.associations,
      );
      const document = await transaction.document.create({
        data: {
          associations: { createMany: { data: associations } },
          category: input.category,
          createdByUserId: input.actorUserId,
          description: input.description,
          ownerOrganizationId: input.ownerOrganizationId,
          projectId: input.projectId,
          title: input.title,
          versions: {
            create: {
              byteSize: input.upload.byteSize,
              createdByUserId: input.actorUserId,
              declaredMimeType: input.upload.mimeType,
              extension: input.upload.extension,
              originalFileName: input.upload.originalFileName,
              sha256: input.upload.sha256,
              storageKey: input.upload.storageKey,
              uploadExpiresAt: input.upload.uploadExpiresAt,
              versionNumber: 1,
            },
          },
        },
        include: documentInclude,
      });
      await this.audit(transaction, {
        ...input,
        action: "DOCUMENT_UPLOAD_INITIATED",
        changes: {
          associationCount: associations.length,
          byteSize: input.upload.byteSize,
          extension: input.upload.extension,
          sha256: input.upload.sha256,
          versionNumber: 1,
        },
        entityId: document.versions[0]!.id,
        entityType: "DocumentVersion",
      });
      return present(document);
    });
  }

  async supersede(
    input: ActorInput & {
      documentId: string;
      expectedDocumentVersion: number;
      ownerOrganizationId: string;
      reason: string;
      upload: UploadMetadata;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM documents WHERE id = ${input.documentId}::uuid FOR UPDATE`,
      );
      const current = await transaction.document.findUnique({
        include: {
          project: true,
          versions: { orderBy: { versionNumber: "desc" } },
        },
        where: { id: input.documentId },
      });
      if (!current || current.ownerOrganizationId !== input.ownerOrganizationId)
        throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedDocumentVersion)
        throw new ConflictException("Concurrent modification");
      if (
        ["CANCELLED", "COMPLETED"].includes(current.project.state) ||
        current.versions[0]?.status !== "APPROVED"
      )
        throw new UnprocessableEntityException(
          "Only the current approved document can be superseded",
        );
      const versionNumber = current.currentVersionNumber + 1;
      const version = await transaction.documentVersion.create({
        data: {
          byteSize: input.upload.byteSize,
          createdByUserId: input.actorUserId,
          declaredMimeType: input.upload.mimeType,
          documentId: current.id,
          extension: input.upload.extension,
          originalFileName: input.upload.originalFileName,
          sha256: input.upload.sha256,
          storageKey: input.upload.storageKey,
          uploadExpiresAt: input.upload.uploadExpiresAt,
          versionNumber,
        },
      });
      const changed = await transaction.document.updateMany({
        data: {
          currentVersionNumber: versionNumber,
          version: { increment: 1 },
        },
        where: { id: current.id, version: input.expectedDocumentVersion },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await this.audit(transaction, {
        ...input,
        action: "DOCUMENT_SUPERSEDE_UPLOAD_INITIATED",
        changes: {
          byteSize: input.upload.byteSize,
          extension: input.upload.extension,
          reason: input.reason,
          sha256: input.upload.sha256,
          versionNumber,
        },
        entityId: version.id,
        entityType: "DocumentVersion",
      });
      return version;
    });
  }

  versionForCompletion(id: string) {
    return this.database.documentVersion.findUnique({
      include: { document: true },
      where: { id },
    });
  }

  async complete(
    input: ActorInput & {
      detectedMimeType?: string;
      expectedVersion: number;
      scanResultCode: string;
      scanStatus: "CLEAN" | "ERROR" | "INFECTED";
      versionId: string;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM document_versions WHERE id = ${input.versionId}::uuid FOR UPDATE`,
      );
      const current = await transaction.documentVersion.findUnique({
        where: { id: input.versionId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (current.status !== "QUARANTINED" || current.scanStatus !== "PENDING")
        throw new UnprocessableEntityException("Upload is already finalized");
      const clean = input.scanStatus === "CLEAN";
      const changed = await transaction.documentVersion.updateMany({
        data: {
          detectedMimeType: input.detectedMimeType ?? null,
          scanResultCode: input.scanResultCode,
          scanStatus: input.scanStatus,
          scannedAt: new Date(),
          status: clean ? "DRAFT" : "SCAN_FAILED",
          uploadedAt: new Date(),
          version: { increment: 1 },
        },
        where: {
          id: current.id,
          status: "QUARANTINED",
          version: input.expectedVersion,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await transaction.documentVersionTransition.create({
        data: {
          actorUserId: input.actorUserId,
          documentVersionId: current.id,
          reason: clean
            ? "Upload verified and malware scan passed"
            : "Upload quarantined after scan failure",
          sourceStatus: "QUARANTINED",
          targetStatus: clean ? "DRAFT" : "SCAN_FAILED",
        },
      });
      await this.audit(transaction, {
        ...input,
        action: clean
          ? "DOCUMENT_UPLOAD_COMPLETED"
          : "DOCUMENT_UPLOAD_REJECTED",
        changes: {
          detectedMimeType: input.detectedMimeType ?? null,
          scanResultCode: input.scanResultCode,
          scanStatus: input.scanStatus,
          sha256Verified: Boolean(input.detectedMimeType),
        },
        entityId: current.id,
        entityType: "DocumentVersion",
      });
      return transaction.documentVersion.findUniqueOrThrow({
        select: {
          detectedMimeType: true,
          id: true,
          scanResultCode: true,
          scanStatus: true,
          status: true,
          version: true,
          versionNumber: true,
        },
        where: { id: current.id },
      });
    });
  }

  async transition(
    input: ActorInput & {
      action:
        "DOCUMENT_APPROVED" | "DOCUMENT_REJECTED" | "DOCUMENT_REVIEW_SUBMITTED";
      expectedVersion: number;
      reason: string;
      targetStatus: "APPROVED" | "IN_REVIEW" | "REJECTED";
      versionId: string;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM document_versions WHERE id = ${input.versionId}::uuid FOR UPDATE`,
      );
      const current = await transaction.documentVersion.findUnique({
        include: { document: { include: { project: true } } },
        where: { id: input.versionId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const sourceStatus =
        input.targetStatus === "IN_REVIEW" ? "DRAFT" : "IN_REVIEW";
      if (
        current.status !== sourceStatus ||
        current.scanStatus !== "CLEAN" ||
        ["CANCELLED", "COMPLETED"].includes(current.document.project.state) ||
        current.versionNumber !== current.document.currentVersionNumber
      )
        throw new UnprocessableEntityException(
          "Invalid document workflow transition",
        );

      const now = new Date();
      if (input.targetStatus === "APPROVED") {
        const previous = await transaction.documentVersion.findFirst({
          where: {
            documentId: current.documentId,
            id: { not: current.id },
            status: "APPROVED",
          },
        });
        if (previous) {
          await transaction.documentVersion.update({
            data: { status: "SUPERSEDED", version: { increment: 1 } },
            where: { id: previous.id },
          });
          await transaction.documentVersionTransition.create({
            data: {
              actorUserId: input.actorUserId,
              documentVersionId: previous.id,
              reason: input.reason,
              sourceStatus: "APPROVED",
              targetStatus: "SUPERSEDED",
            },
          });
        }
      }
      const changed = await transaction.documentVersion.updateMany({
        data: {
          reviewReason: input.reason,
          ...(input.targetStatus === "APPROVED" ||
          input.targetStatus === "REJECTED"
            ? { reviewedAt: now, reviewedByUserId: input.actorUserId }
            : {}),
          status: input.targetStatus,
          version: { increment: 1 },
        },
        where: {
          id: current.id,
          status: sourceStatus,
          version: input.expectedVersion,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await transaction.documentVersionTransition.create({
        data: {
          actorUserId: input.actorUserId,
          documentVersionId: current.id,
          reason: input.reason,
          sourceStatus,
          targetStatus: input.targetStatus,
        },
      });
      await this.audit(transaction, {
        ...input,
        action: input.action,
        changes: {
          reason: input.reason,
          status: { from: sourceStatus, to: input.targetStatus },
          versionNumber: current.versionNumber,
        },
        entityId: current.id,
        entityType: "DocumentVersion",
      });
      return transaction.documentVersion.findUniqueOrThrow({
        include: {
          createdBy: { select: { displayName: true, id: true } },
          reviewedBy: { select: { displayName: true, id: true } },
          transitions: {
            include: { actor: { select: { displayName: true, id: true } } },
            orderBy: { occurredAt: "asc" },
          },
        },
        omit: { storageKey: true },
        where: { id: current.id },
      });
    });
  }

  async versionForDownload(id: string) {
    return this.database.documentVersion.findUnique({
      include: { document: true },
      where: { id },
    });
  }

  async auditDownload(input: ActorInput & { versionId: string }) {
    await this.database.$transaction((transaction) =>
      this.audit(transaction, {
        ...input,
        action: "DOCUMENT_DOWNLOADED",
        changes: { presignedUrlIssued: true },
        entityId: input.versionId,
        entityType: "DocumentVersion",
      }),
    );
  }
}
