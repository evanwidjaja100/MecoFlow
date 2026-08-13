import { describe, expect, it } from "vitest";
import {
  default as playwrightConfig,
  resolveE2ePorts,
  resolveE2eServiceEnvironment,
} from "../../playwright.config.js";

describe("Playwright service port isolation", () => {
  it("uses the documented defaults and accepts distinct overrides", () => {
    expect(resolveE2ePorts({})).toEqual({ api: 3001, oidc: 4310, web: 3000 });
    expect(
      resolveE2ePorts({
        E2E_API_PORT: "3101",
        E2E_WEB_PORT: "3100",
      }),
    ).toEqual({ api: 3101, oidc: 4310, web: 3100 });
  });

  it("rejects invalid or colliding ports", () => {
    expect(() => resolveE2ePorts({ E2E_API_PORT: "0" })).toThrow(
      /between 1 and 65535/u,
    );
    expect(() => resolveE2ePorts({ E2E_API_PORT: "three" })).toThrow(
      /integer port/u,
    );
    expect(() =>
      resolveE2ePorts({ E2E_API_PORT: "3000", E2E_WEB_PORT: "3000" }),
    ).toThrow(/must be distinct/u);
    expect(() => resolveE2ePorts({ E2E_API_PORT: "4310" })).toThrow(
      /must be distinct/u,
    );
  });
});

describe("Playwright service environment", () => {
  it("keeps the web, API, and OIDC callback on one canonical loopback host", () => {
    const environment = resolveE2eServiceEnvironment({});
    expect(environment.CORS_ORIGINS).toBe("http://127.0.0.1:3000");
    expect(environment.NEXT_PUBLIC_API_BASE_URL).toBe("http://127.0.0.1:3001");
    expect(environment.OIDC_REDIRECT_URI).toBe(
      "http://127.0.0.1:3001/api/v1/auth/callback",
    );
    expect(environment.WEB_BASE_URL).toBe("http://127.0.0.1:3000");
    expect(playwrightConfig.use?.baseURL).toBe("http://127.0.0.1:3000");
    const webServers = Array.isArray(playwrightConfig.webServer)
      ? playwrightConfig.webServer
      : [playwrightConfig.webServer];
    expect(webServers[0]?.env?.E2E_API_ORIGIN).toBe(
      environment.NEXT_PUBLIC_API_BASE_URL,
    );
  });

  it("uses the credentials of the isolated CI storage started by the workflow", () => {
    const environment = resolveE2eServiceEnvironment({
      S3_ACCESS_KEY: "ci-access",
      S3_SECRET_KEY: "ci-secret",
    });
    expect(environment.S3_ACCESS_KEY).toBe("ci-access");
    expect(environment.S3_SECRET_KEY).toBe("ci-secret");
  });
});
