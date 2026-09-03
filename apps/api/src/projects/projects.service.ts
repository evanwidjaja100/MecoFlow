import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { datesAreOrdered, type ProjectState } from "./project-state.js";
import { ProjectAuthorizationPolicy } from "./project-authorization.policy.js";
import { ProjectsRepository } from "./projects.repository.js";

function text(value: string | undefined): string {
  return value?.trim() ?? "";
}

function date(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    throw new UnprocessableEntityException("Invalid date");
  return parsed;
}

function projectDates(input: {
  plannedEndDate: string;
  plannedStartDate: string;
}): { plannedEndDate: Date; plannedStartDate: Date } {
  const plannedStartDate = date(input.plannedStartDate);
  const plannedEndDate = date(input.plannedEndDate);
  if (!datesAreOrdered(plannedStartDate, plannedEndDate))
    throw new UnprocessableEntityException("Invalid project dates");
  return { plannedEndDate, plannedStartDate };
}

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly policy: ProjectAuthorizationPolicy,
    @Inject(ProjectsRepository)
    private readonly repository: ProjectsRepository,
  ) {}

  listProductCategories(principal: AuthenticatedPrincipal, activeOnly = false) {
    this.policy.requireList(principal);
    return this.repository.listProductCategories(activeOnly);
  }

  createProductCategory(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: { code: string; description?: string; name: string },
  ) {
    const membership = this.policy.requireCategoryWrite(principal);
    return this.repository.createProductCategory({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      name: input.name.trim(),
    });
  }

  updateProductCategory(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    id: string,
    input: {
      active: boolean;
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
    },
  ) {
    const membership = this.policy.requireCategoryWrite(principal);
    return this.repository.updateProductCategory({
      ...input,
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      auditOrganizationId: membership.organization.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      id,
      name: input.name.trim(),
    });
  }

  async listProjects(
    principal: AuthenticatedPrincipal,
    input: {
      categoryId?: string;
      direction?: "asc" | "desc";
      page?: string;
      pageSize?: string;
      q?: string;
      sort?: "code" | "name" | "plannedStartDate" | "state" | "updatedAt";
      state?: ProjectState;
    },
  ) {
    this.policy.requireList(principal);
    const page = Number(input.page ?? "1");
    const pageSize = Number(input.pageSize ?? "20");
    if (page < 1 || pageSize < 1 || pageSize > 100)
      throw new UnprocessableEntityException("Invalid pagination");
    return this.repository.listProjects(principal, {
      direction: input.direction ?? "asc",
      page,
      pageSize,
      sort: input.sort ?? "code",
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(text(input.q) ? { q: text(input.q) } : {}),
      ...(input.state ? { state: input.state } : {}),
    });
  }

  createProject(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: {
      code: string;
      description?: string;
      name: string;
      organizationId: string;
      plannedEndDate: string;
      plannedStartDate: string;
      productCategoryId: string;
    },
  ) {
    const membership = this.policy.requireCreate(
      principal,
      input.organizationId,
    );
    return this.repository.createProject({
      ...projectDates(input),
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      name: input.name.trim(),
      organizationId: input.organizationId,
      productCategoryId: input.productCategoryId,
    });
  }

  async projectOverview(principal: AuthenticatedPrincipal, projectId: string) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireProjectRead(principal, scope);
    const project = await this.repository.projectOverview(projectId);
    if (!project) throw new UnprocessableEntityException("Project unavailable");
    const internal = principal.memberships.some(
      (membership) => membership.organization.type === "INTERNAL",
    );
    if (internal) return project;
    return { ...project, members: undefined, transitions: undefined };
  }

  async updateProject(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
      plannedEndDate: string;
      plannedStartDate: string;
      productCategoryId: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    const authContext = await this.policy.requireProjectWriteContext(
      principal,
      scope,
      context,
    );
    return this.repository.updateProject({
      ...projectDates(input),
      actorMembershipId: authContext.actorMembershipId,
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      expectedVersion: input.expectedVersion,
      name: input.name.trim(),
      productCategoryId: input.productCategoryId,
      projectId,
    });
  }

  async transitionProject(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      expectedVersion: number;
      reason: string;
      targetState: ProjectState;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    const authContext = await this.policy.requireProjectWriteContext(
      principal,
      scope,
      context,
    );
    return this.repository.transitionProject({
      actorMembershipId: authContext.actorMembershipId,
      actorUserId: principal.user.id,
      context,
      expectedVersion: input.expectedVersion,
      projectId,
      reason: input.reason.trim(),
      targetState: input.targetState,
    });
  }

  async memberCandidates(principal: AuthenticatedPrincipal, projectId: string) {
    const scope = await this.policy.scope(projectId);
    await this.policy.requireMemberManagement(principal, scope);
    return this.repository.memberCandidates(projectId);
  }

  async addProjectMember(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      membershipId: string;
      role: "PROJECT_MANAGER" | "CONTRIBUTOR" | "VIEWER" | "SUPPLIER";
    },
  ) {
    const scope = await this.policy.scope(projectId);
    const authContext = await this.policy.requireMemberManagementContext(
      principal,
      scope,
      context,
    );
    return this.repository.addProjectMember({
      actorMembershipId: authContext.actorMembershipId,
      actorUserId: principal.user.id,
      context,
      membershipId: input.membershipId,
      projectId,
      role: input.role,
    });
  }

  async updateProjectMember(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    memberId: string,
    input: {
      expectedVersion: number;
      role: "PROJECT_MANAGER" | "CONTRIBUTOR" | "VIEWER" | "SUPPLIER";
      status: "ACTIVE" | "INACTIVE";
    },
  ) {
    const scope = await this.policy.scope(projectId);
    const authContext = await this.policy.requireMemberManagementContext(
      principal,
      scope,
      context,
    );
    return this.repository.updateProjectMember({
      actorMembershipId: authContext.actorMembershipId,
      actorUserId: principal.user.id,
      context,
      memberId,
      projectId,
      ...input,
    });
  }

  async createMilestone(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      code: string;
      description?: string;
      name: string;
      targetDate: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    const authContext = await this.policy.requireProjectWriteContext(
      principal,
      scope,
      context,
    );
    return this.repository.createMilestone({
      actorMembershipId: authContext.actorMembershipId,
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      name: input.name.trim(),
      projectId,
      targetDate: date(input.targetDate),
    });
  }

  async updateMilestone(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    milestoneId: string,
    input: {
      code: string;
      description?: string;
      expectedVersion: number;
      name: string;
      targetDate: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    const authContext = await this.policy.requireProjectWriteContext(
      principal,
      scope,
      context,
    );
    return this.repository.updateMilestone({
      actorMembershipId: authContext.actorMembershipId,
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      expectedVersion: input.expectedVersion,
      milestoneId,
      name: input.name.trim(),
      projectId,
      targetDate: date(input.targetDate),
    });
  }

  async createWorkPackage(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    input: {
      code: string;
      description?: string;
      milestoneId?: string;
      name: string;
      plannedEndDate: string;
      plannedStartDate: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    const authContext = await this.policy.requireProjectWriteContext(
      principal,
      scope,
      context,
    );
    return this.repository.createWorkPackage({
      ...projectDates(input),
      actorMembershipId: authContext.actorMembershipId,
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      ...(input.milestoneId ? { milestoneId: input.milestoneId } : {}),
      name: input.name.trim(),
      projectId,
    });
  }

  async updateWorkPackage(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    projectId: string,
    workPackageId: string,
    input: {
      code: string;
      description?: string;
      expectedVersion: number;
      milestoneId?: string;
      name: string;
      plannedEndDate: string;
      plannedStartDate: string;
    },
  ) {
    const scope = await this.policy.scope(projectId);
    const authContext = await this.policy.requireProjectWriteContext(
      principal,
      scope,
      context,
    );
    return this.repository.updateWorkPackage({
      ...projectDates(input),
      actorMembershipId: authContext.actorMembershipId,
      actorUserId: principal.user.id,
      code: input.code.trim().toUpperCase(),
      context,
      description: text(input.description),
      expectedVersion: input.expectedVersion,
      ...(input.milestoneId ? { milestoneId: input.milestoneId } : {}),
      name: input.name.trim(),
      projectId,
      workPackageId,
    });
  }
}
