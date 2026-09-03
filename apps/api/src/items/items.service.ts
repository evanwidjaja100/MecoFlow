import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { ItemAuthorizationPolicy } from "./item-authorization.policy.js";
import { createItemsCsv } from "./item-csv.js";
import {
  isDecimalPrecision,
  type SpecificationDataType,
  type SpecificationValueInput,
  validateSpecificationDefinition,
  validateSpecificationValues,
} from "./item-validation.js";
import { ItemsRepository, type ItemFilters } from "./items.repository.js";

function text(value: string | undefined): string {
  return value?.trim() ?? "";
}

function code(value: string): string {
  return value.trim().toUpperCase();
}

@Injectable()
export class ItemsService {
  constructor(
    @Inject(ItemAuthorizationPolicy)
    private readonly policy: ItemAuthorizationPolicy,
    @Inject(ItemsRepository)
    private readonly repository: ItemsRepository,
  ) {}

  listItemCategories(principal: AuthenticatedPrincipal) {
    this.policy.requireRead(principal);
    return this.repository.listItemCategories();
  }

  createItemCategory(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: { code: string; description?: string; name: string },
  ) {
    const membership = this.policy.requireWrite(principal);
    return this.repository.createItemCategory({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      name: input.name.trim(),
    });
  }

  updateItemCategory(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      active: boolean;
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    return this.repository.updateItemCategory({
      ...input,
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      id,
      name: input.name.trim(),
    });
  }

  listUnitsOfMeasure(principal: AuthenticatedPrincipal) {
    this.policy.requireRead(principal);
    return this.repository.listUnitsOfMeasure();
  }

