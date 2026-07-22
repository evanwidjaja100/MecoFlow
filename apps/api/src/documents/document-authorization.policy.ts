import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

@Injectable()
export class DocumentAuthorizationPolicy {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  private membership(
    principal: AuthenticatedPrincipal,
    internalPermission: string,
    supplierPermission?: string,
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        (candidate.organization.type === "INTERNAL" &&
          candidate.permissions.has(internalPermission)) ||
        (candidate.organization.type === "SUPPLIER" &&
          supplierPermission &&
          candidate.permissions.has(supplierPermission)),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  preflightRead(principal: AuthenticatedPrincipal) {
    return this.membership(
      principal,
      "document.read",
      "supplier.document.read",
    );
  }

  preflightUpload(principal: AuthenticatedPrincipal) {
    return this.membership(
      principal,
      "document.upload",
      "supplier.document.upload",
    );
  }

  preflightReview(principal: AuthenticatedPrincipal) {
    return this.membership(principal, "document.review");
  }

  preflightApprove(principal: AuthenticatedPrincipal) {
    return this.membership(principal, "document.approve");
  }

  async requireRead(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.preflightRead(principal);
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectRead(principal, scope);
    return membership;
  }

  async requireUpload(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.preflightUpload(principal);
    const scope = await this.projects.scope(projectId);
    if (membership.organization.type === "INTERNAL")
      await this.projects.requireProjectWrite(principal, scope);
    else await this.projects.requireProjectRead(principal, scope);
    return membership;
  }

  async requireReview(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.preflightReview(principal);
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectWrite(principal, scope);
    return membership;
  }

  async requireApprove(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.preflightApprove(principal);
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectWrite(principal, scope);
    return membership;
  }
}
