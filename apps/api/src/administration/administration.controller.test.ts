import "reflect-metadata";
import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";
import type { IdentityService } from "../identity/identity.service.js";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { AdministrationController } from "./administration.controller.js";
import type { AdministrationService } from "./administration.service.js";

const mockPrincipal: AuthenticatedPrincipal = {
  sessionId: "s1",
  user: {
    id: "u1",
    displayName: "Admin",
    email: "admin@test.com",
    locale: "en",
  },
  memberships: [],
};

const mockRequest = {
  res: { locals: { correlationId: "corr-1", requestId: "req-1" } },
  headers: { cookie: "mecoflow_session=token" },
} as unknown as Request;

function setup() {
  const identity = {
    principal: vi.fn().mockResolvedValue(mockPrincipal),
    beginLogin: vi.fn(),
    completeLogin: vi.fn(),
    logout: vi.fn(),
    webUrl: vi.fn(),
  } as unknown as IdentityService;

  const administration = {
    listOrganizations: vi.fn(),
    listRoles: vi.fn(),
    listUsers: vi.fn(),
    listMemberships: vi.fn(),
    createOrganization: vi.fn(),
    createMembership: vi.fn(),
    updateMembershipStatus: vi.fn(),
    assignRoles: vi.fn(),
  } as unknown as AdministrationService;

  const controller = new AdministrationController(administration, identity);
  return { identity, administration, controller };
}

