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
import type {
  AuthorizationContext,
  AuthorizationContextSet,
} from "../authorization/authorization-context.js";
import type { RequestContext } from "../identity/identity.types.js";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import { canTransitionNcr, type NcrStatus } from "./ncr-lifecycle.js";

type ActorInput = {
  actorUserId: string | null;
  actorMembershipId?: string | null;
  systemPrincipal?: string | null;
  auditOrganizationId: string;
  context: RequestContext;
};

const internalInclude = {
  cancelledBy: { select: { displayName: true, id: true } },
  closedBy: { select: { displayName: true, id: true } },
  createdBy: { select: { displayName: true, id: true } },
  inventoryLot: {
    select: {
      id: true,
      lotNumber: true,
      status: true,
      item: { select: { code: true, id: true, name: true } },
    },
  },
  issuedBy: { select: { displayName: true, id: true } },
  project: { select: { code: true, id: true, name: true } },
  receivingInspection: {
    select: { disposition: true, id: true, status: true },
  },
  supplierOrganization: { select: { code: true, id: true, name: true } },
  supplierResponses: {
    include: { submittedBy: { select: { displayName: true, id: true } } },
    orderBy: { revisionNumber: "asc" as const },
  },
  transitions: {
    include: { actor: { select: { displayName: true, id: true } } },
    orderBy: { occurredAt: "asc" as const },
  },
} satisfies Prisma.NcrInclude;

type InternalNcr = Prisma.NcrGetPayload<{ include: typeof internalInclude }>;

function presentInternal(value: InternalNcr) {
  return {
    ...value,
    number: `NCR-${String(value.ncrNumber).padStart(4, "0")}`,
  };
}

function presentSupplier(value: InternalNcr) {
  return {
    id: value.id,
    project: value.project,
    number: `NCR-${String(value.ncrNumber).padStart(4, "0")}`,
    title: value.title,
    description: value.description,
    status: value.status,
    sourceType: value.sourceType,
    receivingInspection:
      value.receivingInspection === null
        ? null
        : {
            disposition: value.receivingInspection.disposition,
            id: value.receivingInspection.id,
          },
    inventoryLot:
      value.inventoryLot === null
        ? null
        : {
            id: value.inventoryLot.id,
            item: value.inventoryLot.item,
            lotNumber: value.inventoryLot.lotNumber,
            status: value.inventoryLot.status,
          },
    sharedDispositionNotes: value.shareInternalNotes
      ? value.internalDispositionNotes
      : null,
    supplierResponses: value.supplierResponses.map((response) => ({
      correctiveAction: response.correctiveAction,
      createdAt: response.createdAt,
      id: response.id,
      message: response.message,
      revisionNumber: response.revisionNumber,
      rootCause: response.rootCause,
      submittedBy: response.submittedBy,
    })),
    createdAt: value.createdAt,
    issuedAt: value.issuedAt,
    closedAt: value.closedAt,
    version: value.version,
  };
}

