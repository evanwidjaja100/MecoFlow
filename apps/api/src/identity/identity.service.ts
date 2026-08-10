import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import {
  constantTimeEqual,
  pkceChallenge,
  randomToken,
  sha256,
} from "./crypto.js";
import { IdentityRepository } from "./identity.repository.js";
import type { AuthenticatedPrincipal } from "./identity.types.js";
import { OidcService } from "./oidc.service.js";

const sessionCookie = "mecoflow_session";
const csrfCookie = "mecoflow_csrf";
const oidcStateCookie = "mecoflow_oidc_state";

function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function safeReturnTo(value: string | undefined): string {
  if (!value) return "/";
  const candidate = value.slice(0, 500);
  const hasControlCharacter = [...candidate].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    hasControlCharacter
  )
    return "/";
  try {
    const sentinel = new URL("https://mecoflow.invalid");
    const resolved = new URL(candidate, sentinel);
    return resolved.origin === sentinel.origin ? candidate : "/";
  } catch {
    return "/";
  }
}

@Injectable()
export class IdentityService {
  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
    @Inject(IdentityRepository)
    private readonly repository: IdentityRepository,
    @Inject(OidcService) private readonly oidc: OidcService,
  ) {}

  async beginLogin(
    returnTo: string | undefined,
    response: Response,
  ): Promise<string> {
    const state = randomToken();
    const nonce = randomToken();
    const codeVerifier = randomToken(64);
    await this.repository.createAuthTransaction({
      codeVerifier,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      nonce,
      returnTo: safeReturnTo(returnTo),
      stateHash: sha256(state),
    });
    const secure = this.environment.NODE_ENV === "production" ? "; Secure" : "";
    response.append(
      "Set-Cookie",
      `${oidcStateCookie}=${encodeURIComponent(state)}; Path=/api/v1/auth/callback; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
    );
    const authorizationUrl = new URL(await this.oidc.authorizationEndpoint());
    authorizationUrl.search = new URLSearchParams({
      client_id: this.environment.OIDC_CLIENT_ID,
      code_challenge: pkceChallenge(codeVerifier),
      code_challenge_method: "S256",
      nonce,
      redirect_uri: this.environment.OIDC_REDIRECT_URI,
      response_type: "code",
      scope: "openid profile email",
      state,
    }).toString();
    return authorizationUrl.toString();
  }

  async completeLogin(
    code: string,
    state: string,
    request: Request,
    response: Response,
  ): Promise<string> {
    const browserState = readCookie(request, oidcStateCookie);
    if (!browserState || !constantTimeEqual(browserState, state))
      throw new UnauthorizedException("Authentication could not be completed");
    const transaction = await this.repository.consumeAuthTransaction(
      sha256(state),
    );
    if (!transaction || transaction.expiresAt <= new Date())
      throw new UnauthorizedException("Authentication could not be completed");
    const identity = await this.oidc.exchangeAndValidate({
      code,
      codeVerifier: transaction.codeVerifier,
      nonce: transaction.nonce,
    });
    const userId = await this.repository.synchronizeIdentity(identity);
    const sessionToken = randomToken();
    const csrfToken = randomToken();
    const expiresAt = new Date(
      Date.now() + this.environment.SESSION_TTL_SECONDS * 1000,
    );
    await this.repository.createSession({
      csrfTokenHash: sha256(csrfToken),
      expiresAt,
      tokenHash: sha256(sessionToken),
      userId,
    });
    const secure = this.environment.NODE_ENV === "production" ? "; Secure" : "";
    response.append(
      "Set-Cookie",
      `${sessionCookie}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${this.environment.SESSION_TTL_SECONDS}${secure}`,
    );
    response.append(
      "Set-Cookie",
      `${csrfCookie}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Strict; Max-Age=${this.environment.SESSION_TTL_SECONDS}${secure}`,
    );
    response.append(
      "Set-Cookie",
      `${oidcStateCookie}=; Path=/api/v1/auth/callback; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    );
    return transaction.returnTo;
  }

  async principal(
    request: Request,
    requireCsrf = false,
  ): Promise<AuthenticatedPrincipal> {
    const token = readCookie(request, sessionCookie);
    if (!token) throw new UnauthorizedException("Authentication required");
    const result = await this.repository.findPrincipal(sha256(token));
    if (result.kind === "INVALID")
      throw new UnauthorizedException("Authentication required");
    if (
      result.kind === "INACTIVE_USER" ||
      result.kind === "NO_ACTIVE_MEMBERSHIP"
    )
      throw new ForbiddenException("Access denied");
    if (requireCsrf) {
      const csrfToken = readCookie(request, csrfCookie);
      const csrfHeader = request.headers["x-csrf-token"];
      if (
        !csrfToken ||
        typeof csrfHeader !== "string" ||
        !constantTimeEqual(sha256(csrfToken), result.csrfTokenHash) ||
        !constantTimeEqual(csrfToken, csrfHeader)
      )
        throw new ForbiddenException("Access denied");
    }
    return result.principal;
  }

  async logout(request: Request, response: Response): Promise<void> {
    await this.principal(request, true);
    const token = readCookie(request, sessionCookie);
    if (token) await this.repository.revokeSession(sha256(token));
    const secure = this.environment.NODE_ENV === "production" ? "; Secure" : "";
    response.append(
      "Set-Cookie",
      `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    );
    response.append(
      "Set-Cookie",
      `${csrfCookie}=; Path=/; SameSite=Strict; Max-Age=0${secure}`,
    );
  }

  webUrl(path: string): string {
    return new URL(
      safeReturnTo(path),
      this.environment.WEB_BASE_URL,
    ).toString();
  }
}
