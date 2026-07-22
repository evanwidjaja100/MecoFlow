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
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type {
  SpecificationDataType,
  ValidatedSpecificationValue,
} from "./item-validation.js";

interface AuditInput {
  action: string;
  actorUserId: string;
  changes: Prisma.InputJsonValue;
  context: RequestContext;
  entityId: string;
  entityType: string;
  organizationId: string;
}

export interface ItemFilters {
  active?: boolean;
  categoryId?: string;
  direction: "asc" | "desc";
  q?: string;
  sort: "code" | "name" | "updatedAt";
  unitOfMeasureId?: string;
}

const itemDetailInclude = {
  itemCategory: true,
  specificationValues: {
    include: {
      attributeDefinition: { include: { unitOfMeasure: true } },
    },
    orderBy: { attributeDefinition: { sortOrder: "asc" as const } },
  },
  unitOfMeasure: true,
} as const;

type ItemDetailRecord = Prisma.ItemGetPayload<{
  include: typeof itemDetailInclude;
}>;

function isPrismaError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function duplicate(error: unknown, entity: string): never {
  if (isPrismaError(error, "P2002"))
    throw new UnprocessableEntityException(`Duplicate ${entity} code`);
  throw error;
}

function itemWhere(input: ItemFilters): Prisma.ItemWhereInput {
  return {
    ...(input.active === undefined ? {} : { active: input.active }),
    ...(input.categoryId ? { itemCategoryId: input.categoryId } : {}),
    ...(input.unitOfMeasureId
      ? { unitOfMeasureId: input.unitOfMeasureId }
      : {}),
    ...(input.q
      ? {
          OR: [
            { code: { contains: input.q, mode: "insensitive" as const } },
            { name: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

function itemOrderBy(
  input: ItemFilters,
): Prisma.ItemOrderByWithRelationInput[] {
  if (input.sort === "name") return [{ name: input.direction }, { id: "asc" }];
  if (input.sort === "updatedAt")
    return [{ updatedAt: input.direction }, { id: "asc" }];
  return [{ code: input.direction }, { id: "asc" }];
}

function specificationData(itemId: string, value: ValidatedSpecificationValue) {
  return {
    attributeDefinitionId: value.attributeDefinitionId,
    booleanValue: value.booleanValue ?? null,
    itemId,
    numericValue: value.numericValue ?? null,
    textValue: value.textValue ?? null,
  };
}

function presentItem(item: ItemDetailRecord) {
  const { specificationValues, ...record } = item;
  return {
    ...record,
    specificationValues: specificationValues.map((entry) => ({
      attributeDefinition: entry.attributeDefinition,
      attributeDefinitionId: entry.attributeDefinitionId,
      value:
        entry.attributeDefinition.dataType === "BOOLEAN"
          ? entry.booleanValue
          : entry.attributeDefinition.dataType === "NUMBER"
            ? entry.numericValue?.toString()
            : entry.textValue,
    })),
  };
}

@Injectable()
export class ItemsRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private audit(transaction: Prisma.TransactionClient, input: AuditInput) {
    return transaction.auditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: input.entityType,
        organizationId: input.organizationId,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
      },
    });
  }

  listItemCategories() {
    return this.database.itemCategory.findMany({
      include: {
        specificationAttributes: {
          include: { unitOfMeasure: true },
          orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });
  }

  activeItemCategory(id: string) {
    return this.database.itemCategory.findFirst({
      where: { active: true, id },
    });
  }

  async createItemCategory(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    name: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        const category = await transaction.itemCategory.create({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
          },
        });
        await this.audit(transaction, {
          action: "ITEM_CATEGORY_CREATED",
          actorUserId: input.actorUserId,
          changes: { code: { from: null, to: category.code } },
          context: input.context,
          entityId: category.id,
          entityType: "ItemCategory",
          organizationId: input.auditOrganizationId,
        });
        return category;
      });
    } catch (error) {
      duplicate(error, "item category");
    }
  }

  async updateItemCategory(input: {
    active: boolean;
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    id: string;
    name: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${input.id}::uuid FOR UPDATE`;
        const current = await transaction.itemCategory.findUnique({
          where: { id: input.id },
        });
        if (!current) throw new NotFoundException("Resource not found");
        if (current.version !== input.expectedVersion)
          throw new ConflictException("Concurrent modification");
        if (!input.active && current.active) {
          const activeItems = await transaction.item.count({
            where: { active: true, itemCategoryId: input.id },
          });
          if (activeItems > 0)
            throw new UnprocessableEntityException(
              "Item category is used by active items",
            );
        }
        const result = await transaction.itemCategory.updateMany({
          data: {
            active: input.active,
            code: input.code,
            description: input.description,
            name: input.name,
            version: { increment: 1 },
          },
          where: { id: input.id, version: input.expectedVersion },
        });
        if (result.count !== 1)
          throw new ConflictException("Concurrent modification");
        const updated = await transaction.itemCategory.findUniqueOrThrow({
          where: { id: input.id },
        });
        await this.audit(transaction, {
          action: "ITEM_CATEGORY_UPDATED",
          actorUserId: input.actorUserId,
          changes: {
            active: { from: current.active, to: updated.active },
            code: { from: current.code, to: updated.code },
            name: { from: current.name, to: updated.name },
          },
          context: input.context,
          entityId: updated.id,
          entityType: "ItemCategory",
          organizationId: input.auditOrganizationId,
        });
        return updated;
      });
    } catch (error) {
      duplicate(error, "item category");
    }
  }

  listUnitsOfMeasure() {
    return this.database.unitOfMeasure.findMany({ orderBy: { name: "asc" } });
  }

  activeUnitOfMeasure(id: string) {
    return this.database.unitOfMeasure.findFirst({
      where: { active: true, id },
    });
  }

  async createUnitOfMeasure(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    decimalPrecision: number;
    name: string;
    symbol: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        const unit = await transaction.unitOfMeasure.create({
          data: {
            code: input.code,
            decimalPrecision: input.decimalPrecision,
            name: input.name,
            symbol: input.symbol,
          },
        });
        await this.audit(transaction, {
          action: "UNIT_OF_MEASURE_CREATED",
          actorUserId: input.actorUserId,
          changes: {
            code: { from: null, to: unit.code },
            decimalPrecision: { from: null, to: unit.decimalPrecision },
          },
          context: input.context,
          entityId: unit.id,
          entityType: "UnitOfMeasure",
          organizationId: input.auditOrganizationId,
        });
        return unit;
      });
    } catch (error) {
      duplicate(error, "unit of measure");
    }
  }

  async updateUnitOfMeasure(input: {
    active: boolean;
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    decimalPrecision: number;
    expectedVersion: number;
    id: string;
    name: string;
    symbol: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.id}::uuid FOR UPDATE`;
        const current = await transaction.unitOfMeasure.findUnique({
          where: { id: input.id },
        });
        if (!current) throw new NotFoundException("Resource not found");
        if (current.version !== input.expectedVersion)
          throw new ConflictException("Concurrent modification");
        const incompatibleAttributes =
          await transaction.specificationAttributeDefinition.count({
            where: {
              active: true,
              decimalPrecision: { gt: input.decimalPrecision },
              unitOfMeasureId: input.id,
            },
          });
        if (incompatibleAttributes > 0)
          throw new UnprocessableEntityException(
            "Unit precision is used by specification attributes",
          );
        if (!input.active && current.active) {
          const activeItems = await transaction.item.count({
            where: { active: true, unitOfMeasureId: input.id },
          });
          const activeAttributes =
            await transaction.specificationAttributeDefinition.count({
              where: { active: true, unitOfMeasureId: input.id },
            });
          if (activeItems > 0 || activeAttributes > 0)
            throw new UnprocessableEntityException(
              "Unit of measure is used by active records",
            );
        }
        const result = await transaction.unitOfMeasure.updateMany({
          data: {
            active: input.active,
            code: input.code,
            decimalPrecision: input.decimalPrecision,
            name: input.name,
            symbol: input.symbol,
            version: { increment: 1 },
          },
          where: { id: input.id, version: input.expectedVersion },
        });
        if (result.count !== 1)
          throw new ConflictException("Concurrent modification");
        const updated = await transaction.unitOfMeasure.findUniqueOrThrow({
          where: { id: input.id },
        });
        await this.audit(transaction, {
          action: "UNIT_OF_MEASURE_UPDATED",
          actorUserId: input.actorUserId,
          changes: {
            active: { from: current.active, to: updated.active },
            code: { from: current.code, to: updated.code },
            decimalPrecision: {
              from: current.decimalPrecision,
              to: updated.decimalPrecision,
            },
          },
          context: input.context,
          entityId: updated.id,
          entityType: "UnitOfMeasure",
          organizationId: input.auditOrganizationId,
        });
        return updated;
      });
    } catch (error) {
      duplicate(error, "unit of measure");
    }
  }

  specificationDefinitions(itemCategoryId: string) {
    return this.database.specificationAttributeDefinition.findMany({
      include: { unitOfMeasure: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      where: { itemCategoryId },
    });
  }

  async createSpecificationAttribute(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    dataType: SpecificationDataType;
    decimalPrecision?: number;
    description: string;
    itemCategoryId: string;
    name: string;
    required: boolean;
    sortOrder: number;
    unitOfMeasureId?: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${input.itemCategoryId}::uuid FOR UPDATE`;
        const category = await transaction.itemCategory.findFirst({
          where: { active: true, id: input.itemCategoryId },
        });
        if (!category)
          throw new UnprocessableEntityException(
            "Item category is unavailable",
          );
        if (input.unitOfMeasureId) {
          await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.unitOfMeasureId}::uuid FOR SHARE`;
          const unit = await transaction.unitOfMeasure.findFirst({
            where: { active: true, id: input.unitOfMeasureId },
          });
          if (!unit)
            throw new UnprocessableEntityException(
              "Unit of measure is unavailable",
            );
        }
        if (input.required) {
          const existingItems = await transaction.item.count({
            where: { active: true, itemCategoryId: input.itemCategoryId },
          });
          if (existingItems > 0)
            throw new UnprocessableEntityException(
              "A required attribute cannot be added after active items exist",
            );
        }
        const attribute =
          await transaction.specificationAttributeDefinition.create({
            data: {
              code: input.code,
              dataType: input.dataType,
              decimalPrecision: input.decimalPrecision ?? null,
              description: input.description,
              itemCategoryId: input.itemCategoryId,
              name: input.name,
              required: input.required,
              sortOrder: input.sortOrder,
              unitOfMeasureId: input.unitOfMeasureId ?? null,
            },
            include: { unitOfMeasure: true },
          });
        await this.audit(transaction, {
          action: "SPECIFICATION_ATTRIBUTE_CREATED",
          actorUserId: input.actorUserId,
          changes: {
            code: { from: null, to: attribute.code },
            dataType: { from: null, to: attribute.dataType },
          },
          context: input.context,
          entityId: attribute.id,
          entityType: "SpecificationAttributeDefinition",
          organizationId: input.auditOrganizationId,
        });
        return attribute;
      });
    } catch (error) {
      duplicate(error, "specification attribute");
    }
  }

  async updateSpecificationAttribute(input: {
    active: boolean;
    actorUserId: string;
    attributeId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    dataType: SpecificationDataType;
    decimalPrecision?: number;
    description: string;
    expectedVersion: number;
    itemCategoryId: string;
    name: string;
    required: boolean;
    sortOrder: number;
    unitOfMeasureId?: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${input.itemCategoryId}::uuid FOR UPDATE`;
        await transaction.$queryRaw`SELECT id FROM specification_attribute_definitions WHERE id = ${input.attributeId}::uuid FOR UPDATE`;
        const current =
          await transaction.specificationAttributeDefinition.findFirst({
            include: { _count: { select: { specificationValues: true } } },
            where: {
              id: input.attributeId,
              itemCategoryId: input.itemCategoryId,
            },
          });
        if (!current) throw new NotFoundException("Resource not found");
        if (current.version !== input.expectedVersion)
          throw new ConflictException("Concurrent modification");
        if (input.unitOfMeasureId) {
          await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.unitOfMeasureId}::uuid FOR SHARE`;
          const unit = await transaction.unitOfMeasure.findFirst({
            where: { active: true, id: input.unitOfMeasureId },
          });
          if (!unit)
            throw new UnprocessableEntityException(
              "Unit of measure is unavailable",
            );
        }
        const structuralChange =
          current.dataType !== input.dataType ||
          current.decimalPrecision !== (input.decimalPrecision ?? null) ||
          current.unitOfMeasureId !== (input.unitOfMeasureId ?? null);
        if (structuralChange && current._count.specificationValues > 0)
          throw new UnprocessableEntityException(
            "Used specification attribute structure cannot change",
          );
        if (
          input.active &&
          input.required &&
          (!current.active || !current.required)
        ) {
          const missingValues = await transaction.item.count({
            where: {
              active: true,
              itemCategoryId: input.itemCategoryId,
              specificationValues: {
                none: { attributeDefinitionId: input.attributeId },
              },
            },
          });
          if (missingValues > 0)
            throw new UnprocessableEntityException(
              "Active items are missing the required specification",
            );
        }
        const result =
          await transaction.specificationAttributeDefinition.updateMany({
            data: {
              active: input.active,
              code: input.code,
              dataType: input.dataType,
              decimalPrecision: input.decimalPrecision ?? null,
              description: input.description,
              name: input.name,
              required: input.required,
              sortOrder: input.sortOrder,
              unitOfMeasureId: input.unitOfMeasureId ?? null,
              version: { increment: 1 },
            },
            where: { id: input.attributeId, version: input.expectedVersion },
          });
        if (result.count !== 1)
          throw new ConflictException("Concurrent modification");
        const updated =
          await transaction.specificationAttributeDefinition.findUniqueOrThrow({
            include: { unitOfMeasure: true },
            where: { id: input.attributeId },
          });
        await this.audit(transaction, {
          action: "SPECIFICATION_ATTRIBUTE_UPDATED",
          actorUserId: input.actorUserId,
          changes: {
            active: { from: current.active, to: updated.active },
            code: { from: current.code, to: updated.code },
            required: { from: current.required, to: updated.required },
          },
          context: input.context,
          entityId: updated.id,
          entityType: "SpecificationAttributeDefinition",
          organizationId: input.auditOrganizationId,
        });
        return updated;
      });
    } catch (error) {
      duplicate(error, "specification attribute");
    }
  }

  async listItems(input: ItemFilters & { page: number; pageSize: number }) {
    const where = itemWhere(input);
    const [data, total] = await this.database.$transaction([
      this.database.item.findMany({
        include: { itemCategory: true, unitOfMeasure: true },
        orderBy: itemOrderBy(input),
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        where,
      }),
      this.database.item.count({ where }),
    ]);
    return { data, total };
  }

  async itemDetail(id: string) {
    const item = await this.database.item.findUnique({
      include: itemDetailInclude,
      where: { id },
    });
    return item ? presentItem(item) : null;
  }

  async createItem(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    itemCategoryId: string;
    name: string;
    specificationValues: ValidatedSpecificationValue[];
    unitOfMeasureId: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${input.itemCategoryId}::uuid FOR SHARE`;
        await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.unitOfMeasureId}::uuid FOR SHARE`;
        await transaction.$queryRaw`SELECT id FROM specification_attribute_definitions WHERE "itemCategoryId" = ${input.itemCategoryId}::uuid FOR SHARE`;
        const category = await transaction.itemCategory.findFirst({
          where: { active: true, id: input.itemCategoryId },
        });
        const unit = await transaction.unitOfMeasure.findFirst({
          where: { active: true, id: input.unitOfMeasureId },
        });
        if (!category || !unit)
          throw new UnprocessableEntityException(
            "Item category or unit is unavailable",
          );
        const availableDefinitions =
          await transaction.specificationAttributeDefinition.findMany({
            where: { active: true, itemCategoryId: input.itemCategoryId },
          });
        const definitionIds = new Set(availableDefinitions.map(({ id }) => id));
        if (
          input.specificationValues.some(
            ({ attributeDefinitionId }) =>
              !definitionIds.has(attributeDefinitionId),
          ) ||
          availableDefinitions.some(
            ({ id, required }) =>
              required &&
              !input.specificationValues.some(
                ({ attributeDefinitionId }) => attributeDefinitionId === id,
              ),
          )
        )
          throw new UnprocessableEntityException(
            "Specification definitions changed",
          );
        const item = await transaction.item.create({
          data: {
            code: input.code,
            createdByUserId: input.actorUserId,
            description: input.description,
            itemCategoryId: input.itemCategoryId,
            name: input.name,
            specificationValues: {
              create: input.specificationValues.map((value) => ({
                attributeDefinitionId: value.attributeDefinitionId,
                booleanValue: value.booleanValue ?? null,
                numericValue: value.numericValue ?? null,
                textValue: value.textValue ?? null,
              })),
            },
            unitOfMeasureId: input.unitOfMeasureId,
          },
          include: itemDetailInclude,
        });
        await this.audit(transaction, {
          action: "ITEM_CREATED",
          actorUserId: input.actorUserId,
          changes: {
            code: { from: null, to: item.code },
            specificationAttributeIds: input.specificationValues.map(
              ({ attributeDefinitionId }) => attributeDefinitionId,
            ),
          },
          context: input.context,
          entityId: item.id,
          entityType: "Item",
          organizationId: input.auditOrganizationId,
        });
        return presentItem(item);
      });
    } catch (error) {
      duplicate(error, "item");
    }
  }

  async updateItem(input: {
    actorUserId: string;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    id: string;
    name: string;
    specificationValues: ValidatedSpecificationValue[];
    unitOfMeasureId: string;
  }) {
    try {
      return await this.database.$transaction(async (transaction) => {
        const current = await transaction.item.findUnique({
          where: { id: input.id },
        });
        if (!current) throw new NotFoundException("Resource not found");
        if (current.version !== input.expectedVersion)
          throw new ConflictException("Concurrent modification");
        if (!current.active)
          throw new UnprocessableEntityException(
            "Deactivated items are read-only",
          );
        await transaction.$queryRaw`SELECT id FROM item_categories WHERE id = ${current.itemCategoryId}::uuid FOR SHARE`;
        await transaction.$queryRaw`SELECT id FROM units_of_measure WHERE id = ${input.unitOfMeasureId}::uuid FOR SHARE`;
        await transaction.$queryRaw`SELECT id FROM specification_attribute_definitions WHERE "itemCategoryId" = ${current.itemCategoryId}::uuid FOR SHARE`;
        const unit = await transaction.unitOfMeasure.findFirst({
          where: { active: true, id: input.unitOfMeasureId },
        });
        if (!unit)
          throw new UnprocessableEntityException(
            "Unit of measure is unavailable",
          );
        const availableDefinitions =
          await transaction.specificationAttributeDefinition.findMany({
            where: { active: true, itemCategoryId: current.itemCategoryId },
          });
        const definitionIds = new Set(availableDefinitions.map(({ id }) => id));
        if (
          input.specificationValues.some(
            ({ attributeDefinitionId }) =>
              !definitionIds.has(attributeDefinitionId),
          ) ||
          availableDefinitions.some(
            ({ id, required }) =>
              required &&
              !input.specificationValues.some(
                ({ attributeDefinitionId }) => attributeDefinitionId === id,
              ),
          )
        )
          throw new UnprocessableEntityException(
            "Specification definitions changed",
          );
        const result = await transaction.item.updateMany({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
            unitOfMeasureId: input.unitOfMeasureId,
            version: { increment: 1 },
          },
          where: { id: input.id, version: input.expectedVersion },
        });
        if (result.count !== 1)
          throw new ConflictException("Concurrent modification");
        await transaction.itemSpecificationValue.deleteMany({
          where: { itemId: input.id },
        });
        if (input.specificationValues.length > 0)
          await transaction.itemSpecificationValue.createMany({
            data: input.specificationValues.map((value) =>
              specificationData(input.id, value),
            ),
          });
        const updated = await transaction.item.findUniqueOrThrow({
          include: itemDetailInclude,
          where: { id: input.id },
        });
        await this.audit(transaction, {
          action: "ITEM_UPDATED",
          actorUserId: input.actorUserId,
          changes: {
            code: { from: current.code, to: updated.code },
            name: { from: current.name, to: updated.name },
            specificationAttributeIds: input.specificationValues.map(
              ({ attributeDefinitionId }) => attributeDefinitionId,
            ),
            unitOfMeasureId: {
              from: current.unitOfMeasureId,
              to: updated.unitOfMeasureId,
            },
          },
          context: input.context,
          entityId: updated.id,
          entityType: "Item",
          organizationId: input.auditOrganizationId,
        });
        return presentItem(updated);
      });
    } catch (error) {
      duplicate(error, "item");
    }
  }

  async deactivateItem(input: {
    actorUserId: string;
    auditOrganizationId: string;
    context: RequestContext;
    expectedVersion: number;
    id: string;
    reason: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const current = await transaction.item.findUnique({
        where: { id: input.id },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (!current.active)
        throw new UnprocessableEntityException("Item is already deactivated");
      const result = await transaction.item.updateMany({
        data: { active: false, version: { increment: 1 } },
        where: {
          active: true,
          id: input.id,
          version: input.expectedVersion,
        },
      });
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.item.findUniqueOrThrow({
        include: itemDetailInclude,
        where: { id: input.id },
      });
      await this.audit(transaction, {
        action: "ITEM_DEACTIVATED",
        actorUserId: input.actorUserId,
        changes: {
          active: { from: true, to: false },
          reason: input.reason,
        },
        context: input.context,
        entityId: updated.id,
        entityType: "Item",
        organizationId: input.auditOrganizationId,
      });
      return presentItem(updated);
    });
  }

  exportItems(
    principal: AuthenticatedPrincipal,
    input: ItemFilters,
    audit: {
      auditOrganizationId: string;
      context: RequestContext;
    },
  ) {
    return this.database.$transaction(async (transaction) => {
      const rows = await transaction.item.findMany({
        include: {
          itemCategory: true,
          specificationValues: {
            include: {
              attributeDefinition: { include: { unitOfMeasure: true } },
            },
            orderBy: { attributeDefinition: { sortOrder: "asc" } },
          },
          unitOfMeasure: true,
        },
        orderBy: itemOrderBy(input),
        take: 10001,
        where: itemWhere(input),
      });
      if (rows.length > 10000)
        throw new UnprocessableEntityException(
          "Export exceeds the 10000 item limit",
        );
      await this.audit(transaction, {
        action: "ITEMS_EXPORTED",
        actorUserId: principal.user.id,
        changes: {
          count: rows.length,
          filters: {
            active: input.active ?? null,
            categoryId: input.categoryId ?? null,
            searchApplied: Boolean(input.q),
            unitOfMeasureId: input.unitOfMeasureId ?? null,
          },
        },
        context: audit.context,
        entityId: "items",
        entityType: "ItemExport",
        organizationId: audit.auditOrganizationId,
      });
      return rows;
    });
  }
}
