/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  createDatabaseClient,
  Prisma,
  type PrismaClient,
} from "@mecoflow/database";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import type {
  AuthorizationContext,
  AuthorizationContextSet,
} from "../authorization/authorization-context.js";
import type {
  ProjectScopeResolver,
  ProjectScope,
} from "../authorization/project-scope.policy.js";
import { canTransitionProject, type ProjectState } from "./project-state.js";

type ProjectMemberRole =
  "PROJECT_MANAGER" | "CONTRIBUTOR" | "VIEWER" | "SUPPLIER";

interface AuditInput {
  action: string;
  actorUserId: string | null;
  actorMembershipId?: string | null;
  systemPrincipal?: string | null;
  changes: Prisma.InputJsonValue;
  context: RequestContext;
  entityId: string;
  entityType: string;
  organizationId?: string;
}

@Injectable()
export class ProjectsRepository implements ProjectScopeResolver {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private accessWhere(
    principal: AuthenticatedPrincipal,
  ): Prisma.ProjectWhereInput {
    const readableMemberships = principal.memberships.filter((membership) =>
      membership.permissions.has("project.read"),
    );
    if (readableMemberships.length === 0) return { id: { in: [] } };
    return {
      OR: readableMemberships.map((m) => ({
        organizationId: m.organization.id,
        members: { some: { membershipId: m.id, status: "ACTIVE" } },
      })),
    };
  }

  private accessWhereFromContext(
    context: AuthorizationContext,
  ): Prisma.ProjectWhereInput {
    if (context.source === "SYSTEM_PRINCIPAL") {
      return { organizationId: context.organizationId };
    }
    return {
      organizationId: context.organizationId,
      members: {
        some: {
          membershipId: context.actorMembershipId as string,
          status: "ACTIVE",
        },
      },
    };
  }

  private accessWhereFromSet(
    set: AuthorizationContextSet,
  ): Prisma.ProjectWhereInput {
    if (set.contexts.length === 0) return { id: { in: [] } };
    return {
      OR: set.contexts.map((c) =>
        c.source === "SYSTEM_PRINCIPAL"
          ? { organizationId: c.organizationId }
          : {
              organizationId: c.organizationId,
              members: {
                some: {
                  membershipId: c.actorMembershipId as string,
                  status: "ACTIVE",
                },
              },
            },
      ),
    };
  }

  private audit(transaction: Prisma.TransactionClient, input: AuditInput) {
    return (transaction.auditEvent.create as any)({
      data: {
        action: input.action,
        actorMembershipId: input.actorMembershipId ?? null,
        actorUserId: input.actorUserId as string,
        changes: input.changes,
        correlationId: input.context.correlationId,
        entityId: input.entityId,
        entityType: input.entityType,
        organizationId: input.organizationId ?? null,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
        systemPrincipal: input.systemPrincipal ?? null,
      },
    });
  }

  private auditFromContext(
    transaction: Prisma.TransactionClient,
    context: AuthorizationContext,
    input: {
      action: string;
      entityType: string;
      entityId: string;
      organizationId?: string;
      changes?: Prisma.InputJsonValue;
    },
  ) {
    return (transaction.auditEvent.create as any)({
      data: {
        action: input.action,
        actorMembershipId: context.actorMembershipId,
        actorUserId: context.actorUserId,
        changes: (input.changes ?? {}),
        correlationId: context.correlationId,
        entityId: input.entityId,
        entityType: input.entityType,
        organizationId: input.organizationId ?? context.organizationId,
        outcome: "SUCCESS",
        requestId: context.requestId,
        systemPrincipal: context.systemPrincipal ?? null,
      },
    });
  }

  async scope(projectId: string): Promise<ProjectScope | null> {
    return this.database.project
      .findUnique({
        select: { organizationId: true, id: true },
        where: { id: projectId },
      })
      .then((project) =>
        project
          ? { organizationId: project.organizationId, projectId: project.id }
          : null,
      );
  }

