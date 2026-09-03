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
import {
  canRevisePurchaseOrder,
  canTransitionPurchaseOrder,
  type PurchaseOrderStatus,
} from "./purchase-order-lifecycle.js";

type RevisionInput = {
  internalCommercialTerms?: string;
  internalNotes?: string;
  lines: Array<{
    allocations: Array<{
      overrideReason?: string;
      purchaseRequisitionLineId: string;
      quantity: string;
    }>;
    internalLineNotes?: string;
    internalUnitPrice?: string;
    orderedQuantity: string;
  }>;
  revisionReason: string;
  supplierMessage?: string;
  title: string;
};

type ActorInput = {
  actorUserId: string | null;
  actorMembershipId?: string | null;
  systemPrincipal?: string | null;
  auditOrganizationId: string;
  context: RequestContext;
};

const detailInclude = {
  createdBy: { select: { displayName: true, id: true } },
  project: { select: { code: true, id: true, name: true, state: true } },
  revisions: {
    include: {
      commitments: {
        include: {
          lines: { orderBy: { createdAt: "asc" as const } },
          submittedBy: { select: { displayName: true, id: true } },
        },
        orderBy: { revisionNumber: "asc" as const },
      },
      createdBy: { select: { displayName: true, id: true } },
      lines: {
        include: {
          allocations: {
            include: {
              overrideAuthorizedBy: {
                select: { displayName: true, id: true },
              },
              purchaseRequisitionLine: {
                include: {
                  purchaseRequisition: {
                    select: {
                      id: true,
                      requisitionNumber: true,
                      status: true,
                      title: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "asc" as const },
          },
          item: { select: { code: true, id: true, name: true } },
          unitOfMeasure: {
            select: {
              code: true,
              decimalPrecision: true,
              id: true,
              name: true,
              symbol: true,
            },
          },
        },
        orderBy: { lineNumber: "asc" as const },
      },
    },
    orderBy: { revisionNumber: "asc" as const },
  },
  supplierOrganization: { select: { code: true, id: true, name: true } },
  transitions: {
    include: { actor: { select: { displayName: true, id: true } } },
    orderBy: { occurredAt: "asc" as const },
  },
} as const;

type Detail = Prisma.PurchaseOrderGetPayload<{ include: typeof detailInclude }>;

function decimal(value: Prisma.Decimal | string): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

function maxZero(value: Prisma.Decimal): Prisma.Decimal {
  return value.isNegative() ? new Prisma.Decimal(0) : value;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PurchaseOrdersRepository {
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
    return (transaction.auditEvent.create as any)({
      data: {
        action: input.action,
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: input.entityType,
        organizationId: input.auditOrganizationId,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
        systemPrincipal: input.systemPrincipal ?? null,
      },
    });
  }

  projectIdForPurchaseOrder(id: string) {
    return this.database.purchaseOrder
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  private async orderedCoverage(
    transaction: Prisma.TransactionClient | PrismaClient,
    requisitionLineIds: string[],
    excludePurchaseOrderId?: string,
  ) {
    if (requisitionLineIds.length === 0)
      return new Map<string, Prisma.Decimal>();
    const allocations = await transaction.purchaseOrderAllocation.findMany({
      select: { purchaseRequisitionLineId: true, quantity: true },
      where: {
        purchaseRequisitionLineId: { in: requisitionLineIds },
        purchaseOrderLine: {
          purchaseOrderRevision: {
            current: true,
            purchaseOrder: {
              ...(excludePurchaseOrderId
                ? { id: { not: excludePurchaseOrderId } }
                : {}),
              status: { not: "CANCELLED" },
            },
          },
        },
      },
    });
    const result = new Map<string, Prisma.Decimal>();
    for (const allocation of allocations)
      result.set(
        allocation.purchaseRequisitionLineId,
        (
          result.get(allocation.purchaseRequisitionLineId) ??
          new Prisma.Decimal(0)
        ).add(allocation.quantity),
      );
    return result;
  }

  async approvedRequirements(projectId: string) {
    const lines = await this.database.purchaseRequisitionLine.findMany({
      include: {
        bomLine: {
          include: {
            bomRevision: {
              include: {
                bom: { include: { project: true, workPackage: true } },
              },
            },
            item: true,
            unitOfMeasure: true,
          },
        },
        purchaseRequisition: true,
      },
      orderBy: [
        { purchaseRequisition: { requisitionNumber: "asc" } },
        { lineNumber: "asc" },
      ],
      where: { purchaseRequisition: { projectId, status: "APPROVED" } },
    });
    const ordered = await this.orderedCoverage(
      this.database,
      lines.map(({ id }) => id),
    );
    return lines.map((line) => {
      const orderedQuantity = ordered.get(line.id) ?? new Prisma.Decimal(0);
      const requiredDate =
        line.bomLine.bomRevision.bom.workPackage?.plannedStartDate ??
        line.bomLine.bomRevision.bom.project.plannedStartDate;
      return {
        approvedQuantity: line.quantity.toString(),
        availableQuantity: maxZero(
          line.quantity.sub(orderedQuantity),
        ).toString(),
        item: {
          code: line.bomLine.item.code,
          id: line.bomLine.item.id,
          name: line.bomLine.item.name,
        },
        orderedQuantity: orderedQuantity.toString(),
        purchaseRequisition: {
          id: line.purchaseRequisition.id,
          requisitionNumber: line.purchaseRequisition.requisitionNumber,
          title: line.purchaseRequisition.title,
        },
        purchaseRequisitionLineId: line.id,
        requiredDate: dateOnly(requiredDate),
        unitOfMeasure: {
          code: line.bomLine.unitOfMeasure.code,
          decimalPrecision: line.bomLine.unitOfMeasure.decimalPrecision,
          id: line.bomLine.unitOfMeasure.id,
          name: line.bomLine.unitOfMeasure.name,
          symbol: line.bomLine.unitOfMeasure.symbol,
        },
      };
    });
  }

  list(projectId: string, status?: PurchaseOrderStatus) {
    return this.database.purchaseOrder.findMany({
      include: {
        revisions: {
          select: { revisionNumber: true, title: true },
          where: { current: true },
        },
        supplierOrganization: { select: { code: true, id: true, name: true } },
        _count: { select: { revisions: true } },
      },
      orderBy: { purchaseOrderNumber: "desc" },
      where: { projectId, ...(status ? { status } : {}) },
    });
  }

  private lineCommitmentSummary(
    revision: Detail["revisions"][number],
    lineId: string,
  ) {
    const history = revision.commitments.flatMap((commitment) =>
      commitment.lines
        .filter((line) => line.purchaseOrderLineId === lineId)
        .map((line) => ({
          committedDate: dateOnly(line.committedDate),
          commitmentRevisionNumber: commitment.revisionNumber,
          recordedAt: line.createdAt,
        })),
    );
    return {
      originalCommitmentDate: history[0]?.committedDate ?? null,
      latestCommitmentDate: history.at(-1)?.committedDate ?? null,
    };
  }

  private presentInternal(detail: Detail) {
    const revisions = detail.revisions.map((revision) => ({
      ...revision,
      commitments: revision.commitments.map((commitment) => ({
        ...commitment,
        lines: commitment.lines.map((line) => ({
          ...line,
          committedDate: dateOnly(line.committedDate),
        })),
      })),
      lines: revision.lines.map((line) => {
        const commitment = this.lineCommitmentSummary(revision, line.id);
        const requiredDate = line.allocations
          .map(({ requiredDateSnapshot }) => requiredDateSnapshot)
          .sort((a, b) => a.getTime() - b.getTime())[0]!;
        return {
          ...line,
          ...commitment,
          internalUnitPrice: line.internalUnitPrice?.toString() ?? null,
          isLate:
            commitment.latestCommitmentDate !== null &&
            commitment.latestCommitmentDate > dateOnly(requiredDate),
          orderedQuantity: line.orderedQuantity.toString(),
          requiredDate: dateOnly(requiredDate),
          allocations: line.allocations.map((allocation) => ({
            ...allocation,
            alreadyOrderedQuantitySnapshot:
              allocation.alreadyOrderedQuantitySnapshot.toString(),
            approvedQuantitySnapshot:
              allocation.approvedQuantitySnapshot.toString(),
            availableQuantitySnapshot:
              allocation.availableQuantitySnapshot.toString(),
            quantity: allocation.quantity.toString(),
            requiredDateSnapshot: dateOnly(allocation.requiredDateSnapshot),
            purchaseRequisitionLine: {
              ...allocation.purchaseRequisitionLine,
              quantity: allocation.purchaseRequisitionLine.quantity.toString(),
            },
          })),
        };
      }),
    }));
    return {
      ...detail,
      currentRevision: revisions.find(({ current }) => current) ?? null,
      revisions,
    };
  }

  private presentSupplier(detail: Detail) {
    const revision = detail.revisions.find(({ current }) => current);
    if (!revision || !revision.sentAt)
      throw new NotFoundException("Resource not found");
    return {
      acknowledgedAt: detail.acknowledgedAt,
      id: detail.id,
      project: detail.project,
      purchaseOrderNumber: detail.purchaseOrderNumber,
      sentAt: detail.sentAt,
      status: detail.status,
      supplierOrganization: detail.supplierOrganization,
      version: detail.version,
      revision: {
        createdAt: revision.createdAt,
        id: revision.id,
        lines: revision.lines.map((line) => {
          const commitment = this.lineCommitmentSummary(revision, line.id);
          const requiredDate = line.allocations
            .map(({ requiredDateSnapshot }) => requiredDateSnapshot)
            .sort((a, b) => a.getTime() - b.getTime())[0]!;
          return {
            ...commitment,
            id: line.id,
            item: line.item,
            lineNumber: line.lineNumber,
            orderedQuantity: line.orderedQuantity.toString(),
            requiredDate: dateOnly(requiredDate),
            unitOfMeasure: line.unitOfMeasure,
          };
        }),
        revisionNumber: revision.revisionNumber,
        sentAt: revision.sentAt,
        supplierMessage: revision.supplierMessage,
        title: revision.title,
        commitments: revision.commitments.map((commitment) => ({
          createdAt: commitment.createdAt,
          id: commitment.id,
          lines: commitment.lines.map((line) => ({
            committedDate: dateOnly(line.committedDate),
            purchaseOrderLineId: line.purchaseOrderLineId,
          })),
          note: commitment.note,
          revisionNumber: commitment.revisionNumber,
        })),
      },
    };
  }

  async detail(id: string) {
    const detail = await this.database.purchaseOrder.findUnique({
      include: detailInclude,
      where: { id },
    });
    return detail ? this.presentInternal(detail) : null;
  }

  private async detailInTransaction(
    transaction: Prisma.TransactionClient,
    id: string,
  ) {
    const detail = await transaction.purchaseOrder.findUniqueOrThrow({
      include: detailInclude,
      where: { id },
    });
    return this.presentInternal(detail);
  }

  async supplierCanAccess(
    id: string,
    organizationIds: string[],
    membershipIds: string[],
  ) {
    // deprecated: tuple-OR via FromSet
    return this.supplierCanAccessFromSet(id, {
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

  async supplierList(organizationIds: string[], membershipIds: string[]) {
    // deprecated: tuple-OR via FromSet
    return this.supplierListFromSet({
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

  async supplierDetail(id: string) {
    const detail = await this.database.purchaseOrder.findUnique({
      include: detailInclude,
      where: { id },
    });
    return detail ? this.presentSupplier(detail) : null;
  }

  private async prepareRevision(
    transaction: Prisma.TransactionClient,
    input: RevisionInput,
    projectId: string,
    actorUserId: string,
    canOverride: boolean,
    excludePurchaseOrderId?: string,
  ) {
    const allocationInputs = input.lines.flatMap(
      ({ allocations }) => allocations,
    );
    const ids = allocationInputs.map(
      ({ purchaseRequisitionLineId }) => purchaseRequisitionLineId,
    );
    if (new Set(ids).size !== ids.length)
      throw new UnprocessableEntityException(
        "A requisition line can be allocated only once per purchase order revision",
      );
    await transaction.$queryRaw(
      Prisma.sql`SELECT id FROM purchase_requisition_lines WHERE id IN (${Prisma.join(
        ids.map((id) => Prisma.sql`${id}::uuid`),
      )}) ORDER BY id FOR UPDATE`,
    );
    const requirements = await transaction.purchaseRequisitionLine.findMany({
      include: {
        bomLine: {
          include: {
            bomRevision: {
              include: {
                bom: { include: { project: true, workPackage: true } },
              },
            },
            unitOfMeasure: true,
          },
        },
        purchaseRequisition: true,
      },
      where: { id: { in: ids } },
    });
    if (
      requirements.length !== ids.length ||
      requirements.some(
        ({ purchaseRequisition }) =>
          purchaseRequisition.projectId !== projectId ||
          purchaseRequisition.status !== "APPROVED",
      )
    )
      throw new UnprocessableEntityException(
        "Every allocation must reference an approved requisition line in this project",
      );
    const requirementById = new Map(
      requirements.map((line) => [line.id, line]),
    );
    const ordered = await this.orderedCoverage(
      transaction,
      ids,
      excludePurchaseOrderId,
    );
    const overrides: Array<{
      approvedQuantity: string;
      alreadyOrderedQuantity: string;
      purchaseRequisitionLineId: string;
      quantity: string;
      reason: string;
    }> = [];
    const lines = input.lines.map((line, lineIndex) => {
      const resolved = line.allocations.map((allocation) => {
        const requirement = requirementById.get(
          allocation.purchaseRequisitionLineId,
        )!;
        const quantity = decimal(allocation.quantity);
        const places = allocation.quantity.split(".")[1]?.length ?? 0;
        if (
          !quantity.isPositive() ||
          places > requirement.bomLine.unitOfMeasure.decimalPrecision
        )
          throw new UnprocessableEntityException(
            "Invalid allocation quantity for unit",
          );
        const alreadyOrdered =
          ordered.get(requirement.id) ?? new Prisma.Decimal(0);
        const available = maxZero(requirement.quantity.sub(alreadyOrdered));
        const overOrder = quantity.greaterThan(available);
        const reason = allocation.overrideReason?.trim();
        if (overOrder && !canOverride)
          throw new UnprocessableEntityException(
            "Purchase order allocation exceeds approved available quantity",
          );
        if (overOrder && (!reason || reason.length < 5))
          throw new UnprocessableEntityException(
            "An authorized over-order override requires a reason",
          );
        if (overOrder)
          overrides.push({
            approvedQuantity: requirement.quantity.toString(),
            alreadyOrderedQuantity: alreadyOrdered.toString(),
            purchaseRequisitionLineId: requirement.id,
            quantity: quantity.toString(),
            reason: reason!,
          });
        return {
          data: {
            alreadyOrderedQuantitySnapshot: alreadyOrdered,
            approvedQuantitySnapshot: requirement.quantity,
            availableQuantitySnapshot: available,
            overOrderOverride: overOrder,
            overrideAuthorizedByUserId: overOrder ? actorUserId : null,
            overrideReason: overOrder ? reason! : null,
            purchaseRequisitionLineId: requirement.id,
            quantity,
            requiredDateSnapshot:
              requirement.bomLine.bomRevision.bom.workPackage
                ?.plannedStartDate ??
              requirement.bomLine.bomRevision.bom.project.plannedStartDate,
          },
          itemId: requirement.bomLine.itemId,
          unitOfMeasureId: requirement.bomLine.unitOfMeasureId,
        };
      });
      const itemIds = new Set(resolved.map(({ itemId }) => itemId));
      const unitIds = new Set(
        resolved.map(({ unitOfMeasureId }) => unitOfMeasureId),
      );
      if (itemIds.size !== 1 || unitIds.size !== 1)
        throw new UnprocessableEntityException(
          "One purchase order line can allocate only one item and unit",
        );
      const orderedQuantity = decimal(line.orderedQuantity);
      const precision = requirements.find(
        ({ id }) => id === line.allocations[0]!.purchaseRequisitionLineId,
      )!.bomLine.unitOfMeasure.decimalPrecision;
      if (
        !orderedQuantity.isPositive() ||
        (line.orderedQuantity.split(".")[1]?.length ?? 0) > precision ||
        !resolved
          .reduce(
            (sum, allocation) => sum.add(allocation.data.quantity),
            new Prisma.Decimal(0),
          )
          .equals(orderedQuantity)
      )
        throw new UnprocessableEntityException(
          "Ordered quantity must equal the line allocation total and match unit precision",
        );
      let internalUnitPrice: Prisma.Decimal | null = null;
      if (line.internalUnitPrice !== undefined) {
        internalUnitPrice = decimal(line.internalUnitPrice);
        if (internalUnitPrice.isNegative())
          throw new UnprocessableEntityException("Invalid internal unit price");
      }
      return {
        allocations: resolved.map(({ data }) => data),
        internalLineNotes: line.internalLineNotes?.trim() ?? "",
        internalUnitPrice,
        itemId: resolved[0]!.itemId,
        lineNumber: lineIndex + 1,
        orderedQuantity,
        unitOfMeasureId: resolved[0]!.unitOfMeasureId,
      };
    });
    return { lines, overrides };
  }

  private async createRevisionRows(
    transaction: Prisma.TransactionClient,
    purchaseOrderId: string,
    revisionNumber: number,
    actorUserId: string,
    input: RevisionInput,
    prepared: Awaited<ReturnType<PurchaseOrdersRepository["prepareRevision"]>>,
  ) {
    const revision = await transaction.purchaseOrderRevision.create({
      data: {
        createdByUserId: actorUserId,
        internalCommercialTerms: input.internalCommercialTerms?.trim() ?? "",
        internalNotes: input.internalNotes?.trim() ?? "",
        purchaseOrderId,
        revisionNumber,
        revisionReason: input.revisionReason.trim(),
        supplierMessage: input.supplierMessage?.trim() ?? "",
        title: input.title.trim(),
      },
    });
    for (const line of prepared.lines) {
      const created = await transaction.purchaseOrderLine.create({
        data: {
          internalLineNotes: line.internalLineNotes,
          internalUnitPrice: line.internalUnitPrice,
          itemId: line.itemId,
          lineNumber: line.lineNumber,
          orderedQuantity: line.orderedQuantity,
          purchaseOrderRevisionId: revision.id,
          unitOfMeasureId: line.unitOfMeasureId,
        },
      });
      await transaction.purchaseOrderAllocation.createMany({
        data: line.allocations.map((allocation) => ({
          ...allocation,
          purchaseOrderLineId: created.id,
        })),
      });
    }
    return revision;
  }

  async create(
    input: ActorInput &
      RevisionInput & {
        canOverride: boolean;
        projectId: string;
        supplierOrganizationId: string;
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
      const project = await transaction.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException(
          "Terminal projects cannot create purchase orders",
        );
      const supplier = await transaction.organization.findFirst({
        where: {
          active: true,
          id: input.supplierOrganizationId,
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
          "Supplier must be active and assigned to the project",
        );
      const prepared = await this.prepareRevision(
        transaction,
        input,
        input.projectId,
        input.actorUserId as string,
        input.canOverride,
      );
      const latest = await transaction.purchaseOrder.findFirst({
        orderBy: { purchaseOrderNumber: "desc" },
        select: { purchaseOrderNumber: true },
        where: { projectId: input.projectId },
      });
      const purchaseOrder = await transaction.purchaseOrder.create({
        data: {
          createdByUserId: input.actorUserId as string,
          projectId: input.projectId,
          purchaseOrderNumber: (latest?.purchaseOrderNumber ?? 0) + 1,
          supplierOrganizationId: input.supplierOrganizationId,
        },
      });
      await this.createRevisionRows(
        transaction,
        purchaseOrder.id,
        1,
        input.actorUserId as string,
        input,
        prepared,
      );
      await this.audit(transaction, {
        ...input,
        action: "PURCHASE_ORDER_CREATED",
        changes: {
          lineCount: prepared.lines.length,
          purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
          revisionNumber: 1,
          supplierOrganizationId: input.supplierOrganizationId,
        },
        entityId: purchaseOrder.id,
        entityType: "PurchaseOrder",
      });
      if (prepared.overrides.length > 0)
        await this.audit(transaction, {
          ...input,
          action: "PURCHASE_ORDER_OVER_ORDER_OVERRIDE_USED",
          changes: { allocations: prepared.overrides },
          entityId: purchaseOrder.id,
          entityType: "PurchaseOrder",
        });
      return this.detailInTransaction(transaction, purchaseOrder.id);
    });
  }

  async revise(
    input: ActorInput &
      RevisionInput & {
        canOverride: boolean;
        expectedVersion: number;
        purchaseOrderId: string;
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
        Prisma.sql`SELECT id FROM purchase_orders WHERE id = ${input.purchaseOrderId}::uuid FOR UPDATE`,
      );
      const current = await transaction.purchaseOrder.findUnique({
        include: { project: true },
        where: { id: input.purchaseOrderId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (!canRevisePurchaseOrder(current.status))
        throw new UnprocessableEntityException(
          "Cancelled purchase orders cannot be revised",
        );
      if (["COMPLETED", "CANCELLED"].includes(current.project.state))
        throw new UnprocessableEntityException(
          "Terminal projects cannot revise purchase orders",
        );
      const prepared = await this.prepareRevision(
        transaction,
        input,
        current.projectId,
        input.actorUserId as string,
        input.canOverride,
        current.id,
      );
      await transaction.purchaseOrderRevision.updateMany({
        data: { current: false },
        where: { current: true, purchaseOrderId: current.id },
      });
      const revisionNumber = current.currentRevisionNumber + 1;
      await this.createRevisionRows(
        transaction,
        current.id,
        revisionNumber,
        input.actorUserId as string,
        input,
        prepared,
      );
      const changed = await transaction.purchaseOrder.updateMany({
        data: {
          acknowledgedAt: null,
          currentRevisionNumber: revisionNumber,
          sentAt: null,
          status: "DRAFT",
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
      if (current.status !== "DRAFT")
        await transaction.purchaseOrderTransition.create({
          data: {
            actorMembershipId: input.actorMembershipId ?? null,
            actorUserId: input.actorUserId as string,
            purchaseOrderId: current.id,
            reason: input.revisionReason.trim(),
            sourceStatus: current.status,
            targetStatus: "DRAFT",
          },
        });
      await this.audit(transaction, {
        ...input,
        action: "PURCHASE_ORDER_REVISED",
        changes: {
          reason: input.revisionReason.trim(),
          revisionNumber: {
            from: current.currentRevisionNumber,
            to: revisionNumber,
          },
        },
        entityId: current.id,
        entityType: "PurchaseOrder",
      });
      if (prepared.overrides.length > 0)
        await this.audit(transaction, {
          ...input,
          action: "PURCHASE_ORDER_OVER_ORDER_OVERRIDE_USED",
          changes: { allocations: prepared.overrides, revisionNumber },
          entityId: current.id,
          entityType: "PurchaseOrder",
        });
      return this.detailInTransaction(transaction, current.id);
    });
  }

  private async transition(
    input: ActorInput & {
      expectedVersion: number;
      purchaseOrderId: string;
      reason: string;
    },
    targetStatus: PurchaseOrderStatus,
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
        Prisma.sql`SELECT id FROM purchase_orders WHERE id = ${input.purchaseOrderId}::uuid FOR UPDATE`,
      );
      const current = await transaction.purchaseOrder.findUnique({
        include: { project: true, revisions: { where: { current: true } } },
        where: { id: input.purchaseOrderId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (!canTransitionPurchaseOrder(current.status, targetStatus))
        throw new UnprocessableEntityException(
          "Invalid purchase order transition",
        );
      if (["COMPLETED", "CANCELLED"].includes(current.project.state))
        throw new UnprocessableEntityException(
          "Terminal projects cannot change purchase order lifecycle",
        );
      const now = new Date();
      if (targetStatus === "SENT")
        await transaction.purchaseOrderRevision.update({
          data: { sentAt: now },
          where: { id: current.revisions[0]!.id },
        });
      const changed = await transaction.purchaseOrder.updateMany({
        data: {
          ...(targetStatus === "SENT" ? { sentAt: now } : {}),
          ...(targetStatus === "ACKNOWLEDGED" ? { acknowledgedAt: now } : {}),
          ...(targetStatus === "CANCELLED" ? { cancelledAt: now } : {}),
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
      await transaction.purchaseOrderTransition.create({
        data: {
          actorMembershipId: input.actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          purchaseOrderId: current.id,
          reason: input.reason.trim(),
          sourceStatus: current.status,
          targetStatus,
        },
      });
      await this.audit(transaction, {
        ...input,
        action,
        changes: {
          reason: input.reason.trim(),
          revisionNumber: current.currentRevisionNumber,
          status: { from: current.status, to: targetStatus },
        },
        entityId: current.id,
        entityType: "PurchaseOrder",
      });
      return this.detailInTransaction(transaction, current.id);
    });
  }

  send(
    input: ActorInput & {
      expectedVersion: number;
      purchaseOrderId: string;
      reason: string;
    },
  ) {
    return this.transition(input, "SENT", "PURCHASE_ORDER_SENT");
  }

  cancel(
    input: ActorInput & {
      expectedVersion: number;
      purchaseOrderId: string;
      reason: string;
    },
  ) {
    return this.transition(input, "CANCELLED", "PURCHASE_ORDER_CANCELLED");
  }

  async acknowledge(
    input: ActorInput & {
      expectedVersion: number;
      purchaseOrderId: string;
      reason: string;
    },
  ) {
    await this.transition(input, "ACKNOWLEDGED", "PURCHASE_ORDER_ACKNOWLEDGED");
    const detail = await this.database.purchaseOrder.findUniqueOrThrow({
      include: detailInclude,
      where: { id: input.purchaseOrderId },
    });
    return this.presentSupplier(detail);
  }

  async appendCommitment(
    input: ActorInput & {
      expectedVersion: number;
      lines: Array<{ committedDate: string; purchaseOrderLineId: string }>;
      note?: string;
      purchaseOrderId: string;
      supplierOrganizationId: string;
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
        Prisma.sql`SELECT id FROM purchase_orders WHERE id = ${input.purchaseOrderId}::uuid FOR UPDATE`,
      );
      const order = await transaction.purchaseOrder.findUnique({
        include: {
          revisions: { include: { lines: true }, where: { current: true } },
        },
        where: { id: input.purchaseOrderId },
      });
      if (!order) throw new NotFoundException("Resource not found");
      if (order.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (
        order.status !== "ACKNOWLEDGED" ||
        order.supplierOrganizationId !== input.supplierOrganizationId
      )
        throw new UnprocessableEntityException(
          "Only an acknowledged own-organization purchase order accepts commitments",
        );
      const revision = order.revisions[0]!;
      const ids = input.lines.map(
        ({ purchaseOrderLineId }) => purchaseOrderLineId,
      );
      if (new Set(ids).size !== ids.length)
        throw new UnprocessableEntityException(
          "A purchase order line can appear only once per commitment revision",
        );
      const validIds = new Set(revision.lines.map(({ id }) => id));
      if (ids.some((id) => !validIds.has(id)))
        throw new UnprocessableEntityException(
          "Commitments must reference the current purchase order revision",
        );
      const latest = await transaction.supplierCommitmentRevision.findFirst({
        orderBy: { revisionNumber: "desc" },
        select: { revisionNumber: true },
        where: { purchaseOrderRevisionId: revision.id },
      });
      const commitment = await transaction.supplierCommitmentRevision.create({
        data: {
          lines: {
            create: input.lines.map((line) => ({
              committedDate: new Date(`${line.committedDate}T00:00:00.000Z`),
              purchaseOrderLine: {
                connect: {
                  id_purchaseOrderRevisionId: {
                    id: line.purchaseOrderLineId,
                    purchaseOrderRevisionId: revision.id,
                  },
                },
              },
            })),
          },
          note: input.note?.trim() ?? "",
          purchaseOrderRevision: { connect: { id: revision.id } },
          revisionNumber: (latest?.revisionNumber ?? 0) + 1,
          submittedBy: { connect: { id: input.actorUserId as string } },
          supplierOrganization: {
            connect: { id: input.supplierOrganizationId },
          },
        },
      });
      const changed = await transaction.purchaseOrder.updateMany({
        data: { version: { increment: 1 } },
        where: { id: order.id, version: input.expectedVersion },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await this.audit(transaction, {
        ...input,
        action: "SUPPLIER_COMMITMENT_REVISION_APPENDED",
        changes: {
          lineCount: input.lines.length,
          purchaseOrderRevisionNumber: order.currentRevisionNumber,
          revisionNumber: commitment.revisionNumber,
        },
        entityId: commitment.id,
        entityType: "SupplierCommitmentRevision",
      });
      const detail = await transaction.purchaseOrder.findUniqueOrThrow({
        include: detailInclude,
        where: { id: order.id },
      });
      return this.presentSupplier(detail);
    });
  }

  async exceptions(projectId: string) {
    const orders = await this.database.purchaseOrder.findMany({
      include: detailInclude,
      where: {
        projectId,
        status: { in: ["ACKNOWLEDGED", "SENT"] },
        revisions: { some: { current: true } },
      },
    });
    return orders.flatMap((order) => {
      const detail = this.presentInternal(order);
      const revision = detail.currentRevision;
      if (!revision) return [];
      return revision.lines
        .filter(({ isLate }) => isLate)
        .map((line) => ({
          item: line.item,
          latestCommitmentDate: line.latestCommitmentDate,
          originalCommitmentDate: line.originalCommitmentDate,
          purchaseOrderId: order.id,
          purchaseOrderLineId: line.id,
          purchaseOrderNumber: order.purchaseOrderNumber,
          requiredDate: line.requiredDate,
          revisionNumber: revision.revisionNumber,
          supplierOrganization: order.supplierOrganization,
          title: revision.title,
        }));
    });
  }

  async supplierCanAccessFromSet(
    id: string,
    set: AuthorizationContextSet,
  ): Promise<boolean> {
    if (set.contexts.length === 0) return false;
    return Boolean(
      await this.database.purchaseOrder.findFirst({
        select: { id: true },
        where: {
          id,
          status: { in: ["ACKNOWLEDGED", "SENT"] },
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
          revisions: { some: { current: true, sentAt: { not: null } } },
        },
      }),
    );
  }

  async supplierListFromSet(set: AuthorizationContextSet) {
    if (set.contexts.length === 0) return [];
    const orders = await this.database.purchaseOrder.findMany({
      include: detailInclude,
      orderBy: { updatedAt: "desc" },
      where: {
        status: { in: ["ACKNOWLEDGED", "SENT"] },
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
        revisions: { some: { current: true, sentAt: { not: null } } },
      },
    });
    return orders.map((order) => this.presentSupplier(order));
  }

  async supplierCanAccessFromContext(
    id: string,
    context: AuthorizationContext,
  ): Promise<boolean> {
    return this.supplierCanAccessFromSet(id, { contexts: [context] });
  }
}
