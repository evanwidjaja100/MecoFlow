/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
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
import {
  canTransitionRequisition,
  type RequisitionStatus,
} from "./requisition-lifecycle.js";

type RequisitionCommand = {
  actorUserId: string | null;
  actorMembershipId?: string | null;
  systemPrincipal?: string | null;
  auditOrganizationId: string;
  context: RequestContext;
  expectedVersion: number;
  reason: string;
  requisitionId: string;
};

const detailInclude = {
  approver: { select: { displayName: true, id: true } },
  lines: {
    include: {
      bomLine: {
        include: {
          bomRevision: {
            include: {
              bom: { include: { workPackage: true } },
            },
          },
          item: true,
          unitOfMeasure: true,
        },
      },
      overrideAuthorizedBy: { select: { displayName: true, id: true } },
    },
    orderBy: { lineNumber: "asc" as const },
  },
  project: { select: { code: true, id: true, name: true, state: true } },
  requester: { select: { displayName: true, id: true } },
  transitions: {
    include: { actor: { select: { displayName: true, id: true } } },
    orderBy: { occurredAt: "asc" as const },
  },
} as const;

type Detail = Prisma.PurchaseRequisitionGetPayload<{
  include: typeof detailInclude;
}>;

function decimal(value: Prisma.Decimal | string): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

function maxZero(value: Prisma.Decimal): Prisma.Decimal {
  return value.isNegative() ? new Prisma.Decimal(0) : value;
}

@Injectable()
export class RequisitionsRepository {
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

