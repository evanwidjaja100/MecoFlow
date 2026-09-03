import { ForbiddenException, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";

@Injectable()
export class ItemAuthorizationPolicy {
  private requireInternalPermission(
    principal: AuthenticatedPrincipal,
    permission: "item.export" | "item.read" | "item.write",
  ): PrincipalMembership {
    const qualifying = principal.memberships.filter(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission),
    );
    if (qualifying.length !== 1) throw new ForbiddenException("Access denied");
    return qualifying[0] as PrincipalMembership;
  }

  requireRead(principal: AuthenticatedPrincipal): PrincipalMembership {
    return this.requireInternalPermission(principal, "item.read");
  }

  requireWrite(principal: AuthenticatedPrincipal): PrincipalMembership {
    return this.requireInternalPermission(principal, "item.write");
  }

  requireExport(principal: AuthenticatedPrincipal): PrincipalMembership {
    return this.requireInternalPermission(principal, "item.export");
  }
}
