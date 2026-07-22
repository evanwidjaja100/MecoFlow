import { describe, expect, it } from "vitest";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { RequisitionAuthorizationPolicy } from "./requisition-authorization.policy.js";

function principal(
  type: "INTERNAL" | "SUPPLIER",
  permissions: string[],
): AuthenticatedPrincipal {
  return {
    memberships: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        organization: {
          code: "TEST",
          id: "20000000-0000-4000-8000-000000000001",
          name: "Test organization",
          type,
        },
        permissions: new Set(permissions),
        roles: [],
      },
    ],
    sessionId: "session",
    user: {
      displayName: "Test User",
      email: "test@example.invalid",
      id: "30000000-0000-4000-8000-000000000001",
      locale: "en",
    },
  };
}

describe("requisition override authorization", () => {
  const policy = new RequisitionAuthorizationPolicy(
    {} as ConstructorParameters<typeof RequisitionAuthorizationPolicy>[0],
  );

  it("requires the separate internal override permission", () => {
    expect(
      policy.canOverride(
        principal("INTERNAL", ["requisition.write"]),
        "10000000-0000-4000-8000-000000000001",
      ),
    ).toBe(false);
    expect(
      policy.canOverride(
        principal("INTERNAL", ["requisition.override"]),
        "10000000-0000-4000-8000-000000000001",
      ),
    ).toBe(true);
    expect(
      policy.canOverride(
        principal("SUPPLIER", ["requisition.override"]),
        "10000000-0000-4000-8000-000000000001",
      ),
    ).toBe(false);
    expect(
      policy.canOverride(
        principal("INTERNAL", ["requisition.override"]),
        "10000000-0000-4000-8000-000000000099",
      ),
    ).toBe(false);
  });
});
