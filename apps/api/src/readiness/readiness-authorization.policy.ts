import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { AuthorizationPolicy } from "../authorization/authorization.policy.js";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

@Injectable()
export class ReadinessAuthorizationPolicy {
  constructor(
    @Inject(AuthorizationPolicy)
    private readonly authorization: AuthorizationPolicy,
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  requireManagement(principal: AuthenticatedPrincipal): void {
    const internal = principal.memberships.some(
      (membership) =>
        membership.organization.type === "INTERNAL" &&
        membership.permissions.has("readiness.read") &&
        membership.permissions.has("project.read"),
    );
    if (!internal) throw new ForbiddenException("Access denied");
  }

  async requireProject(principal: AuthenticatedPrincipal, projectId: string) {
    this.requireManagement(principal);
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectRead(principal, scope);
  }
}
