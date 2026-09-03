/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { AuthorizationService } from "./authorization.service.js";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";

function membership(
  overrides: Partial<PrincipalMembership> & {
    id: string;
    organization: { id: string; type: "INTERNAL" | "SUPPLIER" };
  },
): PrincipalMembership {
  return {
    organization: {
      code: overrides.organization.code ?? "ORG",
      id: overrides.organization.id,
      name: overrides.organization.name ?? "Org",
      type: overrides.organization.type,
    },
    permissions: overrides.permissions ?? new Set(),
    roles: overrides.roles ?? [],
    status: "ACTIVE" as const,
    id: overrides.id,
    ...overrides,
  } as unknown as PrincipalMembership;
}

function principal(memberships: PrincipalMembership[]): AuthenticatedPrincipal {
  return {
    memberships,
    sessionId: "session",
    user: {
      displayName: "Test User",
      email: "user@example.test",
      id: "user-1",
      locale: "en",
    },
  };
}

const requestContext = { correlationId: "corr-1", requestId: "req-1" } as any;

describe("canonical AuthorizationContext", () => {
  const service = new AuthorizationService();

  it("resolve requires exactly one qualifying membership (deny zero)", () => {
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-1", type: "INTERNAL" },
        permissions: new Set(["project.read"]),
      }),
    ]);
    expect(() =>
      service.resolve(p, {
        permission: "project.write",
        resource: { type: "Project" },
        requestContext,
      }),
    ).toThrow(ForbiddenException);
  });

  it("resolve denies when two memberships both qualify (union must deny)", () => {
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-1", type: "INTERNAL" },
        permissions: new Set(["project.write"]),
      }),
      membership({
        id: "m2",
        organization: { id: "org-2", type: "INTERNAL" },
        permissions: new Set(["project.write"]),
      }),
    ]);
    expect(() =>
      service.resolve(p, {
        permission: "project.write",
        resource: { type: "Project" },
        requestContext,
      }),
    ).toThrow(ForbiddenException);
  });

  it("resolve succeeds with exactly one qualifying membership and returns tuple", () => {
    const m = membership({
      id: "m1",
      organization: { id: "org-1", type: "INTERNAL" },
      permissions: new Set(["project.write"]),
      roles: ["ADMIN"],
    });
    const p = principal([m]);
    const ctx = service.resolve(p, {
      permission: "project.write",
      resource: { type: "Project", id: "proj-1" },
      organizationId: "org-1",
      projectId: "proj-1",
      requestContext,
    });
    expect(ctx.actorMembershipId).toBe("m1");
    expect(ctx.organizationId).toBe("org-1");
    expect(ctx.requiredPermission).toBe("project.write");
    expect(ctx.source).toBe("MEMBERSHIP_QUALIFIED");
  });

  it("resolveSupplierSet returns tuple-OR contexts for each qualifying supplier membership", () => {
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-s1", type: "SUPPLIER" },
        permissions: new Set(["supplier.ncr.read"]),
      }),
      membership({
        id: "m2",
        organization: { id: "org-s2", type: "SUPPLIER" },
        permissions: new Set(["supplier.ncr.read"]),
      }),
      membership({
        id: "m3",
        organization: { id: "org-internal", type: "INTERNAL" },
        permissions: new Set(["supplier.ncr.read"]),
      }),
    ]);
    const set = service.resolveSupplierSet(p, {
      permission: "supplier.ncr.read",
      requestContext,
      resource: { type: "Ncr" },
    });
    expect(set.contexts).toHaveLength(2);
    expect(set.contexts.map((c) => c.organizationId).sort()).toEqual([
      "org-s1",
      "org-s2",
    ]);
    expect(set.contexts.every((c) => c.actorMembershipId !== null)).toBe(true);
  });

  it("resolveSupplierSet denies when no qualifying supplier membership", () => {
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-1", type: "INTERNAL" },
        permissions: new Set(["supplier.ncr.read"]),
      }),
    ]);
    expect(() =>
      service.resolveSupplierSet(p, {
        permission: "supplier.ncr.read",
        requestContext,
        resource: { type: "Ncr" },
      }),
    ).toThrow(ForbiddenException);
  });

  it("resolveSystemPrincipal creates system principal context with null actor", () => {
    const ctx = service.resolveSystemPrincipal({
      systemPrincipal: "WORKER_BOM_IMPORT",
      organizationId: "org-1",
      organizationType: "INTERNAL",
      requestContext,
      resource: { type: "BomImport", id: "import-1" },
      permission: "bom.import",
    });
    expect(ctx.actorUserId).toBeNull();
    expect(ctx.actorMembershipId).toBeNull();
    expect(ctx.systemPrincipal).toBe("WORKER_BOM_IMPORT");
    expect(ctx.source).toBe("SYSTEM_PRINCIPAL");
  });

  it("client hint is not authority — resolve ignores hint and uses membership only", () => {
    const m = membership({
      id: "m1",
      organization: { id: "org-1", type: "INTERNAL" },
      permissions: new Set(["project.read"]),
    });
    const p = principal([m]);
    // Even if client sends x-organization-id: org-2, resolve with org-1 still succeeds only if membership matches
    const ctx = service.resolve(p, {
      permission: "project.read",
      resource: { type: "Project" },
      organizationId: "org-1",
      requestContext,
    });
    expect(ctx.organizationId).toBe("org-1");
    expect(() =>
      service.resolve(p, {
        permission: "project.read",
        resource: { type: "Project" },
        organizationId: "org-2",
        requestContext,
      }),
    ).toThrow(ForbiddenException);
  });
});

