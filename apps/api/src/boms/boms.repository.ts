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
import { canReleaseBom, canTransitionBom } from "./bom-lifecycle.js";
import type { ValidatedUpload } from "./bom-storage.service.js";

type RevisionCommand = {
  actorUserId: string | null;
  actorMembershipId?: string | null;
  systemPrincipal?: string | null;
  auditOrganizationId: string;
  context: RequestContext;
  expectedVersion: number;
  reason: string;
  revisionId: string;
};

const revisionInclude = {
  bom: { include: { project: true, workPackage: true } },
  createdBy: { select: { displayName: true, id: true } },
  lines: {
    include: { item: true, unitOfMeasure: true },
    orderBy: { lineNumber: "asc" as const },
  },
  sourceFile: {
    select: {
      byteSize: true,
      id: true,
      mimeType: true,
      originalFileName: true,
      sha256: true,
      status: true,
    },
  },
  transitions: {
    include: { actor: { select: { displayName: true, id: true } } },
    orderBy: { occurredAt: "asc" as const },
  },
} as const;

function presentRevision(
  revision: Prisma.BomRevisionGetPayload<{ include: typeof revisionInclude }>,
) {
  return {
    ...revision,
    lines: revision.lines.map((line) => ({
      ...line,
      affectsOfficialReadiness: revision.status === "RELEASED",
      procurementCoverage: {
        allocatedQuantity: "0",
        orderedQuantity: "0",
        placeholder: true,
        status: "NOT_STARTED",
      },
      quantity: line.quantity.toString(),
    })),
  };
}