  projectIdForRequisition(id: string) {
    return this.database.purchaseRequisition
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  private async coverage(
    transaction: Prisma.TransactionClient | PrismaClient,
    bomLineIds: string[],
  ): Promise<Map<string, Prisma.Decimal>> {
    if (bomLineIds.length === 0) return new Map();
    const lines = await transaction.purchaseRequisitionLine.findMany({
      select: { bomLineId: true, quantity: true },
      where: {
        bomLineId: { in: bomLineIds },
        purchaseRequisition: {
          status: { notIn: ["CANCELLED", "REJECTED"] },
        },
      },
    });
    const result = new Map<string, Prisma.Decimal>();
    for (const line of lines)
      result.set(
        line.bomLineId,
        (result.get(line.bomLineId) ?? new Prisma.Decimal(0)).add(
          line.quantity,
        ),
      );
    return result;
  }

  async requirements(projectId: string) {
    const lines = await this.database.bomLine.findMany({
      include: {
        bomRevision: {
          include: { bom: { include: { workPackage: true } } },
        },
        item: true,
        unitOfMeasure: true,
      },
      orderBy: [
        { bomRevision: { bom: { workPackageId: "asc" } } },
        { lineNumber: "asc" },
      ],
      where: {
        bomRevision: { bom: { projectId }, status: "RELEASED" },
      },
    });
    const covered = await this.coverage(
      this.database,
      lines.map(({ id }) => id),
    );
    return lines.map((line) => {
      const coveredQuantity = covered.get(line.id) ?? new Prisma.Decimal(0);
      return {
        bomLineId: line.id,
        bomRevision: {
          id: line.bomRevision.id,
          revisionNumber: line.bomRevision.revisionNumber,
          title: line.bomRevision.title,
        },
        coveredQuantity: coveredQuantity.toString(),
        item: { code: line.item.code, id: line.item.id, name: line.item.name },
        lineNumber: line.lineNumber,
        outstandingQuantity: maxZero(
          line.quantity.sub(coveredQuantity),
        ).toString(),
        requiredQuantity: line.quantity.toString(),
        unitOfMeasure: {
          code: line.unitOfMeasure.code,
          id: line.unitOfMeasure.id,
          name: line.unitOfMeasure.name,
          symbol: line.unitOfMeasure.symbol,
        },
        workPackage: line.bomRevision.bom.workPackage
          ? {
              code: line.bomRevision.bom.workPackage.code,
              id: line.bomRevision.bom.workPackage.id,
              name: line.bomRevision.bom.workPackage.name,
            }
          : null,
      };
    });
  }

  list(projectId: string, status?: RequisitionStatus) {
    return this.database.purchaseRequisition.findMany({
      include: {
        approver: { select: { displayName: true, id: true } },
        requester: { select: { displayName: true, id: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { requisitionNumber: "desc" },
      where: { projectId, ...(status ? { status } : {}) },
    });
  }

  private async present(
    detail: Detail,
    transaction: Prisma.TransactionClient | PrismaClient = this.database,
  ) {
    const covered = await this.coverage(
      transaction,
      detail.lines.map(({ bomLineId }) => bomLineId),
    );
    return {
      ...detail,
      lines: detail.lines.map((line) => ({
        ...line,
        coveredQuantity: (
          covered.get(line.bomLineId) ?? new Prisma.Decimal(0)
        ).toString(),
        outstandingQuantity: maxZero(
          line.bomLine.quantity.sub(
            covered.get(line.bomLineId) ?? new Prisma.Decimal(0),
          ),
        ).toString(),
        coveredQuantitySnapshot: line.coveredQuantitySnapshot.toString(),
        outstandingQuantitySnapshot:
          line.outstandingQuantitySnapshot.toString(),
        quantity: line.quantity.toString(),
        requiredQuantitySnapshot: line.requiredQuantitySnapshot.toString(),
        bomLine: {
          ...line.bomLine,
          quantity: line.bomLine.quantity.toString(),
        },
      })),
    };
  }

  async detail(id: string) {
    const detail = await this.database.purchaseRequisition.findUnique({
      include: detailInclude,
      where: { id },
    });
    return detail ? this.present(detail) : null;
  }

  async create(input: {
    actorUserId: string | null;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId: string;
    canOverride: boolean;
    context: RequestContext;
    lines: Array<{
      bomLineId: string;
      overrideReason?: string;
      quantity: string;
    }>;
    notes: string;
    projectId: string;
    title: string;
  }) {
    const ids = input.lines.map(({ bomLineId }) => bomLineId);
    if (new Set(ids).size !== ids.length)
      throw new UnprocessableEntityException(
        "A BOM line can appear only once per requisition",
      );
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
      const project = await transaction.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException(
          "Terminal projects cannot create requisitions",
        );
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM bom_lines WHERE id IN (${Prisma.join(
          ids.map((id) => Prisma.sql`${id}::uuid`),
        )}) ORDER BY id FOR UPDATE`,
      );
      const bomLines = await transaction.bomLine.findMany({
        include: {
          bomRevision: { include: { bom: true } },
          unitOfMeasure: true,
        },
        where: { id: { in: ids } },
      });
      if (
        bomLines.length !== ids.length ||
        bomLines.some(
          (line) =>
            line.bomRevision.status !== "RELEASED" ||
            line.bomRevision.bom.projectId !== input.projectId,
        )
      )
        throw new UnprocessableEntityException(
          "Every requisition line must reference a released BOM requirement in this project",
        );
      const byId = new Map(bomLines.map((line) => [line.id, line]));
      const covered = await this.coverage(transaction, ids);
      const prepared = input.lines.map((line, index) => {
        const requirement = byId.get(line.bomLineId)!;
        const quantity = decimal(line.quantity);
        const decimalPlaces = line.quantity.split(".")[1]?.length ?? 0;
        if (
          !quantity.isPositive() ||
          decimalPlaces > requirement.unitOfMeasure.decimalPrecision
        )
          throw new UnprocessableEntityException("Invalid quantity for unit");
        const coveredQuantity =
          covered.get(line.bomLineId) ?? new Prisma.Decimal(0);
        const outstanding = maxZero(requirement.quantity.sub(coveredQuantity));
        const overNeed = coveredQuantity
          .add(quantity)
          .greaterThan(requirement.quantity);
        const overrideReason = line.overrideReason?.trim();
        if (overNeed && !input.canOverride)
          throw new UnprocessableEntityException(
            "Requisition quantity exceeds outstanding need",
          );
        if (overNeed && (!overrideReason || overrideReason.length < 5))
          throw new UnprocessableEntityException(
            "An authorized over-need override requires a reason",
          );
        return {
          bomLineId: line.bomLineId,
          coveredQuantitySnapshot: coveredQuantity,
          lineNumber: index + 1,
          outstandingQuantitySnapshot: outstanding,
          overNeedOverride: overNeed,
          overrideAuthorizedByUserId: overNeed
            ? (input.actorUserId)
            : null,
          overrideReason: overNeed ? overrideReason! : null,
          quantity,
          requiredQuantitySnapshot: requirement.quantity,
        };
      });
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM purchase_requisitions WHERE "projectId" = ${input.projectId}::uuid FOR UPDATE`,
      );
      const latest = await transaction.purchaseRequisition.findFirst({
        orderBy: { requisitionNumber: "desc" },
        select: { requisitionNumber: true },
        where: { projectId: input.projectId },
      });
      const requisition = await transaction.purchaseRequisition.create({
        data: {
          lines: { create: prepared },
          notes: input.notes,
          projectId: input.projectId,
          requesterUserId: input.actorUserId as string,
          requisitionNumber: (latest?.requisitionNumber ?? 0) + 1,
          title: input.title,
        },
      });
      await this.audit(transaction, {
        action: "PURCHASE_REQUISITION_CREATED",
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          lineCount: prepared.length,
          requisitionNumber: requisition.requisitionNumber,
          releasedBomLineIds: ids,
        },
        context: input.context,
        entityId: requisition.id,
        entityType: "PurchaseRequisition",
        organizationId: input.auditOrganizationId,
      });
      const overrides = prepared.filter(
        ({ overNeedOverride }) => overNeedOverride,
      );
      if (overrides.length > 0)
        await this.audit(transaction, {
          action: "PURCHASE_REQUISITION_OVER_NEED_OVERRIDE_USED",
          actorMembershipId: input.actorMembershipId ?? null,
          actorUserId: input.actorUserId,
          changes: {
            lines: overrides.map((line) => ({
              bomLineId: line.bomLineId,
              coveredQuantity: line.coveredQuantitySnapshot.toString(),
              quantity: line.quantity.toString(),
              reason: line.overrideReason,
              requiredQuantity: line.requiredQuantitySnapshot.toString(),
            })),
          },
          context: input.context,
          entityId: requisition.id,
          entityType: "PurchaseRequisition",
          organizationId: input.auditOrganizationId,
        });
      const detail = await transaction.purchaseRequisition.findUniqueOrThrow({
        include: detailInclude,
        where: { id: requisition.id },
      });
      return this.present(detail, transaction);
    });
  }

