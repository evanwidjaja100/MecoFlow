import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
  RequestContext,
} from "../identity/identity.types.js";
import { AuthorizationService } from "../authorization/authorization.service.js";
import type { AuthorizationContextSet } from "../authorization/authorization-context.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

type InternalPermission =
  | "shipment.arrive"
  | "shipment.read"
  | "receiving.correct"
  | "receiving.post"
  | "receiving.read"
  | "receiving.write";
type SupplierPermission =
  "supplier.asn.read" | "supplier.asn.transition" | "supplier.asn.write";

@Injectable()
export class ReceivingAuthorizationPolicy {
  constructor(
    @Inject(AuthorizationService)
    private readonly authService: AuthorizationService,
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  requireInternalPermission(
    principal: AuthenticatedPrincipal,
    permission: InternalPermission,
  ): PrincipalMembership {
    const qualifying = principal.memberships.filter(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission),
    );
    if (qualifying.length !== 1) throw new ForbiddenException("Access denied");
    return qualifying[0] as PrincipalMembership;
  }

  private async requireProject(
    principal: AuthenticatedPrincipal,
    projectId: string,
    permission: InternalPermission,
    write: boolean,
  ) {
    const membership = this.requireInternalPermission(principal, permission);
    const scope = await this.projects.scope(projectId);
    if (write) await this.projects.requireProjectWrite(principal, scope);
    else await this.projects.requireProjectRead(principal, scope);
    return membership;
  }

  requireShipmentRead(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "shipment.read", false);
  }

  requireArrival(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "shipment.arrive", true);
  }

  requireReceiptRead(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "receiving.read", false);
  }

  requireReceiptWrite(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "receiving.write", true);
  }

  requireReceiptPost(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "receiving.post", true);
  }

  requireReceiptCorrection(
    principal: AuthenticatedPrincipal,
    projectId: string,
  ) {
    return this.requireProject(principal, projectId, "receiving.correct", true);
  }

  supplierScope(
    principal: AuthenticatedPrincipal,
    permission: SupplierPermission,
    requestContext: RequestContext,
  ): AuthorizationContextSet {
    return this.authService.resolveSupplierSet(principal, {
      permission,
      requestContext,
      resource: { type: "AdvanceShipmentNotice" },
    });
  }
}
