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
  canTransitionAllocation,
  type MaterialAllocationStatus,
} from "./allocation-lifecycle.js";

type ActorInput = {
  actorUserId: string;
  auditOrganizationId: string;
  context: RequestContext;
};

const allocationInclude = {
  bomLine: {
    select: {
      id: true,
      lineNumber: true,
      quantity: true,
      bomRevision: {
        select: {
          id: true,
          revisionNumber: true,
          status: true,
          bom: {
            select: {
              id: true,
              workPackage: { select: { code: true, id: true, name: true } },
            },
          },
        },
      },
    },
  },
  conditionalUseAuthorizedBy: { select: { displayName: true, id: true } },
  consumedBy: { select: { displayName: true, id: true } },
  createdBy: { select: { displayName: true, id: true } },
  inventoryLot: {
    select: {
      acceptedQuantity: true,
      id: true,
      lotNumber: true,
      materialAllocations: {
        select: { id: true, quantity: true, status: true },
      },
      item: { select: { code: true, id: true, name: true } },
      status: true,
      unitOfMeasure: {
        select: { code: true, decimalPrecision: true, id: true, symbol: true },
      },
    },
  },
  releasedBy: { select: { displayName: true, id: true } },
  transitions: {
    include: { actor: { select: { displayName: true, id: true } } },
    orderBy: { occurredAt: "asc" as const },
  },
} satisfies Prisma.MaterialAllocationInclude;

type AllocationPayload = Prisma.MaterialAllocationGetPayload<{
  include: typeof allocationInclude;
}>;

function present(value: AllocationPayload) {
  const committed = value.inventoryLot.materialAllocations
    .filter(({ status }) => status !== "RELEASED")
    .reduce(
      (sum, allocation) => sum.plus(allocation.quantity),
      new Prisma.Decimal(0),
    );
  return {
    ...value,
    bomLine: {
      ...value.bomLine,
      quantity: value.bomLine.quantity.toString(),
    },
    inventoryLot: {
      acceptedQuantity: value.inventoryLot.acceptedQuantity.toString(),
      availableQuantity: value.inventoryLot.acceptedQuantity
        .minus(committed)
        .toString(),
      id: value.inventoryLot.id,
      item: value.inventoryLot.item,
      lotNumber: value.inventoryLot.lotNumber,
      status: value.inventoryLot.status,
      unitOfMeasure: value.inventoryLot.unitOfMeasure,
    },
    quantity: value.quantity.toString(),
    transitions: value.transitions.map((transition) => ({
      ...transition,
      quantitySnapshot: transition.quantitySnapshot.toString(),
    })),
  };
}

