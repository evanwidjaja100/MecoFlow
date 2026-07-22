import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  CompleteDocumentUploadDto,
  CreateDocumentUploadDto,
  DocumentCommandDto,
  SupersedeDocumentDto,
} from "./documents.dto.js";
import { DocumentsService } from "./documents.service.js";

@ApiTags("Documents")
@ApiCookieAuth("session")
@Controller("api/v1")
export class DocumentsController {
  constructor(
    @Inject(DocumentsService) private readonly documents: DocumentsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("projects/:projectId/documents")
  @ApiOperation({ summary: "List authorized project documents and versions" })
  async list(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.documents.list(principal, projectId);
  }

  @Post("projects/:projectId/documents/uploads")
  @ApiOperation({ summary: "Initiate a private presigned document upload" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiBody({ type: CreateDocumentUploadDto })
  async initiate(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateDocumentUploadDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.documents.initiate(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("documents/:documentId")
  @ApiOperation({ summary: "Read authorized document metadata and history" })
  async detail(
    @Req() request: Request,
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.documents.detail(principal, documentId);
  }

  @Post("documents/:documentId/supersede")
  @ApiOperation({ summary: "Initiate a new immutable document version" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async supersede(
    @Req() request: Request,
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
    @Body() input: SupersedeDocumentDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.documents.supersede(
      principal,
      requestContext(request),
      documentId,
      input,
    );
  }

  @Post("document-versions/:versionId/complete")
  @ApiOperation({
    summary: "Verify checksum/content and scan a quarantined upload",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async complete(
    @Req() request: Request,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
    @Body() input: CompleteDocumentUploadDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.documents.complete(
      principal,
      requestContext(request),
      versionId,
      input.expectedVersion,
    );
  }

  @Post("document-versions/:versionId/submit-review")
  @ApiOperation({ summary: "Submit a clean document version for review" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  submit(
    @Req() request: Request,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
    @Body() input: DocumentCommandDto,
  ) {
    return this.command(request, versionId, input, "submit");
  }

  @Post("document-versions/:versionId/approve")
  @ApiOperation({ summary: "Approve a clean reviewed document version" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  approve(
    @Req() request: Request,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
    @Body() input: DocumentCommandDto,
  ) {
    return this.command(request, versionId, input, "approve");
  }

  @Post("document-versions/:versionId/reject")
  @ApiOperation({ summary: "Reject a reviewed document version" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  reject(
    @Req() request: Request,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
    @Body() input: DocumentCommandDto,
  ) {
    return this.command(request, versionId, input, "reject");
  }

  private async command(
    request: Request,
    versionId: string,
    input: DocumentCommandDto,
    command: "approve" | "reject" | "submit",
  ) {
    const principal = await this.identity.principal(request, true);
    return this.documents[command](
      principal,
      requestContext(request),
      versionId,
      input,
    );
  }

  @Post("document-versions/:versionId/download-url")
  @ApiOperation({
    summary: "Issue an authorized short-lived private download URL",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async download(
    @Req() request: Request,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.documents.download(
      principal,
      requestContext(request),
      versionId,
    );
  }
}
