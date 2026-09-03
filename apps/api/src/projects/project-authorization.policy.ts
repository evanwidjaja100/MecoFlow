import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthorizationPolicy } from "../authorization/authorization.policy.js";
import { AuthorizationService } from "../authorization/authorization.service.js";
import type {
  AuthorizationContext,
  AuthorizationContextSet,
} from "../authorization/authorization-context.js";
import type {
  ProjectScope,
  ProjectScopePolicy,
} from "../authorization/project-scope.policy.js";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
  RequestContext,
} from "../identity/identity.types.js";
import { ProjectsRepository } from "./projects.repository.js";

@Injectable()
export class ProjectAuthorizationPolicy implements ProjectScopePolicy {
  constructor(
    @Inject(AuthorizationPolicy)
    private readonly authorization: AuthorizationPolicy,
    @Inject(AuthorizationService)
    private readonly authService: AuthorizationService,
    @Inject(ProjectsRepository)
    private readonly projects: ProjectsRepository,
  ) {}

  requireList(principal: AuthenticatedPrincipal): void {
    const qualifying = principal.memberships.filter(
      (m) =>
        m.organization.type === "INTERNAL" && m.permissions.has("project.read"),
    );
    if (qualifying.length === 0) throw new ForbiddenException("Access denied");
  }

  requireListSet(
    principal: AuthenticatedPrincipal,
    requestContext: RequestContext,
  ): AuthorizationContextSet {
    return this.authService.resolveSet(principal, {
      permission: "project.read",
      resource: { type: "Project" },
      organizationType: "INTERNAL",
      requestContext,
    });
  }

  requireCategoryWrite(principal: AuthenticatedPrincipal): PrincipalMembership {
    const qualifying = principal.memberships.filter(
      (m) =>
        m.organization.type === "INTERNAL" &&
        m.permissions.has("project.write"),
    );
    if (qualifying.length !== 1) throw new ForbiddenException("Access denied");
    return qualifying[0] as PrincipalMembership;
  }

  requireCategoryWriteContext(
    principal: AuthenticatedPrincipal,
    requestContext: RequestContext,
  ): AuthorizationContext {
    return this.authService.resolve(principal, {
      permission: "project.write",
      resource: { type: "ProductCategory" },
      organizationType: "INTERNAL",
      requestContext,
    });
  }

  requireCreate(
    principal: AuthenticatedPrincipal,
    organizationId: string,
  ): PrincipalMembership {
    const qualifying = principal.memberships.filter(
      (m) =>
        m.organization.id === organizationId &&
        m.organization.type === "INTERNAL" &&
        m.permissions.has("project.write"),
    );
    if (qualifying.length !== 1) throw new ForbiddenException("Access denied");
    return qualifying[0] as PrincipalMembership;
  }

  requireCreateContext(
    principal: AuthenticatedPrincipal,
    organizationId: string,
    requestContext: RequestContext,
  ): AuthorizationContext {
    return this.authService.resolve(principal, {
      permission: "project.write",
      resource: { type: "Project" },
      organizationId,
      organizationType: "INTERNAL",
      requestContext,
    });
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
    const qualifying = principal.memberships.filter((m) =>
      m.permissions.has("project.read"),
    );
    if (qualifying.length === 0) throw new ForbiddenException("Access denied");
    if (!(await this.projects.canAccessProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }

  async requireProjectReadContext(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
    requestContext: RequestContext,
  ): Promise<AuthorizationContext> {
    const context = this.authService.resolve(principal, {
      permission: "project.read",
      resource: { type: "Project", id: scope.projectId },
      organizationId: scope.organizationId,
      projectId: scope.projectId,
      requestContext,
    });
    if (!(await this.projects.canAccessProjectFromContext(context, scope)))
      throw new NotFoundException("Resource not found");
    return context;
  }

  async requireProjectWrite(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void> {
    const qualifying = principal.memberships.filter((m) =>
      m.permissions.has("project.write"),
    );
    if (qualifying.length === 0) throw new ForbiddenException("Access denied");
    if (!(await this.projects.canWriteProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }

  async requireProjectWriteContext(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
    requestContext: RequestContext,
  ): Promise<AuthorizationContext> {
    const context = this.authService.resolve(principal, {
      permission: "project.write",
      resource: { type: "Project", id: scope.projectId },
      organizationId: scope.organizationId,
      projectId: scope.projectId,
      requestContext,
    });
    if (!(await this.projects.canWriteProjectFromContext(context, scope)))
      throw new NotFoundException("Resource not found");
    return context;
  }

  async requireMemberManagement(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void> {
    const qualifying = principal.memberships.filter((m) =>
      m.permissions.has("project.membership.manage"),
    );
    if (qualifying.length === 0) throw new ForbiddenException("Access denied");
    if (!(await this.projects.canWriteProject(principal, scope)))
      throw new NotFoundException("Resource not found");
  }

  async requireMemberManagementContext(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
    requestContext: RequestContext,
  ): Promise<AuthorizationContext> {
    const context = this.authService.resolve(principal, {
      permission: "project.membership.manage",
      resource: { type: "Project", id: scope.projectId },
      organizationId: scope.organizationId,
      projectId: scope.projectId,
      requestContext,
    });
    if (!(await this.projects.canWriteProjectFromContext(context, scope)))
      throw new NotFoundException("Resource not found");
    return context;
  }
}