  private async transition(
    input: RequisitionCommand,
    targetStatus: RequisitionStatus,
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
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM purchase_requisitions WHERE id = ${input.requisitionId}::uuid FOR UPDATE`,
      );
      const current = await transaction.purchaseRequisition.findUnique({
        include: { project: true },
        where: { id: input.requisitionId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (!canTransitionRequisition(current.status, targetStatus))
        throw new UnprocessableEntityException(
          "Invalid purchase requisition transition",
        );
      if (targetStatus === "CANCELLED" && current.status === "APPROVED") {
        const activeAllocations =
          await transaction.purchaseOrderAllocation.count({
            where: {
              purchaseRequisitionLine: {
                purchaseRequisitionId: current.id,
              },
              purchaseOrderLine: {
                purchaseOrderRevision: {
                  current: true,
                  purchaseOrder: { status: { not: "CANCELLED" } },
                },
              },
            },
          });
        if (activeAllocations > 0)
          throw new UnprocessableEntityException(
            "An approved requisition allocated to an active purchase order cannot be cancelled",
          );
      }
      if (["COMPLETED", "CANCELLED"].includes(current.project.state))
        throw new UnprocessableEntityException(
          "Terminal projects cannot change requisition lifecycle",
        );
      const changed = await transaction.purchaseRequisition.updateMany({
        data: {
          ...(targetStatus === "SUBMITTED" ? { submittedAt: new Date() } : {}),
          ...(targetStatus === "APPROVED"
            ? {
                approvedAt: new Date(),
                approverUserId: input.actorUserId as string,
              }
            : {}),
          ...(targetStatus === "REJECTED" ? { rejectedAt: new Date() } : {}),
          ...(targetStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
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
      await transaction.purchaseRequisitionTransition.create({
        data: {
          actorMembershipId: input.actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          purchaseRequisitionId: current.id,
          reason: input.reason,
          sourceStatus: current.status,
          targetStatus,
        },
      });
      await this.audit(transaction, {
        action,
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          reason: input.reason,
          status: { from: current.status, to: targetStatus },
        },
        context: input.context,
        entityId: current.id,
        entityType: "PurchaseRequisition",
        organizationId: input.auditOrganizationId,
      });
      const detail = await transaction.purchaseRequisition.findUniqueOrThrow({
        include: detailInclude,
        where: { id: current.id },
      });
      return this.present(detail, transaction);
    });
  }

  submit(input: RequisitionCommand) {
    return this.transition(
      input,
      "SUBMITTED",
      "PURCHASE_REQUISITION_SUBMITTED",
    );
  }

  approve(input: RequisitionCommand) {
    return this.transition(input, "APPROVED", "PURCHASE_REQUISITION_APPROVED");
  }

  reject(input: RequisitionCommand) {
    return this.transition(input, "REJECTED", "PURCHASE_REQUISITION_REJECTED");
  }

  cancel(input: RequisitionCommand) {
    return this.transition(
      input,
      "CANCELLED",
      "PURCHASE_REQUISITION_CANCELLED",
    );
  }
}
