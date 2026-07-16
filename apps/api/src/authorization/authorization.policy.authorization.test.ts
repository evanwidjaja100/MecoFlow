import { describe, expect, it } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
} from "../identity/identity.types.js";
import { AuthorizationPolicy } from "./authorization.policy.js";
import type {
  ProjectScopePolicy,
  ProjectScopeResolver,
} from "./project-scope.policy.js";

function principal(membership: PrincipalMembership): AuthenticatedPrincipal {
  return {
    memberships: [membership],
    sessionId: "session",
    user: {
      displayName: "Test User",
      email: "user@example.test",
      id: "user",
      locale: "en",
    },
  };
}

const internalReadonly = principal({
  id: "membership-internal",
  organization: {
    code: "MECO",
    id: "org-internal",
    name: "MECO",
    type: "INTERNAL",
  },
  permissions: new Set(["organization.read", "project.read"]),
  roles: ["FINANCE_READONLY"],
});

const supplierAdmin = principal({
  id: "membership-supplier",
  organization: {
    code: "SUPPLIER-A",
    id: "org-supplier",
    name: "Supplier A",
    type: "SUPPLIER",
  },
  permissions: new Set(["supplier.membership.write", "project.read"]),
  roles: ["SUPPLIER_ADMIN"],
});

describe("server-side authorization policy", () => {
  const policy = new AuthorizationPolicy();

  it("allows an explicitly granted read permission", () => {
    expect(
      policy.hasPermission(
        internalReadonly,
        "organization.read",
        "org-internal",
      ),
    ).toBe(true);
  });

  it("denies write access to a read-only role", () => {
    expect(() =>
      policy.requirePermission(internalReadonly, "organization.write"),
    ).toThrow(ForbiddenException);
  });

  it("denies supplier access to internal administration", () => {
    expect(() => policy.requireInternalAdministration(supplierAdmin)).toThrow(
      ForbiddenException,
    );
  });

  it("uses not-found semantics for an organization outside the principal scope", () => {
    expect(() =>
      policy.requireOrganizationScope(supplierAdmin, "org-other"),
    ).toThrow(NotFoundException);
  });

  it("exposes Phase 2 project scope only as deny-capable interfaces", () => {
    const resolver: ProjectScopeResolver = {
      canAccessProject: async () => false,
    };
    const projectPolicy: ProjectScopePolicy = {
      requireProjectRead: async () => Promise.reject(new ForbiddenException()),
      requireProjectWrite: async () => Promise.reject(new ForbiddenException()),
    };
    expect(resolver.canAccessProject).toBeTypeOf("function");
    expect(projectPolicy.requireProjectWrite).toBeTypeOf("function");
  });
});
