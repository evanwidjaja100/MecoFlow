import { Inject, Injectable } from "@nestjs/common";
import { AuthorizationPolicy } from "../authorization/authorization.policy.js";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import { AdministrationRepository } from "./administration.repository.js";

@Injectable()
export class AdministrationService {
  constructor(
    @Inject(AuthorizationPolicy)
    private readonly authorization: AuthorizationPolicy,
    @Inject(AdministrationRepository)
    private readonly repository: AdministrationRepository,
  ) {}

  listOrganizations(principal: AuthenticatedPrincipal) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(principal, "organization.read");
    return this.repository.listOrganizations();
  }

  listRoles(principal: AuthenticatedPrincipal) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(principal, "role.read");
    return this.repository.listRoles();
  }

  listUsers(principal: AuthenticatedPrincipal) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(principal, "user.read");
    return this.repository.listUsers();
  }

  listMemberships(principal: AuthenticatedPrincipal, organizationId: string) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(
      principal,
      "membership.read",
      organizationId,
    );
    return this.repository.listMemberships(organizationId);
  }

  createOrganization(
    principal: AuthenticatedPrincipal,
    input: { code: string; name: string; type: "INTERNAL" | "SUPPLIER" },
  ) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(principal, "organization.write");
    return this.repository.createOrganization(input);
  }

  createMembership(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    organizationId: string,
    userId: string,
  ) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(
      principal,
      "membership.write",
      organizationId,
    );
    return this.repository.createMembership({
      actorUserId: principal.user.id,
      context,
      organizationId,
      userId,
    });
  }

  updateMembershipStatus(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    organizationId: string,
    membershipId: string,
    input: { expectedVersion: number; status: "ACTIVE" | "INACTIVE" },
  ) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(
      principal,
      "membership.write",
      organizationId,
    );
    return this.repository.updateMembershipStatus({
      actorUserId: principal.user.id,
      context,
      membershipId,
      organizationId,
      ...input,
    });
  }

  assignRoles(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    organizationId: string,
    membershipId: string,
    input: { expectedVersion: number; roleCodes: string[] },
  ) {
    this.authorization.requireInternalAdministration(principal);
    this.authorization.requirePermission(
      principal,
      "role.assign",
      organizationId,
    );
    return this.repository.assignRoles({
      actorUserId: principal.user.id,
      context,
      membershipId,
      organizationId,
      ...input,
    });
  }
}
