import { UnprocessableEntityException } from "@nestjs/common";
import type { Prisma } from "@mecoflow/database";
import type { RequestContext } from "../identity/identity.types.js";

export async function createInspectionForLot(
  transaction: Prisma.TransactionClient,
  input: {
    actorUserId: string;
    auditOrganizationId: string;
    context: RequestContext;
    effectiveQuantity: Prisma.Decimal;
    inventoryLotId: string;
    itemId: string;
    projectId: string;
    requireDefinitions: boolean;
    source: "AUTOMATIC_RECEIPT_POSTING" | "EXPLICIT_COMMAND";
  },
): Promise<string | null> {
  const existing = await transaction.receivingInspection.findUnique({
    select: { id: true },
    where: { inventoryLotId: input.inventoryLotId },
  });
  if (existing) return existing.id;
  const definitions = await transaction.inspectionCheckDefinition.findMany({
    orderBy: [{ code: "asc" }, { id: "asc" }],
    where: { active: true, itemId: input.itemId },
  });
  if (definitions.length === 0) {
    if (input.requireDefinitions)
      throw new UnprocessableEntityException(
        "The material has no active inspection check definitions",
      );
    return null;
  }
  const inspection = await transaction.receivingInspection.create({
    data: {
      checks: {
        createMany: {
          data: definitions.map((definition, index) => ({
            checkType: definition.checkType,
            code: definition.code,
            decimalPrecision: definition.decimalPrecision,
            definitionId: definition.id,
            description: definition.description,
            lineNumber: index + 1,
            maximumValue: definition.maximumValue,
            minimumValue: definition.minimumValue,
            name: definition.name,
            required: definition.required,
            unitOfMeasureId: definition.unitOfMeasureId,
          })),
        },
      },
      createdByUserId: input.actorUserId,
      inventoryLotId: input.inventoryLotId,
      projectId: input.projectId,
      receivedQuantityAtCreation: input.effectiveQuantity,
    },
  });
  await transaction.auditEvent.create({
    data: {
      action: "RECEIVING_INSPECTION_CREATED",
      actorUserId: input.actorUserId,
      changes: {
        checkCount: definitions.length,
        inventoryLotId: input.inventoryLotId,
        source: input.source,
      },
      correlationId: input.context.correlationId,
      entityId: inspection.id,
      entityType: "ReceivingInspection",
      organizationId: input.auditOrganizationId,
      outcome: "SUCCESS",
      requestId: input.context.requestId,
    },
  });
  return inspection.id;
}
