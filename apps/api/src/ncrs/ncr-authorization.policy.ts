import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

export type NcrInternalPermission =
  "ncr.close" | "ncr.create" | "ncr.issue" | "ncr.read";
export type NcrSupplierPermission =
  "supplier.ncr.read" | "supplier.ncr.respond";

@Injectable()
export class NcrAuthorizationPolicy {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  requireInternalPermission(
    principal: AuthenticatedPrincipal,
    permission: NcrInternalPermission,
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  async requireProject(
    principal: AuthenticatedPrincipal,
    projectId: string,
    permission: NcrInternalPermission,
    write: boolean,
  ) {
    const membership = this.requireInternalPermission(principal, permission);
    const scope = await this.projects.scope(projectId);
    if (write) await this.projects.requireProjectWrite(principal, scope);
    else await this.projects.requireProjectRead(principal, scope);
    return membership;
  }

  supplierScope(
    principal: AuthenticatedPrincipal,
    permission: NcrSupplierPermission,
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
