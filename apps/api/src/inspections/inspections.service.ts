import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { InspectionAuthorizationPolicy } from "./inspection-authorization.policy.js";
import type { InspectionDisposition } from "./inspection-quantity.js";
import { InspectionsRepository } from "./inspections.repository.js";

@Injectable()
export class InspectionsService {
  constructor(
    @Inject(InspectionAuthorizationPolicy)
    private readonly policy: InspectionAuthorizationPolicy,
    @Inject(InspectionsRepository)
    private readonly repository: InspectionsRepository,
  ) {}

  listDefinitions(principal: AuthenticatedPrincipal, itemId?: string) {
    this.policy.requireConfiguration(principal);
    return this.repository.listDefinitions(itemId).then((data) => ({ data }));
  }

  createDefinition(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    itemId: string,
    input: {
      checkType: "CERTIFICATE" | "CHECKLIST" | "MEASUREMENT";
      code: string;
      decimalPrecision?: number;
      description?: string;
      maximumValue?: string;
      minimumValue?: string;
      name: string;
      required: boolean;
      unitOfMeasureId?: string;
    },
  ) {
    const membership = this.policy.requireConfiguration(principal);
    return this.repository.createDefinition({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      itemId,
    });
  }

  updateDefinition(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    definitionId: string,
    input: {
      active: boolean;
      checkType: "CERTIFICATE" | "CHECKLIST" | "MEASUREMENT";
      code: string;
      decimalPrecision?: number;
      description?: string;
      expectedVersion: number;
      maximumValue?: string;
      minimumValue?: string;
      name: string;
      required: boolean;
      unitOfMeasureId?: string;
    },
  ) {
    const membership = this.policy.requireConfiguration(principal);
    return this.repository.updateDefinition({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      definitionId,
    });
  }

  async list(
    principal: AuthenticatedPrincipal,
    projectId: string,
    status?: "FINALIZED" | "OPEN",
  ) {
    await this.policy.requireProject(
      principal,
      projectId,
      "inspection.read",
      false,
    );
    return { data: await this.repository.list(projectId, status) };
  }

  async detail(principal: AuthenticatedPrincipal, id: string) {
    this.policy.requirePermission(principal, "inspection.read");
    const projectId = await this.repository.projectIdForInspection(id);
    if (!projectId) throw new NotFoundException("Resource not found");
    await this.policy.requireProject(
      principal,
      projectId,
      "inspection.read",
      false,
    );
    const detail = await this.repository.detail(id);
    if (!detail) throw new NotFoundException("Resource not found");
    return detail;
  }

  async createExplicit(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    inventoryLotId: string,
  ) {
    this.policy.requirePermission(principal, "inspection.create");
    const projectId = await this.repository.projectIdForLot(inventoryLotId);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireProject(
      principal,
      projectId,
      "inspection.create",
      true,
    );
    return this.repository.createExplicit({
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      inventoryLotId,
      projectId,
    });
  }

  async saveResults(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    inspectionId: string,
    input: {
      expectedVersion: number;
      results: Array<{
        certificateDecision?: "ACCEPTED" | "REJECTED";
        checkId: string;
        checklistPassed?: boolean;
        evidenceDocumentId?: string;
        measuredValue?: string;
        notes?: string;
      }>;
    },
  ) {
    this.policy.requirePermission(principal, "inspection.write");
    const projectId =
      await this.repository.projectIdForInspection(inspectionId);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireProject(
      principal,
      projectId,
      "inspection.write",
      true,
    );
    return this.repository.saveResults({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      context,
      inspectionId,
    });
  }

  async finalize(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    inspectionId: string,
    input: {
      acceptedQuantity: string;
      disposition: InspectionDisposition;
      expectedVersion: number;
      reason: string;
      rejectedQuantity: string;
    },
  ) {
    this.policy.requirePermission(principal, "inspection.finalize");
    if (input.disposition === "CONDITIONALLY_ACCEPTED")
      this.policy.requirePermission(principal, "inspection.conditional-accept");
    const projectId =
      await this.repository.projectIdForInspection(inspectionId);
    if (!projectId) throw new NotFoundException("Resource not found");
    const membership = await this.policy.requireProject(
      principal,
      projectId,
      "inspection.finalize",
      true,
    );
    if (input.disposition === "CONDITIONALLY_ACCEPTED")
      await this.policy.requireProject(
        principal,
        projectId,
        "inspection.conditional-accept",
        true,
      );
    return this.repository.finalize({
      ...input,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      conditionalAuthorized: input.disposition === "CONDITIONALLY_ACCEPTED",
      context,
      inspectionId,
    });
  }
}
