import { describe, expect, it, vi } from "vitest";
import type { AuthorizationPolicy } from "../authorization/authorization.policy.js";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import type { AdministrationRepository } from "./administration.repository.js";
import { AdministrationService } from "./administration.service.js";

const principal: AuthenticatedPrincipal = {
  sessionId: "s1",
  user: {
    id: "u1",
    displayName: "Admin",
    email: "admin@test.com",
    locale: "en",
  },
  memberships: [],
};

function setup() {
  const authorization = {
    requireInternalAdministration: vi.fn(),
    requirePermission: vi.fn(),
  } as unknown as AuthorizationPolicy;

  const repository = {
    listOrganizations: vi.fn(),
    listRoles: vi.fn(),
    listUsers: vi.fn(),
    listMemberships: vi.fn(),
    createOrganization: vi.fn(),
    createMembership: vi.fn(),
    updateMembershipStatus: vi.fn(),
    assignRoles: vi.fn(),
  } as unknown as AdministrationRepository;

  const service = new AdministrationService(authorization, repository);
  return { authorization, repository, service };
}

describe("AdministrationService", () => {
  describe("listOrganizations", () => {
    it("calls auth checks and returns organizations", async () => {
      const { authorization, repository, service } = setup();
      repository.listOrganizations.mockResolvedValue([
        { id: "org-1", code: "TEST" },
      ]);
      const result = await service.listOrganizations(principal);
      expect(authorization.requireInternalAdministration).toHaveBeenCalledWith(
        principal,
      );
      expect(authorization.requirePermission).toHaveBeenCalledWith(
        principal,
        "organization.read",
      );
      expect(repository.listOrganizations).toHaveBeenCalledOnce();
      expect(result).toEqual([{ id: "org-1", code: "TEST" }]);
    });
  });

  describe("listRoles", () => {
    it("calls auth checks and returns roles", async () => {
      const { authorization, repository, service } = setup();
      repository.listRoles.mockResolvedValue([{ code: "ADMIN" }]);
      const result = await service.listRoles(principal);
      expect(authorization.requireInternalAdministration).toHaveBeenCalledWith(
        principal,
      );
      expect(authorization.requirePermission).toHaveBeenCalledWith(
        principal,
        "role.read",
      );
      expect(repository.listRoles).toHaveBeenCalledOnce();
      expect(result).toEqual([{ code: "ADMIN" }]);
    });
  });

  describe("listUsers", () => {
    it("calls auth checks and returns users", async () => {
      const { authorization, repository, service } = setup();
      repository.listUsers.mockResolvedValue([{ id: "u1", email: "a@b.c" }]);
      const result = await service.listUsers(principal);
      expect(authorization.requireInternalAdministration).toHaveBeenCalledWith(
        principal,
      );
      expect(authorization.requirePermission).toHaveBeenCalledWith(
        principal,
        "user.read",
      );
      expect(repository.listUsers).toHaveBeenCalledOnce();
      expect(result).toEqual([{ id: "u1", email: "a@b.c" }]);
    });
  });

  describe("listMemberships", () => {
    it("passes orgId and returns memberships", async () => {
      const { authorization, repository, service } = setup();
      repository.listMemberships.mockResolvedValue([{ id: "m1" }]);
      const result = await service.listMemberships(principal, "org-1");
      expect(authorization.requireInternalAdministration).toHaveBeenCalledWith(
        principal,
      );
      expect(authorization.requirePermission).toHaveBeenCalledWith(
        principal,
        "membership.read",
        "org-1",
      );
      expect(repository.listMemberships).toHaveBeenCalledWith("org-1");
      expect(result).toEqual([{ id: "m1" }]);
    });
  });

  describe("createOrganization", () => {
    it("calls auth and delegates to repo with input", async () => {
      const { authorization, repository, service } = setup();
      const input = {
        code: "TEST",
        name: "Test Org",
        type: "INTERNAL" as const,
      };
      repository.createOrganization.mockResolvedValue({
        id: "org-1",
        ...input,
      });
      const result = await service.createOrganization(principal, input);
      expect(authorization.requireInternalAdministration).toHaveBeenCalledWith(
        principal,
      );
      expect(authorization.requirePermission).toHaveBeenCalledWith(
        principal,
        "organization.write",
      );
      expect(repository.createOrganization).toHaveBeenCalledWith(input);
      expect(result).toEqual({ id: "org-1", ...input });
    });
  });

  describe("createMembership", () => {
    it("passes context and userId to repo", async () => {
      const { authorization, repository, service } = setup();
      const context = { correlationId: "corr-1", requestId: "req-1" };
      repository.createMembership.mockResolvedValue({ id: "m1" });
      const result = await service.createMembership(
        principal,
        context,
        "org-1",
        "u2",
      );
      expect(authorization.requireInternalAdministration).toHaveBeenCalledWith(
        principal,
      );
      expect(authorization.requirePermission).toHaveBeenCalledWith(
        principal,
        "membership.write",
        "org-1",
      );
      expect(repository.createMembership).toHaveBeenCalledWith({
        actorUserId: "u1",
        context,
        organizationId: "org-1",
        userId: "u2",
      });
      expect(result).toEqual({ id: "m1" });
    });
  });

  describe("updateMembershipStatus", () => {
    it("passes all params to repo", async () => {
      const { authorization, repository, service } = setup();
      const context = { correlationId: "corr-1", requestId: "req-1" };
      const input = {
        expectedVersion: 2,
        status: "ACTIVE" as const,
      };
      repository.updateMembershipStatus.mockResolvedValue({
        id: "m1",
        version: 3,
        status: "ACTIVE",
      });
      const result = await service.updateMembershipStatus(
        principal,
        context,
        "org-1",
        "m1",
        input,
      );
      expect(authorization.requireInternalAdministration).toHaveBeenCalledWith(
        principal,
      );
      expect(authorization.requirePermission).toHaveBeenCalledWith(
        principal,
        "membership.write",
        "org-1",
      );
      expect(repository.updateMembershipStatus).toHaveBeenCalledWith({
        actorUserId: "u1",
        context,
        membershipId: "m1",
        organizationId: "org-1",
        ...input,
      });
      expect(result).toEqual({ id: "m1", version: 3, status: "ACTIVE" });
    });
  });

  describe("assignRoles", () => {
    it("passes all params to repo", async () => {
      const { authorization, repository, service } = setup();
      const context = { correlationId: "corr-1", requestId: "req-1" };
      const input = { expectedVersion: 1, roleCodes: ["ADMIN"] };
      repository.assignRoles.mockResolvedValue({
        id: "m1",
        roles: [{ roleCode: "ADMIN" }],
      });
      const result = await service.assignRoles(
        principal,
        context,
        "org-1",
        "m1",
        input,
      );
      expect(authorization.requireInternalAdministration).toHaveBeenCalledWith(
        principal,
      );
      expect(authorization.requirePermission).toHaveBeenCalledWith(
        principal,
        "role.assign",
        "org-1",
      );
      expect(repository.assignRoles).toHaveBeenCalledWith({
        actorUserId: "u1",
        context,
        membershipId: "m1",
        organizationId: "org-1",
        ...input,
      });
      expect(result).toEqual({
        id: "m1",
        roles: [{ roleCode: "ADMIN" }],
      });
    });
  });
});
