import { ForbiddenException, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
  RequestContext,
} from "../identity/identity.types.js";
import type {
  AuthorizationContext,
  AuthorizationContextSet,
  SystemPrincipal,
} from "./authorization-context.js";

@Injectable()
export class AuthorizationService {
  resolve(
    principal: AuthenticatedPrincipal,
    input: {
      permission: string;
      resource: { type: string; id?: string };
      organizationId?: string;
      organizationType?: "INTERNAL" | "SUPPLIER";
      projectId?: string;
      requestContext: RequestContext;
    },
  ): AuthorizationContext {
    const qualifying = principal.memberships.filter(
      (m) =>
        m.permissions.has(input.permission) &&
        (!input.organizationId || m.organization.id === input.organizationId) &&
        (!input.organizationType ||
          m.organization.type === input.organizationType),
    );
    if (qualifying.length !== 1) {
      throw new ForbiddenException("Access denied");
    }
    const membership = qualifying[0] as PrincipalMembership;
    return {
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      correlationId: input.requestContext.correlationId,
      organizationId: membership.organization.id,
      organizationType: membership.organization.type,
      permissions: membership.permissions,
      ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
      requestId: input.requestContext.requestId,
      requiredPermission: input.permission,
      resource: input.resource,
      roles: membership.roles,
      source: "MEMBERSHIP_QUALIFIED",
    };
  }

  resolveSystemPrincipal(input: {
    systemPrincipal: SystemPrincipal;
    organizationId: string;
    organizationType: "INTERNAL" | "SUPPLIER";
    requestContext: RequestContext;
    resource: { type: string; id?: string };
    permission: string;
  }): AuthorizationContext {
    return {
      actorMembershipId: null,
      actorUserId: null,
      correlationId: input.requestContext.correlationId,
      organizationId: input.organizationId,
      organizationType: input.organizationType,
      permissions: new Set([input.permission]),
      requestId: input.requestContext.requestId,
      requiredPermission: input.permission,
      resource: input.resource,
      roles: [],
      source: "SYSTEM_PRINCIPAL",
      systemPrincipal: input.systemPrincipal,
    };
  }

  resolveSupplierSet(
    principal: AuthenticatedPrincipal,
    input: {
      permission: string;
      requestContext: RequestContext;
      resource: { type: string; id?: string };
    },
  ): AuthorizationContextSet {
    const qualifying = principal.memberships.filter(
      (m) =>
        m.organization.type === "SUPPLIER" &&
        m.permissions.has(input.permission),
    );
    if (qualifying.length === 0) {
      throw new ForbiddenException("Access denied");
    }
    const contexts = qualifying.map((membership) => ({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      correlationId: input.requestContext.correlationId,
      organizationId: membership.organization.id,
      organizationType: membership.organization.type,
      permissions: membership.permissions,
      requestId: input.requestContext.requestId,
      requiredPermission: input.permission,
      resource: input.resource,
      roles: membership.roles,
      source: "MEMBERSHIP_QUALIFIED" as const,
    }));
    return { contexts };
  }

  resolveSet(
    principal: AuthenticatedPrincipal,
    input: {
      permission: string;
      requestContext: RequestContext;
      resource: { type: string; id?: string };
      organizationType?: "INTERNAL" | "SUPPLIER";
    },
  ): AuthorizationContextSet {
    const qualifying = principal.memberships.filter(
      (m) =>
        m.permissions.has(input.permission) &&
        (!input.organizationType ||
          m.organization.type === input.organizationType),
    );
    if (qualifying.length === 0) {
      throw new ForbiddenException("Access denied");
    }
    const contexts = qualifying.map((membership) => ({
      actorMembershipId: membership.id,
      actorUserId: principal.user.id,
      correlationId: input.requestContext.correlationId,
      organizationId: membership.organization.id,
      organizationType: membership.organization.type,
      permissions: membership.permissions,
      requestId: input.requestContext.requestId,
      requiredPermission: input.permission,
      resource: input.resource,
      roles: membership.roles,
      source: "MEMBERSHIP_QUALIFIED" as const,
    }));
    return { contexts };
  }
}