@Injectable()
export class AllocationsRepository {
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
    return transaction.auditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: "MaterialAllocation",
        organizationId: input.auditOrganizationId,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
      },
    });
  }

  projectIdForAllocation(id: string) {
    return this.database.materialAllocation
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  lotStatus(projectId: string, id: string) {
    return this.database.inventoryLot
      .findFirst({ select: { status: true }, where: { id, projectId } })
      .then((value) => value?.status ?? null);
  }

  list(projectId: string, status?: MaterialAllocationStatus) {
    return this.database.materialAllocation
      .findMany({
        include: allocationInclude,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        where: { projectId, ...(status ? { status } : {}) },
      })
      .then((rows) => rows.map(present));
  }

  async options(projectId: string) {
    const [lots, lines] = await Promise.all([
      this.database.inventoryLot.findMany({
        include: {
          item: { select: { code: true, id: true, name: true } },
          materialAllocations: {
            select: { quantity: true },
            where: { status: { in: ["ALLOCATED", "CONSUMED"] } },
          },
          unitOfMeasure: {
            select: {
              code: true,
              decimalPrecision: true,
              id: true,
              symbol: true,
            },
          },
        },
        orderBy: { lotNumber: "asc" },
        where: {
          acceptedQuantity: { gt: 0 },
          projectId,
          status: { in: ["ACCEPTED", "CONDITIONALLY_ACCEPTED"] },
        },
      }),
      this.database.bomLine.findMany({
        include: {
          bomRevision: {
            select: {
              bom: {
                select: {
                  id: true,
                  workPackage: { select: { code: true, id: true, name: true } },
                },
              },
              id: true,
              revisionNumber: true,
            },
          },
          item: { select: { code: true, id: true, name: true } },
          unitOfMeasure: { select: { code: true, id: true, symbol: true } },
        },
        orderBy: [{ bomRevisionId: "asc" }, { lineNumber: "asc" }],
        where: {
          bomRevision: { bom: { projectId }, status: "RELEASED" },
        },
      }),
    ]);
    return {
      bomLines: lines.map((line) => ({
        ...line,
        quantity: line.quantity.toString(),
      })),
      inventoryLots: lots.map((lot) => ({
        acceptedQuantity: lot.acceptedQuantity.toString(),
        availableQuantity: lot.acceptedQuantity
          .minus(
            lot.materialAllocations.reduce(
              (sum, allocation) => sum.plus(allocation.quantity),
              new Prisma.Decimal(0),
            ),
          )
          .toString(),
        id: lot.id,
        item: lot.item,
        lotNumber: lot.lotNumber,
        status: lot.status,
        unitOfMeasure: lot.unitOfMeasure,
      })),
    };
  }

  detail(id: string) {
    return this.database.materialAllocation
      .findUnique({ include: allocationInclude, where: { id } })
      .then((value) => (value ? present(value) : null));
  }

  async create(
    input: ActorInput & {
      bomLineId: string;
      conditionalAuthorized: boolean;
      conditionalUseReason?: string;
      inventoryLotId: string;
      projectId: string;
      quantity: string;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM inventory_lots WHERE id = ${input.inventoryLotId}::uuid FOR UPDATE`,
      );
      const lot = await transaction.inventoryLot.findFirst({
        include: {
          materialAllocations: {
            select: { quantity: true, status: true },
            where: { status: { in: ["ALLOCATED", "CONSUMED"] } },
          },
          receivingInspection: {
            select: { conditionalAcceptanceAuthorizedByUserId: true },
          },
          unitOfMeasure: { select: { decimalPrecision: true } },
        },
        where: { id: input.inventoryLotId, projectId: input.projectId },
      });
      if (!lot) throw new UnprocessableEntityException("Invalid inventory lot");
      if (
        !(["ACCEPTED", "CONDITIONALLY_ACCEPTED"] as string[]).includes(
          lot.status,
        )
      )
        throw new UnprocessableEntityException(
          "Rejected or quarantined material cannot be allocated",
        );
      const conditional = lot.status === "CONDITIONALLY_ACCEPTED";
      if (
        conditional &&
        (!input.conditionalAuthorized ||
          !input.conditionalUseReason ||
          !lot.receivingInspection?.conditionalAcceptanceAuthorizedByUserId)
      )
        throw new UnprocessableEntityException(
          "Conditional material requires an authorized disposition and use reason",
        );
      if (!conditional && input.conditionalUseReason)
        throw new UnprocessableEntityException(
          "Conditional-use reason is valid only for conditionally accepted material",
        );
      const bomLine = await transaction.bomLine.findFirst({
        select: { id: true },
        where: {
          bomRevision: {
            bom: { projectId: input.projectId },
            status: "RELEASED",
          },
          id: input.bomLineId,
          itemId: lot.itemId,
          unitOfMeasureId: lot.unitOfMeasureId,
        },
      });
      if (!bomLine)
        throw new UnprocessableEntityException(
          "Allocation requires a matching released BOM line",
        );
      const quantity = new Prisma.Decimal(input.quantity);
      if (
        !quantity.isPositive() ||
        !quantity
          .toDecimalPlaces(lot.unitOfMeasure.decimalPrecision)
          .equals(quantity)
      )
        throw new UnprocessableEntityException(
          "Invalid allocation quantity for unit",
        );
      const committed = lot.materialAllocations.reduce(
        (sum, allocation) => sum.plus(allocation.quantity),
        new Prisma.Decimal(0),
      );
      if (committed.plus(quantity).greaterThan(lot.acceptedQuantity))
        throw new ConflictException(
          "Allocation exceeds accepted available lot quantity",
        );
      const allocation = await transaction.materialAllocation.create({
        data: {
          bomLineId: bomLine.id,
          conditionalUseAuthorizedByUserId: conditional
            ? input.actorUserId
            : null,
          conditionalUseReason: conditional
            ? input.conditionalUseReason!.trim()
            : null,
          createdByUserId: input.actorUserId,
          inventoryLotId: lot.id,
          projectId: input.projectId,
          quantity,
        },
      });
      await this.audit(transaction, {
        ...input,
        action: "material-allocation.created",
        changes: {
          bomLineId: bomLine.id,
          conditionalUseAuthorized: conditional,
          inventoryLotId: lot.id,
          quantity: quantity.toString(),
        },
        entityId: allocation.id,
      });
      if (conditional)
        await this.audit(transaction, {
          ...input,
          action: "material-allocation.conditional-use-authorized",
          changes: {
            inventoryLotId: lot.id,
            reason: input.conditionalUseReason!.trim(),
          },
          entityId: allocation.id,
        });
      return this.detailWith(transaction, allocation.id);
    });
  }

  private detailWith(transaction: Prisma.TransactionClient, id: string) {
    return transaction.materialAllocation
      .findUniqueOrThrow({ include: allocationInclude, where: { id } })
      .then(present);
  }

  async transition(
    input: ActorInput & {
      expectedVersion: number;
      id: string;
      reason: string;
      targetStatus: "CONSUMED" | "RELEASED";
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      const reference = await transaction.materialAllocation.findUnique({
        select: { inventoryLotId: true },
        where: { id: input.id },
      });
      if (!reference) throw new NotFoundException("Resource not found");
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM inventory_lots WHERE id = ${reference.inventoryLotId}::uuid FOR UPDATE`,
      );
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM material_allocations WHERE id = ${input.id}::uuid FOR UPDATE`,
      );
      const allocation = await transaction.materialAllocation.findUnique({
        where: { id: input.id },
      });
      if (!allocation) throw new NotFoundException("Resource not found");
      if (allocation.version !== input.expectedVersion)
        throw new ConflictException("Material allocation version is stale");
      if (!canTransitionAllocation(allocation.status, input.targetStatus))
        throw new ConflictException("Invalid material allocation transition");
      const now = new Date();
      await transaction.materialAllocation.update({
        data: {
          ...(input.targetStatus === "RELEASED"
            ? { releasedAt: now, releasedByUserId: input.actorUserId }
            : { consumedAt: now, consumedByUserId: input.actorUserId }),
          status: input.targetStatus,
          version: { increment: 1 },
        },
        where: { id: allocation.id },
      });
      await transaction.materialAllocationTransition.create({
        data: {
          actorUserId: input.actorUserId,
          materialAllocationId: allocation.id,
          quantitySnapshot: allocation.quantity,
          reason: input.reason.trim(),
          sourceStatus: allocation.status,
          targetStatus: input.targetStatus,
        },
      });
      await this.audit(transaction, {
        ...input,
        action: `material-allocation.${input.targetStatus.toLowerCase()}`,
        changes: {
          from: allocation.status,
          quantity: allocation.quantity.toString(),
          to: input.targetStatus,
        },
        entityId: allocation.id,
      });
      return this.detailWith(transaction, allocation.id);
    });
  }
}
