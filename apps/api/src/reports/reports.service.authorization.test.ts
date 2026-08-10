import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { ReportsAuthorizationPolicy } from "./reports-authorization.policy.js";
import { ReportsService } from "./reports.service.js";

function principal(input: {
  organizationId?: string;
  organizationType: "INTERNAL" | "SUPPLIER";
  permissions: string[];
}): AuthenticatedPrincipal {
  return {
    memberships: [
      {
        id: "membership-1",
        organization: {
          code: "ORG",
          id: input.organizationId ?? "organization-1",
          name: "Organization",
          type: input.organizationType,
        },
        permissions: new Set(input.permissions),
        roles: [],
      },
    ],
    sessionId: "session-1",
    user: {
      displayName: "Test User",
      email: "user@example.test",
      id: "user-1",
      locale: "en",
    },
  };
}

const period = { from: "2026-01-01", to: "2026-01-31" };

describe("Phase 8B report authorization", () => {
  it("denies report.read without the underlying project/readiness/BOM grants", () => {
    const policy = new ReportsAuthorizationPolicy();
    expect(() =>
      policy.requireInternalReportRead(
        principal({
          organizationType: "INTERNAL",
          permissions: ["report.read", "project.read", "readiness.read"],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("denies internal scorecards without every underlying source read", () => {
    const policy = new ReportsAuthorizationPolicy();
    expect(() =>
      policy.requireInternalScorecard(
        principal({
          organizationType: "INTERNAL",
          permissions: [
            "report.read",
            "scorecard.read",
            "project.read",
            "readiness.read",
            "bom.read",
            "purchase-order.read",
            "shipment.read",
            "inspection.read",
          ],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("rejects a supplier-supplied organization selector before repository access", async () => {
    const supplier = principal({
      organizationId: "supplier-a",
      organizationType: "SUPPLIER",
      permissions: [
        "project.read",
        "supplier.scorecard.read",
        "supplier.scorecard.export",
      ],
    });
    const repository = { supplierFacts: vi.fn() };
    const service = new ReportsService(
      new ReportsAuthorizationPolicy(),
      repository as never,
    );
    await expect(
      service.ownSupplierScorecard(supplier, {
        ...period,
        supplierOrganizationId: "supplier-b",
      }),
    ).rejects.toThrow(
      "Supplier organization is derived from the authenticated membership",
    );
    expect(repository.supplierFacts).not.toHaveBeenCalled();
  });

  it("passes only the authenticated supplier membership into scoped loading", async () => {
    const supplier = principal({
      organizationId: "supplier-a",
      organizationType: "SUPPLIER",
      permissions: ["project.read", "supplier.scorecard.read"],
    });
    const repository = {
      supplierFacts: vi
        .fn()
        .mockResolvedValue({ inspections: [], lines: [], ncrs: [] }),
    };
    const service = new ReportsService(
      new ReportsAuthorizationPolicy(),
      repository as never,
    );
    const result = await service.ownSupplierScorecard(supplier, period);
    expect(repository.supplierFacts).toHaveBeenCalledWith(
      supplier,
      period,
      expect.objectContaining({
        internal: false,
        membership: supplier.memberships[0],
      }),
    );
    expect(result.data.supplier.id).toBe("supplier-a");
  });
});
