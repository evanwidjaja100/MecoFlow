# Dependency rationale

Phase 0 uses only stack-required foundations: Next.js/React for the web shell; NestJS, Swagger, RxJS and reflection metadata for REST; Prisma with the PostgreSQL driver adapter; Zod for boundary configuration/contracts; ioredis and AWS S3 client for readiness/integration boundaries; Pino-compatible structured logging; Tailwind/PostCSS for local UI styling; Vitest and Playwright for tests; and ESLint, Prettier, TypeScript, pnpm and Turborepo for workspace quality.

Dependencies are exact in package manifests and lockfile. The application does not add a global client store, alternate ORM, GraphQL layer, microservice framework or generic utility suite. CI performs frozen install and vulnerability review. Updates require compatibility, security and maintenance evaluation.

TypeScript 6.0.3 is intentionally pinned instead of the newer 7.x release because the selected current `typescript-eslint` release declares support below TypeScript 6.1. Strict peer checking remains enabled; this compatibility pin is preferred to suppressing the warning or weakening lint guarantees.

The S3 client is pinned one stable patch behind the registry head because the head release was less than one day old at initialization and failed pnpm 11's minimum-release-age supply-chain policy. This keeps the policy enabled rather than bypassing it.

Dependency build scripts are deny-by-default. Prisma engines, Prisma, esbuild, and sharp are explicitly allowed because they provide required generated/native runtime artifacts; Scarf's optional install-time analytics script is explicitly ignored.

Workspace overrides require patched minimum versions of `@hono/node-server` 1.19.13 and PostCSS 8.5.10. These are transitive dependencies of Prisma tooling and Next.js respectively; the overrides remediate their published path-traversal/middleware-bypass and CSS-stringification XSS advisories while remaining within the parent packages' compatible ranges.
