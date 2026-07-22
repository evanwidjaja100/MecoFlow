import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthorizationPolicy } from "../authorization/authorization.policy.js";
import type {
  ProjectScope,
  ProjectScopePolicy,
} from "../authorization/project-scope.policy.js";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectsRepository } from "./projects.repository.js";

@Injectable()
export class ProjectAuthorizationPolicy implements ProjectScopePolicy {
  constructor(
    @Inject(AuthorizationPolicy)
    private readonly authorization: AuthorizationPolicy,
    @Inject(ProjectsRepository)
    private readonly projects: ProjectsRepository,
  ) {}

  requireList(principal: AuthenticatedPrincipal): void {
    this.authorization.requirePermission(principal, "project.read");
  }

  requireCategoryWrite(principal: AuthenticatedPrincipal): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has("project.write"),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  requireCreate(
    principal: AuthenticatedPrincipal,
    organizationId: string,
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.id === organizationId &&
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has("project.write"),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  async scope(projectId: string): Promise<ProjectScope> {
    const scope = await this.projects.scope(projectId);
    if (!scope) throw new NotFoundException("Resource not found");
    return scope;
  }

  async requireProjectRead(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void> {
    this.authorization.requirePermission(principal, "project.read");
    if (!(await this.projects.canAccessProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }

  async requireProjectWrite(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void> {
    this.authorization.requirePermission(principal, "project.write");
    if (!(await this.projects.canWriteProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }

  async requireMemberManagement(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void> {
    this.authorization.requirePermission(
      principal,
      "project.membership.manage",
    );
    if (!(await this.projects.canWriteProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }
}
