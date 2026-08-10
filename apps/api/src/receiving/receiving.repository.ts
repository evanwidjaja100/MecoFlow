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
import { createInspectionForLot } from "../inspections/inspection-creation.js";
import {
  canTransitionShipment,
  type AdvanceShipmentNoticeStatus,
} from "./shipment-lifecycle.js";

type ActorInput = {
  actorUserId: string;
  auditOrganizationId: string;
  context: RequestContext;
};

type TrackingInput = {
  batchNumber?: string;
  heatNumber?: string;
  manufacturer?: string;
  notes?: string;
  packageReference?: string;
};

const asnInclude = {
  createdBy: { select: { displayName: true, id: true } },
  lines: {
    include: {
      purchaseOrderLine: {
        include: {
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
      },
    },
    orderBy: { lineNumber: "asc" as const },
  },
  project: { select: { code: true, id: true, name: true, state: true } },
  purchaseOrder: {
    select: {
      id: true,
      purchaseOrderNumber: true,
      status: true,
      version: true,
    },
  },
  supplierOrganization: { select: { code: true, id: true, name: true } },
  transitions: {
    include: { actor: { select: { displayName: true, id: true } } },
    orderBy: { occurredAt: "asc" as const },
  },
} as const;

const receiptInclude = {
  advanceShipmentNotice: {
    select: {
      id: true,
      supplierReference: true,
      supplierOrganization: { select: { code: true, id: true, name: true } },
    },
  },
  corrections: {
    select: {
      id: true,
      postedAt: true,
      receiptNumber: true,
      status: true,
    },
    orderBy: { receiptNumber: "asc" as const },
  },
  createdBy: { select: { displayName: true, id: true } },
  lines: {
    include: {
      advanceShipmentNoticeLine: {
        include: {
          purchaseOrderLine: {
            include: {
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
          },
        },
      },
      inventoryLot: {
        include: { adjustments: { orderBy: { createdAt: "asc" as const } } },
      },
      inventoryLotAdjustment: {
        include: { inventoryLot: { select: { id: true, lotNumber: true } } },
      },
    },
    orderBy: { lineNumber: "asc" as const },
  },
  postedBy: { select: { displayName: true, id: true } },
  project: { select: { code: true, id: true, name: true } },
} as const;

function decimal(value: Prisma.Decimal | string): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

function trim(value: string | undefined): string {
  return value?.trim() ?? "";
}

@Injectable()
export class ReceivingRepository {
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

  projectIdForAsn(id: string) {
    return this.database.advanceShipmentNotice
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  projectIdForReceipt(id: string) {
    return this.database.goodsReceipt
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  async supplierCanAccessPurchaseOrder(
    id: string,
    organizationIds: string[],
    membershipIds: string[],
  ) {
    return this.database.purchaseOrder.findFirst({
      include: {
        revisions: {
          include: {
            lines: {
              include: {
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
              orderBy: { lineNumber: "asc" },
            },
          },
          where: { current: true },
        },
      },
      where: {
        id,
        status: "ACKNOWLEDGED",
        supplierOrganizationId: { in: organizationIds },
        project: {
          members: {
            some: { membershipId: { in: membershipIds }, status: "ACTIVE" },
          },
        },
      },
    });
  }

  async supplierCanAccessAsn(
    id: string,
    organizationIds: string[],
    membershipIds: string[],
  ) {
    return Boolean(
      await this.database.advanceShipmentNotice.findFirst({
        select: { id: true },
        where: {
          id,
          supplierOrganizationId: { in: organizationIds },
          project: {
            members: {
              some: { membershipId: { in: membershipIds }, status: "ACTIVE" },
            },
          },
        },
      }),
    );
  }

  private presentAsn<
    T extends { lines: Array<{ shippedQuantity: Prisma.Decimal }> },
  >(value: T) {
    return {
      ...value,
      lines: value.lines.map((line) => ({
        ...line,
        shippedQuantity: line.shippedQuantity.toString(),
      })),
    };
  }

  private presentSupplierAsn(
    row: Prisma.AdvanceShipmentNoticeGetPayload<{ include: typeof asnInclude }>,
  ) {
    return {
      arrivedAt: row.arrivedAt,
      cancelledAt: row.cancelledAt,
      carrier: row.carrier,
      createdAt: row.createdAt,
      departedAt: row.departedAt,
      estimatedArrivalDate: row.estimatedArrivalDate,
      id: row.id,
      lines: row.lines.map((line) => ({
        id: line.id,
        lineNumber: line.lineNumber,
        packageReference: line.packageReference,
        purchaseOrderLine: {
          item: line.purchaseOrderLine.item,
          unitOfMeasure: line.purchaseOrderLine.unitOfMeasure,
        },
        purchaseOrderLineId: line.purchaseOrderLineId,
        shippedQuantity: line.shippedQuantity.toString(),
      })),
      notes: row.notes,
      project: row.project,
      projectId: row.projectId,
      purchaseOrder: row.purchaseOrder,
      purchaseOrderId: row.purchaseOrderId,
      status: row.status,
      submittedAt: row.submittedAt,
      supplierOrganization: row.supplierOrganization,
      supplierOrganizationId: row.supplierOrganizationId,
      supplierReference: row.supplierReference,
      trackingNumber: row.trackingNumber,
      transitions: row.transitions.map((transition) => ({
        id: transition.id,
        occurredAt: transition.occurredAt,
        reason: transition.reason,
        sourceStatus: transition.sourceStatus,
        targetStatus: transition.targetStatus,
      })),
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }

  private presentReceipt<
    T extends {
      lines: Array<{
        quantityDelta: Prisma.Decimal;
        inventoryLot?:
          | (Record<string, unknown> & {
              adjustments: Array<
                Record<string, unknown> & { quantityDelta: Prisma.Decimal }
              >;
              quantity: Prisma.Decimal;
            })
          | null;
        inventoryLotAdjustment?:
          (Record<string, unknown> & { quantityDelta: Prisma.Decimal }) | null;
      }>;
    },
  >(value: T) {
    return {
      ...value,
      lines: value.lines.map((line) => ({
        ...line,
        quantityDelta: line.quantityDelta.toString(),
        ...(line.inventoryLot
          ? {
              inventoryLot: {
                ...line.inventoryLot,
                adjustments: line.inventoryLot.adjustments.map(
                  (adjustment) => ({
                    ...adjustment,
                    quantityDelta: adjustment.quantityDelta.toString(),
                  }),
                ),
                quantity: line.inventoryLot.quantity.toString(),
              },
            }
          : {}),
        ...(line.inventoryLotAdjustment
          ? {
              inventoryLotAdjustment: {
                ...line.inventoryLotAdjustment,
                quantityDelta:
                  line.inventoryLotAdjustment.quantityDelta.toString(),
              },
            }
          : {}),
      })),
    };
  }

  async supplierList(organizationIds: string[], membershipIds: string[]) {
    const rows = await this.database.advanceShipmentNotice.findMany({
      include: asnInclude,
      orderBy: { updatedAt: "desc" },
      where: {
        supplierOrganizationId: { in: organizationIds },
        project: {
          members: {
            some: { membershipId: { in: membershipIds }, status: "ACTIVE" },
          },
        },
      },
    });
    return rows.map((row) => this.presentSupplierAsn(row));
  }

  async supplierDetail(id: string) {
    const row = await this.database.advanceShipmentNotice.findUnique({
      include: asnInclude,
      where: { id },
    });
    if (!row) return null;
    return this.presentSupplierAsn(row);
  }

  async listAsns(projectId: string) {
    const rows = await this.database.advanceShipmentNotice.findMany({
      include: asnInclude,
      orderBy: { updatedAt: "desc" },
      where: { projectId },
    });
    return rows.map((row) => this.presentAsn(row));
  }

  async asnDetail(id: string) {
    const row = await this.database.advanceShipmentNotice.findUnique({
      include: asnInclude,
      where: { id },
    });
    return row ? this.presentAsn(row) : null;
  }

  private async asnDetailInTransaction(
    transaction: Prisma.TransactionClient,
    id: string,
  ) {
    return this.presentAsn(
      await transaction.advanceShipmentNotice.findUniqueOrThrow({
        include: asnInclude,
        where: { id },
      }),
    );
  }

  async createAsn(
    input: ActorInput & {
      carrier?: string;
      estimatedArrivalDate?: string;
      lines: Array<{
        packageReference?: string;
        purchaseOrderLineId: string;
        shippedQuantity: string;
      }>;
      notes?: string;
      purchaseOrderId: string;
      supplierOrganizationId: string;
      supplierReference: string;
      trackingNumber?: string;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM purchase_orders WHERE id = ${input.purchaseOrderId}::uuid FOR UPDATE`,
      );
      const order = await transaction.purchaseOrder.findFirst({
        include: {
          revisions: {
            include: { lines: { include: { unitOfMeasure: true } } },
            where: { current: true },
          },
        },
        where: {
          id: input.purchaseOrderId,
          status: "ACKNOWLEDGED",
          supplierOrganizationId: input.supplierOrganizationId,
        },
      });
      const revision = order?.revisions[0];
      if (!order || !revision)
        throw new NotFoundException("Resource not found");
      const lineIds = input.lines.map(
        ({ purchaseOrderLineId }) => purchaseOrderLineId,
      );
      if (new Set(lineIds).size !== lineIds.length)
        throw new UnprocessableEntityException(
          "A purchase order line can appear only once in an ASN",
        );
      const byId = new Map(revision.lines.map((line) => [line.id, line]));
      if (lineIds.some((id) => !byId.has(id)))
        throw new UnprocessableEntityException(
          "Every ASN line must belong to the current supplier-owned purchase order revision",
        );
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM purchase_order_lines WHERE id IN (${Prisma.join(
          [...lineIds].sort().map((id) => Prisma.sql`${id}::uuid`),
        )}) ORDER BY id FOR UPDATE`,
      );
      const prior = await transaction.advanceShipmentNoticeLine.groupBy({
        by: ["purchaseOrderLineId"],
        _sum: { shippedQuantity: true },
        where: {
          purchaseOrderLineId: { in: lineIds },
          advanceShipmentNotice: { status: { not: "CANCELLED" } },
        },
      });
      const priorByLine = new Map(
        prior.map((value) => [
          value.purchaseOrderLineId,
          value._sum.shippedQuantity ?? new Prisma.Decimal(0),
        ]),
      );
      const prepared = input.lines.map((line, index) => {
        const source = byId.get(line.purchaseOrderLineId)!;
        const quantity = decimal(line.shippedQuantity);
        if (
          quantity.lte(0) ||
          quantity.decimalPlaces() > source.unitOfMeasure.decimalPrecision
        )
          throw new UnprocessableEntityException(
            "ASN quantity must be positive and match the purchase order unit precision",
          );
        const reserved = priorByLine.get(source.id) ?? new Prisma.Decimal(0);
        if (reserved.plus(quantity).gt(source.orderedQuantity))
          throw new UnprocessableEntityException(
            "ASN quantity exceeds the unshipped purchase order quantity",
          );
        return {
          lineNumber: index + 1,
          packageReference: trim(line.packageReference),
          purchaseOrderLineId: source.id,
          purchaseOrderRevisionId: revision.id,
          shippedQuantity: quantity,
        };
      });
      const created = await transaction.advanceShipmentNotice.create({
        data: {
          carrier: trim(input.carrier),
          createdByUserId: input.actorUserId,
          estimatedArrivalDate: input.estimatedArrivalDate
            ? new Date(`${input.estimatedArrivalDate}T00:00:00.000Z`)
            : null,
          lines: { createMany: { data: prepared } },
          notes: trim(input.notes),
          projectId: order.projectId,
          purchaseOrderId: order.id,
          purchaseOrderRevisionId: revision.id,
          supplierOrganizationId: input.supplierOrganizationId,
          supplierReference: input.supplierReference.trim(),
          trackingNumber: trim(input.trackingNumber),
        },
      });
      await this.audit(transaction, {
        ...input,
        action: "ADVANCE_SHIPMENT_NOTICE_CREATED",
        changes: {
          lineCount: prepared.length,
          purchaseOrderId: order.id,
          supplierOrganizationId: input.supplierOrganizationId,
          supplierReference: created.supplierReference,
        },
        entityId: created.id,
        entityType: "AdvanceShipmentNotice",
      });
      return this.asnDetailInTransaction(transaction, created.id);
    });
  }

  async transitionAsn(
    input: ActorInput & {
      advanceShipmentNoticeId: string;
      expectedVersion: number;
      reason: string;
      targetStatus: AdvanceShipmentNoticeStatus;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM advance_shipment_notices WHERE id = ${input.advanceShipmentNoticeId}::uuid FOR UPDATE`,
      );
      const current = await transaction.advanceShipmentNotice.findUnique({
        where: { id: input.advanceShipmentNoticeId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (!canTransitionShipment(current.status, input.targetStatus))
        throw new UnprocessableEntityException("Invalid shipment transition");
      const now = new Date();
      const changed = await transaction.advanceShipmentNotice.updateMany({
        data: {
          ...(input.targetStatus === "SUBMITTED" ? { submittedAt: now } : {}),
          ...(input.targetStatus === "IN_TRANSIT" ? { departedAt: now } : {}),
          ...(input.targetStatus === "ARRIVED" ? { arrivedAt: now } : {}),
          ...(input.targetStatus === "CANCELLED" ? { cancelledAt: now } : {}),
          status: input.targetStatus,
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
      await transaction.advanceShipmentNoticeTransition.create({
        data: {
          actorUserId: input.actorUserId,
          advanceShipmentNoticeId: current.id,
          reason: input.reason.trim(),
          sourceStatus: current.status,
          targetStatus: input.targetStatus,
        },
      });
      await this.audit(transaction, {
        ...input,
        action: `ADVANCE_SHIPMENT_NOTICE_${input.targetStatus}`,
        changes: {
          reason: input.reason.trim(),
          sourceStatus: current.status,
          targetStatus: input.targetStatus,
        },
        entityId: current.id,
        entityType: "AdvanceShipmentNotice",
      });
      return this.asnDetailInTransaction(transaction, current.id);
    });
  }

  async listReceipts(projectId: string) {
    const rows = await this.database.goodsReceipt.findMany({
      include: receiptInclude,
      orderBy: { createdAt: "desc" },
      where: { projectId },
    });
    return rows.map((row) => this.presentReceipt(row));
  }

  async receiptDetail(id: string) {
    const row = await this.database.goodsReceipt.findUnique({
      include: receiptInclude,
      where: { id },
    });
    return row ? this.presentReceipt(row) : null;
  }

  private async receiptDetailInTransaction(
    transaction: Prisma.TransactionClient,
    id: string,
  ) {
    return this.presentReceipt(
      await transaction.goodsReceipt.findUniqueOrThrow({
        include: receiptInclude,
        where: { id },
      }),
    );
  }

  private async postedQuantityByAsnLine(
    transaction: Prisma.TransactionClient,
    asnLineIds: string[],
    excludeReceiptId?: string,
  ) {
    const rows = await transaction.goodsReceiptLine.groupBy({
      by: ["advanceShipmentNoticeLineId"],
      _sum: { quantityDelta: true },
      where: {
        advanceShipmentNoticeLineId: { in: asnLineIds },
        goodsReceipt: {
          ...(excludeReceiptId ? { id: { not: excludeReceiptId } } : {}),
          status: "POSTED",
        },
      },
    });
    return new Map(
      rows.map((row) => [
        row.advanceShipmentNoticeLineId,
        row._sum.quantityDelta ?? new Prisma.Decimal(0),
      ]),
    );
  }

  private async nextReceiptNumber(
    transaction: Prisma.TransactionClient,
    projectId: string,
  ) {
    await transaction.$queryRaw(
      Prisma.sql`SELECT id FROM projects WHERE id = ${projectId}::uuid FOR UPDATE`,
    );
    const latest = await transaction.goodsReceipt.findFirst({
      orderBy: { receiptNumber: "desc" },
      select: { receiptNumber: true },
      where: { projectId },
    });
    return (latest?.receiptNumber ?? 0) + 1;
  }

  async createReceipt(
    input: ActorInput & {
      advanceShipmentNoticeId: string;
      lines: Array<
        TrackingInput & {
          advanceShipmentNoticeLineId: string;
          receivedQuantity: string;
        }
      >;
      notes?: string;
      projectId: string;
      receivedAt: string;
      warehouseLocation: string;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      const asn = await transaction.advanceShipmentNotice.findFirst({
        include: {
          lines: {
            include: {
              purchaseOrderLine: { include: { unitOfMeasure: true } },
            },
          },
        },
        where: {
          id: input.advanceShipmentNoticeId,
          projectId: input.projectId,
          status: "ARRIVED",
        },
      });
      if (!asn)
        throw new UnprocessableEntityException(
          "Receipt requires an arrived ASN in this project",
        );
      const ids = input.lines.map(
        ({ advanceShipmentNoticeLineId }) => advanceShipmentNoticeLineId,
      );
      if (new Set(ids).size !== ids.length)
        throw new UnprocessableEntityException(
          "An ASN line can appear only once in a receipt",
        );
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM advance_shipment_notice_lines WHERE id IN (${Prisma.join(
          [...ids].sort().map((id) => Prisma.sql`${id}::uuid`),
        )}) ORDER BY id FOR UPDATE`,
      );
      const byId = new Map(asn.lines.map((line) => [line.id, line]));
      if (ids.some((id) => !byId.has(id)))
        throw new UnprocessableEntityException(
          "Every receipt line must belong to the selected ASN",
        );
      const posted = await this.postedQuantityByAsnLine(transaction, ids);
      const prepared = input.lines.map((line, index) => {
        const source = byId.get(line.advanceShipmentNoticeLineId)!;
        const quantity = decimal(line.receivedQuantity);
        if (
          quantity.lte(0) ||
          quantity.decimalPlaces() >
            source.purchaseOrderLine.unitOfMeasure.decimalPrecision
        )
          throw new UnprocessableEntityException(
            "Receipt quantity must be positive and match the purchase order unit precision",
          );
        if (
          (posted.get(source.id) ?? new Prisma.Decimal(0))
            .plus(quantity)
            .gt(source.shippedQuantity)
        )
          throw new UnprocessableEntityException(
            "Receipt quantity exceeds the unreceived ASN quantity",
          );
        return {
          advanceShipmentNoticeId: asn.id,
          advanceShipmentNoticeLineId: source.id,
          batchNumber: trim(line.batchNumber),
          heatNumber: trim(line.heatNumber),
          lineNumber: index + 1,
          manufacturer: trim(line.manufacturer),
          notes: trim(line.notes),
          packageReference:
            trim(line.packageReference) || source.packageReference,
          quantityDelta: quantity,
        };
      });
      const receiptNumber = await this.nextReceiptNumber(
        transaction,
        input.projectId,
      );
      const created = await transaction.goodsReceipt.create({
        data: {
          advanceShipmentNoticeId: asn.id,
          createdByUserId: input.actorUserId,
          lines: { createMany: { data: prepared } },
          notes: trim(input.notes),
          projectId: input.projectId,
          receiptNumber,
          receivedAt: new Date(input.receivedAt),
          warehouseLocation: input.warehouseLocation.trim(),
        },
      });
      await this.audit(transaction, {
        ...input,
        action: "GOODS_RECEIPT_DRAFT_CREATED",
        changes: {
          advanceShipmentNoticeId: asn.id,
          lineCount: prepared.length,
          receiptNumber,
        },
        entityId: created.id,
        entityType: "GoodsReceipt",
      });
      return this.receiptDetailInTransaction(transaction, created.id);
    });
  }

  async createCorrection(
    input: ActorInput & {
      correctsReceiptId: string;
      lines: Array<
        TrackingInput & {
          goodsReceiptLineId: string;
          quantityDelta: string;
        }
      >;
      notes?: string;
      reason: string;
      receivedAt: string;
      warehouseLocation: string;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM goods_receipts WHERE id = ${input.correctsReceiptId}::uuid FOR UPDATE`,
      );
      const original = await transaction.goodsReceipt.findFirst({
        include: {
          lines: {
            include: {
              advanceShipmentNoticeLine: {
                include: {
                  purchaseOrderLine: { include: { unitOfMeasure: true } },
                },
              },
            },
          },
        },
        where: {
          id: input.correctsReceiptId,
          kind: "RECEIPT",
          status: "POSTED",
        },
      });
      if (!original)
        throw new UnprocessableEntityException(
          "Corrections require a posted original receipt",
        );
      const ids = input.lines.map(
        ({ goodsReceiptLineId }) => goodsReceiptLineId,
      );
      if (new Set(ids).size !== ids.length)
        throw new UnprocessableEntityException(
          "An original receipt line can appear only once in a correction",
        );
      const byId = new Map(original.lines.map((line) => [line.id, line]));
      if (ids.some((id) => !byId.has(id)))
        throw new UnprocessableEntityException(
          "Every correction line must belong to the posted original receipt",
        );
      const asnLineIds = input.lines.map(
        ({ goodsReceiptLineId }) =>
          byId.get(goodsReceiptLineId)!.advanceShipmentNoticeLineId,
      );
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM advance_shipment_notice_lines WHERE id IN (${Prisma.join(
          [...asnLineIds].sort().map((id) => Prisma.sql`${id}::uuid`),
        )}) ORDER BY id FOR UPDATE`,
      );
      const posted = await this.postedQuantityByAsnLine(
        transaction,
        asnLineIds,
      );
      const prepared = input.lines.map((line, index) => {
        const source = byId.get(line.goodsReceiptLineId)!;
        const delta = decimal(line.quantityDelta);
        if (
          delta.isZero() ||
          delta.decimalPlaces() >
            source.advanceShipmentNoticeLine.purchaseOrderLine.unitOfMeasure
              .decimalPrecision
        )
          throw new UnprocessableEntityException(
            "Correction quantity must be non-zero and match the purchase order unit precision",
          );
        const effective = (
          posted.get(source.advanceShipmentNoticeLineId) ??
          new Prisma.Decimal(0)
        ).plus(delta);
        if (
          effective.isNegative() ||
          effective.gt(source.advanceShipmentNoticeLine.shippedQuantity)
        )
          throw new UnprocessableEntityException(
            "Correction would make received quantity negative or greater than shipped quantity",
          );
        return {
          advanceShipmentNoticeId: original.advanceShipmentNoticeId,
          advanceShipmentNoticeLineId: source.advanceShipmentNoticeLineId,
          batchNumber: trim(line.batchNumber) || source.batchNumber,
          correctsReceiptLineId: source.id,
          heatNumber: trim(line.heatNumber) || source.heatNumber,
          lineNumber: index + 1,
          manufacturer: trim(line.manufacturer) || source.manufacturer,
          notes: trim(line.notes),
          packageReference:
            trim(line.packageReference) || source.packageReference,
          quantityDelta: delta,
        };
      });
      const receiptNumber = await this.nextReceiptNumber(
        transaction,
        original.projectId,
      );
      const created = await transaction.goodsReceipt.create({
        data: {
          advanceShipmentNoticeId: original.advanceShipmentNoticeId,
          correctionReason: input.reason.trim(),
          correctsReceiptId: original.id,
          createdByUserId: input.actorUserId,
          kind: "CORRECTION",
          lines: { createMany: { data: prepared } },
          notes: trim(input.notes),
          projectId: original.projectId,
          receiptNumber,
          receivedAt: new Date(input.receivedAt),
          warehouseLocation: input.warehouseLocation.trim(),
        },
      });
      await this.audit(transaction, {
        ...input,
        action: "GOODS_RECEIPT_CORRECTION_DRAFT_CREATED",
        changes: {
          correctsReceiptId: original.id,
          lineCount: prepared.length,
          reason: input.reason.trim(),
          receiptNumber,
        },
        entityId: created.id,
        entityType: "GoodsReceipt",
      });
      return this.receiptDetailInTransaction(transaction, created.id);
    });
  }

  async postReceipt(
    input: ActorInput & {
      expectedVersion: number;
      goodsReceiptId: string;
      idempotencyKey: string;
      requestHash: string;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM goods_receipts WHERE id = ${input.goodsReceiptId}::uuid FOR UPDATE`,
      );
      const current = await transaction.goodsReceipt.findUnique({
        include: {
          lines: {
            include: {
              advanceShipmentNoticeLine: {
                include: { purchaseOrderLine: true },
              },
              correctsReceiptLine: true,
            },
          },
        },
        where: { id: input.goodsReceiptId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.status === "POSTED") {
        if (
          current.postingIdempotencyKey === input.idempotencyKey &&
          current.postingRequestHash === input.requestHash
        )
          return this.receiptDetailInTransaction(transaction, current.id);
        throw new ConflictException("Posted goods receipts are immutable");
      }
      const reused = await transaction.goodsReceipt.findFirst({
        select: { id: true },
        where: {
          id: { not: current.id },
          postingIdempotencyKey: input.idempotencyKey,
        },
      });
      if (reused)
        throw new ConflictException(
          "Idempotency key was used for another receipt",
        );
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const asnLineIds = current.lines.map(
        ({ advanceShipmentNoticeLineId }) => advanceShipmentNoticeLineId,
      );
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM advance_shipment_notice_lines WHERE id IN (${Prisma.join(
          [...asnLineIds].sort().map((id) => Prisma.sql`${id}::uuid`),
        )}) ORDER BY id FOR UPDATE`,
      );
      const posted = await this.postedQuantityByAsnLine(
        transaction,
        asnLineIds,
        current.id,
      );
      for (const line of current.lines) {
        const effective = (
          posted.get(line.advanceShipmentNoticeLineId) ?? new Prisma.Decimal(0)
        ).plus(line.quantityDelta);
        if (
          effective.isNegative() ||
          effective.gt(line.advanceShipmentNoticeLine.shippedQuantity)
        )
          throw new ConflictException(
            "Receipt quantities changed concurrently; create a new draft",
          );
      }
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM projects WHERE id = ${current.projectId}::uuid FOR UPDATE`,
      );
      const now = new Date();
      const changed = await transaction.goodsReceipt.updateMany({
        data: {
          postedAt: now,
          postedByUserId: input.actorUserId,
          postingIdempotencyKey: input.idempotencyKey,
          postingRequestHash: input.requestHash,
          status: "POSTED",
          version: { increment: 1 },
        },
        where: {
          id: current.id,
          status: "DRAFT",
          version: input.expectedVersion,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      if (current.kind === "RECEIPT") {
        const latest = await transaction.inventoryLot.findFirst({
          orderBy: { lotNumber: "desc" },
          select: { lotNumber: true },
          where: { projectId: current.projectId },
        });
        let lotNumber = latest?.lotNumber ?? 0;
        for (const line of current.lines) {
          lotNumber += 1;
          const lot = await transaction.inventoryLot.create({
            data: {
              advanceShipmentNoticeLineId: line.advanceShipmentNoticeLineId,
              batchNumber: line.batchNumber,
              goodsReceiptLineId: line.id,
              heatNumber: line.heatNumber,
              itemId: line.advanceShipmentNoticeLine.purchaseOrderLine.itemId,
              lotNumber,
              manufacturer: line.manufacturer,
              packageReference: line.packageReference,
              projectId: current.projectId,
              quantity: line.quantityDelta,
              sourceGoodsReceiptId: current.id,
              unitOfMeasureId:
                line.advanceShipmentNoticeLine.purchaseOrderLine
                  .unitOfMeasureId,
            },
          });
          await createInspectionForLot(transaction, {
            actorUserId: input.actorUserId,
            auditOrganizationId: input.auditOrganizationId,
            context: input.context,
            effectiveQuantity: line.quantityDelta,
            inventoryLotId: lot.id,
            itemId: line.advanceShipmentNoticeLine.purchaseOrderLine.itemId,
            projectId: current.projectId,
            requireDefinitions: false,
            source: "AUTOMATIC_RECEIPT_POSTING",
          });
        }
      } else {
        for (const line of current.lines) {
          const originalLineId = line.correctsReceiptLineId;
          if (!originalLineId)
            throw new UnprocessableEntityException(
              "Correction line is missing its original receipt line",
            );
          await transaction.$queryRaw(
            Prisma.sql`SELECT id FROM inventory_lots WHERE "goodsReceiptLineId" = ${originalLineId}::uuid FOR UPDATE`,
          );
          const lot = await transaction.inventoryLot.findUnique({
            where: { goodsReceiptLineId: originalLineId },
          });
          if (!lot)
            throw new UnprocessableEntityException(
              "Original receipt inventory lot is missing",
            );
          if (lot.status !== "AWAITING_INSPECTION")
            throw new ConflictException(
              "A finalized inventory lot cannot be corrected",
            );
          const priorAdjustments =
            await transaction.inventoryLotAdjustment.aggregate({
              _sum: { quantityDelta: true },
              where: { inventoryLotId: lot.id },
            });
          const effectiveLot = lot.quantity
            .plus(priorAdjustments._sum.quantityDelta ?? new Prisma.Decimal(0))
            .plus(line.quantityDelta);
          if (effectiveLot.isNegative())
            throw new ConflictException(
              "Correction would make the inventory lot quantity negative",
            );
          await transaction.inventoryLotAdjustment.create({
            data: {
              correctionReceiptLineId: line.id,
              inventoryLotId: lot.id,
              quantityDelta: line.quantityDelta,
            },
          });
        }
      }
      await this.audit(transaction, {
        ...input,
        action:
          current.kind === "RECEIPT"
            ? "GOODS_RECEIPT_POSTED"
            : "GOODS_RECEIPT_CORRECTION_POSTED",
        changes: {
          kind: current.kind,
          lineCount: current.lines.length,
          receiptNumber: current.receiptNumber,
        },
        entityId: current.id,
        entityType: "GoodsReceipt",
      });
      return this.receiptDetailInTransaction(transaction, current.id);
    });
  }
}