  createUnitOfMeasure(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: {
      code: string;
      decimalPrecision: number;
      name: string;
      symbol: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    if (!isDecimalPrecision(input.decimalPrecision))
      throw new UnprocessableEntityException("Invalid decimal precision");
    return this.repository.createUnitOfMeasure({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      decimalPrecision: input.decimalPrecision,
      name: input.name.trim(),
      symbol: input.symbol.trim(),
    });
  }

  updateUnitOfMeasure(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      active: boolean;
      code: string;
      decimalPrecision: number;
      expectedVersion: number;
      name: string;
      symbol: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    if (!isDecimalPrecision(input.decimalPrecision))
      throw new UnprocessableEntityException("Invalid decimal precision");
    return this.repository.updateUnitOfMeasure({
      ...input,
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      id,
      name: input.name.trim(),
      symbol: input.symbol.trim(),
    });
  }

  private async validatedDefinition(input: {
    dataType: SpecificationDataType;
    decimalPrecision?: number;
    unitOfMeasureId?: string;
  }): Promise<void> {
    const unit = input.unitOfMeasureId
      ? await this.repository.activeUnitOfMeasure(input.unitOfMeasureId)
      : null;
    if (input.unitOfMeasureId && !unit)
      throw new UnprocessableEntityException("Unit of measure is unavailable");
    validateSpecificationDefinition({
      dataType: input.dataType,
      ...(input.decimalPrecision === undefined
        ? {}
        : { decimalPrecision: input.decimalPrecision }),
      ...(unit ? { unitDecimalPrecision: unit.decimalPrecision } : {}),
      ...(input.unitOfMeasureId
        ? { unitOfMeasureId: input.unitOfMeasureId }
        : {}),
    });
  }

  async createSpecificationAttribute(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    itemCategoryId: string,
    input: {
      code: string;
      dataType: SpecificationDataType;
      decimalPrecision?: number;
      description?: string;
      name: string;
      required: boolean;
      sortOrder: number;
      unitOfMeasureId?: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    await this.validatedDefinition(input);
    return this.repository.createSpecificationAttribute({
      ...input,
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      itemCategoryId,
      name: input.name.trim(),
    });
  }

  async updateSpecificationAttribute(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    itemCategoryId: string,
    attributeId: string,
    input: {
      active: boolean;
      code: string;
      dataType: SpecificationDataType;
      decimalPrecision?: number;
      description?: string;
      expectedVersion: number;
      name: string;
      required: boolean;
      sortOrder: number;
      unitOfMeasureId?: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    await this.validatedDefinition(input);
    return this.repository.updateSpecificationAttribute({
      ...input,
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      attributeId,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      itemCategoryId,
      name: input.name.trim(),
    });
  }

  private filters(input: {
    active?: "false" | "true";
    categoryId?: string;
    direction?: "asc" | "desc";
    q?: string;
    sort?: "code" | "name" | "updatedAt";
    unitOfMeasureId?: string;
  }): ItemFilters {
    return {
      direction: input.direction ?? "asc",
      sort: input.sort ?? "code",
      ...(input.active === undefined
        ? {}
        : { active: input.active === "true" }),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(text(input.q) ? { q: text(input.q) } : {}),
      ...(input.unitOfMeasureId
        ? { unitOfMeasureId: input.unitOfMeasureId }
        : {}),
    };
  }

  listItems(
    principal: AuthenticatedPrincipal,
    input: {
      active?: "false" | "true";
      categoryId?: string;
      direction?: "asc" | "desc";
      page?: string;
      pageSize?: string;
      q?: string;
      sort?: "code" | "name" | "updatedAt";
      unitOfMeasureId?: string;
    },
  ) {
    this.policy.requireRead(principal);
    const page = Number(input.page ?? "1");
    const pageSize = Number(input.pageSize ?? "20");
    if (page < 1 || pageSize < 1 || pageSize > 100)
      throw new UnprocessableEntityException("Invalid pagination");
    return this.repository.listItems({
      ...this.filters(input),
      page,
      pageSize,
    });
  }

  async itemDetail(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requireRead(principal);
    const item = await this.repository.itemDetail(id);
    if (!item) throw new NotFoundException("Resource not found");
    return item;
  }

  private async validatedItemValues(
    itemCategoryId: string,
    unitOfMeasureId: string,
    values: readonly SpecificationValueInput[],
  ) {
    const [category, unit, definitions] = await Promise.all([
      this.repository.activeItemCategory(itemCategoryId),
      this.repository.activeUnitOfMeasure(unitOfMeasureId),
      this.repository.specificationDefinitions(itemCategoryId),
    ]);
    if (!category || !unit)
      throw new UnprocessableEntityException(
        "Item category or unit is unavailable",
      );
    return validateSpecificationValues(definitions, values);
  }

  async createItem(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: {
      code: string;
      description?: string;
      itemCategoryId: string;
      name: string;
      specificationValues: SpecificationValueInput[];
      unitOfMeasureId: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    const specificationValues = await this.validatedItemValues(
      input.itemCategoryId,
      input.unitOfMeasureId,
      input.specificationValues,
    );
    return this.repository.createItem({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      itemCategoryId: input.itemCategoryId,
      name: input.name.trim(),
      specificationValues,
      unitOfMeasureId: input.unitOfMeasureId,
    });
  }

  async updateItem(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
      specificationValues: SpecificationValueInput[];
      unitOfMeasureId: string;
    },
  ) {
    const membership = this.policy.requireWrite(principal);
    const current = await this.repository.itemDetail(id);
    if (!current) throw new NotFoundException("Resource not found");
    const specificationValues = await this.validatedItemValues(
      current.itemCategoryId,
      input.unitOfMeasureId,
      input.specificationValues,
    );
    return this.repository.updateItem({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: code(input.code),
      context,
      description: text(input.description),
      expectedVersion: input.expectedVersion,
      id,
      name: input.name.trim(),
      specificationValues,
      unitOfMeasureId: input.unitOfMeasureId,
    });
  }

  deactivateItem(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    const membership = this.policy.requireWrite(principal);
    return this.repository.deactivateItem({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      id,
      reason: input.reason.trim(),
    });
  }

  async exportItems(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: {
      active?: "false" | "true";
      categoryId?: string;
      direction?: "asc" | "desc";
      q?: string;
      sort?: "code" | "name" | "updatedAt";
      unitOfMeasureId?: string;
    },
  ) {
    const membership = this.policy.requireExport(principal);
    const rows = await this.repository.exportItems(
      principal,
      this.filters(input),
      { auditOrganizationId: membership.organization.id, context },
    );
    return { csv: createItemsCsv(rows), filename: "items.csv" };
  }
}
