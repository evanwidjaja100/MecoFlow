import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

type InternalPermission =
  | "purchase-order.cancel"
  | "purchase-order.exception.read"
  | "purchase-order.override"
  | "purchase-order.read"
  | "purchase-order.send"
  | "purchase-order.write";
type SupplierPermission =
  | "supplier.commitment.write"
  | "supplier.purchase-order.acknowledge"
  | "supplier.purchase-order.read";

@Injectable()
export class PurchaseOrderAuthorizationPolicy {
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

  requireRead(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(
      principal,
      projectId,
      "purchase-order.read",
      false,
    );
  }

  requireWrite(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(
      principal,
      projectId,
      "purchase-order.write",
      true,
    );
  }

  requireSend(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(
      principal,
      projectId,
      "purchase-order.send",
      true,
    );
  }

  requireCancel(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(
      principal,
      projectId,
      "purchase-order.cancel",
      true,
    );
  }

  requireExceptions(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(
      principal,
      projectId,
      "purchase-order.exception.read",
      false,
    );
  }

  canOverride(
    principal: AuthenticatedPrincipal,
    qualifyingMembershipId: string,
  ): boolean {
    return principal.memberships.some(
      (membership) =>
        membership.id === qualifyingMembershipId &&
        membership.organization.type === "INTERNAL" &&
        membership.permissions.has("purchase-order.override"),
    );
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
