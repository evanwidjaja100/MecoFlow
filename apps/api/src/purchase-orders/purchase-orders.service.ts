import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { PurchaseOrderAuthorizationPolicy } from "./purchase-order-authorization.policy.js";
import type { PurchaseOrderStatus } from "./purchase-order-lifecycle.js";
import { PurchaseOrdersRepository } from "./purchase-orders.repository.js";

type RevisionInput = {
  internalCommercialTerms?: string;
  internalNotes?: string;
  lines: Array<{
    allocations: Array<{
      overrideReason?: string;
      purchaseRequisitionLineId: string;
      quantity: string;
    }>;
    internalLineNotes?: string;
    internalUnitPrice?: string;
    orderedQuantity: string;
  }>;
  revisionReason: string;
  supplierMessage?: string;
  title: string;
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject(PurchaseOrderAuthorizationPolicy)
    private readonly policy: PurchaseOrderAuthorizationPolicy,
    @Inject(PurchaseOrdersRepository)
    private readonly repository: PurchaseOrdersRepository,
  ) {}

  async requirements(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireRead(principal, projectId);
    return { data: await this.repository.approvedRequirements(projectId) };
  }

  async list(
    principal: AuthenticatedPrincipal,
    projectId: string,
    status?: PurchaseOrderStatus,
  ) {
    await this.policy.requireRead(principal, projectId);
    return { data: await this.repository.list(projectId, status) };
  }

  create(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: RevisionInput & { supplierOrganizationId: string },
  ) {
    return this.policy.requireWrite(principal, projectId).then((membership) =>
      this.repository.create({
        ...input,
        actorUserId: principal.user.id,
        auditOrganizationId: membership.organization.id,
        canOverride: this.policy.canOverride(principal, membership.id),
        context,
        projectId,
      }),
    );
  }

  async detail(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requireInternalPermission(principal, "purchase-order.read");
    const projectId = await this.repository.projectIdForPurchaseOrder(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireRead(principal, projectId);
    const detail = await this.repository.detail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  private async internalOrderScope(
    principal: AuthenticatedPrincipal,
    id: string,
    kind: "cancel" | "send" | "write",
  ) {
    const permission =
      kind === "cancel"
        ? "purchase-order.cancel"
        : kind === "send"
          ? "purchase-order.send"
          : "purchase-order.write";
    this.policy.requireInternalPermission(principal, permission);
    const projectId = await this.repository.projectIdForPurchaseOrder(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    return kind === "cancel"
      ? this.policy.requireCancel(principal, projectId)
      : kind === "send"
        ? this.policy.requireSend(principal, projectId)
        : this.policy.requireWrite(principal, projectId);
  }

  async revise(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: RevisionInput & { expectedVersion: number },
  ) {
    const membership = await this.internalOrderScope(principal, id, "write");
    return this.repository.revise({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      canOverride: this.policy.canOverride(principal, membership.id),
      context,
      purchaseOrderId: id,
    });
  }

  private async command(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
    kind: "cancel" | "send",
  ) {
    const membership = await this.internalOrderScope(principal, id, kind);
    return this.repository[kind]({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      purchaseOrderId: id,
      reason: input.reason.trim(),
    });
  }

  send(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, id, input, "send");
  }

  cancel(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.command(principal, context, id, input, "cancel");
  }

  async exceptions(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireExceptions(principal, projectId);
    return { data: await this.repository.exceptions(projectId) };
  }

  supplierList(principal: AuthenticatedPrincipal) {
    const scope = this.policy.supplierScope(
      principal,
      "supplier.purchase-order.read",
    );
    return this.repository
      .supplierList(scope.organizationIds, scope.membershipIds)
      .then((data) => ({ data }));
  }

  private async supplierOrder(
    principal: AuthenticatedPrincipal,
    id: string,
    permission:
      | "supplier.commitment.write"
      | "supplier.purchase-order.acknowledge"
      | "supplier.purchase-order.read",
  ) {
    const scope = this.policy.supplierScope(principal, permission);
    if (
      !(await this.repository.supplierCanAccess(
        id,
        scope.organizationIds,
        scope.membershipIds,
      ))
    )
      throw new NotFoundException("Resource not found");
    const detail = await this.repository.supplierDetail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  supplierDetail(principal: AuthenticatedPrincipal, id: string) {
    return this.supplierOrder(principal, id, "supplier.purchase-order.read");
  }

  async acknowledge(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    const detail = await this.supplierOrder(
      principal,
      id,
      "supplier.purchase-order.acknowledge",
    );
    return this.repository.acknowledge({
      actorUserId: principal.user.id,
      auditOrganizationId: detail.supplierOrganization.id,
      context,
      expectedVersion: input.expectedVersion,
      purchaseOrderId: id,
      reason: input.reason.trim(),
    });
  }

  async appendCommitment(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      expectedVersion: number;
      lines: Array<{ committedDate: string; purchaseOrderLineId: string }>;
      note?: string;
    },
  ) {
    const detail = await this.supplierOrder(
      principal,
      id,
      "supplier.commitment.write",
    );
    return this.repository.appendCommitment({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: detail.supplierOrganization.id,
      context,
      purchaseOrderId: id,
      supplierOrganizationId: detail.supplierOrganization.id,
    });
  }
}
