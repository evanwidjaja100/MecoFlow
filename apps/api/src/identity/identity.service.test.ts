import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { ServiceEnvironment } from "@mecoflow/config";
import { IdentityService } from "./identity.service.js";
import type { IdentityRepository } from "./identity.repository.js";
import type { OidcService } from "./oidc.service.js";
import { sha256 } from "./crypto.js";

const environment: ServiceEnvironment = {
  API_PORT: 3001,
  APP_CURRENCY: "IDR",
  APP_ENV: "test",
  APP_TIMEZONE: "Asia/Jakarta",
  APP_VERSION: "test",
  CORS_ORIGINS: "http://localhost:3000",
  DATABASE_URL: "postgresql://user:password@localhost:5432/test",
  LOG_LEVEL: "info",
  NODE_ENV: "test",
  OIDC_CLIENT_ID: "test-client",
  OIDC_ISSUER: "http://localhost:8180/realms/test",
  OIDC_REDIRECT_URI: "http://localhost:3001/api/v1/auth/callback",
  REDIS_URL: "redis://localhost:6379",
  S3_ACCESS_KEY: "test",
  S3_BUCKET: "test-private",
  S3_ENDPOINT: "http://localhost:9000",
  S3_FORCE_PATH_STYLE: true,
  S3_REGION: "us-east-1",
  S3_SECRET_KEY: "test",
  SESSION_SECRET: "test_session_secret_at_least_32_chars",
  SESSION_TTL_SECONDS: 3600,
  VIRUS_SCANNER_ENABLED: false,
  VIRUS_SCANNER_HOST: "127.0.0.1",
  VIRUS_SCANNER_PORT: 3310,
  VIRUS_SCANNER_TIMEOUT_MS: 10000,
  WEB_BASE_URL: "http://localhost:3000",
};

function mockRepo(): IdentityRepository {
  return {
    createAuthTransaction: vi.fn().mockResolvedValue(undefined),
    consumeAuthTransaction: vi.fn(),
    synchronizeIdentity: vi.fn(),
    createSession: vi.fn().mockResolvedValue(undefined),
    revokeSession: vi.fn().mockResolvedValue(undefined),
    findPrincipal: vi.fn(),
  } as unknown as IdentityRepository;
}

function mockOidc(): OidcService {
  return {
    authorizationEndpoint: vi.fn(),
    exchangeAndValidate: vi.fn(),
  } as unknown as OidcService;
}

const mockPrincipal = {
  sessionId: "s1",
  user: {
    id: "u1",
    displayName: "Test User",
    email: "test@example.com",
    locale: "en",
  },
  memberships: [],
};

