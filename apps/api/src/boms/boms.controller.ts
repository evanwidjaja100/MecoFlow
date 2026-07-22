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
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  BomComparisonQueryDto,
  BomRevisionCommandDto,
  ConfirmBomImportDto,
  CreateBomImportDto,
  UpdateBomLineDto,
} from "./boms.dto.js";
import { BomsService } from "./boms.service.js";

@ApiTags("BOM and import")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks BOM permission or project scope",
})
@Controller("api/v1")
export class BomsController {
  constructor(
    @Inject(BomsService) private readonly boms: BomsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("projects/:projectId/boms")
  @ApiOperation({ summary: "List project BOM scopes, revisions, and imports" })
  @ApiParam({ format: "uuid", name: "projectId" })
  async list(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.boms.listProject(principal, projectId);
  }

  @Get("projects/:projectId/bom-import-template.csv")
  @ApiOperation({ summary: "Download the BOM CSV import template" })
  @ApiProduces("text/csv")
  async csvTemplate(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    const template = await this.boms.template(principal, projectId, "csv");
    return new StreamableFile(template.body, {
      disposition: `attachment; filename="${template.filename}"`,
      type: template.mimeType,
    });
  }

  @Get("projects/:projectId/bom-import-template.xlsx")
  @ApiOperation({ summary: "Download the BOM XLSX import template" })
  @ApiProduces(
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  async xlsxTemplate(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    const template = await this.boms.template(principal, projectId, "xlsx");
    return new StreamableFile(template.body, {
      disposition: `attachment; filename="${template.filename}"`,
      type: template.mimeType,
    });
  }

  @Post("projects/:projectId/bom-imports")
  @ApiOperation({ summary: "Securely upload and enqueue a BOM dry run" })
  @ApiBody({ type: CreateBomImportDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async upload(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateBomImportDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.boms.createImport(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("bom-imports/:importId")
  @ApiOperation({
    summary: "Read BOM import dry-run rows, errors, and warnings",
  })
  async importDetail(
    @Req() request: Request,
    @Param("importId", new ParseUUIDPipe()) importId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.boms.importDetail(principal, importId);
  }

  @Post("bom-imports/:importId/confirm")
  @ApiOperation({
    summary: "Explicitly confirm a valid dry run and create a draft revision",
  })
  @ApiBody({ type: ConfirmBomImportDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async confirm(
    @Req() request: Request,
    @Param("importId", new ParseUUIDPipe()) importId: string,
    @Body() input: ConfirmBomImportDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.boms.confirmImport(
      principal,
      requestContext(request),
      importId,
      input,
    );
  }

  @Get("bom-revisions/:revisionId")
  @ApiOperation({
    summary: "Read a BOM revision with official-readiness and coverage flags",
  })
  async revision(
    @Req() request: Request,
    @Param("revisionId", new ParseUUIDPipe()) revisionId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.boms.revisionDetail(principal, revisionId);
  }

  @Patch("bom-revisions/:revisionId/lines/:lineId")
  @ApiOperation({ summary: "Correct a draft BOM line" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateLine(
    @Req() request: Request,
    @Param("revisionId", new ParseUUIDPipe()) revisionId: string,
    @Param("lineId", new ParseUUIDPipe()) lineId: string,
    @Body() input: UpdateBomLineDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.boms.updateLine(
      principal,
      requestContext(request),
      revisionId,
      lineId,
      input,
    );
  }

  @Post("bom-revisions/:revisionId/review")
  @ApiOperation({ summary: "Submit a draft BOM revision for review" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  review(
    @Req() request: Request,
    @Param("revisionId", new ParseUUIDPipe()) revisionId: string,
    @Body() input: BomRevisionCommandDto,
  ) {
    return this.lifecycle(request, revisionId, input, "review");
  }

  @Post("bom-revisions/:revisionId/release")
  @ApiOperation({ summary: "Transactionally release a reviewed BOM revision" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  release(
    @Req() request: Request,
    @Param("revisionId", new ParseUUIDPipe()) revisionId: string,
    @Body() input: BomRevisionCommandDto,
  ) {
    return this.lifecycle(request, revisionId, input, "release");
  }

  @Post("bom-revisions/:revisionId/supersede")
  @ApiOperation({ summary: "Explicitly supersede a released BOM revision" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  supersede(
    @Req() request: Request,
    @Param("revisionId", new ParseUUIDPipe()) revisionId: string,
    @Body() input: BomRevisionCommandDto,
  ) {
    return this.lifecycle(request, revisionId, input, "supersede");
  }

  @Post("bom-revisions/:revisionId/cancel")
  @ApiOperation({ summary: "Cancel a draft or reviewed BOM revision" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  cancel(
    @Req() request: Request,
    @Param("revisionId", new ParseUUIDPipe()) revisionId: string,
    @Body() input: BomRevisionCommandDto,
  ) {
    return this.lifecycle(request, revisionId, input, "cancel");
  }

  private async lifecycle(
    request: Request,
    revisionId: string,
    input: BomRevisionCommandDto,
    command: "cancel" | "release" | "review" | "supersede",
  ) {
    const principal = await this.identity.principal(request, true);
    return this.boms[command](
      principal,
      requestContext(request),
      revisionId,
      input,
    );
  }

  @Get("boms/:bomId/comparison")
  @ApiOperation({ summary: "Compare two revisions in one BOM scope" })
  comparison(
    @Req() request: Request,
    @Param("bomId", new ParseUUIDPipe()) bomId: string,
    @Query() query: BomComparisonQueryDto,
  ) {
    return this.identity
      .principal(request)
      .then((principal) => this.boms.comparison(principal, bomId, query));
  }
}
