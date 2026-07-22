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
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  CreateRequisitionDto,
  RequisitionCommandDto,
  RequisitionListQueryDto,
} from "./requisitions.dto.js";
import { RequisitionsService } from "./requisitions.service.js";

@ApiTags("Purchase requisitions")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks requisition permission or project scope",
})
@Controller("api/v1")
export class RequisitionsController {
  constructor(
    @Inject(RequisitionsService)
    private readonly requisitions: RequisitionsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("projects/:projectId/requisition-requirements")
  @ApiOperation({
    summary: "List released BOM requirements with current requisition coverage",
  })
  @ApiParam({ format: "uuid", name: "projectId" })
  async requirements(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.requisitions.requirements(principal, projectId);
  }

  @Get("projects/:projectId/requisitions")
  @ApiOperation({ summary: "List project purchase requisitions" })
  async list(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Query() query: RequisitionListQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    return this.requisitions.list(principal, projectId, query.status);
  }

  @Post("projects/:projectId/requisitions")
  @ApiOperation({
    summary: "Create a draft requisition from released BOM lines",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async create(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateRequisitionDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.requisitions.create(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("purchase-requisitions/:requisitionId")
  @ApiOperation({ summary: "Read purchase requisition detail and history" })
  async detail(
    @Req() request: Request,
    @Param("requisitionId", new ParseUUIDPipe()) requisitionId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.requisitions.detail(principal, requisitionId);
  }

  private async runCommand(
    request: Request,
    requisitionId: string,
    command: "approve" | "cancel" | "reject" | "submit",
    input: RequisitionCommandDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.requisitions[command](
      principal,
      requestContext(request),
      requisitionId,
      input,
    );
  }

  @Post("purchase-requisitions/:requisitionId/submit")
  @ApiOperation({ summary: "Submit a draft purchase requisition" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  submit(
    @Req() request: Request,
    @Param("requisitionId", new ParseUUIDPipe()) requisitionId: string,
    @Body() input: RequisitionCommandDto,
  ) {
    return this.runCommand(request, requisitionId, "submit", input);
  }

  @Post("purchase-requisitions/:requisitionId/approve")
  @ApiOperation({ summary: "Approve a submitted purchase requisition" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  approve(
    @Req() request: Request,
    @Param("requisitionId", new ParseUUIDPipe()) requisitionId: string,
    @Body() input: RequisitionCommandDto,
  ) {
    return this.runCommand(request, requisitionId, "approve", input);
  }

  @Post("purchase-requisitions/:requisitionId/reject")
  @ApiOperation({ summary: "Reject a submitted purchase requisition" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  reject(
    @Req() request: Request,
    @Param("requisitionId", new ParseUUIDPipe()) requisitionId: string,
    @Body() input: RequisitionCommandDto,
  ) {
    return this.runCommand(request, requisitionId, "reject", input);
  }

  @Post("purchase-requisitions/:requisitionId/cancel")
  @ApiOperation({ summary: "Cancel an active purchase requisition" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  cancel(
    @Req() request: Request,
    @Param("requisitionId", new ParseUUIDPipe()) requisitionId: string,
    @Body() input: RequisitionCommandDto,
  ) {
    return this.runCommand(request, requisitionId, "cancel", input);
  }
}