describe("IdentityService", () => {
  describe("beginLogin", () => {
    it("creates auth transaction and returns authorization URL", async () => {
      const repo = mockRepo();
      const oidc = mockOidc();
      vi.mocked(oidc.authorizationEndpoint).mockResolvedValue(
        "https://idp.test/auth",
      );
      const service = new IdentityService(environment, repo, oidc);
      const response = { append: vi.fn() } as unknown as Response;

      const url = await service.beginLogin("/dashboard", response);

      expect(repo.createAuthTransaction).toHaveBeenCalledOnce();
      const txArgs = vi.mocked(repo.createAuthTransaction).mock.calls[0][0];
      expect(txArgs).toMatchObject({
        codeVerifier: expect.any(String),
        expiresAt: expect.any(Date),
        nonce: expect.any(String),
        returnTo: "/dashboard",
        stateHash: expect.any(String),
      });
      expect(response.append).toHaveBeenCalledWith(
        "Set-Cookie",
        expect.stringContaining("mecoflow_oidc_state"),
      );
      const parsed = new URL(url);
      expect(parsed.origin + parsed.pathname).toBe("https://idp.test/auth");
      expect(parsed.searchParams.get("client_id")).toBe("test-client");
      expect(parsed.searchParams.get("redirect_uri")).toBe(
        environment.OIDC_REDIRECT_URI,
      );
      expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
      expect(parsed.searchParams.get("response_type")).toBe("code");
      expect(parsed.searchParams.get("scope")).toBe("openid profile email");
    });

    it("sanitizes unsafe returnTo to /", async () => {
      const repo = mockRepo();
      const oidc = mockOidc();
      vi.mocked(oidc.authorizationEndpoint).mockResolvedValue(
        "https://idp.test/auth",
      );
      const service = new IdentityService(environment, repo, oidc);
      const response = { append: vi.fn() } as unknown as Response;

      await service.beginLogin("https://evil.com", response);

      const txArgs = vi.mocked(repo.createAuthTransaction).mock.calls[0][0];
      expect(txArgs.returnTo).toBe("/");
    });

    it("rejects URL-parser backslash and control-character return paths", async () => {
      const repo = mockRepo();
      const oidc = mockOidc();
      vi.mocked(oidc.authorizationEndpoint).mockResolvedValue(
        "https://idp.test/auth",
      );
      const service = new IdentityService(environment, repo, oidc);
      const response = { append: vi.fn() } as unknown as Response;

      await service.beginLogin("/\\evil.example/path", response);
      await service.beginLogin("/\nevil.example/path", response);

      const calls = vi.mocked(repo.createAuthTransaction).mock.calls;
      expect(calls[0]?.[0].returnTo).toBe("/");
      expect(calls[1]?.[0].returnTo).toBe("/");
      expect(service.webUrl("/\\evil.example/path")).toBe(
        "http://localhost:3000/",
      );
    });

    it("includes Secure flag in production", async () => {
      const prodEnv = { ...environment, NODE_ENV: "production" };
      const repo = mockRepo();
      const oidc = mockOidc();
      vi.mocked(oidc.authorizationEndpoint).mockResolvedValue(
        "https://idp.test/auth",
      );
      const service = new IdentityService(prodEnv, repo, oidc);
      const response = { append: vi.fn() } as unknown as Response;

      await service.beginLogin("/", response);

      expect(response.append).toHaveBeenCalledWith(
        "Set-Cookie",
        expect.stringContaining("; Secure"),
      );
    });
  });

  describe("completeLogin", () => {
    it("throws when state does not match cookie", async () => {
      const repo = mockRepo();
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = {
        headers: { cookie: "mecoflow_oidc_state=browser-state" },
      } as unknown as Record<string, unknown>;

      await expect(
        service.completeLogin(
          "code",
          "different-state",
          request,
          {} as unknown as Record<string, unknown>,
        ),
      ).rejects.toThrow("Authentication could not be completed");
    });

    it("throws when auth transaction is missing or expired", async () => {
      const repo = mockRepo();
      vi.mocked(repo.consumeAuthTransaction).mockResolvedValue(null);
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const state = "test-state";
      const request = {
        headers: {
          cookie: `mecoflow_oidc_state=${encodeURIComponent(state)}`,
        },
      } as unknown as Record<string, unknown>;

      await expect(
        service.completeLogin(
          "code",
          state,
          request,
          {} as unknown as Record<string, unknown>,
        ),
      ).rejects.toThrow("Authentication could not be completed");
    });

    it("exchanges code, synchronizes identity, and creates session", async () => {
      const repo = mockRepo();
      vi.mocked(repo.consumeAuthTransaction).mockResolvedValue({
        codeVerifier: "verifier",
        nonce: "nonce",
        expiresAt: new Date(Date.now() + 60000),
        returnTo: "/dashboard",
      });
      vi.mocked(repo.synchronizeIdentity).mockResolvedValue("user-id");
      const oidc = mockOidc();
      vi.mocked(oidc.exchangeAndValidate).mockResolvedValue({
        displayName: "Test",
        email: "test@test.com",
        issuer: "test-issuer",
        locale: "en",
        subject: "sub-123",
      });
      const service = new IdentityService(environment, repo, oidc);
      const state = "test-state";
      const request = {
        headers: {
          cookie: `mecoflow_oidc_state=${encodeURIComponent(state)}`,
        },
      } as unknown as Record<string, unknown>;
      const response = { append: vi.fn() } as unknown as Response;

      const returnTo = await service.completeLogin(
        "auth-code",
        state,
        request,
        response,
      );

      expect(repo.consumeAuthTransaction).toHaveBeenCalledWith(sha256(state));
      expect(oidc.exchangeAndValidate).toHaveBeenCalledWith({
        code: "auth-code",
        codeVerifier: "verifier",
        nonce: "nonce",
      });
      expect(repo.synchronizeIdentity).toHaveBeenCalledWith({
        displayName: "Test",
        email: "test@test.com",
        issuer: "test-issuer",
        locale: "en",
        subject: "sub-123",
      });
      expect(repo.createSession).toHaveBeenCalledWith({
        csrfTokenHash: expect.any(String),
        expiresAt: expect.any(Date),
        tokenHash: expect.any(String),
        userId: "user-id",
      });
      expect(response.append).toHaveBeenCalledTimes(3);
      expect(returnTo).toBe("/dashboard");
    });

    it("clears the OIDC state cookie", async () => {
      const repo = mockRepo();
      vi.mocked(repo.consumeAuthTransaction).mockResolvedValue({
        codeVerifier: "verifier",
        nonce: "nonce",
        expiresAt: new Date(Date.now() + 60000),
        returnTo: "/",
      });
      vi.mocked(repo.synchronizeIdentity).mockResolvedValue("user-id");
      const oidc = mockOidc();
      vi.mocked(oidc.exchangeAndValidate).mockResolvedValue({
        displayName: "T",
        email: "t@t.com",
        issuer: "i",
        locale: "en",
        subject: "s",
      });
      const service = new IdentityService(environment, repo, oidc);
      const state = "test-state";
      const request = {
        headers: {
          cookie: `mecoflow_oidc_state=${encodeURIComponent(state)}`,
        },
      } as unknown as Record<string, unknown>;
      const response = { append: vi.fn() } as unknown as Response;

      await service.completeLogin("code", state, request, response);

      expect(response.append).toHaveBeenCalledWith(
        "Set-Cookie",
        expect.stringContaining("mecoflow_oidc_state=;"),
      );
      expect(response.append).toHaveBeenCalledWith(
        "Set-Cookie",
        expect.stringContaining("Max-Age=0"),
      );
    });
  });

  describe("principal", () => {
    it("throws when session cookie is missing", async () => {
      const repo = mockRepo();
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = { headers: {} } as unknown as Record<string, unknown>;

      await expect(service.principal(request)).rejects.toThrow(
        "Authentication required",
      );
    });

    it("treats a malformed encoded session cookie as unauthenticated", async () => {
      const repo = mockRepo();
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = {
        headers: { cookie: "mecoflow_session=%E0%A4%A" },
      } as unknown as Record<string, unknown>;

      await expect(service.principal(request)).rejects.toThrow(
        "Authentication required",
      );
      expect(repo.findPrincipal).not.toHaveBeenCalled();
    });

    it("throws when session is invalid", async () => {
      const repo = mockRepo();
      vi.mocked(repo.findPrincipal).mockResolvedValue({ kind: "INVALID" });
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = {
        headers: { cookie: "mecoflow_session=bad-token" },
      } as unknown as Record<string, unknown>;

      await expect(service.principal(request)).rejects.toThrow(
        "Authentication required",
      );
    });

    it("throws Forbidden when user is inactive", async () => {
      const repo = mockRepo();
      vi.mocked(repo.findPrincipal).mockResolvedValue({
        kind: "INACTIVE_USER",
      });
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = {
        headers: { cookie: "mecoflow_session=token" },
      } as unknown as Record<string, unknown>;

      await expect(service.principal(request)).rejects.toThrow("Access denied");
    });

    it("returns principal for a valid session", async () => {
      const repo = mockRepo();
      vi.mocked(repo.findPrincipal).mockResolvedValue({
        kind: "ACTIVE",
        csrfTokenHash: "some-hash",
        principal: mockPrincipal,
      });
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = {
        headers: { cookie: "mecoflow_session=valid-token" },
      } as unknown as Record<string, unknown>;

      const result = await service.principal(request);
      expect(result).toEqual(mockPrincipal);
    });

    it("validates CSRF when requireCsrf is true", async () => {
      const csrfToken = "test-csrf-token";
      const csrfTokenHash = sha256(csrfToken);
      const repo = mockRepo();
      vi.mocked(repo.findPrincipal).mockResolvedValue({
        kind: "ACTIVE",
        csrfTokenHash,
        principal: mockPrincipal,
      });
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = {
        headers: {
          cookie: `mecoflow_session=valid-token; mecoflow_csrf=${encodeURIComponent(csrfToken)}`,
          "x-csrf-token": csrfToken,
        },
      } as unknown as Record<string, unknown>;

      const result = await service.principal(request, true);
      expect(result).toEqual(mockPrincipal);
    });

    it("throws Forbidden when CSRF token is missing", async () => {
      const repo = mockRepo();
      vi.mocked(repo.findPrincipal).mockResolvedValue({
        kind: "ACTIVE",
        csrfTokenHash: "hash",
        principal: mockPrincipal,
      });
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = {
        headers: { cookie: "mecoflow_session=valid-token" },
      } as unknown as Record<string, unknown>;

      await expect(service.principal(request, true)).rejects.toThrow(
        "Access denied",
      );
    });
  });

  describe("logout", () => {
    it("validates principal, revokes session, and clears cookies", async () => {
      const csrfToken = "logout-csrf";
      const csrfTokenHash = sha256(csrfToken);
      const repo = mockRepo();
      vi.mocked(repo.findPrincipal).mockResolvedValue({
        kind: "ACTIVE",
        csrfTokenHash,
        principal: mockPrincipal,
      });
      vi.mocked(repo.revokeSession).mockResolvedValue(undefined);
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      const request = {
        headers: {
          cookie: `mecoflow_session=session-token; mecoflow_csrf=${encodeURIComponent(csrfToken)}`,
          "x-csrf-token": csrfToken,
        },
      } as unknown as Record<string, unknown>;
      const response = { append: vi.fn() } as unknown as Response;

      await service.logout(request, response);

      expect(repo.findPrincipal).toHaveBeenCalledWith(sha256("session-token"));
      expect(repo.revokeSession).toHaveBeenCalledWith(sha256("session-token"));
      expect(response.append).toHaveBeenCalledWith(
        "Set-Cookie",
        expect.stringContaining("mecoflow_session=;"),
      );
      expect(response.append).toHaveBeenCalledWith(
        "Set-Cookie",
        expect.stringContaining("mecoflow_csrf=;"),
      );
    });
  });

  describe("webUrl", () => {
    it("returns an absolute URL for the given path", () => {
      const repo = mockRepo();
      const oidc = mockOidc();
      const service = new IdentityService(environment, repo, oidc);
      expect(service.webUrl("/page")).toBe("http://localhost:3000/page");
    });
  });
});
