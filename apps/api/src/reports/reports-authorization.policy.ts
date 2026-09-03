import { ForbiddenException, Injectable } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";

@Injectable()
export class ReportsAuthorizationPolicy {
  private internal(
    principal: AuthenticatedPrincipal,
    permission: "report.export" | "report.read" | "scorecard.read",
  ): PrincipalMembership {
    const qualifying = principal.memberships.filter(
      (candidate) =>
        candidate.organization.type === "INTERNAL" &&
        candidate.permissions.has(permission) &&
        candidate.permissions.has("project.read") &&
        candidate.permissions.has("readiness.read") &&
        candidate.permissions.has("bom.read"),
    );
    if (qualifying.length !== 1) throw new ForbiddenException("Access denied");
    return qualifying[0] as PrincipalMembership;
  }

  requireInternalReportRead(
    principal: AuthenticatedPrincipal,
  ): PrincipalMembership {
    return this.internal(principal, "report.read");
  }

  requireInternalReportExport(
    principal: AuthenticatedPrincipal,
  ): PrincipalMembership {
    return this.internal(principal, "report.export");
  }

  requireInternalScorecard(
    principal: AuthenticatedPrincipal,
  ): PrincipalMembership {
    this.internal(principal, "report.read");
    const membership = this.internal(principal, "scorecard.read");
    this.requireSupplierSourceReads(membership);
    return membership;
  }

  requireInternalScorecardExport(
    principal: AuthenticatedPrincipal,
  ): PrincipalMembership {
    this.internal(principal, "scorecard.read");
    const membership = this.internal(principal, "report.export");
    this.requireSupplierSourceReads(membership);
    return membership;
  }

  private requireSupplierSourceReads(membership: PrincipalMembership): void {
    for (const permission of [
      "purchase-order.read",
      "shipment.read",
      "inspection.read",
      "ncr.read",
    ])
      if (!membership.permissions.has(permission))
        throw new ForbiddenException("Access denied");
  }

  private supplier(
    principal: AuthenticatedPrincipal,
    permission: "supplier.scorecard.export" | "supplier.scorecard.read",
  ): PrincipalMembership {
    const qualifying = principal.memberships.filter(
      (candidate) =>
        candidate.organization.type === "SUPPLIER" &&
        candidate.permissions.has(permission) &&
        candidate.permissions.has("project.read"),
    );
    if (qualifying.length !== 1) throw new ForbiddenException("Access denied");
    return qualifying[0] as PrincipalMembership;
  }

  requireSupplierScorecard(
    principal: AuthenticatedPrincipal,
  ): PrincipalMembership {
    return this.supplier(principal, "supplier.scorecard.read");
  }

  requireSupplierScorecardExport(
    principal: AuthenticatedPrincipal,
  ): PrincipalMembership {
    return this.supplier(principal, "supplier.scorecard.export");
  }
}