describe("AdministrationController", () => {
  describe("GET /organizations", () => {
    it("returns organizations with meta", async () => {
      const { identity, administration, controller } = setup();
      vi.mocked(administration.listOrganizations).mockResolvedValue([
        { id: "o1", code: "TEST" },
      ]);

      const result = await controller.organizations(mockRequest);

      expect(identity.principal).toHaveBeenCalledWith(mockRequest);
      expect(administration.listOrganizations).toHaveBeenCalledWith(
        mockPrincipal,
      );
      expect(result).toEqual({
        data: [{ id: "o1", code: "TEST" }],
        meta: { correlationId: "corr-1", requestId: "req-1" },
      });
    });
  });

  describe("POST /organizations (createOrganization)", () => {
    it("creates an organization with CSRF validation", async () => {
      const { identity, administration, controller } = setup();
      const dto = {
        code: "SUPPLIER-1",
        name: "Supplier One",
        type: "SUPPLIER" as const,
      };
      vi.mocked(administration.createOrganization).mockResolvedValue({
        id: "o1",
        ...dto,
      });

      const result = await controller.createOrganization(mockRequest, dto);

      expect(identity.principal).toHaveBeenCalledWith(mockRequest, true);
      expect(administration.createOrganization).toHaveBeenCalledWith(
        mockPrincipal,
        dto,
      );
      expect(result).toEqual({ id: "o1", ...dto });
    });
  });

  describe("GET /roles", () => {
    it("returns roles with meta", async () => {
      const { identity, administration, controller } = setup();
      vi.mocked(administration.listRoles).mockResolvedValue([
        { code: "ADMIN" },
      ]);

      const result = await controller.roles(mockRequest);

      expect(identity.principal).toHaveBeenCalledWith(mockRequest);
      expect(administration.listRoles).toHaveBeenCalledWith(mockPrincipal);
      expect(result).toEqual({
        data: [{ code: "ADMIN" }],
        meta: { correlationId: "corr-1", requestId: "req-1" },
      });
    });
  });

  describe("GET /users", () => {
    it("returns users with meta", async () => {
      const { identity, administration, controller } = setup();
      vi.mocked(administration.listUsers).mockResolvedValue([
        { id: "u1", email: "a@b.com" },
      ]);

      const result = await controller.users(mockRequest);

      expect(identity.principal).toHaveBeenCalledWith(mockRequest);
      expect(administration.listUsers).toHaveBeenCalledWith(mockPrincipal);
      expect(result).toEqual({
        data: [{ id: "u1", email: "a@b.com" }],
        meta: { correlationId: "corr-1", requestId: "req-1" },
      });
    });
  });

  describe("GET /organizations/:id/memberships", () => {
    it("returns memberships with meta", async () => {
      const { identity, administration, controller } = setup();
      vi.mocked(administration.listMemberships).mockResolvedValue([
        { id: "m1" },
      ]);

      const result = await controller.memberships(mockRequest, "org-uuid");

      expect(identity.principal).toHaveBeenCalledWith(mockRequest);
      expect(administration.listMemberships).toHaveBeenCalledWith(
        mockPrincipal,
        "org-uuid",
      );
      expect(result).toEqual({
        data: [{ id: "m1" }],
        meta: { correlationId: "corr-1", requestId: "req-1" },
      });
    });
  });

  describe("POST /organizations/:id/memberships (createMembership)", () => {
    it("creates membership with CSRF validation", async () => {
      const { identity, administration, controller } = setup();
      const dto = { userId: "user-uuid" };
      vi.mocked(administration.createMembership).mockResolvedValue({
        id: "m1",
      });

      const result = await controller.createMembership(
        mockRequest,
        "org-uuid",
        dto,
      );

      expect(identity.principal).toHaveBeenCalledWith(mockRequest, true);
      expect(administration.createMembership).toHaveBeenCalledWith(
        mockPrincipal,
        { correlationId: "corr-1", requestId: "req-1" },
        "org-uuid",
        "user-uuid",
      );
      expect(result).toEqual({ id: "m1" });
    });
  });

  describe("PATCH /organizations/:id/memberships/:mid/status (updateMembershipStatus)", () => {
    it("updates status with CSRF validation", async () => {
      const { identity, administration, controller } = setup();
      const dto = { expectedVersion: 1, status: "INACTIVE" as const };
      vi.mocked(administration.updateMembershipStatus).mockResolvedValue({
        id: "m1",
        version: 2,
        status: "INACTIVE",
      });

      const result = await controller.updateMembershipStatus(
        mockRequest,
        "org-uuid",
        "mem-uuid",
        dto,
      );

      expect(identity.principal).toHaveBeenCalledWith(mockRequest, true);
      expect(administration.updateMembershipStatus).toHaveBeenCalledWith(
        mockPrincipal,
        { correlationId: "corr-1", requestId: "req-1" },
        "org-uuid",
        "mem-uuid",
        dto,
      );
      expect(result).toEqual({ id: "m1", version: 2, status: "INACTIVE" });
    });
  });

  describe("PUT /organizations/:id/memberships/:mid/roles (assignRoles)", () => {
    it("assigns roles with CSRF validation", async () => {
      const { identity, administration, controller } = setup();
      const dto = { expectedVersion: 1, roleCodes: ["FINANCE_READONLY"] };
      vi.mocked(administration.assignRoles).mockResolvedValue({
        id: "m1",
        roles: [{ roleCode: "FINANCE_READONLY" }],
      });

      const result = await controller.assignRoles(
        mockRequest,
        "org-uuid",
        "mem-uuid",
        dto,
      );

      expect(identity.principal).toHaveBeenCalledWith(mockRequest, true);
      expect(administration.assignRoles).toHaveBeenCalledWith(
        mockPrincipal,
        { correlationId: "corr-1", requestId: "req-1" },
        "org-uuid",
        "mem-uuid",
        dto,
      );
      expect(result).toEqual({
        id: "m1",
        roles: [{ roleCode: "FINANCE_READONLY" }],
      });
    });
  });

  describe("dependency metadata", () => {
    it("declares its dependencies explicitly for development transpilers", () => {
      const dependencies = Reflect.getMetadata(
        "self:paramtypes",
        AdministrationController,
      ) as Array<{ index: number; param: unknown }> | undefined;

      expect(dependencies).toBeDefined();
      expect(dependencies!.length).toBeGreaterThanOrEqual(1);
    });
  });
});
