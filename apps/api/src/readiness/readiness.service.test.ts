import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { ReadinessService } from "./readiness.service.js";

const principal = { memberships: [] } as unknown as AuthenticatedPrincipal;

describe("ReadinessService", () => {
  it("authorizes project scope before loading dashboard snapshots", async () => {
    const policy = {
      requireManagement: vi.fn(),
      requireProject: vi.fn().mockResolvedValue(undefined),
    };
    const repository = {
      history: vi.fn(),
      management: vi.fn(),
      materials: vi.fn(),
      overview: vi.fn().mockResolvedValue({ latest: null, workPackages: [] }),
    };
    const service = new ReadinessService(policy as never, repository as never);
    await service.overview(principal, "project-1");
    expect(policy.requireProject).toHaveBeenCalledWith(principal, "project-1");
    expect(repository.overview).toHaveBeenCalledWith("project-1");
    expect(policy.requireProject.mock.invocationCallOrder[0]).toBeLessThan(
      repository.overview.mock.invocationCallOrder[0]!,
    );
  });

  it("does not load snapshots after authorization denial", async () => {
    const denial = new Error("denied");
    const policy = {
      requireManagement: vi.fn(),
      requireProject: vi.fn().mockRejectedValue(denial),
    };
    const repository = {
      history: vi.fn(),
      management: vi.fn(),
      materials: vi.fn(),
      overview: vi.fn(),
    };
    const service = new ReadinessService(policy as never, repository as never);
    await expect(service.materials(principal, "project-1")).rejects.toBe(
      denial,
    );
    expect(repository.materials).not.toHaveBeenCalled();
  });

  it("bounds management pagination before querying the scoped repository", async () => {
    const policy = {
      requireManagement: vi.fn(),
      requireProject: vi.fn(),
    };
    const repository = {
      history: vi.fn(),
      management: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      materials: vi.fn(),
      overview: vi.fn(),
    };
    const service = new ReadinessService(policy as never, repository as never);

    await service.management(principal, {});
    expect(repository.management).toHaveBeenCalledWith(principal, {
      page: 1,
      pageSize: 20,
    });

    expect(() =>
      service.management(principal, { page: "1", pageSize: "101" }),
    ).toThrow("Invalid pagination");
    expect(repository.management).toHaveBeenCalledTimes(1);
  });
});
