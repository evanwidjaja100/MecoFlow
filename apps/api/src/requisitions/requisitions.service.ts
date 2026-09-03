import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { RequisitionAuthorizationPolicy } from "./requisition-authorization.policy.js";
import type { RequisitionStatus } from "./requisition-lifecycle.js";
import { RequisitionsRepository } from "./requisitions.repository.js";

@Injectable()
export class RequisitionsService {
  constructor(
    @Inject(RequisitionAuthorizationPolicy)
    private readonly policy: RequisitionAuthorizationPolicy,
    @Inject(RequisitionsRepository)
    private readonly repository: RequisitionsRepository,
  ) {}

  async requirements(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireRead(principal, projectId);
    return { data: await this.repository.requirements(projectId) };
  }

  async list(
    principal: AuthenticatedPrincipal,
    projectId: string,
    status?: RequisitionStatus,
  ) {
    await this.policy.requireRead(principal, projectId);
    return { data: await this.repository.list(projectId, status) };
  }

  create(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      lines: Array<{
        bomLineId: string;
        overrideReason?: string;
        quantity: string;
      }>;
      notes?: string;
      title: string;
    },
  ) {
    return this.policy.requireWrite(principal, projectId).then((membership) =>
      this.repository.create({
        actorMembershipId: membership.id,
        actorUserId: principal.user.id,
        auditOrganizationId: membership.organization.id,
        canOverride: this.policy.canOverride(principal, membership.id),
        context,
        lines: input.lines,
        notes: input.notes?.trim() ?? "",
        projectId,
        title: input.title.trim(),
      }),
    );
  }

  async detail(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requirePermission(principal, "requisition.read");
    const projectId = await this.repository.projectIdForRequisition(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireRead(principal, projectId);
    const detail = await this.repository.detail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  private async command(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    requisitionId: string,
    input: { expectedVersion: number; reason: string },
    kind: "approve" | "cancel" | "reject" | "submit",
  ) {
    const permission =
      kind === "approve" || kind === "reject"
        ? "requisition.approve"
        : kind === "cancel"
          ? "requisition.cancel"
          : "requisition.submit";
    this.policy.requirePermission(principal, permission);
    const projectId =
      await this.repository.projectIdForRequisition(requisitionId);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership =
      kind === "approve" || kind === "reject"
        ? await this.policy.requireApprove(principal, projectId)
        : kind === "cancel"
          ? await this.policy.requireCancel(principal, projectId)
          : await this.policy.requireSubmit(principal, projectId);
    return this.repository[kind]({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      reason: input.reason.trim(),
      requisitionId,
    });
  }

  submit(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, id, input, "submit");
  }

  approve(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, id, input, "approve");
  }

  reject(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, id, input, "reject");
  }

  cancel(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, id, input, "cancel");
  }
}
