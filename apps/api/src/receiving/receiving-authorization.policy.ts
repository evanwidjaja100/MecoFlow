import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

type InternalPermission =
  | "shipment.arrive"
  | "shipment.read"
  | "receiving.correct"
  | "receiving.post"
  | "receiving.read"
  | "receiving.write";
type SupplierPermission =
  "supplier.asn.read" | "supplier.asn.transition" | "supplier.asn.write";

@Injectable()
export class ReceivingAuthorizationPolicy {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  requireInternalPermission(
    principal: AuthenticatedPrincipal,
    permission: InternalPermission,
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  private async requireProject(
    principal: AuthenticatedPrincipal,
    projectId: string,
    permission: InternalPermission,
    write: boolean,
  ) {
    const membership = this.requireInternalPermission(principal, permission);
    const scope = await this.projects.scope(projectId);
    if (write) await this.projects.requireProjectWrite(principal, scope);
    else await this.projects.requireProjectRead(principal, scope);
    return membership;
  }

  requireShipmentRead(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "shipment.read", false);
  }

  requireArrival(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "shipment.arrive", true);
  }

  requireReceiptRead(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "receiving.read", false);
  }

  requireReceiptWrite(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "receiving.write", true);
  }

  requireReceiptPost(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "receiving.post", true);
  }

  requireReceiptCorrection(
    principal: AuthenticatedPrincipal,
    projectId: string,
  ) {
    return this.requireProject(principal, projectId, "receiving.correct", true);
  }

  supplierScope(
    principal: AuthenticatedPrincipal,
    permission: SupplierPermission,
  ) {
    const memberships = principal.memberships.filter(
      (candidate) =>
        candidate.organization.type === "SUPPLIER" &&
        candidate.permissions.has(permission),
    );
    if (memberships.length === 0) throw new ForbiddenException("Access denied");
    return {
      membershipIds: memberships.map(({ id }) => id),
      organizationIds: memberships.map(({ organization }) => organization.id),
    };
  }
}