@Injectable()
export class NcrsRepository {
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
    },
  ) {
    return (transaction.auditEvent.create as any)({
      data: {
        action: input.action,
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: "Ncr",
        organizationId: input.auditOrganizationId,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
        systemPrincipal: input.systemPrincipal ?? null,
      },
    });
  }

  projectIdForNcr(id: string) {
    return this.database.ncr
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  listInternal(projectId: string, status?: NcrStatus) {
    return this.database.ncr
      .findMany({
        include: internalInclude,
        orderBy: [{ updatedAt: "desc" }, { ncrNumber: "desc" }],
        where: { projectId, ...(status ? { status } : {}) },
      })
      .then((rows) => rows.map(presentInternal));
  }

  detailInternal(id: string) {
    return this.database.ncr
      .findUnique({ include: internalInclude, where: { id } })
      .then((value) => (value ? presentInternal(value) : null));
  }

  private supplierWhere(
    organizationIds: string[],
    membershipIds: string[],
    id?: string,
  ): Prisma.NcrWhereInput {
    return {
      ...(id ? { id } : {}),
      status: { in: ["ISSUED", "SUPPLIER_RESPONDED", "CLOSED"] },
      OR: organizationIds.map(function (orgId, idx) {
        return {
          supplierOrganizationId: orgId,
          project: {
            members: {
              some: { membershipId: membershipIds[idx], status: "ACTIVE" },
            },
          },
        };
      }),
    };
  }

  listSupplier(organizationIds: string[], membershipIds: string[]) {
    // deprecated: tuple-OR via FromSet
    return this.listSupplierFromSet({
      contexts: organizationIds.map(function (orgId, idx) {
        return {
          organizationId: orgId,
          actorMembershipId: membershipIds[idx],
          organizationType: "SUPPLIER",
          source: "MEMBERSHIP_QUALIFIED",
        } as unknown as AuthorizationContext;
      }),
    });
  }

  detailSupplier(
    id: string,
    organizationIds: string[],
    membershipIds: string[],
  ) {
    // deprecated: tuple-OR via FromSet
    return this.detailSupplierFromSet(id, {
      contexts: organizationIds.map(function (orgId, idx) {
        return {
          organizationId: orgId,
          actorMembershipId: membershipIds[idx],
          organizationType: "SUPPLIER",
          source: "MEMBERSHIP_QUALIFIED",
        } as unknown as AuthorizationContext;
      }),
    });
  }

  async create(
    input: ActorInput & {
      description: string;
      internalDispositionNotes?: string;
      inventoryLotId?: string;
      projectId: string;
      receivingInspectionId?: string;
      shareInternalNotes: boolean;
      sourceType: "INVENTORY_LOT" | "PROJECT" | "RECEIVING_INSPECTION";
      supplierOrganizationId?: string;
      title: string;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM projects WHERE id = ${input.projectId}::uuid FOR UPDATE`,
      );
      let supplierOrganizationId = input.supplierOrganizationId;
      if (input.sourceType === "PROJECT") {
        if (
          input.inventoryLotId ||
          input.receivingInspectionId ||
          !supplierOrganizationId
        )
          throw new UnprocessableEntityException("Invalid project NCR source");
      } else if (input.sourceType === "INVENTORY_LOT") {
        if (!input.inventoryLotId || input.receivingInspectionId)
          throw new UnprocessableEntityException(
            "Invalid inventory lot NCR source",
          );
        const lot = await transaction.inventoryLot.findFirst({
          select: {
            advanceShipmentNoticeLine: {
              select: {
                advanceShipmentNotice: {
                  select: { supplierOrganizationId: true },
                },
              },
            },
            projectId: true,
          },
          where: { id: input.inventoryLotId, projectId: input.projectId },
        });
        if (!lot) throw new UnprocessableEntityException("Invalid NCR source");
        supplierOrganizationId =
          lot.advanceShipmentNoticeLine.advanceShipmentNotice
            .supplierOrganizationId;
      } else {
        if (!input.receivingInspectionId || input.inventoryLotId)
          throw new UnprocessableEntityException(
            "Invalid inspection NCR source",
          );
        const inspection = await transaction.receivingInspection.findFirst({
          select: {
            disposition: true,
            inventoryLot: {
              select: {
                advanceShipmentNoticeLine: {
                  select: {
                    advanceShipmentNotice: {
                      select: { supplierOrganizationId: true },
                    },
                  },
                },
              },
            },
            status: true,
          },
          where: {
            id: input.receivingInspectionId,
            projectId: input.projectId,
          },
        });
        if (
          !inspection ||
          inspection.status !== "FINALIZED" ||
          inspection.disposition === "ACCEPTED"
        )
          throw new UnprocessableEntityException(
            "Inspection NCRs require a finalized non-accepted disposition",
          );
        supplierOrganizationId =
          inspection.inventoryLot.advanceShipmentNoticeLine
            .advanceShipmentNotice.supplierOrganizationId;
      }
      const supplier = await transaction.organization.findFirst({
        select: { id: true },
        where: {
          active: true,
          id: supplierOrganizationId,
          type: "SUPPLIER",
          memberships: {
            some: {
              projectMembers: {
                some: { projectId: input.projectId, status: "ACTIVE" },
              },
              status: "ACTIVE",
            },
          },
        },
      });
      if (!supplier)
        throw new UnprocessableEntityException(
          "NCR supplier must have active project scope",
        );
      const maximum = await transaction.ncr.aggregate({
        _max: { ncrNumber: true },
        where: { projectId: input.projectId },
      });
      const ncr = await transaction.ncr.create({
        data: {
          createdByUserId: input.actorUserId as string,
          description: input.description.trim(),
          internalDispositionNotes:
            input.internalDispositionNotes?.trim() ?? "",
          inventoryLotId: input.inventoryLotId ?? null,
          ncrNumber: (maximum._max.ncrNumber ?? 0) + 1,
          projectId: input.projectId,
          receivingInspectionId: input.receivingInspectionId ?? null,
          shareInternalNotes: input.shareInternalNotes,
          sourceType: input.sourceType,
          supplierOrganizationId: supplier.id,
          title: input.title.trim(),
        },
      });
      await this.audit(transaction, {
        ...input,
        action: "ncr.created",
        changes: {
          sourceType: input.sourceType,
          supplierOrganizationId: supplier.id,
        },
        entityId: ncr.id,
      });
      return this.detailInternalWith(transaction, ncr.id);
    });
  }

  private detailInternalWith(
    transaction: Prisma.TransactionClient,
    id: string,
  ) {
    return transaction.ncr
      .findUniqueOrThrow({ include: internalInclude, where: { id } })
      .then(presentInternal);
  }

  async transition(
    input: ActorInput & {
      expectedVersion: number;
      id: string;
      internalDispositionNotes?: string;
      reason: string;
      shareInternalNotes?: boolean;
      targetStatus: "CANCELLED" | "CLOSED" | "ISSUED";
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM ncrs WHERE id = ${input.id}::uuid FOR UPDATE`,
      );
      const ncr = await transaction.ncr.findUnique({ where: { id: input.id } });
      if (!ncr) throw new NotFoundException("Resource not found");
      if (ncr.version !== input.expectedVersion)
        throw new ConflictException("NCR version is stale");
      if (!canTransitionNcr(ncr.status, input.targetStatus))
        throw new ConflictException("Invalid NCR transition");
      const now = new Date();
      const update: Prisma.NcrUncheckedUpdateInput = {
        status: input.targetStatus,
        version: { increment: 1 },
      };
      if (input.targetStatus === "ISSUED") {
        update.issuedAt = now;
        update.issuedByUserId = input.actorUserId as string;
      } else if (input.targetStatus === "CLOSED") {
        update.closedAt = now;
        update.closedByUserId = input.actorUserId as string;
        update.internalDispositionNotes =
          input.internalDispositionNotes!.trim();
        update.shareInternalNotes = input.shareInternalNotes!;
      } else {
        update.cancelledAt = now;
        update.cancelledByUserId = input.actorUserId as string;
      }
      await transaction.ncr.update({
        data: update,
        where: { id: ncr.id },
      });
      await transaction.ncrTransition.create({
        data: {
          actorMembershipId: (input as any).actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          ncrId: ncr.id,
          reason: input.reason.trim(),
          sourceStatus: ncr.status,
          targetStatus: input.targetStatus,
        },
      });
      await this.audit(transaction, {
        ...input,
        action: `ncr.${input.targetStatus.toLowerCase()}`,
        changes: {
          from: ncr.status,
          shareInternalNotes:
            input.targetStatus === "CLOSED"
              ? input.shareInternalNotes
              : undefined,
          to: input.targetStatus,
        },
        entityId: ncr.id,
      });
      return this.detailInternalWith(transaction, ncr.id);
    });
  }

  async submitSupplierResponse(input: {
    actorUserId: string;
    actorMembershipId?: string | null;
    context: RequestContext;
    correctiveAction?: string;
    expectedVersion: number;
    id: string;
    membershipIds: string[];
    message: string;
    organizationIds: string[];
    rootCause?: string;
  }) {
    // deprecated: use submitSupplierResponseFromSet for tuple-OR
    return this.submitSupplierResponseFromSet({
      actorMembershipId: (input as any).actorMembershipId ?? null,
      actorUserId: input.actorUserId,
      context: input.context,
      correctiveAction: input.correctiveAction,
      expectedVersion: input.expectedVersion,
      id: input.id,
      message: input.message,
      rootCause: input.rootCause,
      set: {
        contexts: input.organizationIds.map(
          (orgId, idx) =>
            ({
              organizationId: orgId,
              actorMembershipId: input.membershipIds[idx],
            }) as any,
        ),
      },
    });
  }

  async submitSupplierResponseFromSet(input: {
    actorUserId: string;
    actorMembershipId?: string | null | undefined;
    systemPrincipal?: string | null | undefined;
    auditOrganizationId?: string | null | undefined;
    context: RequestContext;
    correctiveAction?: string | undefined;
    expectedVersion: number;
    id: string;
    message: string;
    rootCause?: string | undefined;
    set: import("../authorization/authorization-context.js").AuthorizationContextSet;
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM ncrs WHERE id = ${input.id}::uuid FOR UPDATE`,
      );
      const ncr = await transaction.ncr.findFirst({
        include: internalInclude,
        where: this.supplierWhereFromSet(input.set, input.id),
      });
      if (!ncr) throw new NotFoundException("Resource not found");
      if (ncr.version !== input.expectedVersion)
        throw new ConflictException("NCR version is stale");
      if (
        !(["ISSUED", "SUPPLIER_RESPONDED"] as NcrStatus[]).includes(ncr.status)
      )
        throw new ConflictException("NCR is not open for supplier response");
      const response = await transaction.ncrSupplierResponse.create({
        data: {
          correctiveAction: input.correctiveAction?.trim() ?? "",
          message: input.message.trim(),
          ncrId: ncr.id,
          revisionNumber: ncr.supplierResponses.length + 1,
          rootCause: input.rootCause?.trim() ?? "",
          submittedByUserId: input.actorUserId as string,
        },
      });
      const transition = ncr.status === "ISSUED";
      const update: Prisma.NcrUncheckedUpdateInput = {
        version: { increment: 1 },
      };
      if (transition) update.status = "SUPPLIER_RESPONDED";
      await transaction.ncr.update({
        data: update,
        where: { id: ncr.id },
      });
      if (transition)
        await transaction.ncrTransition.create({
          data: {
            actorMembershipId: (input as any).actorMembershipId ?? null,
            actorUserId: input.actorUserId as string,
            ncrId: ncr.id,
            reason: "Supplier response submitted",
            sourceStatus: "ISSUED",
            targetStatus: "SUPPLIER_RESPONDED",
          },
        });
      await this.audit(transaction, {
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        action: "ncr.supplier-response.submitted",
        auditOrganizationId: ncr.supplierOrganizationId,
        changes: {
          responseId: response.id,
          revisionNumber: response.revisionNumber,
        },
        context: input.context,
        entityId: ncr.id,
      });
      const result = await transaction.ncr.findUniqueOrThrow({
        include: internalInclude,
        where: { id: ncr.id },
      });
      return presentSupplier(result);
    });
  }

  private supplierWhereFromSet(
    set: AuthorizationContextSet,
    id?: string,
  ): Prisma.NcrWhereInput {
    const base: Prisma.NcrWhereInput = {
      ...(id ? { id } : {}),
      status: { in: ["ISSUED", "SUPPLIER_RESPONDED", "CLOSED"] },
    };
    if (set.contexts.length === 0)
      return { ...base, id: { in: [] } } as Prisma.NcrWhereInput;
    return {
      ...base,
      OR: set.contexts.map((c) => ({
        supplierOrganizationId: c.organizationId,
        project: {
          members: {
            some: {
              membershipId: c.actorMembershipId as string,
              status: "ACTIVE",
            },
          },
        },
      })),
    } as unknown as Prisma.NcrWhereInput;
  }

  private supplierWhereFromContext(
    context: AuthorizationContext,
    id?: string,
  ): Prisma.NcrWhereInput {
    return this.supplierWhereFromSet({ contexts: [context] }, id);
  }

  async listSupplierFromSet(set: AuthorizationContextSet) {
    return this.database.ncr
      .findMany({
        include: internalInclude,
        where: this.supplierWhereFromSet(set),
      })
      .then((rows) => rows.map(presentSupplier));
  }

  async detailSupplierFromSet(id: string, set: AuthorizationContextSet) {
    return this.database.ncr
      .findFirst({
        include: internalInclude,
        where: this.supplierWhereFromSet(set, id),
      })
      .then((value) => (value ? presentSupplier(value) : null));
  }
}
