import { createPublicKey, verify } from "node:crypto";
import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";

interface DiscoveryDocument {
  authorization_endpoint: string;
  issuer: string;
  jwks_uri: string;
  token_endpoint: string;
}

interface IdTokenClaims {
  aud: string | string[];
  email?: string;
  exp: number;
  iat: number;
  iss: string;
  locale?: string;
  name?: string;
  nonce: string;
  preferred_username?: string;
  sub: string;
}

function decodePart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

@Injectable()
export class OidcService {
  private discoveryPromise: Promise<DiscoveryDocument> | undefined;

  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
  ) {}

  async authorizationEndpoint(): Promise<string> {
    return (await this.discovery()).authorization_endpoint;
  }

  async exchangeAndValidate(input: {
    code: string;
    codeVerifier: string;
    nonce: string;
  }): Promise<{
    displayName: string;
    email: string;
    issuer: string;
    locale: string;
    subject: string;
  }> {
    try {
      const discovery = await this.discovery();
      const body = new URLSearchParams({
        client_id: this.environment.OIDC_CLIENT_ID,
        code: input.code,
        code_verifier: input.codeVerifier,
        grant_type: "authorization_code",
        redirect_uri: this.environment.OIDC_REDIRECT_URI,
      });
      const response = await fetch(discovery.token_endpoint, {
        body,
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error("token exchange rejected");
      const tokenResponse = (await response.json()) as { id_token?: unknown };
      if (typeof tokenResponse.id_token !== "string")
        throw new Error("missing ID token");
      const claims = await this.validateIdToken(
        tokenResponse.id_token,
        input.nonce,
      );
      const email = claims.email ?? claims.preferred_username;
      if (!email) throw new Error("missing identity email");
      return {
        displayName: claims.name ?? email,
        email: email.toLowerCase(),
        issuer: claims.iss,
        locale: claims.locale === "id" ? "id" : "en",
        subject: claims.sub,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new UnauthorizedException("Authentication could not be completed");
    }
  }

  private async discovery(): Promise<DiscoveryDocument> {
    this.discoveryPromise ??= (async () => {
      try {
        const response = await fetch(
          `${this.environment.OIDC_ISSUER}/.well-known/openid-configuration`,
          { signal: AbortSignal.timeout(5_000) },
        );
        if (!response.ok) throw new Error("discovery rejected");
        const document = (await response.json()) as Partial<DiscoveryDocument>;
        if (
          document.issuer !== this.environment.OIDC_ISSUER ||
          !document.authorization_endpoint ||
          !document.token_endpoint ||
          !document.jwks_uri
        )
          throw new Error("invalid discovery document");
        return document as DiscoveryDocument;
      } catch {
        this.discoveryPromise = undefined;
        throw new BadGatewayException("Identity provider is unavailable");
      }
    })();
    return this.discoveryPromise;
  }

  private async validateIdToken(
    token: string,
    expectedNonce: string,
  ): Promise<IdTokenClaims> {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("invalid token");
    const [encodedHeader, encodedPayload, encodedSignature] = parts as [
      string,
      string,
      string,
    ];
    const header = decodePart<{ alg?: string; kid?: string }>(encodedHeader);
    if (header.alg !== "RS256" || !header.kid)
      throw new Error("invalid signing algorithm");
    const discovery = await this.discovery();
    const jwksResponse = await fetch(discovery.jwks_uri, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!jwksResponse.ok) throw new Error("JWKS unavailable");
    const jwks = (await jwksResponse.json()) as {
      keys?: Array<JsonWebKey & { kid?: string }>;
    };
    const jwk = jwks.keys?.find((candidate) => candidate.kid === header.kid);
    if (!jwk) throw new Error("unknown signing key");
    const validSignature = verify(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      createPublicKey({ format: "jwk", key: jwk }),
      Buffer.from(encodedSignature, "base64url"),
    );
    if (!validSignature) throw new Error("invalid signature");
    const claims = decodePart<IdTokenClaims>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (
      claims.iss !== this.environment.OIDC_ISSUER ||
      !audiences.includes(this.environment.OIDC_CLIENT_ID) ||
      claims.exp <= now ||
      claims.iat > now + 60 ||
      claims.nonce !== expectedNonce ||
      !claims.sub
    )
      throw new Error("invalid claims");
    return claims;
  }
}
