import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { BomAuthorizationPolicy } from "./bom-authorization.policy.js";
import { BomStorageService } from "./bom-storage.service.js";
import { createBomCsvTemplate, createBomXlsxTemplate } from "./bom-template.js";
import { BomsRepository } from "./boms.repository.js";

@Injectable()
export class BomsService {
  constructor(
    @Inject(BomAuthorizationPolicy)
    private readonly policy: BomAuthorizationPolicy,
    @Inject(BomsRepository)
    private readonly repository: BomsRepository,
    @Inject(BomStorageService)
    private readonly storage: BomStorageService,
  ) {}

  async listProject(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireRead(principal, projectId);
    const [boms, imports] = await Promise.all([
      this.repository.listProjectBoms(projectId),
      this.repository.listImports(projectId),
    ]);
    return { boms, imports };
  }

  async template(
    principal: AuthenticatedPrincipal,
    projectId: string,
    type: "csv" | "xlsx",
  ) {
    await this.policy.requireImport(principal, projectId);
    return type === "csv"
      ? {
          body: Buffer.from(createBomCsvTemplate(), "utf8"),
          filename: "mecoflow-bom-import.csv",
          mimeType: "text/csv; charset=utf-8",
        }
      : {
          body: createBomXlsxTemplate(),
          filename: "mecoflow-bom-import.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
  }

  async createImport(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      contentBase64: string;
      fileName: string;
      mimeType: string;
      workPackageId?: string;
    },
  ) {
    const membership = await this.policy.requireImport(principal, projectId);
    const upload = this.storage.validate(input);
    await this.storage.put(upload);
    try {
      const metadata = {
        byteSize: upload.byteSize,
        extension: upload.extension,
        mimeType: upload.mimeType,
        originalFileName: upload.originalFileName,
        sha256: upload.sha256,
        storageKey: upload.storageKey,
      };
      return await this.repository.createImport({
        actorUserId: principal.user.id,
        auditOrganizationId: membership.organization.id,
        context,
        projectId,
        upload: metadata,
        ...(input.workPackageId ? { workPackageId: input.workPackageId } : {}),
      });
    } catch (error) {
      await this.storage.remove(upload.storageKey).catch(() => undefined);
      throw error;
    }
  }

  async importDetail(principal: AuthenticatedPrincipal, id: string) {
    const projectId = await this.repository.projectIdForImport(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireRead(principal, projectId);
    const detail = await this.repository.importDetail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  async confirmImport(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; notes?: string; title: string },
  ) {
    const projectId = await this.repository.projectIdForImport(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireImport(principal, projectId);
    return this.repository.confirmImport({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      importId: id,
      notes: input.notes?.trim() ?? "",
      title: input.title.trim(),
    });
  }

  async revisionDetail(principal: AuthenticatedPrincipal, id: string) {
    const projectId = await this.repository.projectIdForRevision(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireRead(principal, projectId);
    const revision = await this.repository.revisionDetail(id);
    if (!revision) throw new NotFoundException("Resource not found");
    return revision;
  }

  async updateLine(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    revisionId: string,
    lineId: string,
    input: {
      criticality: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
      expectedVersion: number;
      notes: string;
      quantity: string;
      unitOfMeasureId: string;
    },
  ) {
    const projectId = await this.repository.projectIdForRevision(revisionId);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireWrite(principal, projectId);
    return this.repository.updateLine({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      lineId,
      notes: input.notes.trim(),
      revisionId,
    });
  }

  private async command(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    revisionId: string,
    input: { expectedVersion: number; reason: string },
    kind: "cancel" | "release" | "review" | "supersede",
  ) {
    const projectId = await this.repository.projectIdForRevision(revisionId);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership =
      kind === "release" || kind === "supersede"
        ? await this.policy.requireRelease(principal, projectId)
        : await this.policy.requireReview(principal, projectId);
    return this.repository[kind]({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      reason: input.reason.trim(),
      revisionId,
    });
  }

  review(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    revisionId: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, revisionId, input, "review");
  }

  release(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    revisionId: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, revisionId, input, "release");
  }

  supersede(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    revisionId: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, revisionId, input, "supersede");
  }

  cancel(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    revisionId: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, revisionId, input, "cancel");
  }

  async comparison(
    principal: AuthenticatedPrincipal,
    bomId: string,
    input: { fromRevisionId: string; toRevisionId: string },
  ) {
    const projectId = await this.repository.projectIdForBom(bomId);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireRead(principal, projectId);
    return this.repository.comparison(
      bomId,
      input.fromRevisionId,
      input.toRevisionId,
    );
  }
}
