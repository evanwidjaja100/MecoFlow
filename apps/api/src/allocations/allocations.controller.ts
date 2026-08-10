import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
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
  AllocationListQueryDto,
  CreateMaterialAllocationDto,
  MaterialAllocationCommandDto,
} from "./allocations.dto.js";
import { AllocationsService } from "./allocations.service.js";

@ApiTags("Material allocations")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks operation or object scope",
})
@Controller("api/v1")
export class AllocationsController {
  constructor(
    @Inject(AllocationsService)
    private readonly allocations: AllocationsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("projects/:projectId/material-allocations")
  @ApiOperation({ summary: "List project material allocations" })
  async list(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Query() query: AllocationListQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    return this.allocations.list(principal, projectId, query.status);
  }

  @Post("projects/:projectId/material-allocations")
  @ApiOperation({
    summary: "Allocate an accepted inventory lot to a released BOM line",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async create(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateMaterialAllocationDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.allocations.create(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("projects/:projectId/material-allocation-options")
  @ApiOperation({
    summary:
      "List accepted lots and released BOM lines eligible for allocation",
  })
  async options(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.allocations.options(principal, projectId);
  }

  @Get("material-allocations/:allocationId")
  @ApiOperation({ summary: "Read a material allocation and quantity history" })
  async detail(
    @Req() request: Request,
    @Param("allocationId", new ParseUUIDPipe()) allocationId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.allocations.detail(principal, allocationId);
  }

  @Post("material-allocations/:allocationId/release")
  @ApiOperation({ summary: "Release an active material allocation" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async release(
    @Req() request: Request,
    @Param("allocationId", new ParseUUIDPipe()) allocationId: string,
    @Body() input: MaterialAllocationCommandDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.allocations.release(
      principal,
      requestContext(request),
      allocationId,
      input,
    );
  }

  @Post("material-allocations/:allocationId/consume")
  @ApiOperation({
    summary: "Record consumption of an active material allocation",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async consume(
    @Req() request: Request,
    @Param("allocationId", new ParseUUIDPipe()) allocationId: string,
    @Body() input: MaterialAllocationCommandDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.allocations.consume(
      principal,
      requestContext(request),
      allocationId,
      input,
    );
  }
}
