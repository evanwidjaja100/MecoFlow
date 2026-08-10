import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApplication } from "./bootstrap.js";

describe.sequential("HTTP security configuration", () => {
  let app: INestApplication;
  let baseUrl: string;
  let allowedOrigin: string;

  beforeAll(async () => {
    const created = await createApplication();
    app = created.app;
    allowedOrigin = created.environment.CORS_ORIGINS.split(",")[0]!.trim();
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("marks authenticated API responses private and applies security headers", async () => {
    const response = await fetch(`${baseUrl}/api/v1/me`);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
  });

  it("allows only configured CORS origins with credentials", async () => {
    const allowed = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Origin: allowedOrigin },
    });
    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      allowedOrigin,
    );
    expect(allowed.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );

    const denied = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Origin: "https://untrusted.example" },
    });
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("rejects oversized JSON before controller processing", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      body: JSON.stringify("x".repeat(8 * 1024 * 1024)),
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "not-a-session-token",
      },
      method: "POST",
    });
    expect(response.status).toBe(413);
  });

  it("does not echo parser details or submitted secrets in errors", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      body: '{"password":"must-not-appear"',
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    expect(response.status).toBe(400);
    const body = await response.text();
    expect(body).not.toContain("must-not-appear");
    expect(body).not.toContain("JSON");
    expect(body).toContain("The request is invalid");
  });

  it("bounds repeated API requests", async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 31; attempt += 1) {
      statuses.push((await fetch(`${baseUrl}/api/v1/me`)).status);
    }
    expect(statuses.slice(0, 30)).toEqual(expect.arrayContaining([401]));
    expect(statuses.at(-1)).toBe(429);
  });
});
