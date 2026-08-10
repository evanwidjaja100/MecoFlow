import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { AllocationAuthorizationPolicy } from "./allocation-authorization.policy.js";
import type { MaterialAllocationStatus } from "./allocation-lifecycle.js";
import { AllocationsRepository } from "./allocations.repository.js";

@Injectable()
export class AllocationsService {
  constructor(
    @Inject(AllocationAuthorizationPolicy)
    private readonly policy: AllocationAuthorizationPolicy,
    @Inject(AllocationsRepository)
    private readonly repository: AllocationsRepository,
  ) {}

  async list(
    principal: AuthenticatedPrincipal,
    projectId: string,
    status?: MaterialAllocationStatus,
  ) {
    await this.policy.requireProject(
      principal,
      projectId,
      "allocation.read",
      false,
    );
    return { data: await this.repository.list(projectId, status) };
  }

  async detail(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requirePermission(principal, "allocation.read");
    const projectId = await this.repository.projectIdForAllocation(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireProject(
      principal,
      projectId,
      "allocation.read",
      false,
    );
    const detail = await this.repository.detail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  async options(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireProject(
      principal,
      projectId,
      "allocation.read",
      false,
    );
    return this.repository.options(projectId);
  }

  async create(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      bomLineId: string;
      conditionalUseReason?: string;
      inventoryLotId: string;
      quantity: string;
    },
  ) {
    const membership = await this.policy.requireProject(
      principal,
      projectId,
      "allocation.create",
      true,
    );
    const lotStatus = await this.repository.lotStatus(
      projectId,
      input.inventoryLotId,
    );
    if (!lotStatus) throw new NotFoundException("Resource not found");
    const conditional = lotStatus === "CONDITIONALLY_ACCEPTED";
    if (conditional)
      await this.policy.requireProject(
        principal,
        projectId,
        "allocation.conditional-use",
        true,
      );
    return this.repository.create({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      conditionalAuthorized: conditional,
      context,
      projectId,
    });
  }

  private async transition(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    permission: "allocation.consume" | "allocation.release",
    input: { expectedVersion: number; reason: string },
    targetStatus: "CONSUMED" | "RELEASED",
  ) {
    this.policy.requirePermission(principal, permission);
    const projectId = await this.repository.projectIdForAllocation(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireProject(
      principal,
      projectId,
      permission,
      true,
    );
    return this.repository.transition({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      id,
      targetStatus,
    });
  }

  release(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.transition(
      principal,
      context,
      id,
      "allocation.release",
      input,
      "RELEASED",
    );
  }

  consume(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: { expectedVersion: number; reason: string },
  ) {
    return this.transition(
      principal,
      context,
      id,
      "allocation.consume",
      input,
      "CONSUMED",
    );
  }
}
