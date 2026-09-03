import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
  RequestContext,
} from "../identity/identity.types.js";
import { AuthorizationService } from "../authorization/authorization.service.js";
import type { AuthorizationContextSet } from "../authorization/authorization-context.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

export type NcrInternalPermission =
  "ncr.close" | "ncr.create" | "ncr.issue" | "ncr.read";
export type NcrSupplierPermission =
  "supplier.ncr.read" | "supplier.ncr.respond";

@Injectable()
export class NcrAuthorizationPolicy {
  constructor(
    @Inject(AuthorizationService)
    private readonly authService: AuthorizationService,
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  requireInternalPermission(
    principal: AuthenticatedPrincipal,
    permission: NcrInternalPermission,
  ): PrincipalMembership {
    const qualifying = principal.memberships.filter(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission),
    );
    if (qualifying.length !== 1) throw new ForbiddenException("Access denied");
    return qualifying[0] as PrincipalMembership;
  }

  async requireProject(
    principal: AuthenticatedPrincipal,
    projectId: string,
    permission: NcrInternalPermission,
    write: boolean,
  ) {
    const membership = this.requireInternalPermission(principal, permission);
    const scope = await this.projects.scope(projectId);
    if (write) await this.projects.requireProjectWrite(principal, scope);
    else await this.projects.requireProjectRead(principal, scope);
    return membership;
  }

  supplierScope(
    principal: AuthenticatedPrincipal,
    permission: NcrSupplierPermission,
    requestContext: RequestContext,
  ): AuthorizationContextSet {
    return this.authService.resolveSupplierSet(principal, {
      permission,
      requestContext,
      resource: { type: "Ncr" },
    });
  }
}
