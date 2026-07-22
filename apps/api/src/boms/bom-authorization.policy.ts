import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { ProjectAuthorizationPolicy } from "../projects/project-authorization.policy.js";

type BomPermission =
  "bom.import" | "bom.read" | "bom.release" | "bom.review" | "bom.write";

@Injectable()
export class BomAuthorizationPolicy {
  constructor(
    @Inject(ProjectAuthorizationPolicy)
    private readonly projects: ProjectAuthorizationPolicy,
  ) {}

  private membership(
    principal: AuthenticatedPrincipal,
    permission: BomPermission,
  ): PrincipalMembership {
    const membership = principal.memberships.find(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission),
    );
    if (!membership) throw new ForbiddenException("Access denied");
    return membership;
  }

  async requireRead(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.membership(principal, "bom.read");
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectRead(principal, scope);
    return membership;
  }

  async requireWrite(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.membership(principal, "bom.write");
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectWrite(principal, scope);
    return membership;
  }

  async requireImport(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.membership(principal, "bom.import");
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectWrite(principal, scope);
    return membership;
  }

  async requireReview(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.membership(principal, "bom.review");
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectWrite(principal, scope);
    return membership;
  }

  async requireRelease(principal: AuthenticatedPrincipal, projectId: string) {
    const membership = this.membership(principal, "bom.release");
    const scope = await this.projects.scope(projectId);
    await this.projects.requireProjectWrite(principal, scope);
    return membership;
  }
}
