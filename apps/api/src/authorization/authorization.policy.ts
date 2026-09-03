import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";

@Injectable()
export class AuthorizationPolicy {
  hasPermission(
    principal: AuthenticatedPrincipal,
    permission: string,
    organizationId?: string,
  ): boolean {
    return principal.memberships.some(
      (membership) =>
        (!organizationId || membership.organization.id === organizationId) &&
        membership.permissions.has(permission),
    );
  }

  requirePermission(
    principal: AuthenticatedPrincipal,
    permission: string,
    organizationId?: string,
  ): void {
    if (!this.hasPermission(principal, permission, organizationId))
      throw new ForbiddenException("Access denied");
  }

  requireInternalAdministration(principal: AuthenticatedPrincipal): void {
    const allowed = principal.memberships.some(
      (membership) =>
        membership.organization.type === "INTERNAL" &&
        membership.permissions.has("administration.access"),
    );
    if (!allowed) throw new ForbiddenException("Access denied");
  }

  requireOrganizationScope(
    principal: AuthenticatedPrincipal,
    organizationId: string,
  ): PrincipalMembership {
    const qualifying = principal.memberships.filter(
      (candidate) => candidate.organization.id === organizationId,
    );
    if (qualifying.length !== 1)
      throw new NotFoundException("Resource not found");
    return qualifying[0] as PrincipalMembership;
  }
}