  async canAccessProject(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<boolean> {
    return Boolean(
      await this.database.project.findFirst({
        select: { id: true },
        where: {
          ...this.accessWhere(principal),
          id: scope.projectId,
          organizationId: scope.organizationId,
        },
      }),
    );
  }

  async canWriteProject(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<boolean> {
    const writableMemberships = principal.memberships.filter((membership) =>
      membership.permissions.has("project.write"),
    );
    if (writableMemberships.length === 0) return false;
    return Boolean(
      await this.database.project.findFirst({
        select: { id: true },
        where: {
          id: scope.projectId,
          organizationId: scope.organizationId,
          OR: writableMemberships.map((m) => ({
            organizationId: m.organization.id,
            members: {
              some: { membershipId: m.id, status: "ACTIVE" },
            },
          })),
        },
      }),
    );
  }

  async canAccessProjectFromContext(
    context: AuthorizationContext,
    scope: ProjectScope,
  ): Promise<boolean> {
    return Boolean(
      await this.database.project.findFirst({
        select: { id: true },
        where: {
          ...this.accessWhereFromContext(context),
          id: scope.projectId,
          organizationId: scope.organizationId,
        },
      }),
    );
  }

  async canWriteProjectFromContext(
    context: AuthorizationContext,
    scope: ProjectScope,
  ): Promise<boolean> {
    if (context.source === "SYSTEM_PRINCIPAL") return true;
    return Boolean(
      await this.database.project.findFirst({
        select: { id: true },
        where: {
          id: scope.projectId,
          organizationId: scope.organizationId,
          members: {
            some: {
              membershipId: context.actorMembershipId as string,
              status: "ACTIVE",
            },
          },
        },
      }),
    );
  }

  async listWithContext(
    context: AuthorizationContext,
    input: {
      q?: string;
      state?: string;
      categoryId?: string;
      page: number;
      pageSize: number;
    },
  ) {
    return this.listWithSet({ contexts: [context] }, input);
  }

  async listWithSet(
    set: AuthorizationContextSet,
    input: {
      q?: string;
      state?: string;
      categoryId?: string;
      page: number;
      pageSize: number;
    },
  ) {
    const where: Prisma.ProjectWhereInput = {
      AND: [
        this.accessWhereFromSet(set),
        {
          ...(input.categoryId ? { productCategoryId: input.categoryId } : {}),
          ...(input.state ? { state: input.state as any } : {}),
          ...(input.q
            ? {
                OR: [
                  { code: { contains: input.q, mode: "insensitive" } },
                  { name: { contains: input.q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      ],
    };
    const [data, total] = await this.database.$transaction([
      this.database.project.findMany({
        include: { productCategory: true },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        where,
      }),
      this.database.project.count({ where }),
    ]);
    return { data, total };
  }

  listProductCategories(activeOnly = false) {
    return this.database.productCategory.findMany({
      orderBy: { name: "asc" },
      ...(activeOnly ? { where: { active: true } } : {}),
    });
  }

  async createProductCategory(input: {
    actorUserId: string;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    name: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      let category;
      try {
        category = await transaction.productCategory.create({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
          },
        });
      } catch {
        throw new UnprocessableEntityException("Invalid product category");
      }
      await this.audit(transaction, {
        action: "PRODUCT_CATEGORY_CREATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: { code: { from: null, to: category.code } },
        context: input.context,
        entityId: category.id,
        entityType: "ProductCategory",
        organizationId: input.auditOrganizationId,
      });
      return category;
    });
  }

  async updateProductCategory(input: {
    active: boolean;
    actorUserId: string;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    id: string;
    name: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const current = await transaction.productCategory.findUnique({
        where: { id: input.id },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      let result;
      try {
        result = await transaction.productCategory.updateMany({
          data: {
            active: input.active,
            code: input.code,
            description: input.description,
            name: input.name,
            version: { increment: 1 },
          },
          where: { id: input.id, version: input.expectedVersion },
        });
      } catch {
        throw new UnprocessableEntityException("Invalid product category");
      }
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.productCategory.findUniqueOrThrow({
        where: { id: input.id },
      });
      await this.audit(transaction, {
        action: "PRODUCT_CATEGORY_UPDATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          active: { from: current.active, to: updated.active },
          code: { from: current.code, to: updated.code },
          name: { from: current.name, to: updated.name },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "ProductCategory",
        organizationId: input.auditOrganizationId,
      });
      return updated;
    });
  }

  async listProjects(
    principal: AuthenticatedPrincipal,
    input: {
      categoryId?: string;
      direction: "asc" | "desc";
      page: number;
      pageSize: number;
      q?: string;
      sort: "code" | "name" | "plannedStartDate" | "state" | "updatedAt";
      state?: ProjectState;
    },
  ) {
    const where: Prisma.ProjectWhereInput = {
      AND: [
        this.accessWhere(principal),
        {
          ...(input.categoryId ? { productCategoryId: input.categoryId } : {}),
          ...(input.state ? { state: input.state } : {}),
          ...(input.q
            ? {
                OR: [
                  { code: { contains: input.q, mode: "insensitive" } },
                  { name: { contains: input.q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      ],
    };
    const [data, total] = await this.database.$transaction([
      this.database.project.findMany({
        orderBy: [{ [input.sort]: input.direction }, { id: "asc" }],
        select: {
          code: true,
          id: true,
          name: true,
          plannedEndDate: true,
          plannedStartDate: true,
          productCategory: { select: { code: true, id: true, name: true } },
          state: true,
          updatedAt: true,
          version: true,
        },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        where,
      }),
      this.database.project.count({ where }),
    ]);
    return { data, total };
  }

  async createProject(input: {
    actorMembershipId: string;
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    name: string;
    organizationId: string;
    plannedEndDate: Date;
    plannedStartDate: Date;
    productCategoryId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const [organization, category, membership] = await Promise.all([
        transaction.organization.findFirst({
          where: { active: true, id: input.organizationId, type: "INTERNAL" },
        }),
        transaction.productCategory.findFirst({
          where: { active: true, id: input.productCategoryId },
        }),
        transaction.membership.findFirst({
          where: {
            id: input.actorMembershipId,
            organizationId: input.organizationId,
            status: "ACTIVE",
            userId: input.actorUserId,
          },
        }),
      ]);
      if (!organization || !category || !membership)
        throw new UnprocessableEntityException("Invalid project scope");
      let project;
      try {
        project = await transaction.project.create({
          data: {
            code: input.code,
            createdByUserId: input.actorUserId,
            description: input.description,
            name: input.name,
            organizationId: input.organizationId,
            plannedEndDate: input.plannedEndDate,
            plannedStartDate: input.plannedStartDate,
            productCategoryId: input.productCategoryId,
          },
        });
      } catch {
        throw new UnprocessableEntityException("Invalid or duplicate project");
      }
      await transaction.projectMember.create({
        data: {
          addedByUserId: input.actorUserId,
          membershipId: input.actorMembershipId,
          projectId: project.id,
          role: "PROJECT_MANAGER",
        },
      });
      await this.audit(transaction, {
        action: "PROJECT_CREATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          code: { from: null, to: project.code },
          state: { from: null, to: "DRAFT" },
        },
        context: input.context,
        entityId: project.id,
        entityType: "Project",
        organizationId: project.organizationId,
      });
      return project;
    });
  }

  projectOverview(projectId: string) {
    return this.database.project.findUnique({
      include: {
        members: {
          include: {
            membership: {
              include: {
                organization: {
                  select: { code: true, id: true, name: true, type: true },
                },
                user: { select: { displayName: true, email: true, id: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        milestones: { orderBy: [{ targetDate: "asc" }, { code: "asc" }] },
        organization: { select: { code: true, id: true, name: true } },
        productCategory: { select: { code: true, id: true, name: true } },
        transitions: {
          include: { actor: { select: { displayName: true, id: true } } },
          orderBy: { occurredAt: "desc" },
        },
        workPackages: {
          orderBy: [{ plannedStartDate: "asc" }, { code: "asc" }],
        },
      },
      where: { id: projectId },
    });
  }

  async updateProject(input: {
    actorMembershipId?: string | null;
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    name: string;
    plannedEndDate: Date;
    plannedStartDate: Date;
    productCategoryId: string;
    projectId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      if (input.actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: input.actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const [current, category] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        transaction.productCategory.findFirst({
          where: { active: true, id: input.productCategoryId },
        }),
      ]);
      if (!current) throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(current.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (!category)
        throw new UnprocessableEntityException("Invalid product category");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const [milestoneOutsideDates, workPackageOutsideDates] =
        await Promise.all([
          transaction.milestone.findFirst({
            select: { id: true },
            where: {
              projectId: input.projectId,
              OR: [
                { targetDate: { lt: input.plannedStartDate } },
                { targetDate: { gt: input.plannedEndDate } },
              ],
            },
          }),
          transaction.workPackage.findFirst({
            select: { id: true },
            where: {
              projectId: input.projectId,
              OR: [
                { plannedStartDate: { lt: input.plannedStartDate } },
                { plannedEndDate: { gt: input.plannedEndDate } },
              ],
            },
          }),
        ]);
      if (milestoneOutsideDates || workPackageOutsideDates)
        throw new UnprocessableEntityException(
          "Project dates exclude existing planned work",
        );
      let result;
      try {
        result = await transaction.project.updateMany({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
            plannedEndDate: input.plannedEndDate,
            plannedStartDate: input.plannedStartDate,
            productCategoryId: input.productCategoryId,
            version: { increment: 1 },
          },
          where: { id: input.projectId, version: input.expectedVersion },
        });
      } catch {
        throw new UnprocessableEntityException("Invalid or duplicate project");
      }
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.project.findUniqueOrThrow({
        where: { id: input.projectId },
      });
      await this.audit(transaction, {
        action: "PROJECT_UPDATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          code: { from: current.code, to: updated.code },
          name: { from: current.name, to: updated.name },
          plannedEndDate: {
            from: current.plannedEndDate.toISOString(),
            to: updated.plannedEndDate.toISOString(),
          },
          plannedStartDate: {
            from: current.plannedStartDate.toISOString(),
            to: updated.plannedStartDate.toISOString(),
          },
        },
        context: input.context,
        entityId: current.id,
        entityType: "Project",
        organizationId: current.organizationId,
      });
      return updated;
    });
  }

  async transitionProject(input: {
    actorMembershipId?: string | null;
    actorUserId: string;
    context: RequestContext;
    expectedVersion: number;
    projectId: string;
    reason: string;
    targetState: ProjectState;
  }) {
    return this.database.$transaction(async (transaction) => {
      if (input.actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: input.actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const current = await transaction.project.findUnique({
        where: { id: input.projectId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (!canTransitionProject(current.state, input.targetState))
        throw new UnprocessableEntityException("Invalid project transition");
      const result = await transaction.project.updateMany({
        data: { state: input.targetState, version: { increment: 1 } },
        where: { id: input.projectId, version: input.expectedVersion },
      });
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const transition = await transaction.projectTransition.create({
        data: {
          actorUserId: input.actorUserId,
          projectId: input.projectId,
          reason: input.reason,
          sourceState: current.state,
          targetState: input.targetState,
        },
      });
      await this.audit(transaction, {
        action: "PROJECT_STATE_TRANSITIONED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          reason: input.reason,
          sourceState: current.state,
          targetState: input.targetState,
          transitionId: transition.id,
        },
        context: input.context,
        entityId: current.id,
        entityType: "Project",
        organizationId: current.organizationId,
      });
      return transaction.project.findUniqueOrThrow({
        where: { id: current.id },
      });
    });
  }

  async memberCandidates(projectId: string) {
    const project = await this.database.project.findUnique({
      select: { organizationId: true },
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Resource not found");
    return this.database.membership.findMany({
      orderBy: [{ organization: { name: "asc" } }, { user: { email: "asc" } }],
      select: {
        id: true,
        organization: {
          select: { code: true, id: true, name: true, type: true },
        },
        user: { select: { displayName: true, email: true, id: true } },
      },
      where: {
        organization: {
          active: true,
          OR: [{ id: project.organizationId }, { type: "SUPPLIER" }],
        },
        projectMembers: { none: { projectId } },
        status: "ACTIVE",
      },
    });
  }

  async addProjectMember(input: {
    actorMembershipId?: string | null;
    actorUserId: string;
    context: RequestContext;
    membershipId: string;
    projectId: string;
    role: ProjectMemberRole;
  }) {
    return this.database.$transaction(async (transaction) => {
      if (input.actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: input.actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const [project, membership] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        transaction.membership.findFirst({
          include: { organization: true },
          where: {
            id: input.membershipId,
            organization: { active: true },
            status: "ACTIVE",
          },
        }),
      ]);
      if (!project || !membership)
        throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      const supplier = membership.organization.type === "SUPPLIER";
      if (
        (supplier && input.role !== "SUPPLIER") ||
        (!supplier && input.role === "SUPPLIER") ||
        (!supplier && membership.organizationId !== project.organizationId)
      )
        throw new UnprocessableEntityException("Invalid project member scope");
      let member;
      try {
        member = await transaction.projectMember.create({
          data: {
            addedByUserId: input.actorUserId,
            membershipId: input.membershipId,
            projectId: input.projectId,
            role: input.role,
          },
        });
      } catch {
        throw new UnprocessableEntityException("Project member already exists");
      }
      await this.audit(transaction, {
        action: "PROJECT_MEMBER_ADDED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          membershipId: input.membershipId,
          role: { from: null, to: input.role },
          status: { from: null, to: "ACTIVE" },
        },
        context: input.context,
        entityId: member.id,
        entityType: "ProjectMember",
        organizationId: project.organizationId,
      });
      return member;
    });
  }

  async updateProjectMember(input: {
    actorMembershipId?: string | null;
    actorUserId: string;
    context: RequestContext;
    expectedVersion: number;
    memberId: string;
    projectId: string;
    role: ProjectMemberRole;
    status: "ACTIVE" | "INACTIVE";
  }) {
    return this.database.$transaction(async (transaction) => {
      if (input.actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: input.actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const current = await transaction.projectMember.findFirst({
        include: {
          membership: { include: { organization: true } },
          project: true,
        },
        where: { id: input.memberId, projectId: input.projectId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(current.project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const supplier = current.membership.organization.type === "SUPPLIER";
      if (
        (supplier && input.role !== "SUPPLIER") ||
        (!supplier && input.role === "SUPPLIER")
      )
        throw new UnprocessableEntityException("Invalid project member scope");
      if (
        input.status === "ACTIVE" &&
        (current.membership.status !== "ACTIVE" ||
          !current.membership.organization.active)
      )
        throw new UnprocessableEntityException("Inactive membership scope");
      if (
        current.status === "ACTIVE" &&
        current.role === "PROJECT_MANAGER" &&
        (input.status !== "ACTIVE" || input.role !== "PROJECT_MANAGER")
      ) {
        const managerCount = await transaction.projectMember.count({
          where: {
            projectId: input.projectId,
            role: "PROJECT_MANAGER",
            status: "ACTIVE",
          },
        });
        if (managerCount <= 1)
          throw new UnprocessableEntityException(
            "A project manager is required",
          );
      }
      const result = await transaction.projectMember.updateMany({
        data: {
          role: input.role,
          status: input.status,
          version: { increment: 1 },
        },
        where: {
          id: input.memberId,
          projectId: input.projectId,
          version: input.expectedVersion,
        },
      });
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.projectMember.findUniqueOrThrow({
        where: { id: input.memberId },
      });
      await this.audit(transaction, {
        action: "PROJECT_MEMBER_UPDATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          role: { from: current.role, to: updated.role },
          status: { from: current.status, to: updated.status },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "ProjectMember",
        organizationId: current.project.organizationId,
      });
      return updated;
    });
  }

  async createMilestone(input: {
    actorMembershipId?: string | null;
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    name: string;
    projectId: string;
    targetDate: Date;
  }) {
    return this.database.$transaction(async (transaction) => {
      if (input.actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: input.actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const project = await transaction.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (
        input.targetDate < project.plannedStartDate ||
        input.targetDate > project.plannedEndDate
      )
        throw new UnprocessableEntityException(
          "Milestone date is outside project dates",
        );
      let milestone;
      try {
        milestone = await transaction.milestone.create({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
            projectId: input.projectId,
            targetDate: input.targetDate,
          },
        });
      } catch {
        throw new UnprocessableEntityException(
          "Invalid or duplicate milestone",
        );
      }
      await this.audit(transaction, {
        action: "MILESTONE_CREATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          code: { from: null, to: milestone.code },
          targetDate: milestone.targetDate.toISOString(),
        },
        context: input.context,
        entityId: milestone.id,
        entityType: "Milestone",
        organizationId: project.organizationId,
      });
      return milestone;
    });
  }

  async updateMilestone(input: {
    actorMembershipId?: string | null;
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    milestoneId: string;
    name: string;
    projectId: string;
    targetDate: Date;
  }) {
    return this.database.$transaction(async (transaction) => {
      if (input.actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: input.actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const [project, current] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        transaction.milestone.findFirst({
          where: { id: input.milestoneId, projectId: input.projectId },
        }),
      ]);
      if (!project || !current)
        throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (
        input.targetDate < project.plannedStartDate ||
        input.targetDate > project.plannedEndDate
      )
        throw new UnprocessableEntityException(
          "Milestone date is outside project dates",
        );
      let result;
      try {
        result = await transaction.milestone.updateMany({
          data: {
            code: input.code,
            description: input.description,
            name: input.name,
            targetDate: input.targetDate,
            version: { increment: 1 },
          },
          where: {
            id: input.milestoneId,
            projectId: input.projectId,
            version: input.expectedVersion,
          },
        });
      } catch {
        throw new UnprocessableEntityException(
          "Invalid or duplicate milestone",
        );
      }
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.milestone.findUniqueOrThrow({
        where: { id: input.milestoneId },
      });
      await this.audit(transaction, {
        action: "MILESTONE_UPDATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          targetDate: {
            from: current.targetDate.toISOString(),
            to: updated.targetDate.toISOString(),
          },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "Milestone",
        organizationId: project.organizationId,
      });
      return updated;
    });
  }

  async createWorkPackage(input: {
    actorMembershipId?: string | null;
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    milestoneId?: string;
    name: string;
    plannedEndDate: Date;
    plannedStartDate: Date;
    projectId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      if (input.actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: input.actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const [project, milestone] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        input.milestoneId
          ? transaction.milestone.findFirst({
              where: { id: input.milestoneId, projectId: input.projectId },
            })
          : Promise.resolve(null),
      ]);
      if (!project || (input.milestoneId && !milestone))
        throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (
        input.plannedStartDate < project.plannedStartDate ||
        input.plannedEndDate > project.plannedEndDate
      )
        throw new UnprocessableEntityException(
          "Work package dates are outside project dates",
        );
      let workPackage;
      try {
        workPackage = await transaction.workPackage.create({
          data: {
            code: input.code,
            description: input.description,
            milestoneId: input.milestoneId ?? null,
            name: input.name,
            plannedEndDate: input.plannedEndDate,
            plannedStartDate: input.plannedStartDate,
            projectId: input.projectId,
          },
        });
      } catch {
        throw new UnprocessableEntityException(
          "Invalid or duplicate work package",
        );
      }
      await this.audit(transaction, {
        action: "WORK_PACKAGE_CREATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          code: { from: null, to: workPackage.code },
          milestoneId: input.milestoneId ?? null,
        },
        context: input.context,
        entityId: workPackage.id,
        entityType: "WorkPackage",
        organizationId: project.organizationId,
      });
      return workPackage;
    });
  }

  async updateWorkPackage(input: {
    actorMembershipId?: string | null;
    actorUserId: string;
    code: string;
    context: RequestContext;
    description: string;
    expectedVersion: number;
    milestoneId?: string;
    name: string;
    plannedEndDate: Date;
    plannedStartDate: Date;
    projectId: string;
    workPackageId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      if (input.actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: input.actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const [project, current, milestone] = await Promise.all([
        transaction.project.findUnique({ where: { id: input.projectId } }),
        transaction.workPackage.findFirst({
          where: { id: input.workPackageId, projectId: input.projectId },
        }),
        input.milestoneId
          ? transaction.milestone.findFirst({
              where: { id: input.milestoneId, projectId: input.projectId },
            })
          : Promise.resolve(null),
      ]);
      if (!project || !current || (input.milestoneId && !milestone))
        throw new NotFoundException("Resource not found");
      if (["COMPLETED", "CANCELLED"].includes(project.state))
        throw new UnprocessableEntityException("Project is read-only");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (
        input.plannedStartDate < project.plannedStartDate ||
        input.plannedEndDate > project.plannedEndDate
      )
        throw new UnprocessableEntityException(
          "Work package dates are outside project dates",
        );
      let result;
      try {
        result = await transaction.workPackage.updateMany({
          data: {
            code: input.code,
            description: input.description,
            milestoneId: input.milestoneId ?? null,
            name: input.name,
            plannedEndDate: input.plannedEndDate,
            plannedStartDate: input.plannedStartDate,
            version: { increment: 1 },
          },
          where: {
            id: input.workPackageId,
            projectId: input.projectId,
            version: input.expectedVersion,
          },
        });
      } catch {
        throw new UnprocessableEntityException(
          "Invalid or duplicate work package",
        );
      }
      if (result.count !== 1)
        throw new ConflictException("Concurrent modification");
      const updated = await transaction.workPackage.findUniqueOrThrow({
        where: { id: input.workPackageId },
      });
      await this.audit(transaction, {
        action: "WORK_PACKAGE_UPDATED",
        actorMembershipId: (input as any).actorMembershipId ?? null,
        actorUserId: input.actorUserId,
        changes: {
          milestoneId: { from: current.milestoneId, to: updated.milestoneId },
          plannedEndDate: {
            from: current.plannedEndDate.toISOString(),
            to: updated.plannedEndDate.toISOString(),
          },
          plannedStartDate: {
            from: current.plannedStartDate.toISOString(),
            to: updated.plannedStartDate.toISOString(),
          },
        },
        context: input.context,
        entityId: updated.id,
        entityType: "WorkPackage",
        organizationId: project.organizationId,
      });
      return updated;
    });
  }
}
