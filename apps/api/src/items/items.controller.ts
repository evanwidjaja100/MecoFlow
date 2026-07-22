import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  CreateItemCategoryDto,
  CreateItemDto,
  CreateSpecificationAttributeDto,
  CreateUnitOfMeasureDto,
  DeactivateItemDto,
  ExportItemsQueryDto,
  ListItemsQueryDto,
  UpdateItemCategoryDto,
  UpdateItemDto,
  UpdateSpecificationAttributeDto,
  UpdateUnitOfMeasureDto,
} from "./items.dto.js";
import { ItemsService } from "./items.service.js";

@ApiTags("item master")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks the required internal item permission",
})
@Controller("api/v1")
export class ItemsController {
  constructor(
    @Inject(ItemsService) private readonly items: ItemsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("item-categories")
  @ApiOperation({ summary: "List item categories and attribute definitions" })
  async itemCategories(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.items.listItemCategories(principal),
      meta: requestContext(request),
    };
  }

  @Post("item-categories")
  @ApiOperation({ summary: "Create an item category" })
  @ApiBody({ type: CreateItemCategoryDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createItemCategory(
    @Req() request: Request,
    @Body() input: CreateItemCategoryDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.createItemCategory(
      principal,
      requestContext(request),
      input,
    );
  }

  @Patch("item-categories/:categoryId")
  @ApiOperation({ summary: "Edit an item category with an expected version" })
  @ApiParam({ format: "uuid", name: "categoryId" })
  @ApiBody({ type: UpdateItemCategoryDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateItemCategory(
    @Req() request: Request,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Body() input: UpdateItemCategoryDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.updateItemCategory(
      principal,
      requestContext(request),
      categoryId,
      input,
    );
  }

  @Post("item-categories/:categoryId/specification-attributes")
  @ApiOperation({ summary: "Create a structured specification attribute" })
  @ApiParam({ format: "uuid", name: "categoryId" })
  @ApiBody({ type: CreateSpecificationAttributeDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createSpecificationAttribute(
    @Req() request: Request,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Body() input: CreateSpecificationAttributeDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.createSpecificationAttribute(
      principal,
      requestContext(request),
      categoryId,
      input,
    );
  }

  @Patch("item-categories/:categoryId/specification-attributes/:attributeId")
  @ApiOperation({ summary: "Edit a structured specification attribute" })
  @ApiParam({ format: "uuid", name: "categoryId" })
  @ApiParam({ format: "uuid", name: "attributeId" })
  @ApiBody({ type: UpdateSpecificationAttributeDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateSpecificationAttribute(
    @Req() request: Request,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Param("attributeId", new ParseUUIDPipe()) attributeId: string,
    @Body() input: UpdateSpecificationAttributeDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.updateSpecificationAttribute(
      principal,
      requestContext(request),
      categoryId,
      attributeId,
      input,
    );
  }

  @Get("units-of-measure")
  @ApiOperation({ summary: "List units of measure" })
  async unitsOfMeasure(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.items.listUnitsOfMeasure(principal),
      meta: requestContext(request),
    };
  }

  @Post("units-of-measure")
  @ApiOperation({ summary: "Create a unit of measure" })
  @ApiBody({ type: CreateUnitOfMeasureDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createUnitOfMeasure(
    @Req() request: Request,
    @Body() input: CreateUnitOfMeasureDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.createUnitOfMeasure(
      principal,
      requestContext(request),
      input,
    );
  }

  @Patch("units-of-measure/:unitId")
  @ApiOperation({ summary: "Edit a unit of measure with an expected version" })
  @ApiParam({ format: "uuid", name: "unitId" })
  @ApiBody({ type: UpdateUnitOfMeasureDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateUnitOfMeasure(
    @Req() request: Request,
    @Param("unitId", new ParseUUIDPipe()) unitId: string,
    @Body() input: UpdateUnitOfMeasureDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.updateUnitOfMeasure(
      principal,
      requestContext(request),
      unitId,
      input,
    );
  }

  @Get("items/export.csv")
  @ApiOperation({ summary: "Export the filtered internal item master as CSV" })
  @ApiProduces("text/csv")
  @ApiQuery({ name: "active", required: false, enum: ["true", "false"] })
  @ApiQuery({ name: "categoryId", required: false, format: "uuid" })
  @ApiQuery({ name: "q", required: false, maxLength: 100 })
  @ApiQuery({ name: "unitOfMeasureId", required: false, format: "uuid" })
  async exportItems(
    @Req() request: Request,
    @Query() query: ExportItemsQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    const result = await this.items.exportItems(
      principal,
      requestContext(request),
      query,
    );
    return new StreamableFile(Buffer.from(result.csv, "utf8"), {
      disposition: `attachment; filename="${result.filename}"`,
      type: "text/csv; charset=utf-8",
    });
  }

  @Get("items")
  @ApiOperation({ summary: "Search and list internal item-master records" })
  @ApiQuery({ name: "active", required: false, enum: ["true", "false"] })
  @ApiQuery({ name: "categoryId", required: false, format: "uuid" })
  @ApiQuery({ name: "direction", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "page", required: false, minimum: 1, type: Number })
  @ApiQuery({
    name: "pageSize",
    required: false,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @ApiQuery({ name: "q", required: false, maxLength: 100 })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["code", "name", "updatedAt"],
  })
  @ApiQuery({ name: "unitOfMeasureId", required: false, format: "uuid" })
  async listItems(@Req() request: Request, @Query() query: ListItemsQueryDto) {
    const principal = await this.identity.principal(request);
    const result = await this.items.listItems(principal, query);
    const page = Number(query.page ?? "1");
    const pageSize = Number(query.pageSize ?? "20");
    return {
      data: result.data,
      meta: requestContext(request),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  @Post("items")
  @ApiOperation({ summary: "Create an item with structured specifications" })
  @ApiBody({ type: CreateItemDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createItem(@Req() request: Request, @Body() input: CreateItemDto) {
    const principal = await this.identity.principal(request, true);
    return this.items.createItem(principal, requestContext(request), input);
  }

  @Get("items/:itemId")
  @ApiOperation({ summary: "Read an internal item detail" })
  @ApiParam({ format: "uuid", name: "itemId" })
  @ApiNotFoundResponse({ description: "Item does not exist" })
  async itemDetail(
    @Req() request: Request,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.items.itemDetail(principal, itemId);
  }

  @Patch("items/:itemId")
  @ApiOperation({ summary: "Edit an active item with an expected version" })
  @ApiParam({ format: "uuid", name: "itemId" })
  @ApiBody({ type: UpdateItemDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateItem(
    @Req() request: Request,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
    @Body() input: UpdateItemDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.updateItem(
      principal,
      requestContext(request),
      itemId,
      input,
    );
  }

  @Post("items/:itemId/deactivate")
  @ApiOperation({ summary: "Deactivate an item; hard deletion is unavailable" })
  @ApiParam({ format: "uuid", name: "itemId" })
  @ApiBody({ type: DeactivateItemDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async deactivateItem(
    @Req() request: Request,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
    @Body() input: DeactivateItemDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.items.deactivateItem(
      principal,
      requestContext(request),
      itemId,
      input,
    );
  }
}
