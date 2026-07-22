import { randomUUID } from "node:crypto";
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
import { DocumentAuthorizationPolicy } from "./document-authorization.policy.js";
import { validateDocumentMetadata } from "./document-file-validation.js";
import {
  DocumentStorageService,
  UPLOAD_URL_TTL_SECONDS,
} from "./document-storage.service.js";
import { DocumentsRepository } from "./documents.repository.js";
import { VIRUS_SCANNER, type VirusScanner } from "./virus-scanner.js";

type UploadInput = {
  byteSize: number;
  fileName: string;
  mimeType: string;
  sha256: string;
};

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DocumentAuthorizationPolicy)
    private readonly policy: DocumentAuthorizationPolicy,
    @Inject(DocumentsRepository)
    private readonly repository: DocumentsRepository,
    @Inject(DocumentStorageService)
    private readonly storage: DocumentStorageService,
    @Inject(VIRUS_SCANNER)
    private readonly scanner: VirusScanner,
  ) {}

  private preparedUpload(input: UploadInput) {
    const metadata = validateDocumentMetadata(input);
    const storageKey = `documents/${randomUUID()}`;
    return {
      ...metadata,
      storageKey,
      uploadExpiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    };
  }

  private ownerFilter(membership: {
    organization: { id: string; type: "INTERNAL" | "SUPPLIER" };
  }): string | undefined {
    return membership.organization.type === "SUPPLIER"
      ? membership.organization.id
      : undefined;
  }

  async list(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = await this.policy.requireRead(principal, projectId);
    return this.repository.list(projectId, this.ownerFilter(membership));
  }

  async detail(principal: AuthenticatedPrincipal, documentId: string) {
    this.policy.preflightRead(principal);
    const projectId = await this.repository.projectIdForDocument(documentId);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireRead(principal, projectId);
    const document = await this.repository.detail(
      documentId,
      this.ownerFilter(membership),
    );
    if (!document) throw new NotFoundException("Resource not found");
    return document;
  }

  async initiate(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: UploadInput & {
      associations?: Array<{
        entityId: string;
        entityType:
          | "ADVANCE_SHIPMENT_NOTICE"
          | "BOM"
          | "GOODS_RECEIPT"
          | "PROJECT"
          | "PURCHASE_ORDER"
          | "PURCHASE_REQUISITION"
          | "WORK_PACKAGE";
      }>;
      category: string;
      description?: string;
      title: string;
    },
  ) {
    const membership = await this.policy.requireUpload(principal, projectId);
    const upload = this.preparedUpload(input);
    const document = await this.repository.create({
      actorUserId: principal.user.id,
      associations: input.associations ?? [],
      auditOrganizationId: membership.organization.id,
      category: input.category.trim(),
      context,
      description: input.description?.trim() ?? "",
      ownerOrganizationId: membership.organization.id,
      ownerType: membership.organization.type,
      projectId,
      title: input.title.trim(),
      upload,
    });
    const signed = await this.storage.uploadUrl(upload);
    const version = document.versions.find(
      ({ versionNumber }) => versionNumber === 1,
    )!;
    return {
      document,
      upload: {
        expiresInSeconds: signed.expiresInSeconds,
        headers: signed.headers,
        url: signed.url,
        versionId: version.id,
        version: version.version,
      },
    };
  }

  async supersede(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    documentId: string,
    input: UploadInput & {
      expectedDocumentVersion: number;
      reason: string;
    },
  ) {
    this.policy.preflightUpload(principal);
    const projectId = await this.repository.projectIdForDocument(documentId);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireUpload(principal, projectId);
    const upload = this.preparedUpload(input);
    const version = await this.repository.supersede({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      documentId,
      expectedDocumentVersion: input.expectedDocumentVersion,
      ownerOrganizationId: membership.organization.id,
      reason: input.reason.trim(),
      upload,
    });
    const signed = await this.storage.uploadUrl(upload);
    return {
      documentId,
      upload: {
        expiresInSeconds: signed.expiresInSeconds,
        headers: signed.headers,
        url: signed.url,
        version: version.version,
        versionId: version.id,
      },
    };
  }

  async complete(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    versionId: string,
    expectedVersion: number,
  ) {
    this.policy.preflightUpload(principal);
    const scoped = await this.repository.scopeForVersion(versionId);
    if (!scoped) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireUpload(
      principal,
      scoped.document.projectId,
    );
    if (membership.organization.id !== scoped.document.ownerOrganizationId)
      throw new NotFoundException("Resource not found");
    const version = await this.repository.versionForCompletion(versionId);
    if (!version) throw new NotFoundException("Resource not found");
    if (version.uploadExpiresAt.getTime() < Date.now())
      throw new UnprocessableEntityException("Upload session expired");
    let detectedMimeType: string | undefined;
    let scanResult: Awaited<ReturnType<VirusScanner["scan"]>>;
    try {
      const verified = await this.storage.verifiedObject({
        byteSize: version.byteSize,
        extension: version.extension as ReturnType<
          typeof validateDocumentMetadata
        >["extension"],
        mimeType: version.declaredMimeType,
        sha256: version.sha256,
        storageKey: version.storageKey,
      });
      detectedMimeType = verified.detectedMimeType;
      scanResult = await this.scanner.scan(verified.body);
    } catch {
      scanResult = { code: "SCANNER_ERROR", status: "ERROR" };
    }
    return this.repository.complete({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      ...(detectedMimeType ? { detectedMimeType } : {}),
      expectedVersion,
      scanResultCode: scanResult.code,
      scanStatus: scanResult.status,
      versionId,
    });
  }

  private async workflow(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    versionId: string,
    input: { expectedVersion: number; reason: string },
    command: "approve" | "reject" | "submit",
  ) {
    if (command === "submit") this.policy.preflightUpload(principal);
    else this.policy.preflightApprove(principal);
    const scoped = await this.repository.scopeForVersion(versionId);
    if (!scoped) throw new NotFoundException("Resource not found");
    const membership =
      command === "submit"
        ? await this.policy.requireUpload(principal, scoped.document.projectId)
        : await this.policy.requireApprove(
            principal,
            scoped.document.projectId,
          );
    if (
      command === "submit" &&
      membership.organization.id !== scoped.document.ownerOrganizationId
    )
      throw new NotFoundException("Resource not found");
    return this.repository.transition({
      action:
        command === "approve"
          ? "DOCUMENT_APPROVED"
          : command === "reject"
            ? "DOCUMENT_REJECTED"
            : "DOCUMENT_REVIEW_SUBMITTED",
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      reason: input.reason.trim(),
      targetStatus:
        command === "approve"
          ? "APPROVED"
          : command === "reject"
            ? "REJECTED"
            : "IN_REVIEW",
      versionId,
    });
  }

  submit(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    versionId: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.workflow(principal, context, versionId, input, "submit");
  }

  approve(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    versionId: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.workflow(principal, context, versionId, input, "approve");
  }

  reject(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    versionId: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.workflow(principal, context, versionId, input, "reject");
  }

  async download(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    versionId: string,
  ) {
    this.policy.preflightRead(principal);
    const version = await this.repository.versionForDownload(versionId);
    if (!version) throw new NotFoundException("Resource not found");
    const membership =
      version.status === "IN_REVIEW"
        ? await this.policy.requireReview(principal, version.document.projectId)
        : await this.policy.requireRead(principal, version.document.projectId);
    if (
      membership.organization.type === "SUPPLIER" &&
      membership.organization.id !== version.document.ownerOrganizationId
    )
      throw new NotFoundException("Resource not found");
    if (
      version.scanStatus !== "CLEAN" ||
      !["APPROVED", "IN_REVIEW"].includes(version.status)
    )
      throw new UnprocessableEntityException("Document is not downloadable");
    const signed = await this.storage.downloadUrl(version);
    await this.repository.auditDownload({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      versionId,
    });
    return signed;
  }
}
