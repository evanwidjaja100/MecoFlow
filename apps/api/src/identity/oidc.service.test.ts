import { describe, expect, it } from "vitest";
import {
  isAllowedOidcEndpoint,
  readBoundedOidcJson,
  validateOidcClaims,
} from "./oidc.service.js";

const now = 1_700_000_000;
const valid = {
  aud: "mecoflow-web",
  exp: now + 300,
  iat: now - 5,
  iss: "https://identity.example/realms/mecoflow",
  nonce: "expected-nonce",
  sub: "user-123",
};

const input = {
  clientId: "mecoflow-web",
  expectedIssuer: "https://identity.example/realms/mecoflow",
  expectedNonce: "expected-nonce",
  now,
};

describe("OIDC ID-token claims", () => {
  it("accepts the documented single-audience profile", () => {
    expect(validateOidcClaims(valid, input)).toEqual(valid);
  });

  it("requires this client as authorized party for multiple audiences", () => {
    expect(() =>
      validateOidcClaims(
        { ...valid, aud: ["mecoflow-web", "another-client"] },
        input,
      ),
    ).toThrow("invalid claims");
    expect(
      validateOidcClaims(
        {
          ...valid,
          aud: ["mecoflow-web", "another-client"],
          azp: "mecoflow-web",
        },
        input,
      ),
    ).toBeDefined();
    expect(() =>
      validateOidcClaims(
        {
          ...valid,
          aud: ["mecoflow-web", "another-client"],
          azp: "another-client",
        },
        input,
      ),
    ).toThrow("invalid claims");
  });

  it("rejects a mismatched authorized party and future not-before claim", () => {
    expect(() =>
      validateOidcClaims({ ...valid, azp: "another-client" }, input),
    ).toThrow("invalid claims");
    expect(() =>
      validateOidcClaims({ ...valid, nbf: now + 61 }, input),
    ).toThrow("invalid claims");
  });

  it("rejects malformed temporal and subject claims without coercion", () => {
    expect(() =>
      validateOidcClaims(
        { ...valid, exp: "1700000300" as unknown as number },
        input,
      ),
    ).toThrow("invalid claims");
    expect(() => validateOidcClaims({ ...valid, sub: "" }, input)).toThrow(
      "invalid claims",
    );
  });
});

describe("OIDC provider response boundaries", () => {
  it("requires HTTPS endpoints in production", () => {
    expect(isAllowedOidcEndpoint("https://identity.example/token", true)).toBe(
      true,
    );
    expect(isAllowedOidcEndpoint("http://identity.example/token", true)).toBe(
      false,
    );
    expect(isAllowedOidcEndpoint("file:///identity.json", false)).toBe(false);
  });

  it("reads bounded JSON and rejects oversized provider responses", async () => {
    await expect(
      readBoundedOidcJson(
        new Response(JSON.stringify({ issuer: "https://identity.example" })),
      ),
    ).resolves.toEqual({ issuer: "https://identity.example" });
    await expect(
      readBoundedOidcJson(new Response(`"${"x".repeat(1024 * 1024)}"`)),
    ).rejects.toThrow("too large");
  });
});
