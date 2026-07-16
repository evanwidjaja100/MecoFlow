# Test strategy

## Layers

- Unit tests cover pure configuration validation, policies, calculations, workflows, normalization, validation, sanitization and idempotency.
- Integration tests use isolated disposable PostgreSQL/Redis/object-storage dependencies for repositories, constraints, transactions, audit/outbox effects and operational workflows.
- Authorization tests exercise every protected command and supplier object with negative identifier manipulation.
- Playwright tests use accessible roles/labels for critical browser workflows and include accessibility smoke coverage without arbitrary sleeps.

Tests are deterministic, independent of order, use fictional fixtures, and clean up or isolate their state. A failing test is not weakened to obtain green status. Obsolete expectations require a documented behavior decision first.

## Phase 0 gates

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, Prisma migration/seed, and the Playwright landing-page smoke test form the foundation. `pnpm verify` is the shared local/CI primary quality chain. CI uses frozen installation, service containers, migration validation, checked-in OpenAPI drift detection, production builds, browser smoke, moderate-or-higher dependency audit, pull-request dependency review and container build checks.

## Phase 1 gates

`pnpm test:authorization` runs policy and live-PostgreSQL authorization tests, including inactive profile/membership denial, supplier administration denial, read-only write denial, safe identifier behavior, role-change atomicity, and database-enforced audit immutability. `pnpm test:e2e` runs a deterministic OIDC Authorization Code/PKCE provider and covers login, access denied, internal navigation, supplier navigation, and absence of browser local-storage tokens. The full gate remains `pnpm verify`, followed by `pnpm test:authorization`, `pnpm test:e2e`, and `pnpm openapi:check`.

Environment-blocked commands are reported with exact cause and residual risk; no command is reported successful unless it completed successfully.
