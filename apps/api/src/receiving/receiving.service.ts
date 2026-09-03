import { createHash } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { ReceivingAuthorizationPolicy } from "./receiving-authorization.policy.js";
import { ReceivingRepository } from "./receiving.repository.js";

@Injectable()
export class ReceivingService {
  constructor(
    @Inject(ReceivingAuthorizationPolicy)
    private readonly policy: ReceivingAuthorizationPolicy,
    @Inject(ReceivingRepository)
    private readonly repository: ReceivingRepository,
  ) {}

  supplierList(
    principal: AuthenticatedPrincipal,
    requestContext: RequestContext,
  ) {
    const scope = this.policy.supplierScope(
      principal,
      "supplier.asn.read",
      requestContext,
    );
    return this.repository
      .supplierAsnListFromSet(scope)
      .then((data) => ({ data }));
  }

  private async supplierAsn(
    principal: AuthenticatedPrincipal,
    id: string,
    permission:
      "supplier.asn.read" | "supplier.asn.transition" | "supplier.asn.write",
    requestContext: RequestContext,
  ) {
    const scope = this.policy.supplierScope(
      principal,
      permission,
      requestContext,
    );
    if (!(await this.repository.supplierCanAccessAsnFromSet(id, scope)))
      throw new NotFoundException("Resource not found");
    const detail = await this.repository.supplierDetail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  supplierDetail(
    principal: AuthenticatedPrincipal,
    requestContext: RequestContext,
    id: string,
  ) {
    return this.supplierAsn(principal, id, "supplier.asn.read", requestContext);
  }

  async createAsn(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    purchaseOrderId: string,
    input: {
      carrier?: string;
      estimatedArrivalDate?: string;
      lines: Array<{
        packageReference?: string;
        purchaseOrderLineId: string;
        shippedQuantity: string;
      }>;
      notes?: string;
      supplierReference: string;
      trackingNumber?: string;
    },
  ) {
    const scope = this.policy.supplierScope(
      principal,
      "supplier.asn.write",
      context,
    );
    const order = await this.repository.supplierCanAccessPurchaseOrderFromSet(
      purchaseOrderId,
      scope,
    );
    if (!order) throw new NotFoundException("Resource not found");
    const actorMembership = principal.memberships.find(
      (m) => m.organization.id === order.supplierOrganizationId,
    );
    if (!actorMembership) throw new NotFoundException("Resource not found");
    return this.repository.createAsn({
      ...input,
      actorMembershipId: actorMembership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: order.supplierOrganizationId,
      context,
      purchaseOrderId,
      supplierOrganizationId: order.supplierOrganizationId,
    });
  }

  private async supplierTransition(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
    targetStatus: "CANCELLED" | "IN_TRANSIT" | "SUBMITTED",
  ) {
    const detail = await this.supplierAsn(
      principal,
      id,
      "supplier.asn.transition",
      context,
    );
    const actorMembership = principal.memberships.find(
      (m) => m.organization.id === detail.supplierOrganization.id,
    );
    if (!actorMembership) throw new NotFoundException("Resource not found");
    return this.repository.transitionAsn({
      actorMembershipId: actorMembership.id,
      actorUserId: principal.user.id,
      advanceShipmentNoticeId: id,
      auditOrganizationId: detail.supplierOrganization.id,
      context,
      expectedVersion: input.expectedVersion,
      reason: input.reason,
      targetStatus,
    });
  }

  submitAsn(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.supplierTransition(principal, context, id, input, "SUBMITTED");
  }

  dispatchAsn(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.supplierTransition(principal, context, id, input, "IN_TRANSIT");
  }

  cancelAsn(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.supplierTransition(principal, context, id, input, "CANCELLED");
  }

  async listAsns(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireShipmentRead(principal, projectId);
    return { data: await this.repository.listAsns(projectId) };
  }

  async asnDetail(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requireInternalPermission(principal, "shipment.read");
    const projectId = await this.repository.projectIdForAsn(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireShipmentRead(principal, projectId);
    const detail = await this.repository.asnDetail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  async arriveAsn(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    this.policy.requireInternalPermission(principal, "shipment.arrive");
    const projectId = await this.repository.projectIdForAsn(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireArrival(principal, projectId);
    return this.repository.transitionAsn({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      advanceShipmentNoticeId: id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      reason: input.reason,
      targetStatus: "ARRIVED",
    });
  }

  async listReceipts(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireReceiptRead(principal, projectId);
    return { data: await this.repository.listReceipts(projectId) };
  }

  createReceipt(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      advanceShipmentNoticeId: string;
      lines: Array<{
        advanceShipmentNoticeLineId: string;
        batchNumber?: string;
        heatNumber?: string;
        manufacturer?: string;
        notes?: string;
        packageReference?: string;
        receivedQuantity: string;
      }>;
      notes?: string;
      receivedAt: string;
      warehouseLocation: string;
    },
  ) {
    return this.policy
      .requireReceiptWrite(principal, projectId)
      .then((membership) =>
        this.repository.createReceipt({
          ...input,
          actorMembershipId: membership.id,
          actorUserId: principal.user.id,
          auditOrganizationId: membership.organization.id,
          context,
          projectId,
        }),
      );
  }

  async receiptDetail(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requireInternalPermission(principal, "receiving.read");
    const projectId = await this.repository.projectIdForReceipt(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireReceiptRead(principal, projectId);
    const detail = await this.repository.receiptDetail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  async createCorrection(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      lines: Array<{
        batchNumber?: string;
        goodsReceiptLineId: string;
        heatNumber?: string;
        manufacturer?: string;
        notes?: string;
        packageReference?: string;
        quantityDelta: string;
      }>;
      notes?: string;
      reason: string;
      receivedAt: string;
      warehouseLocation: string;
    },
  ) {
    this.policy.requireInternalPermission(principal, "receiving.correct");
    const projectId = await this.repository.projectIdForReceipt(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireReceiptCorrection(
      principal,
      projectId,
    );
    return this.repository.createCorrection({
      ...input,
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      correctsReceiptId: id,
    });
  }

  async postReceipt(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number },
    idempotencyKey: string,
  ) {
    this.policy.requireInternalPermission(principal, "receiving.post");
    const projectId = await this.repository.projectIdForReceipt(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireReceiptPost(
      principal,
      projectId,
    );
    const requestHash = createHash("sha256")
      .update(`${id}:${input.expectedVersion}`)
      .digest("hex");
    return this.repository.postReceipt({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      expectedVersion: input.expectedVersion,
      goodsReceiptId: id,
      idempotencyKey,
      requestHash,
    });
  }
}
