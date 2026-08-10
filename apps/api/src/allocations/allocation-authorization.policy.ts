import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

export type AllocationPermission =
  | "allocation.conditional-use"
  | "allocation.consume"
  | "allocation.create"
  | "allocation.read"
  | "allocation.release";

@Injectable()
export class AllocationAuthorizationPolicy {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  requirePermission(
    principal: AuthenticatedPrincipal,
    permission: AllocationPermission,
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
    permission: AllocationPermission,
    write: boolean,
  ) {
    const membership = this.requirePermission(principal, permission);
    const scope = await this.projects.scope(projectId);
    if (write) await this.projects.requireProjectWrite(principal, scope);
    else await this.projects.requireProjectRead(principal, scope);
    return membership;
  }
}
