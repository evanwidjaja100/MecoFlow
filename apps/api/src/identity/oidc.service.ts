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
  azp?: string;
  email?: string;
  exp: number;
  iat: number;
  iss: string;
  locale?: string;
  name?: string;
  nbf?: number;
  nonce: string;
  preferred_username?: string;
  sub: string;
}

const MAX_IDENTITY_PROVIDER_JSON_BYTES = 1024 * 1024;

function decodePart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

export function isAllowedOidcEndpoint(
  value: string,
  production: boolean,
): boolean {
  try {
    const protocol = new URL(value).protocol;
    return production
      ? protocol === "https:"
      : protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export async function readBoundedOidcJson(
  response: Response,
): Promise<unknown> {
  const declaredLength = response.headers.get("content-length");
  if (
    declaredLength !== null &&
    Number(declaredLength) > MAX_IDENTITY_PROVIDER_JSON_BYTES
  )
    throw new Error("identity provider response is too large");
  if (!response.body) throw new Error("identity provider response is empty");
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IDENTITY_PROVIDER_JSON_BYTES) {
      await reader.cancel();
      throw new Error("identity provider response is too large");
    }
    chunks.push(Buffer.from(value));
  }
  return JSON.parse(Buffer.concat(chunks, total).toString("utf8")) as unknown;
}

export function validateOidcClaims(
  claims: IdTokenClaims,
  input: {
    clientId: string;
    expectedIssuer: string;
    expectedNonce: string;
    now: number;
  },
): IdTokenClaims {
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const validAuthorizedParty =
    audiences.length > 1
      ? claims.azp === input.clientId
      : claims.azp === undefined || claims.azp === input.clientId;
  if (
    typeof claims.iss !== "string" ||
    claims.iss !== input.expectedIssuer ||
    audiences.length === 0 ||
    audiences.some(
      (audience) => typeof audience !== "string" || audience.length === 0,
    ) ||
    !audiences.includes(input.clientId) ||
    !validAuthorizedParty ||
    typeof claims.exp !== "number" ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= input.now ||
    typeof claims.iat !== "number" ||
    !Number.isFinite(claims.iat) ||
    claims.iat > input.now + 60 ||
    (claims.nbf !== undefined &&
      (typeof claims.nbf !== "number" ||
        !Number.isFinite(claims.nbf) ||
        claims.nbf > input.now + 60)) ||
    typeof claims.nonce !== "string" ||
    claims.nonce !== input.expectedNonce ||
    typeof claims.sub !== "string" ||
    claims.sub.length === 0
  )
    throw new Error("invalid claims");
  return claims;
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
      const tokenResponse = (await readBoundedOidcJson(response)) as {
        id_token?: unknown;
      };
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
        const document = (await readBoundedOidcJson(
          response,
        )) as Partial<DiscoveryDocument>;
        const production = this.environment.NODE_ENV === "production";
        if (
          document.issuer !== this.environment.OIDC_ISSUER ||
          !document.authorization_endpoint ||
          !document.token_endpoint ||
          !document.jwks_uri ||
          !isAllowedOidcEndpoint(document.authorization_endpoint, production) ||
          !isAllowedOidcEndpoint(document.token_endpoint, production) ||
          !isAllowedOidcEndpoint(document.jwks_uri, production)
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
    if (token.length > 32 * 1024) throw new Error("invalid token");
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
    const jwks = (await readBoundedOidcJson(jwksResponse)) as {
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
    return validateOidcClaims(claims, {
      clientId: this.environment.OIDC_CLIENT_ID,
      expectedIssuer: this.environment.OIDC_ISSUER,
      expectedNonce,
      now,
    });
  }
}
