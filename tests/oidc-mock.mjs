import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from "node:crypto";
import { createServer } from "node:http";

const oidcPort = 4310;
const apiPort = Number(process.env.E2E_API_PORT ?? "3001");
if (
  !Number.isInteger(oidcPort) ||
  oidcPort < 1 ||
  oidcPort > 65_535 ||
  !Number.isInteger(apiPort) ||
  apiPort < 1 ||
  apiPort > 65_535 ||
  oidcPort === apiPort
) {
  throw new Error(
    "The E2E API port must be valid and distinct from OIDC port 4310",
  );
}
const issuer = `http://127.0.0.1:${oidcPort}`;
const clientId = "mecoflow-web";
const redirectUri = `http://localhost:${apiPort}/api/v1/auth/callback`;
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const publicJwk = publicKey.export({ format: "jwk" });
const keyId = "mecoflow-e2e";
const codes = new Map();
const personas = {
  internal: {
    email: "internal.admin@mecoflow.test",
    name: "Internal Administrator",
    sub: "mock-internal-admin",
  },
  supplier: {
    email: "supplier.admin@mecoflow.test",
    name: "Supplier Administrator",
    sub: "mock-supplier-admin",
  },
};

function json(response, status, value) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(value));
}

function jwt(claims) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: keyId, typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    privateKey,
  ).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

async function body(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", issuer);
  if (url.pathname === "/.well-known/openid-configuration") {
    json(response, 200, {
      authorization_endpoint: `${issuer}/authorize`,
      id_token_signing_alg_values_supported: ["RS256"],
      issuer,
      jwks_uri: `${issuer}/jwks`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      token_endpoint: `${issuer}/token`,
    });
    return;
  }
  if (url.pathname === "/jwks") {
    json(response, 200, {
      keys: [{ ...publicJwk, alg: "RS256", kid: keyId, use: "sig" }],
    });
    return;
  }
  if (url.pathname === "/authorize" && request.method === "GET") {
    if (
      url.searchParams.get("client_id") !== clientId ||
      url.searchParams.get("redirect_uri") !== redirectUri ||
      url.searchParams.get("response_type") !== "code" ||
      url.searchParams.get("code_challenge_method") !== "S256"
    ) {
      response.writeHead(400).end("Invalid authorization request");
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      `<!doctype html><html lang="en"><head><title>Test identity provider</title></head><body><main><h1>Test identity provider</h1><p>Select a deterministic test identity.</p><form method="post" action="${url.pathname}${url.search}"><button name="persona" value="internal">Internal administrator</button><button name="persona" value="supplier">Supplier administrator</button></form></main></body></html>`,
    );
    return;
  }
  if (url.pathname === "/authorize" && request.method === "POST") {
    const form = await body(request);
    const persona = personas[form.get("persona")];
    const state = url.searchParams.get("state");
    const nonce = url.searchParams.get("nonce");
    const codeChallenge = url.searchParams.get("code_challenge");
    if (!persona || !state || !nonce || !codeChallenge) {
      response.writeHead(400).end("Invalid authorization request");
      return;
    }
    const code = randomBytes(24).toString("base64url");
    codes.set(code, { codeChallenge, nonce, persona });
    const callback = new URL(redirectUri);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", state);
    response.writeHead(302, { location: callback.toString() }).end();
    return;
  }
  if (url.pathname === "/token" && request.method === "POST") {
    const form = await body(request);
    const code = form.get("code");
    const transaction = code ? codes.get(code) : undefined;
    const verifier = form.get("code_verifier") ?? "";
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    if (
      !code ||
      !transaction ||
      challenge !== transaction.codeChallenge ||
      form.get("client_id") !== clientId ||
      form.get("redirect_uri") !== redirectUri
    ) {
      json(response, 400, { error: "invalid_grant" });
      return;
    }
    codes.delete(code);
    const now = Math.floor(Date.now() / 1000);
    json(response, 200, {
      access_token: randomBytes(24).toString("base64url"),
      expires_in: 300,
      id_token: jwt({
        aud: clientId,
        email: transaction.persona.email,
        exp: now + 300,
        iat: now,
        iss: issuer,
        name: transaction.persona.name,
        nonce: transaction.nonce,
        sub: transaction.persona.sub,
      }),
      token_type: "Bearer",
    });
    return;
  }
  response.writeHead(404).end("Not found");
});

server.listen(oidcPort, "127.0.0.1");
