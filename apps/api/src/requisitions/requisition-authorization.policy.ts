import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

type RequisitionPermission =
  | "requisition.approve"
  | "requisition.cancel"
  | "requisition.override"
  | "requisition.read"
  | "requisition.submit"
  | "requisition.write";

@Injectable()
export class RequisitionAuthorizationPolicy {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  requirePermission(
    principal: AuthenticatedPrincipal,
    permission: RequisitionPermission,
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
    permission: RequisitionPermission,
    write: boolean,
  ) {
    const membership = this.requirePermission(principal, permission);
    const scope = await this.projects.scope(projectId);
    if (write) await this.projects.requireProjectWrite(principal, scope);
    else await this.projects.requireProjectRead(principal, scope);
    return membership;
  }

  requireRead(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "requisition.read", false);
  }

  requireWrite(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(principal, projectId, "requisition.write", true);
  }

  requireSubmit(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(
      principal,
      projectId,
      "requisition.submit",
      true,
    );
  }

  requireApprove(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(
      principal,
      projectId,
      "requisition.approve",
      true,
    );
  }

  requireCancel(principal: AuthenticatedPrincipal, projectId: string) {
    return this.requireProject(
      principal,
      projectId,
      "requisition.cancel",
      true,
    );
  }

  canOverride(
    principal: AuthenticatedPrincipal,
    qualifyingMembershipId: string,
  ): boolean {
    return principal.memberships.some(
      (membership) =>
        membership.id === qualifyingMembershipId &&
        membership.organization.type === "INTERNAL" &&
        membership.permissions.has("requisition.override"),
    );
  }
}
