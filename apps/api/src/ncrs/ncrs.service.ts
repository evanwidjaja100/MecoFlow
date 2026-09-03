import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { NcrAuthorizationPolicy } from "./ncr-authorization.policy.js";
import type { NcrStatus } from "./ncr-lifecycle.js";
import { NcrsRepository } from "./ncrs.repository.js";

@Injectable()
export class NcrsService {
  constructor(
    @Inject(NcrAuthorizationPolicy)
    private readonly policy: NcrAuthorizationPolicy,
    @Inject(NcrsRepository) private readonly repository: NcrsRepository,
  ) {}

  async listInternal(
    principal: AuthenticatedPrincipal,
    projectId: string,
    status?: NcrStatus,
  ) {
    await this.policy.requireProject(principal, projectId, "ncr.read", false);
    return { data: await this.repository.listInternal(projectId, status) };
  }

  async detailInternal(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requireInternalPermission(principal, "ncr.read");
    const projectId = await this.repository.projectIdForNcr(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireProject(principal, projectId, "ncr.read", false);
    const detail = await this.repository.detailInternal(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  async create(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      description: string;
      internalDispositionNotes?: string;
      inventoryLotId?: string;
      receivingInspectionId?: string;
      shareInternalNotes: boolean;
      sourceType: "INVENTORY_LOT" | "PROJECT" | "RECEIVING_INSPECTION";
      supplierOrganizationId?: string;
      title: string;
    },
  ) {
    const membership = await this.policy.requireProject(
      principal,
      projectId,
      "ncr.create",
      true,
    );
    return this.repository.create({
      ...input,
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      projectId,
    });
  }

  private async transition(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    permission: "ncr.close" | "ncr.issue",
    input: {
      expectedVersion: number;
      internalDispositionNotes?: string;
      reason: string;
      shareInternalNotes?: boolean;
    },
    targetStatus: "CANCELLED" | "CLOSED" | "ISSUED",
  ) {
    this.policy.requireInternalPermission(principal, permission);
    const projectId = await this.repository.projectIdForNcr(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireProject(
      principal,
      projectId,
      permission,
      true,
    );
    return this.repository.transition({
      ...input,
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      id,
      targetStatus,
    });
  }

  issue(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.transition(
      principal,
      context,
      id,
      "ncr.issue",
      input,
      "ISSUED",
    );
  }

  close(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      expectedVersion: number;
      internalDispositionNotes: string;
      reason: string;
      shareInternalNotes: boolean;
    },
  ) {
    return this.transition(
      principal,
      context,
      id,
      "ncr.close",
      input,
      "CLOSED",
    );
  }

  cancel(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.transition(
      principal,
      context,
      id,
      "ncr.close",
      input,
      "CANCELLED",
    );
  }

  listSupplier(
    principal: AuthenticatedPrincipal,
    requestContext: RequestContext,
  ) {
    const scope = this.policy.supplierScope(
      principal,
      "supplier.ncr.read",
      requestContext,
    );
    return this.repository
      .listSupplierFromSet(scope)
      .then((data) => ({ data }));
  }

  async detailSupplier(
    principal: AuthenticatedPrincipal,
    requestContext: RequestContext,
    id: string,
  ) {
    const scope = this.policy.supplierScope(
      principal,
      "supplier.ncr.read",
      requestContext,
    );
    const detail = await this.repository.detailSupplierFromSet(id, scope);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  async submitSupplierResponse(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      correctiveAction?: string;
      expectedVersion: number;
      message: string;
      rootCause?: string;
    },
  ) {
    const scope = this.policy.supplierScope(
      principal,
      "supplier.ncr.respond",
      context,
    );
    const preview = await this.repository.detailSupplierFromSet(id, scope);
    if (!preview) throw new NotFoundException("Resource not found");
    const actorMembership = principal.memberships.find(
      (m) => m.organization.id === preview.supplierOrganization.id,
    );
    if (!actorMembership) throw new NotFoundException("Resource not found");
    return this.repository.submitSupplierResponseFromSet({
      ...input,
      actorMembershipId: actorMembership.id,
      actorUserId: principal.user.id,
      context,
      id,
      set: scope,
    });
  }
}
