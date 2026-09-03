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
import { createInspectionForLot } from "./inspection-creation.js";
import {
  inspectionQuantityDecision,
  type InspectionDisposition,
} from "./inspection-quantity.js";

type ActorInput = {
  actorUserId: string | null;
  actorMembershipId?: string | null;
  systemPrincipal?: string | null;
  auditOrganizationId: string;
  context: RequestContext;
};

type DefinitionInput = {
  checkType: "CERTIFICATE" | "CHECKLIST" | "MEASUREMENT";
  code: string;
  decimalPrecision?: number;
  description?: string;
  maximumValue?: string;
  minimumValue?: string;
  name: string;
  required: boolean;
  unitOfMeasureId?: string;
};

const definitionInclude = {
  createdBy: { select: { displayName: true, id: true } },
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
} satisfies Prisma.InspectionCheckDefinitionInclude;

const inspectionInclude = {
  checks: {
    include: {
      evidenceDocument: {
        select: {
          category: true,
          currentVersionNumber: true,
          id: true,
          title: true,
          versions: {
            select: {
              id: true,
              scanStatus: true,
              status: true,
              versionNumber: true,
            },
          },
        },
      },
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
  conditionalAcceptanceAuthorizedBy: {
    select: { displayName: true, id: true },
  },
  createdBy: { select: { displayName: true, id: true } },
  finalizedBy: { select: { displayName: true, id: true } },
  inventoryLot: {
    include: {
      adjustments: { orderBy: { createdAt: "asc" as const } },
      item: { select: { code: true, id: true, name: true } },
      sourceGoodsReceipt: {
        select: { id: true, receiptNumber: true, receivedAt: true },
      },
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
  project: { select: { code: true, id: true, name: true } },
} satisfies Prisma.ReceivingInspectionInclude;

type InspectionPayload = Prisma.ReceivingInspectionGetPayload<{
  include: typeof inspectionInclude;
}>;

function presentDefinition(
  value: Prisma.InspectionCheckDefinitionGetPayload<{
    include: typeof definitionInclude;
  }>,
) {
  return {
    ...value,
    maximumValue: value.maximumValue?.toString() ?? null,
    minimumValue: value.minimumValue?.toString() ?? null,
  };
}

function presentInspection(
  value: InspectionPayload,
  evidenceDocuments: unknown[],
) {
  const adjustments = value.inventoryLot.adjustments.map((adjustment) => ({
    ...adjustment,
    quantityDelta: adjustment.quantityDelta.toString(),
  }));
  const effectiveQuantity = value.inventoryLot.quantity.plus(
    value.inventoryLot.adjustments.reduce(
      (sum, adjustment) => sum.plus(adjustment.quantityDelta),
      new Prisma.Decimal(0),
    ),
  );
  return {
    ...value,
    acceptedQuantity: value.acceptedQuantity.toString(),
    checks: value.checks.map((check) => ({
      ...check,
      maximumValue: check.maximumValue?.toString() ?? null,
      measuredValue: check.measuredValue?.toString() ?? null,
      minimumValue: check.minimumValue?.toString() ?? null,
    })),
    evidenceDocuments,
    finalizedReceivedQuantity:
      value.finalizedReceivedQuantity?.toString() ?? null,
    inventoryLot: {
      ...value.inventoryLot,
      acceptedQuantity: value.inventoryLot.acceptedQuantity.toString(),
      adjustments,
      effectiveQuantity: effectiveQuantity.toString(),
      quantity: value.inventoryLot.quantity.toString(),
      quarantinedQuantity: value.inventoryLot.quarantinedQuantity.toString(),
      rejectedQuantity: value.inventoryLot.rejectedQuantity.toString(),
    },
    quarantinedQuantity: value.quarantinedQuantity.toString(),
    receivedQuantityAtCreation: value.receivedQuantityAtCreation.toString(),
    rejectedQuantity: value.rejectedQuantity.toString(),
  };
}

@Injectable()
export class InspectionsRepository {
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

  projectIdForInspection(id: string) {
    return this.database.receivingInspection
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  projectIdForLot(id: string) {
    return this.database.inventoryLot
      .findUnique({ select: { projectId: true }, where: { id } })
      .then((value) => value?.projectId ?? null);
  }

  listDefinitions(itemId?: string) {
    return this.database.inspectionCheckDefinition
      .findMany({
        include: definitionInclude,
        orderBy: [{ item: { code: "asc" } }, { code: "asc" }],
        where: itemId ? { itemId } : {},
      })
      .then((rows) => rows.map(presentDefinition));
  }

  private async prepareDefinition(
    transaction: Prisma.TransactionClient,
    input: DefinitionInput,
    itemId: string,
  ) {
    const item = await transaction.item.findFirst({
      select: { id: true },
      where: { active: true, id: itemId },
    });
    if (!item)
      throw new UnprocessableEntityException(
        "Inspection checks require an active item",
      );
    const measurement = input.checkType === "MEASUREMENT";
    if (
      measurement !==
      (input.decimalPrecision !== undefined ||
        input.minimumValue !== undefined ||
        input.maximumValue !== undefined ||
        input.unitOfMeasureId !== undefined)
    )
      throw new UnprocessableEntityException(
        "Measurement configuration is valid only for measurement checks",
      );
    if (measurement && input.decimalPrecision === undefined)
      throw new UnprocessableEntityException(
        "Measurement checks require decimal precision",
      );
    let unit: { decimalPrecision: number; id: string } | null = null;
    if (input.unitOfMeasureId) {
      unit = await transaction.unitOfMeasure.findFirst({
        select: { decimalPrecision: true, id: true },
        where: { active: true, id: input.unitOfMeasureId },
      });
      if (!unit)
        throw new UnprocessableEntityException(
          "Measurement unit must be active",
        );
      if ((input.decimalPrecision ?? 0) > unit.decimalPrecision)
        throw new UnprocessableEntityException(
          "Measurement precision exceeds the selected unit precision",
        );
    }
    const minimum =
      input.minimumValue === undefined
        ? null
        : new Prisma.Decimal(input.minimumValue);
    const maximum =
      input.maximumValue === undefined
        ? null
        : new Prisma.Decimal(input.maximumValue);
    const precision = input.decimalPrecision ?? null;
    if (
      (minimum && minimum.decimalPlaces() > precision!) ||
      (maximum && maximum.decimalPlaces() > precision!) ||
      (minimum && maximum && minimum.gt(maximum))
    )
      throw new UnprocessableEntityException(
        "Measurement limits must match precision and minimum cannot exceed maximum",
      );
    return {
      checkType: input.checkType,
      code: input.code.trim().toUpperCase(),
      decimalPrecision: precision,
      description: input.description?.trim() ?? "",
      maximumValue: maximum,
      minimumValue: minimum,
      name: input.name.trim(),
      required: input.required,
      unitOfMeasureId: unit?.id ?? null,
    };
  }

  async createDefinition(
    input: ActorInput & DefinitionInput & { itemId: string },
  ) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const prepared = await this.prepareDefinition(
        transaction,
        input,
        input.itemId,
      );
      const created = await transaction.inspectionCheckDefinition.create({
        data: {
          ...prepared,
          createdByUserId: input.actorUserId as string,
          itemId: input.itemId,
        },
        include: definitionInclude,
      });
      await this.audit(transaction, {
        ...input,
        action: "INSPECTION_CHECK_DEFINITION_CREATED",
        changes: {
          checkType: prepared.checkType,
          code: prepared.code,
          itemId: input.itemId,
          required: prepared.required,
        },
        entityId: created.id,
        entityType: "InspectionCheckDefinition",
      });
      return presentDefinition(created);
    });
  }

  async updateDefinition(
    input: ActorInput &
      DefinitionInput & {
        active: boolean;
        definitionId: string;
        expectedVersion: number;
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
        Prisma.sql`SELECT id FROM inspection_check_definitions WHERE id = ${input.definitionId}::uuid FOR UPDATE`,
      );
      const current = await transaction.inspectionCheckDefinition.findUnique({
        where: { id: input.definitionId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (current.code !== input.code.trim().toUpperCase())
        throw new UnprocessableEntityException(
          "Inspection check code is immutable",
        );
      const prepared = await this.prepareDefinition(
        transaction,
        input,
        current.itemId,
      );
      const changed = await transaction.inspectionCheckDefinition.updateMany({
        data: {
          ...prepared,
          active: input.active,
          version: { increment: 1 },
        },
        where: { id: current.id, version: input.expectedVersion },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await this.audit(transaction, {
        ...input,
        action: "INSPECTION_CHECK_DEFINITION_UPDATED",
        changes: {
          active: input.active,
          checkType: prepared.checkType,
          required: prepared.required,
        },
        entityId: current.id,
        entityType: "InspectionCheckDefinition",
      });
      return presentDefinition(
        await transaction.inspectionCheckDefinition.findUniqueOrThrow({
          include: definitionInclude,
          where: { id: current.id },
        }),
      );
    });
  }

  private evidenceDocuments(
    database: Prisma.TransactionClient | PrismaClient,
    inspectionId: string,
  ) {
    return database.document.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        category: true,
        currentVersionNumber: true,
        id: true,
        title: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          select: {
            id: true,
            scanStatus: true,
            status: true,
            versionNumber: true,
          },
        },
      },
      where: {
        associations: {
          some: { entityId: inspectionId, entityType: "RECEIVING_INSPECTION" },
        },
      },
    });
  }

  private async detailWith(
    database: Prisma.TransactionClient | PrismaClient,
    id: string,
  ) {
    const [inspection, evidence] = await Promise.all([
      database.receivingInspection.findUnique({
        include: inspectionInclude,
        where: { id },
      }),
      this.evidenceDocuments(database, id),
    ]);
    return inspection ? presentInspection(inspection, evidence) : null;
  }

  list(projectId: string, status?: "FINALIZED" | "OPEN") {
    return this.database.receivingInspection
      .findMany({
        include: inspectionInclude,
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        where: { projectId, ...(status ? { status } : {}) },
      })
      .then(async (rows) =>
        Promise.all(
          rows.map(async (row) =>
            presentInspection(
              row,
              await this.evidenceDocuments(this.database, row.id),
            ),
          ),
        ),
      );
  }

  detail(id: string) {
    return this.detailWith(this.database, id);
  }

  async createExplicit(
    input: ActorInput & { inventoryLotId: string; projectId: string },
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
        Prisma.sql`SELECT id FROM inventory_lots WHERE id = ${input.inventoryLotId}::uuid FOR UPDATE`,
      );
      const lot = await transaction.inventoryLot.findFirst({
        include: { adjustments: true },
        where: {
          id: input.inventoryLotId,
          projectId: input.projectId,
          status: "AWAITING_INSPECTION",
        },
      });
      if (!lot) throw new NotFoundException("Resource not found");
      const effectiveQuantity = lot.quantity.plus(
        lot.adjustments.reduce(
          (sum, adjustment) => sum.plus(adjustment.quantityDelta),
          new Prisma.Decimal(0),
        ),
      );
      const id = await createInspectionForLot(transaction, {
        ...input,
        actorUserId: input.actorUserId as string,
        effectiveQuantity,
        itemId: lot.itemId,
        requireDefinitions: true,
        source: "EXPLICIT_COMMAND",
      });
      return this.detailWith(transaction, id!);
    });
  }

  private async approvedEvidence(
    transaction: Prisma.TransactionClient,
    inspectionId: string,
    projectId: string,
    documentId: string,
  ) {
    const document = await transaction.document.findFirst({
      include: {
        versions: {
          select: { scanStatus: true, status: true, versionNumber: true },
        },
      },
      where: {
        id: documentId,
        projectId,
        associations: {
          some: { entityId: inspectionId, entityType: "RECEIVING_INSPECTION" },
        },
      },
    });
    const version = document?.versions.find(
      (candidate) => candidate.versionNumber === document.currentVersionNumber,
    );
    return Boolean(
      version?.status === "APPROVED" && version.scanStatus === "CLEAN",
    );
  }

  async saveResults(
    input: ActorInput & {
      expectedVersion: number;
      inspectionId: string;
      results: Array<{
        certificateDecision?: "ACCEPTED" | "REJECTED";
        checkId: string;
        checklistPassed?: boolean;
        evidenceDocumentId?: string;
        measuredValue?: string;
        notes?: string;
      }>;
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
        Prisma.sql`SELECT id FROM receiving_inspections WHERE id = ${input.inspectionId}::uuid FOR UPDATE`,
      );
      const inspection = await transaction.receivingInspection.findUnique({
        include: { checks: true },
        where: { id: input.inspectionId },
      });
      if (!inspection) throw new NotFoundException("Resource not found");
      if (inspection.status !== "OPEN")
        throw new ConflictException("Receiving inspection is finalized");
      if (inspection.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const ids = input.results.map(({ checkId }) => checkId);
      if (new Set(ids).size !== ids.length)
        throw new UnprocessableEntityException(
          "An inspection check can appear only once",
        );
      const byId = new Map(inspection.checks.map((check) => [check.id, check]));
      if (ids.some((id) => !byId.has(id)))
        throw new UnprocessableEntityException(
          "Every result must belong to the receiving inspection",
        );
      const now = new Date();
      for (const result of input.results) {
        const check = byId.get(result.checkId)!;
        let checklistPassed: boolean | null = null;
        let measuredValue: Prisma.Decimal | null = null;
        let certificateDecision: "ACCEPTED" | "REJECTED" | null = null;
        let evidenceDocumentId: string | null = null;
        let conforming: boolean;
        if (check.checkType === "CHECKLIST") {
          if (
            typeof result.checklistPassed !== "boolean" ||
            result.measuredValue !== undefined ||
            result.certificateDecision !== undefined ||
            result.evidenceDocumentId !== undefined
          )
            throw new UnprocessableEntityException(
              "Checklist results require only a pass/fail value",
            );
          checklistPassed = result.checklistPassed;
          conforming = checklistPassed;
        } else if (check.checkType === "MEASUREMENT") {
          if (
            result.measuredValue === undefined ||
            result.checklistPassed !== undefined ||
            result.certificateDecision !== undefined ||
            result.evidenceDocumentId !== undefined
          )
            throw new UnprocessableEntityException(
              "Measurement results require only a measured value",
            );
          measuredValue = new Prisma.Decimal(result.measuredValue);
          if (measuredValue.decimalPlaces() > check.decimalPrecision!)
            throw new UnprocessableEntityException(
              "Measured value exceeds configured precision",
            );
          conforming =
            (!check.minimumValue || measuredValue.gte(check.minimumValue)) &&
            (!check.maximumValue || measuredValue.lte(check.maximumValue));
        } else {
          if (
            result.certificateDecision === undefined ||
            result.evidenceDocumentId === undefined ||
            result.checklistPassed !== undefined ||
            result.measuredValue !== undefined
          )
            throw new UnprocessableEntityException(
              "Certificate review requires a decision and linked evidence document",
            );
          if (
            !(await this.approvedEvidence(
              transaction,
              inspection.id,
              inspection.projectId,
              result.evidenceDocumentId,
            ))
          )
            throw new UnprocessableEntityException(
              "Certificate evidence must be an approved clean document linked to this inspection",
            );
          certificateDecision = result.certificateDecision;
          evidenceDocumentId = result.evidenceDocumentId;
          conforming = certificateDecision === "ACCEPTED";
        }
        await transaction.receivingInspectionCheck.update({
          data: {
            certificateDecision,
            checklistPassed,
            completedAt: now,
            conforming,
            evidenceDocumentId,
            measuredValue,
            notes: result.notes?.trim() ?? "",
          },
          where: { id: check.id },
        });
      }
      const changed = await transaction.receivingInspection.updateMany({
        data: { version: { increment: 1 } },
        where: {
          id: inspection.id,
          status: "OPEN",
          version: input.expectedVersion,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      await this.audit(transaction, {
        ...input,
        action: "RECEIVING_INSPECTION_RESULTS_RECORDED",
        changes: { resultCount: input.results.length },
        entityId: inspection.id,
        entityType: "ReceivingInspection",
      });
      return this.detailWith(transaction, inspection.id);
    });
  }

  async finalize(
    input: ActorInput & {
      acceptedQuantity: string;
      conditionalAuthorized: boolean;
      disposition: InspectionDisposition;
      expectedVersion: number;
      inspectionId: string;
      reason: string;
      rejectedQuantity: string;
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
        Prisma.sql`SELECT id FROM receiving_inspections WHERE id = ${input.inspectionId}::uuid FOR UPDATE`,
      );
      const inspection = await transaction.receivingInspection.findUnique({
        include: {
          checks: true,
        },
        where: { id: input.inspectionId },
      });
      if (!inspection) throw new NotFoundException("Resource not found");
      if (inspection.status !== "OPEN")
        throw new ConflictException(
          "Receiving inspection is already finalized",
        );
      if (inspection.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM inventory_lots WHERE id = ${inspection.inventoryLotId}::uuid FOR UPDATE`,
      );
      const lot = await transaction.inventoryLot.findUniqueOrThrow({
        include: { adjustments: true, unitOfMeasure: true },
        where: { id: inspection.inventoryLotId },
      });
      if (lot.status !== "AWAITING_INSPECTION")
        throw new ConflictException("Inventory lot is already dispositioned");
      if (
        inspection.checks.some(
          (check) => check.required && check.completedAt === null,
        )
      )
        throw new UnprocessableEntityException(
          "Every required inspection check must be completed",
        );
      if (
        input.disposition === "ACCEPTED" &&
        inspection.checks.some(
          (check) => check.required && check.conforming !== true,
        )
      )
        throw new UnprocessableEntityException(
          "Nonconforming required checks cannot receive an accepted disposition",
        );
      if (
        input.disposition === "CONDITIONALLY_ACCEPTED" &&
        !input.conditionalAuthorized
      )
        throw new UnprocessableEntityException(
          "Conditional acceptance requires explicit permission",
        );
      const received = lot.quantity.plus(
        lot.adjustments.reduce(
          (sum, adjustment) => sum.plus(adjustment.quantityDelta),
          new Prisma.Decimal(0),
        ),
      );
      let quantities;
      try {
        quantities = inspectionQuantityDecision({
          acceptedQuantity: input.acceptedQuantity,
          decimalPrecision: lot.unitOfMeasure.decimalPrecision,
          disposition: input.disposition,
          receivedQuantity: received,
          rejectedQuantity: input.rejectedQuantity,
        });
      } catch (error) {
        throw new UnprocessableEntityException(
          error instanceof Error
            ? error.message
            : "Invalid inspection quantities",
        );
      }
      const now = new Date();
      const changed = await transaction.receivingInspection.updateMany({
        data: {
          acceptedQuantity: quantities.accepted,
          conditionalAcceptanceAuthorizedByUserId:
            input.disposition === "CONDITIONALLY_ACCEPTED"
              ? (input.actorUserId as string)
              : null,
          disposition: input.disposition,
          finalizedAt: now,
          finalizedByUserId: input.actorUserId as string,
          finalizedReceivedQuantity: received,
          quarantinedQuantity: quantities.quarantined,
          reason: input.reason.trim(),
          rejectedQuantity: quantities.rejected,
          status: "FINALIZED",
          version: { increment: 1 },
        },
        where: {
          id: inspection.id,
          status: "OPEN",
          version: input.expectedVersion,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Concurrent modification");
      const lotChanged = await transaction.inventoryLot.updateMany({
        data: {
          acceptedQuantity: quantities.accepted,
          quarantinedQuantity: quantities.quarantined,
          rejectedQuantity: quantities.rejected,
          status: input.disposition,
        },
        where: {
          id: inspection.inventoryLotId,
          status: "AWAITING_INSPECTION",
        },
      });
      if (lotChanged.count !== 1)
        throw new ConflictException("Inventory lot changed concurrently");
      if (input.disposition === "CONDITIONALLY_ACCEPTED")
        await this.audit(transaction, {
          ...input,
          action: "RECEIVING_INSPECTION_CONDITIONAL_ACCEPTANCE_AUTHORIZED",
          changes: {
            acceptedQuantity: quantities.accepted.toString(),
            reason: input.reason.trim(),
          },
          entityId: inspection.id,
          entityType: "ReceivingInspection",
        });
      await this.audit(transaction, {
        ...input,
        action: "RECEIVING_INSPECTION_FINALIZED",
        changes: {
          acceptedQuantity: quantities.accepted.toString(),
          disposition: input.disposition,
          inventoryLotId: inspection.inventoryLotId,
          quarantinedQuantity: quantities.quarantined.toString(),
          receivedQuantity: received.toString(),
          reason: input.reason.trim(),
          rejectedQuantity: quantities.rejected.toString(),
        },
        entityId: inspection.id,
        entityType: "ReceivingInspection",
      });
      return this.detailWith(transaction, inspection.id);
    });
  }
}
