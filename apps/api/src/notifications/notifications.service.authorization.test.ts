import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { NotificationsService } from "./notifications.service.js";

const principal = {
  memberships: [
    {
      id: "membership-1",
      organization: { id: "organization-1" },
    },
  ],
  user: { id: "user-1" },
} as unknown as AuthenticatedPrincipal;

describe("NotificationsService authorization ownership", () => {
  it("always scopes inbox operations to the authenticated principal", async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({ data: [], total: 0, unread: 0 }),
      markRead: vi.fn().mockResolvedValue({ id: "notification-1" }),
      preferences: vi.fn().mockResolvedValue([]),
      updatePreference: vi.fn(),
    };
    const service = new NotificationsService(repository as never);
    await service.list(principal, {});
    await service.markRead(principal, "notification-1");
    expect(repository.list).toHaveBeenCalledWith(
      principal,
      expect.objectContaining({ page: 1, pageSize: 20 }),
    );
    expect(repository.markRead).toHaveBeenCalledWith(
      principal,
      "notification-1",
    );
    expect(repository.preferences).not.toHaveBeenCalled();
  });

  it("uses only the authenticated user's identity for preference writes", async () => {
    const repository = {
      list: vi.fn(),
      markRead: vi.fn(),
      preferences: vi.fn(),
      updatePreference: vi.fn().mockResolvedValue({}),
    };
    const service = new NotificationsService(repository as never);
    await service.updatePreference(
      principal,
      { correlationId: "correlation", requestId: "request" },
      "READINESS_ALERT",
      {
        emailEnabled: true,
        expectedVersion: 1,
        inAppEnabled: true,
      },
    );
    expect(repository.updatePreference).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        organizationId: "organization-1",
        type: "READINESS_ALERT",
      }),
    );
  });
});
