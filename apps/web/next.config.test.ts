import { describe, expect, it } from "vitest";
import { browserSecurityHeaders } from "./next.config.js";

describe("browser security headers", () => {
  it("deny framing, MIME sniffing, broad permissions, and unsafe content sources", () => {
    const headers = new Map(
      browserSecurityHeaders.map(({ key, value }) => [key, value]),
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("same-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers.get("Content-Security-Policy")).toContain(
      "object-src 'none'",
    );
    expect(headers.get("Content-Security-Policy")).not.toContain("http:");
    expect(headers.get("Content-Security-Policy")).not.toContain("https:");
  });
});
