import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

export type InspectionPermission =
  | "inspection.conditional-accept"
  | "inspection.configure"
  | "inspection.create"
  | "inspection.finalize"
  | "inspection.read"
  | "inspection.write";

@Injectable()
export class InspectionAuthorizationPolicy {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  requirePermission(
    principal: AuthenticatedPrincipal,
    permission: InspectionPermission,
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  requireConfiguration(principal: AuthenticatedPrincipal) {
    return this.requirePermission(principal, "inspection.configure");
  }

  async requireProject(
    principal: AuthenticatedPrincipal,
    projectId: string,
    permission: InspectionPermission,
    write: boolean,
  ) {
    const membership = this.requirePermission(principal, permission);
    const scope = await this.projects.scope(projectId);
    if (write) await this.projects.requireProjectWrite(principal, scope);
    else await this.projects.requireProjectRead(principal, scope);
    return membership;
  }
}
