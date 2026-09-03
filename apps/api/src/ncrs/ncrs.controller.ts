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
  CloseNcrDto,
  CreateNcrDto,
  NcrCommandDto,
  NcrListQueryDto,
  SubmitNcrResponseDto,
} from "./ncrs.dto.js";
import { NcrsService } from "./ncrs.service.js";

@ApiTags("Nonconformance reports")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks operation or object scope",
})
@Controller("api/v1")
export class NcrsController {
  constructor(
    @Inject(NcrsService) private readonly ncrs: NcrsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("projects/:projectId/ncrs")
  @ApiOperation({ summary: "List internal project NCRs" })
  async listInternal(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Query() query: NcrListQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    return this.ncrs.listInternal(principal, projectId, query.status);
  }

  @Post("projects/:projectId/ncrs")
  @ApiOperation({
    summary: "Create an NCR from a project, inventory lot, or inspection",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async create(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateNcrDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.ncrs.create(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("ncrs/:ncrId")
  @ApiOperation({ summary: "Read an internal NCR" })
  async detailInternal(
    @Req() request: Request,
    @Param("ncrId", new ParseUUIDPipe()) ncrId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.ncrs.detailInternal(principal, ncrId);
  }

  @Post("ncrs/:ncrId/issue")
  @ApiOperation({ summary: "Issue an NCR to its supplier" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async issue(
    @Req() request: Request,
    @Param("ncrId", new ParseUUIDPipe()) ncrId: string,
    @Body() input: NcrCommandDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.ncrs.issue(principal, requestContext(request), ncrId, input);
  }

  @Post("ncrs/:ncrId/close")
  @ApiOperation({ summary: "Close an issued or supplier-responded NCR" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async close(
    @Req() request: Request,
    @Param("ncrId", new ParseUUIDPipe()) ncrId: string,
    @Body() input: CloseNcrDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.ncrs.close(principal, requestContext(request), ncrId, input);
  }

  @Post("ncrs/:ncrId/cancel")
  @ApiOperation({ summary: "Cancel a draft or issued NCR" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async cancel(
    @Req() request: Request,
    @Param("ncrId", new ParseUUIDPipe()) ncrId: string,
    @Body() input: NcrCommandDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.ncrs.cancel(principal, requestContext(request), ncrId, input);
  }

  @Get("supplier/ncrs")
  @ApiOperation({ summary: "List issued NCRs for the supplier organization" })
  async listSupplier(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return this.ncrs.listSupplier(principal, requestContext(request));
  }

  @Get("supplier/ncrs/:ncrId")
  @ApiOperation({ summary: "Read an issued own-organization NCR" })
  async detailSupplier(
    @Req() request: Request,
    @Param("ncrId", new ParseUUIDPipe()) ncrId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.ncrs.detailSupplier(principal, requestContext(request), ncrId);
  }

  @Post("supplier/ncrs/:ncrId/responses")
  @ApiOperation({ summary: "Append a supplier NCR response" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async respond(
    @Req() request: Request,
    @Param("ncrId", new ParseUUIDPipe()) ncrId: string,
    @Body() input: SubmitNcrResponseDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.ncrs.submitSupplierResponse(
      principal,
      requestContext(request),
      ncrId,
      input,
    );
  }
}
