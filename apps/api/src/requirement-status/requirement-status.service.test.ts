import { describe, expect, it, vi } from "vitest";
import type { BomAuthorizationPolicy } from "../boms/bom-authorization.policy.js";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import type { RequirementStatusRepository } from "./requirement-status.repository.js";
import { RequirementStatusService } from "./requirement-status.service.js";

const principal = {
  memberships: [],
  sessionId: "session",
  user: {
    displayName: "Projection reader",
    email: "reader@example.invalid",
    id: "30000000-0000-4000-8000-000000000001",
    locale: "en",
  },
} satisfies AuthenticatedPrincipal;

describe("RequirementStatusService", () => {
  it("authorizes internal BOM/project read scope before repository access", async () => {
    const policy = { requireRead: vi.fn().mockResolvedValue(undefined) };
    const repository = {
      projectStatus: vi.fn().mockResolvedValue({
        data: [],
        modelVersion: "material-requirement-status-v1",
      }),
    };
    const service = new RequirementStatusService(
      policy as unknown as BomAuthorizationPolicy,
      repository as unknown as RequirementStatusRepository,
    );
    await expect(
      service.projectStatus(principal, "project-id"),
    ).resolves.toEqual({
      data: [],
      modelVersion: "material-requirement-status-v1",
    });
    expect(policy.requireRead).toHaveBeenCalledWith(principal, "project-id");
    expect(repository.projectStatus).toHaveBeenCalledWith("project-id");
  });

  it("does not load projection data when authorization is denied", async () => {
    const denied = new Error("Access denied");
    const policy = { requireRead: vi.fn().mockRejectedValue(denied) };
    const repository = { projectStatus: vi.fn() };
    const service = new RequirementStatusService(
      policy as unknown as BomAuthorizationPolicy,
      repository as unknown as RequirementStatusRepository,
    );
    await expect(service.projectStatus(principal, "project-id")).rejects.toBe(
      denied,
    );
    expect(repository.projectStatus).not.toHaveBeenCalled();
  });
});
