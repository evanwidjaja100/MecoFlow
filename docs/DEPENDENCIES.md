# Dependency rationale

Phase 0 uses only stack-required foundations: Next.js/React for the web shell; NestJS, Swagger, RxJS and reflection metadata for REST; Prisma with the PostgreSQL driver adapter; Zod for boundary configuration/contracts; ioredis and AWS S3 client for readiness/integration boundaries; Pino-compatible structured logging; Tailwind/PostCSS for local UI styling; Vitest and Playwright for tests; and ESLint, Prettier, TypeScript, pnpm and Turborepo for workspace quality.

Dependencies are exact in package manifests and lockfile. The application does not add a global client store, alternate ORM, GraphQL layer, microservice framework or generic utility suite. CI performs frozen install, a moderate-or-higher vulnerability audit, and GitHub's dependency diff review on pull requests using the checked-in license/severity policy. Updates require compatibility, security and maintenance evaluation.

Container runtime stages use filtered `--prod` installations and copy compiled/standalone outputs. Repository source, unrelated applications, Playwright, ESLint, Vitest and the wider build toolchain are not shipped in application runtime images. Prisma's published client peer closure currently retains Prisma/TypeScript packages in API and worker images; this is a documented packaging limitation rather than a reason to disable strict peer checks.

TypeScript 6.0.3 is intentionally pinned instead of the newer 7.x release because the selected current `typescript-eslint` release declares support below TypeScript 6.1. Strict peer checking remains enabled; this compatibility pin is preferred to suppressing the warning or weakening lint guarantees.

The S3 client is pinned one stable patch behind the registry head because the head release was less than one day old at initialization and failed pnpm 11's minimum-release-age supply-chain policy. This keeps the policy enabled rather than bypassing it.

Dependency build scripts are deny-by-default. Prisma engines, Prisma, esbuild, and sharp are explicitly allowed because they provide required generated/native runtime artifacts; Scarf's optional install-time analytics script is explicitly ignored.

Phase 1 adds no third-party runtime dependency. OIDC discovery, code exchange, PKCE, and bounded RS256/JWKS verification use Node's built-in `fetch` and `crypto` APIs; the implementation accepts only the documented Keycloak-compatible RS256 profile and validates issuer, audience, signature, expiry, issued-at, nonce, and browser-bound state. This keeps the supply-chain surface unchanged, but any future algorithm/client-authentication expansion requires a security review and may justify a maintained OIDC library.

Workspace overrides require patched minimum versions of `@hono/node-server` 1.19.13 and PostCSS 8.5.10. These are transitive dependencies of Prisma tooling and Next.js respectively; the overrides remediate their published path-traversal/middleware-bypass and CSS-stringification XSS advisories while remaining within the parent packages' compatible ranges.