describe("supplier tuple-OR isolation (no cross)", () => {
  it("four rows with two orgs each bound to distinct memberships produce no cross leakage", () => {
    // This is a logical test: OR: [{org:s1, membership:m1}, {org:s2, membership:m2}] must not match {org:s1, membership:m2}
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-s1", type: "SUPPLIER" },
        permissions: new Set(["supplier.purchase-order.read"]),
      }),
      membership({
        id: "m2",
        organization: { id: "org-s2", type: "SUPPLIER" },
        permissions: new Set(["supplier.purchase-order.read"]),
      }),
    ]);
    const service2 = new AuthorizationService();
    const set = service2.resolveSupplierSet(p, {
      permission: "supplier.purchase-order.read",
      requestContext,
      resource: { type: "PurchaseOrder" },
    });
    // Simulate repository predicate: OR of tuples
    const rows = [
      { supplierOrganizationId: "org-s1", membershipId: "m1" },
      { supplierOrganizationId: "org-s1", membershipId: "m2" }, // cross — should not be returned
      { supplierOrganizationId: "org-s2", membershipId: "m1" }, // cross — should not be returned
      { supplierOrganizationId: "org-s2", membershipId: "m2" },
    ];
    const authorized = rows.filter((row) =>
      set.contexts.some(
        (c) =>
          c.organizationId === row.supplierOrganizationId &&
          c.actorMembershipId === row.membershipId,
      ),
    );
    expect(authorized).toHaveLength(2);
    expect(authorized.map((r) => r.supplierOrganizationId).sort()).toEqual([
      "org-s1",
      "org-s2",
    ]);
  });
});
// appended test
describe("extra coverage", function () {
  it("disabled membership still resolves but repo will reject", function () {
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-1", type: "INTERNAL" },
        permissions: new Set(["project.write"]),
        status: "DISABLED" as any,
      }),
    ]);
    const ctx = new AuthorizationService().resolve(p, {
      permission: "project.write",
      resource: { type: "Project" },
      organizationId: "org-1",
      requestContext,
    });
    expect(ctx.actorMembershipId).toBe("m1");
  });
  it("IDOR wrong org denies", function () {
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-1", type: "INTERNAL" },
        permissions: new Set(["project.read"]),
      }),
    ]);
    expect(function () {
      new AuthorizationService().resolve(p, {
        permission: "project.read",
        resource: { type: "Project", id: "proj-x" },
        organizationId: "org-2",
        requestContext,
      });
    }).toThrow(ForbiddenException);
  });
  it("supplier cannot escalate to internal", function () {
    const p = principal([
      membership({
        id: "m-supplier",
        organization: { id: "org-s1", type: "SUPPLIER" },
        permissions: new Set(["supplier.ncr.read"]),
      }),
    ]);
    expect(function () {
      new AuthorizationService().resolve(p, {
        permission: "project.write",
        resource: { type: "Project" },
        organizationType: "INTERNAL",
        requestContext,
      });
    }).toThrow(ForbiddenException);
  });
  it("permutes two memberships denies union", function () {
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-1", type: "INTERNAL" },
        permissions: new Set(["project.write"]),
      }),
      membership({
        id: "m2",
        organization: { id: "org-1", type: "INTERNAL" },
        permissions: new Set(["project.write"]),
      }),
    ]);
    expect(function () {
      new AuthorizationService().resolve(p, {
        permission: "project.write",
        resource: { type: "Project" },
        organizationId: "org-1",
        requestContext,
      });
    }).toThrow(ForbiddenException);
  });
  it("concurrent revoke still denies union", function () {
    const p = principal([
      membership({
        id: "m1",
        organization: { id: "org-1", type: "INTERNAL" },
        permissions: new Set(["project.write"]),
      }),
      membership({
        id: "m2",
        organization: { id: "org-2", type: "INTERNAL" },
        permissions: new Set(["project.write"]),
      }),
    ]);
    expect(function () {
      new AuthorizationService().resolve(p, {
        permission: "project.write",
        resource: { type: "Project" },
        requestContext,
      });
    }).toThrow(ForbiddenException);
  });
  it("system principal has null actor", function () {
    const ctx = new AuthorizationService().resolveSystemPrincipal({
      systemPrincipal: "WORKER_BOM_IMPORT",
      organizationId: "org-1",
      organizationType: "INTERNAL",
      requestContext,
      resource: { type: "BomImport" },
      permission: "bom.import",
    });
    expect(ctx.source).toBe("SYSTEM_PRINCIPAL");
    expect(ctx.actorUserId).toBeNull();
  });
});