@Injectable()
export class BomsRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private audit(
    transaction: Prisma.TransactionClient,
    input: {
      action: string;
      actorUserId: string | null;
      actorMembershipId?: string | null;
      systemPrincipal?: string | null;
      changes: Prisma.InputJsonValue;
      context: RequestContext;
      entityId: string;
      entityType: string;
      organizationId: string;
    },
  ) {
    return (transaction.auditEvent.create as any)({
      data: {
        action: input.action,
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: input.entityType,
        organizationId: input.organizationId,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
        systemPrincipal: input.systemPrincipal ?? null,
      },
    });
  }

  projectIdForBom(id: string) {
    return this.database.bom
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  projectIdForRevision(id: string) {
    return this.database.bomRevision
      .findUnique({
        select: { bom: { select: { projectId: true } } },
        where: { id },
      })
      .then((value) => value?.bom.projectId ?? null);
  }

  projectIdForImport(id: string) {
    return this.database.bomImport
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  async createImport(input: {
    actorUserId: string | null;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId: string;
    context: RequestContext;
    projectId: string;
    upload: Omit<ValidatedUpload, "body">;
    workPackageId?: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const project = await transaction.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project || ["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException(
          "Project cannot accept BOM imports",
        );
      if (input.workPackageId) {
        const workPackage = await transaction.workPackage.findFirst({
          where: { id: input.workPackageId, projectId: input.projectId },
        });
        if (!workPackage)
          throw new UnprocessableEntityException("Invalid work-package scope");
      }
      const sourceFile = await transaction.storedFile.create({
        data: {
          byteSize: input.upload.byteSize,
          extension: input.upload.extension,
          mimeType: input.upload.mimeType,
          originalFileName: input.upload.originalFileName,
          sha256: input.upload.sha256,
          storageKey: input.upload.storageKey,
        },
      });
      const bomImport = await transaction.bomImport.create({
        data: {
          auditOrganizationId: input.auditOrganizationId,
          projectId: input.projectId,
          requestedByUserId: input.actorUserId as string,
          sourceFileId: sourceFile.id,
          workPackageId: input.workPackageId ?? null,
        },
        include: {
          sourceFile: {
            select: {
              id: true,
              originalFileName: true,
              sha256: true,
              status: true,
            },
          },
        },
      });
      await transaction.outboxEvent.create({
        data: {
          aggregateId: bomImport.id,
          aggregateType: "BomImport",
          eventType: "BOM_IMPORT_PARSE_REQUESTED",
          payload: { bomImportId: bomImport.id },
        },
      });
      await this.audit(transaction, {
        action: "BOM_IMPORT_UPLOADED",
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: {
          byteSize: sourceFile.byteSize,
          extension: sourceFile.extension,
          sha256: sourceFile.sha256,
          workPackageId: input.workPackageId ?? null,
        },
        context: input.context,
        entityId: bomImport.id,
        entityType: "BomImport",
        organizationId: input.auditOrganizationId,
      });
      return bomImport;
    });
  }

  listImports(projectId: string) {
    return this.database.bomImport.findMany({
      include: {
        createdRevision: {
          select: { bomId: true, id: true, revisionNumber: true, status: true },
        },
        sourceFile: {
          select: {
            byteSize: true,
            id: true,
            originalFileName: true,
            sha256: true,
            status: true,
          },
        },
        workPackage: { select: { code: true, id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      where: { projectId },
    });
  }

  importDetail(id: string) {
    return this.database.bomImport.findUnique({
      include: {
        createdRevision: {
          select: { bomId: true, id: true, revisionNumber: true, status: true },
        },
        rows: { orderBy: { rowNumber: "asc" } },
        sourceFile: {
          select: {
            byteSize: true,
            id: true,
            mimeType: true,
            originalFileName: true,
            sha256: true,
            status: true,
          },
        },
        workPackage: { select: { code: true, id: true, name: true } },
      },
      where: { id },
    });
  }

  async confirmImport(input: {
    actorUserId: string | null;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId: string;
    context: RequestContext;
    expectedVersion: number;
    importId: string;
    notes: string;
    title: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      await transaction.$queryRaw`SELECT id FROM bom_imports WHERE id = ${input.importId}::uuid FOR UPDATE`;
      const bomImport = await transaction.bomImport.findUnique({
        include: {
          rows: { orderBy: { rowNumber: "asc" } },
          sourceFile: true,
        },
        where: { id: input.importId },
      });
      if (!bomImport) throw new NotFoundException("Resource not found");
      if (bomImport.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (bomImport.status !== "READY" || bomImport.errorCount !== 0)
        throw new UnprocessableEntityException(
          "Import dry run is not ready for confirmation",
        );
      if (
        bomImport.rows.length === 0 ||
        bomImport.rows.length !== bomImport.rowCount
      )
        throw new UnprocessableEntityException(
          "Import contains no confirmed rows",
        );
      if (
        bomImport.rows.some(
          (row) =>
            !row.itemId ||
            !row.unitOfMeasureId ||
            !row.quantity ||
            !row.criticality,
        )
      )
        throw new UnprocessableEntityException("Import rows are incomplete");
      await transaction.$queryRaw`SELECT id FROM projects WHERE id = ${bomImport.projectId}::uuid FOR UPDATE`;
      const project = await transaction.project.findUnique({
        where: { id: bomImport.projectId },
      });
      if (!project || ["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException(
          "Project cannot accept a draft BOM revision",
        );
      const matchedItems = await transaction.item.findMany({
        select: {
          active: true,
          id: true,
          unitOfMeasure: { select: { active: true } },
          unitOfMeasureId: true,
        },
        where: {
          id: { in: [...new Set(bomImport.rows.map((row) => row.itemId!))] },
        },
      });
      const currentItems = new Map(matchedItems.map((item) => [item.id, item]));
      if (
        bomImport.rows.some((row) => {
          const item = currentItems.get(row.itemId!);
          return (
            !item?.active ||
            !item.unitOfMeasure.active ||
            item.unitOfMeasureId !== row.unitOfMeasureId
          );
        })
      )
        throw new UnprocessableEntityException(
          "Item or unit references changed after validation; upload and validate again",
        );
      let bom = await transaction.bom.findFirst({
        where: {
          projectId: bomImport.projectId,
          workPackageId: bomImport.workPackageId,
        },
      });
      if (!bom) {
        bom = await transaction.bom.create({
          data: {
            projectId: bomImport.projectId,
            workPackageId: bomImport.workPackageId,
          },
        });
      } else
        await transaction.$queryRaw`SELECT id FROM boms WHERE id = ${bom.id}::uuid FOR UPDATE`;
      const latest = await transaction.bomRevision.aggregate({
        _max: { revisionNumber: true },
        where: { bomId: bom.id },
      });
      const revisionNumber = (latest._max.revisionNumber ?? 0) + 1;
      const revision = await transaction.bomRevision.create({
        data: {
          bomId: bom.id,
          createdByUserId: input.actorUserId as string,
          notes: input.notes,
          revisionNumber,
          sourceChecksum: bomImport.sourceFile.sha256,
          sourceFileId: bomImport.sourceFileId,
          sourceImportId: bomImport.id,
          title: input.title,
        },
      });
      await transaction.bomLine.createMany({
        data: bomImport.rows.map((row, index) => ({
          bomRevisionId: revision.id,
          criticality: row.criticality!,
          itemId: row.itemId!,
          lineNumber: index + 1,
          notes: row.notes,
          quantity: row.quantity!,
          unitOfMeasureId: row.unitOfMeasureId!,
        })),
      });
      const changed = await transaction.bomImport.updateMany({
        data: {
          confirmedAt: new Date(),
          status: "CONFIRMED",
          version: { increment: 1 },
        },
        where: {
          id: bomImport.id,
          status: "READY",
          version: input.expectedVersion,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await transaction.bom.update({
        data: { version: { increment: 1 } },
        where: { id: bom.id },
      });
      await transaction.outboxEvent.create({
        data: {
          aggregateId: revision.id,
          aggregateType: "BomRevision",
          eventType: "BOM_DRAFT_CREATED",
          payload: { bomRevisionId: revision.id },
          status: "PROCESSED",
          processedAt: new Date(),
        },
      });
      await this.audit(transaction, {
        action: "BOM_IMPORT_CONFIRMED",
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: {
          lineCount: bomImport.rows.length,
          revisionNumber,
          sourceChecksum: bomImport.sourceFile.sha256,
        },
        context: input.context,
        entityId: revision.id,
        entityType: "BomRevision",
        organizationId: input.auditOrganizationId,
      });
      return transaction.bomRevision
        .findUniqueOrThrow({
          include: revisionInclude,
          where: { id: revision.id },
        })
        .then(presentRevision);
    });
  }

  listProjectBoms(projectId: string) {
    return this.database.bom.findMany({
      include: {
        revisions: {
          orderBy: { revisionNumber: "desc" },
          select: {
            createdAt: true,
            id: true,
            revisionNumber: true,
            status: true,
            title: true,
            updatedAt: true,
            version: true,
          },
        },
        workPackage: { select: { code: true, id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      where: { projectId },
    });
  }

  async revisionDetail(id: string) {
    const revision = await this.database.bomRevision.findUnique({
      include: revisionInclude,
      where: { id },
    });
    return revision ? presentRevision(revision) : null;
  }

  async updateLine(input: {
    actorUserId: string | null;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId: string;
    context: RequestContext;
    criticality: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
    expectedVersion: number;
    lineId: string;
    notes: string;
    quantity: string;
    revisionId: string;
    unitOfMeasureId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const current = await transaction.bomLine.findFirst({
        include: {
          bomRevision: true,
          item: { include: { unitOfMeasure: true } },
        },
        where: { bomRevisionId: input.revisionId, id: input.lineId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.bomRevision.status !== "DRAFT")
        throw new UnprocessableEntityException(
          "Only draft BOM lines can be corrected",
        );
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (
        !current.item.active ||
        !current.item.unitOfMeasure.active ||
        input.unitOfMeasureId !== current.item.unitOfMeasureId
      )
        throw new UnprocessableEntityException("Invalid unit for item");
      const decimalPlaces = input.quantity.split(".")[1]?.length ?? 0;
      if (
        Number(input.quantity) <= 0 ||
        decimalPlaces > current.item.unitOfMeasure.decimalPrecision
      )
        throw new UnprocessableEntityException("Invalid quantity for unit");
      const changed = await transaction.bomLine.updateMany({
        data: {
          criticality: input.criticality,
          notes: input.notes,
          quantity: input.quantity,
          unitOfMeasureId: input.unitOfMeasureId,
          version: { increment: 1 },
        },
        where: { id: input.lineId, version: input.expectedVersion },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.bomLine.findUniqueOrThrow({
        include: { item: true, unitOfMeasure: true },
        where: { id: input.lineId },
      });
      await this.audit(transaction, {
        action: "BOM_LINE_CORRECTED",
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: {
          criticality: { from: current.criticality, to: updated.criticality },
          notesChanged: current.notes !== updated.notes,
          quantity: {
            from: current.quantity.toString(),
            to: updated.quantity.toString(),
          },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "BomLine",
        organizationId: input.auditOrganizationId,
      });
      return { ...updated, quantity: updated.quantity.toString() };
    });
  }

  private async transition(
    input: RevisionCommand,
    sourceStatuses: Array<"DRAFT" | "IN_REVIEW" | "RELEASED">,
    targetStatus: "IN_REVIEW" | "SUPERSEDED" | "CANCELLED",
    action: string,
  ) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      await transaction.$queryRaw`SELECT id FROM bom_revisions WHERE id = ${input.revisionId}::uuid FOR UPDATE`;
      const current = await transaction.bomRevision.findUnique({
        include: {
          _count: { select: { lines: true } },
          bom: { include: { project: true } },
        },
        where: { id: input.revisionId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (
        !sourceStatuses.includes(
          current.status as (typeof sourceStatuses)[number],
        ) ||
        !canTransitionBom(current.status, targetStatus)
      )
        throw new UnprocessableEntityException(
          "Invalid BOM revision transition",
        );
      if (targetStatus === "IN_REVIEW" && current._count.lines === 0)
        throw new UnprocessableEntityException(
          "An empty BOM revision cannot enter review",
        );
      if (["COMPLETED", "CANCELLED"].includes(current.bom.project.state))
        throw new UnprocessableEntityException(
          "Terminal projects cannot change BOM lifecycle",
        );
      const timestamps = {
        ...(targetStatus === "IN_REVIEW" ? { reviewedAt: new Date() } : {}),
        ...(targetStatus === "SUPERSEDED" ? { supersededAt: new Date() } : {}),
        ...(targetStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      };
      const changed = await transaction.bomRevision.updateMany({
        data: {
          ...timestamps,
          status: targetStatus,
          version: { increment: 1 },
        },
        where: {
          id: current.id,
          status: current.status,
          version: input.expectedVersion,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await transaction.bomRevisionTransition.create({
        data: {
          actorMembershipId: input.actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          bomRevisionId: current.id,
          reason: input.reason,
          sourceStatus: current.status,
          targetStatus,
        },
      });
      await transaction.bom.update({
        data: { version: { increment: 1 } },
        where: { id: current.bomId },
      });
      await this.audit(transaction, {
        action,
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: {
          reason: input.reason,
          status: { from: current.status, to: targetStatus },
        },
        context: input.context,
        entityId: current.id,
        entityType: "BomRevision",
        organizationId: input.auditOrganizationId,
      });
      return transaction.bomRevision
        .findUniqueOrThrow({
          include: revisionInclude,
          where: { id: current.id },
        })
        .then(presentRevision);
    });
  }

  review(input: RevisionCommand) {
    return this.transition(
      input,
      ["DRAFT"],
      "IN_REVIEW",
      "BOM_REVISION_REVIEWED",
    );
  }

  cancel(input: RevisionCommand) {
    return this.transition(
      input,
      ["DRAFT", "IN_REVIEW"],
      "CANCELLED",
      "BOM_REVISION_CANCELLED",
    );
  }

  supersede(input: RevisionCommand) {
    return this.transition(
      input,
      ["RELEASED"],
      "SUPERSEDED",
      "BOM_REVISION_SUPERSEDED",
    );
  }

  async release(input: RevisionCommand) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const current = await transaction.bomRevision.findUnique({
        include: {
          _count: { select: { lines: true } },
          bom: { include: { project: true } },
        },
        where: { id: input.revisionId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      await transaction.$queryRaw`SELECT id FROM boms WHERE id = ${current.bomId}::uuid FOR UPDATE`;
      await transaction.$queryRaw`SELECT id FROM bom_revisions WHERE "bomId" = ${current.bomId}::uuid FOR UPDATE`;
      await transaction.$queryRaw`SELECT id FROM projects WHERE id = ${current.bom.projectId}::uuid FOR UPDATE`;
      const locked = await transaction.bomRevision.findUniqueOrThrow({
        where: { id: current.id },
      });
      const project = await transaction.project.findUniqueOrThrow({
        where: { id: current.bom.projectId },
      });
      const unavailableLineCount = await transaction.bomLine.count({
        where: {
          bomRevisionId: locked.id,
          OR: [
            { item: { active: false } },
            { unitOfMeasure: { active: false } },
          ],
        },
      });
      if (locked.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (
        unavailableLineCount > 0 ||
        !canReleaseBom({
          lineCount: current._count.lines,
          projectState: project.state,
          status: locked.status,
        })
      )
        throw new UnprocessableEntityException(
          "Only a non-empty reviewed revision with active items and units can be released",
        );
      const previous = await transaction.bomRevision.findFirst({
        where: {
          bomId: current.bomId,
          id: { not: current.id },
          status: "RELEASED",
        },
      });
      if (previous) {
        await transaction.bomRevision.update({
          data: {
            status: "SUPERSEDED",
            supersededAt: new Date(),
            version: { increment: 1 },
          },
          where: { id: previous.id },
        });
        await transaction.bomRevisionTransition.create({
          data: {
            actorMembershipId: input.actorMembershipId ?? null,
            actorUserId: input.actorUserId as string,
            bomRevisionId: previous.id,
            reason: `Superseded by revision ${locked.revisionNumber}: ${input.reason}`,
            sourceStatus: "RELEASED",
            targetStatus: "SUPERSEDED",
          },
        });
        await this.audit(transaction, {
          action: "BOM_REVISION_SUPERSEDED",
          actorMembershipId: input.actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          changes: {
            replacementRevisionId: locked.id,
            status: { from: "RELEASED", to: "SUPERSEDED" },
          },
          context: input.context,
          entityId: previous.id,
          entityType: "BomRevision",
          organizationId: input.auditOrganizationId,
        });
      }
      const changed = await transaction.bomRevision.updateMany({
        data: {
          releasedAt: new Date(),
          status: "RELEASED",
          version: { increment: 1 },
        },
        where: {
          id: locked.id,
          status: "IN_REVIEW",
          version: input.expectedVersion,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await transaction.bomRevisionTransition.create({
        data: {
          actorMembershipId: input.actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          bomRevisionId: locked.id,
          reason: input.reason,
          sourceStatus: "IN_REVIEW",
          targetStatus: "RELEASED",
        },
      });
      await transaction.bom.update({
        data: { version: { increment: 1 } },
        where: { id: locked.bomId },
      });
      await this.audit(transaction, {
        action: "BOM_REVISION_RELEASED",
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: {
          lineCount: current._count.lines,
          previousReleasedRevisionId: previous?.id ?? null,
          status: { from: "IN_REVIEW", to: "RELEASED" },
        },
        context: input.context,
        entityId: locked.id,
        entityType: "BomRevision",
        organizationId: input.auditOrganizationId,
      });
      return transaction.bomRevision
        .findUniqueOrThrow({
          include: revisionInclude,
          where: { id: locked.id },
        })
        .then(presentRevision);
    });
  }

  async comparison(
    bomId: string,
    fromRevisionId: string,
    toRevisionId: string,
  ) {
    const revisions = await this.database.bomRevision.findMany({
      include: {
        lines: {
          include: {
            item: { select: { code: true, id: true, name: true } },
            unitOfMeasure: true,
          },
          orderBy: { lineNumber: "asc" },
        },
      },
      where: { bomId, id: { in: [fromRevisionId, toRevisionId] } },
    });
    if (revisions.length !== 2)
      throw new NotFoundException("Resource not found");
    const from = revisions.find((revision) => revision.id === fromRevisionId)!;
    const to = revisions.find((revision) => revision.id === toRevisionId)!;
    const keyed = (lines: typeof from.lines) => {
      const counts = new Map<string, number>();
      return new Map(
        lines.map((line) => {
          const occurrence = (counts.get(line.itemId) ?? 0) + 1;
          counts.set(line.itemId, occurrence);
          return [`${line.itemId}:${occurrence}`, line] as const;
        }),
      );
    };
    const fromLines = keyed(from.lines);
    const toLines = keyed(to.lines);
    const keys = new Set([...fromLines.keys(), ...toLines.keys()]);
    const changes = [...keys].map((key) => {
      const before = fromLines.get(key);
      const after = toLines.get(key);
      const kind = !before
        ? "ADDED"
        : !after
          ? "REMOVED"
          : before.quantity.toString() !== after.quantity.toString() ||
              before.unitOfMeasureId !== after.unitOfMeasureId ||
              before.criticality !== after.criticality ||
              before.notes !== after.notes
            ? "CHANGED"
            : "UNCHANGED";
      const line = after ?? before!;
      return {
        after: after
          ? {
              criticality: after.criticality,
              notes: after.notes,
              quantity: after.quantity.toString(),
              unitCode: after.unitOfMeasure.code,
            }
          : null,
        before: before
          ? {
              criticality: before.criticality,
              notes: before.notes,
              quantity: before.quantity.toString(),
              unitCode: before.unitOfMeasure.code,
            }
          : null,
        item: line.item,
        kind,
      };
    });
    return {
      changes,
      from: {
        id: from.id,
        revisionNumber: from.revisionNumber,
        status: from.status,
      },
      summary: {
        added: changes.filter(({ kind }) => kind === "ADDED").length,
        changed: changes.filter(({ kind }) => kind === "CHANGED").length,
        removed: changes.filter(({ kind }) => kind === "REMOVED").length,
        unchanged: changes.filter(({ kind }) => kind === "UNCHANGED").length,
      },
      to: { id: to.id, revisionNumber: to.revisionNumber, status: to.status },
    };
  }
}
