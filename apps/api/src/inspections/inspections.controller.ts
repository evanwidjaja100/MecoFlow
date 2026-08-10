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
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  FinalizeInspectionDto,
  InspectionCheckDefinitionDto,
  InspectionDefinitionQueryDto,
  InspectionQueueQueryDto,
  SaveInspectionResultsDto,
  UpdateInspectionCheckDefinitionDto,
} from "./inspections.dto.js";
import { InspectionsService } from "./inspections.service.js";

@ApiTags("Receiving inspections")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks operation or object scope",
})
@Controller("api/v1")
export class InspectionsController {
  constructor(
    @Inject(InspectionsService)
    private readonly inspections: InspectionsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("inspection-check-definitions")
  @ApiOperation({ summary: "List configurable inspection check definitions" })
  async listDefinitions(
    @Req() request: Request,
    @Query() query: InspectionDefinitionQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    return this.inspections.listDefinitions(principal, query.itemId);
  }

  @Post("items/:itemId/inspection-check-definitions")
  @ApiOperation({ summary: "Create an item inspection check definition" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createDefinition(
    @Req() request: Request,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
    @Body() input: InspectionCheckDefinitionDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.inspections.createDefinition(
      principal,
      requestContext(request),
      itemId,
      input,
    );
  }

  @Patch("inspection-check-definitions/:definitionId")
  @ApiOperation({ summary: "Replace an inspection check configuration" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateDefinition(
    @Req() request: Request,
    @Param("definitionId", new ParseUUIDPipe()) definitionId: string,
    @Body() input: UpdateInspectionCheckDefinitionDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.inspections.updateDefinition(
      principal,
      requestContext(request),
      definitionId,
      input,
    );
  }

  @Get("projects/:projectId/receiving-inspections")
  @ApiOperation({ summary: "List the project receiving inspection work queue" })
  async list(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Query() query: InspectionQueueQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    return this.inspections.list(principal, projectId, query.status);
  }

  @Post("inventory-lots/:inventoryLotId/receiving-inspections")
  @ApiOperation({
    summary: "Create an inspection explicitly for an awaiting lot",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createExplicit(
    @Req() request: Request,
    @Param("inventoryLotId", new ParseUUIDPipe()) inventoryLotId: string,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.inspections.createExplicit(
      principal,
      requestContext(request),
      inventoryLotId,
    );
  }

  @Get("receiving-inspections/:inspectionId")
  @ApiOperation({ summary: "Read an authorized receiving inspection" })
  async detail(
    @Req() request: Request,
    @Param("inspectionId", new ParseUUIDPipe()) inspectionId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.inspections.detail(principal, inspectionId);
  }

  @Post("receiving-inspections/:inspectionId/results")
  @ApiOperation({
    summary: "Record checklist, measurement, and certificate results",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async saveResults(
    @Req() request: Request,
    @Param("inspectionId", new ParseUUIDPipe()) inspectionId: string,
    @Body() input: SaveInspectionResultsDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.inspections.saveResults(
      principal,
      requestContext(request),
      inspectionId,
      input,
    );
  }

  @Post("receiving-inspections/:inspectionId/finalize")
  @ApiOperation({
    summary: "Finalize the inspection and inventory lot disposition",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async finalize(
    @Req() request: Request,
    @Param("inspectionId", new ParseUUIDPipe()) inspectionId: string,
    @Body() input: FinalizeInspectionDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.inspections.finalize(
      principal,
      requestContext(request),
      inspectionId,
      input,
    );
  }
}
