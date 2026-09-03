import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { createDatabaseClient, type PrismaClient } from "@mecoflow/database";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type { RequestContext } from "../identity/identity.types.js";

@Injectable()
export class AdministrationRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  listOrganizations() {
    return this.database.organization.findMany({ orderBy: { code: "asc" } });
  }

  listRoles() {
    return this.database.role.findMany({ orderBy: { code: "asc" } });
  }

  listUsers() {
    return this.database.userProfile.findMany({
      orderBy: { email: "asc" },
      select: { displayName: true, email: true, id: true, status: true },
    });
  }

  listMemberships(organizationId: string) {
    return this.database.membership.findMany({
      include: {
        roles: { select: { roleCode: true }, orderBy: { roleCode: "asc" } },
        user: {
          select: { displayName: true, email: true, id: true, status: true },
        },
      },
      orderBy: { user: { email: "asc" } },
      where: { organizationId },
    });
  }

  async createOrganization(input: {
    code: string;
    name: string;
    type: "INTERNAL" | "SUPPLIER";
    actorUserId?: string | null;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId?: string | null;
    context?: RequestContext;
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      let organization;
      try {
        organization = await transaction.organization.create({
          data: { code: input.code, name: input.name, type: input.type },
        });
      } catch {
        throw new ConflictException("Organization code already exists");
      }
      if (input.context) {
        await (transaction.auditEvent.create as any)({
          data: {
            action: "ORGANIZATION_CREATED",
            actorMembershipId: input.actorMembershipId ?? null,
            actorUserId: (input.actorUserId as string) ?? null,
            changes: { code: organization.code, type: organization.type },
            correlationId: input.context.correlationId,
            entityId: organization.id,
            entityType: "Organization",
            organizationId: organization.id,
            outcome: "SUCCESS",
            requestId: input.context.requestId,
            systemPrincipal: input.systemPrincipal ?? null,
          },
        });
      }
      return organization;
    });
  }

  async createMembership(input: {
    actorUserId: string;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId?: string | null;
    context: RequestContext;
    organizationId: string;
    userId: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const [organization, user] = await Promise.all([
        transaction.organization.findUnique({
          where: { id: input.organizationId },
        }),
        transaction.userProfile.findUnique({ where: { id: input.userId } }),
      ]);
      if (!organization || !user)
        throw new NotFoundException("Resource not found");
      let membership;
      try {
        membership = await transaction.membership.create({
          data: { organizationId: input.organizationId, userId: input.userId },
        });
      } catch {
        throw new ConflictException("Membership already exists");
      }
      await (transaction.auditEvent.create as any)({
        data: {
          action: "MEMBERSHIP_CREATED",
          actorMembershipId: (input as any).actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          systemPrincipal: (input as any).systemPrincipal ?? null,
          changes: {
            status: { from: null, to: "ACTIVE" },
            userId: input.userId,
          },
          correlationId: input.context.correlationId,
          entityId: membership.id,
          entityType: "Membership",
          organizationId: input.organizationId,
          outcome: "SUCCESS",
          requestId: input.context.requestId,
        },
      });
      return membership;
    });
  }

  async updateMembershipStatus(input: {
    actorUserId: string;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId?: string | null;
    context: RequestContext;
    expectedVersion: number;
    membershipId: string;
    organizationId: string;
    status: "ACTIVE" | "INACTIVE";
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const current = await transaction.membership.findFirst({
        where: { id: input.membershipId, organizationId: input.organizationId },
      });
      if (!current) throw new NotFoundException("Resource not found");
      if (current.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      if (current.status === input.status) return current;
      const updated = await transaction.membership.update({
        data: { status: input.status, version: { increment: 1 } },
        where: { id: current.id },
      });
      await (transaction.auditEvent.create as any)({
        data: {
          action: "MEMBERSHIP_STATUS_CHANGED",
          actorMembershipId: (input as any).actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          systemPrincipal: (input as any).systemPrincipal ?? null,
          changes: { status: { from: current.status, to: updated.status } },
          correlationId: input.context.correlationId,
          entityId: current.id,
          entityType: "Membership",
          organizationId: input.organizationId,
          outcome: "SUCCESS",
          requestId: input.context.requestId,
        },
      });
      return updated;
    });
  }

  async assignRoles(input: {
    actorUserId: string;
    actorMembershipId?: string | null;
    systemPrincipal?: string | null;
    auditOrganizationId?: string | null;
    context: RequestContext;
    expectedVersion: number;
    membershipId: string;
    organizationId: string;
    roleCodes: readonly string[];
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      const membership = await transaction.membership.findFirst({
        include: { organization: true, roles: true },
        where: { id: input.membershipId, organizationId: input.organizationId },
      });
      if (!membership) throw new NotFoundException("Resource not found");
      if (membership.version !== input.expectedVersion)
        throw new ConflictException("Concurrent modification");
      const uniqueRoleCodes = [...new Set(input.roleCodes)].sort();
      const roles = await transaction.role.findMany({
        where: { code: { in: uniqueRoleCodes } },
      });
      if (roles.length !== uniqueRoleCodes.length)
        throw new UnprocessableEntityException("Invalid role assignment");
      if (
        roles.some(
          (role) =>
            role.scope !== "ANY" && role.scope !== membership.organization.type,
        )
      )
        throw new UnprocessableEntityException("Invalid role assignment");
      const before = membership.roles.map(({ roleCode }) => roleCode).sort();
      const added = uniqueRoleCodes.filter((code) => !before.includes(code));
      const removed = before.filter((code) => !uniqueRoleCodes.includes(code));
      if (added.length === 0 && removed.length === 0) return membership;
      const versionUpdate = await transaction.membership.updateMany({
        data: { version: { increment: 1 } },
        where: { id: membership.id, version: input.expectedVersion },
      });
      if (versionUpdate.count !== 1)
        throw new ConflictException("Concurrent modification");
      if (removed.length > 0)
        await transaction.membershipRole.deleteMany({
          where: { membershipId: membership.id, roleCode: { in: removed } },
        });
      if (added.length > 0)
        await transaction.membershipRole.createMany({
          data: added.map((roleCode) => ({
            assignedByUserId: input.actorUserId as string,
            membershipId: membership.id,
            roleCode,
          })),
        });
      await (transaction.auditEvent.create as any)({
        data: {
          action: "MEMBERSHIP_ROLES_CHANGED",
          actorMembershipId: (input as any).actorMembershipId ?? null,
          actorUserId: input.actorUserId as string,
          systemPrincipal: (input as any).systemPrincipal ?? null,
          changes: { added, removed },
          correlationId: input.context.correlationId,
          entityId: membership.id,
          entityType: "Membership",
          organizationId: input.organizationId,
          outcome: "SUCCESS",
          requestId: input.context.requestId,
        },
      });
      return transaction.membership.findUniqueOrThrow({
        include: { roles: { select: { roleCode: true } } },
        where: { id: membership.id },
      });
    });
  }
}
