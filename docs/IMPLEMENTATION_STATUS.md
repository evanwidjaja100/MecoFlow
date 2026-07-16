# Current phase

Phase 0 — Architecture and repository foundation (reviewed, remediated, and locally verified on 2026-07-16).

# Completed capabilities

- Master requirements, repository instructions, and ADR-0001 through ADR-0014 reviewed.
- Baseline product, architecture, domain, security, authorization, API, UX, testing, deployment, recovery, import, pilot, operations, dependency, and change-management documentation established.
- pnpm/Turborepo strict TypeScript monorepo with Next.js web, NestJS API, and Node worker foundations.
- Shared configuration, contracts, database, lint, test utility, TypeScript, and UI packages.
- Validated environment boundaries with production rejection of documented local placeholders/insecure browser origins, structured safe logging, request/correlation IDs, security headers, public health probes, checked OpenAPI generation, and an accessible foundation screen.
- Local PostgreSQL, Redis, Keycloak, private MinIO, and Mailpit infrastructure with reliable health checks, loopback-only published ports, and an idempotent private-bucket initializer.
- Prisma client, one technical metadata migration, deterministic idempotent seed, and real PostgreSQL integration tests.
- Reproducible setup helper with explicit native-command failure propagation and no administrator-only Corepack shim mutation.
- Unit, integration, browser, formatting, lint, type, build, dependency-audit, Compose, filtered/standalone image-build, and shared local/CI verification foundations.

# Partially completed capabilities

- None within the bounded Phase 0 scope.

# Not started

- All Phase 1–9 operational capabilities, including production OIDC integration, identity synchronization, organization/role persistence, business modules, audit persistence, transactional outbox processing, and readiness calculations.

# Active technical decisions

- ADR-0001 through ADR-0014 are accepted. Phase 0 intentionally contains no operational domain implementation.

# Database migrations

- `20260715000000_phase_0_foundation` creates only the technical `SystemMetadata` table with a UUID primary key, unique metadata key, version, and UTC timestamps.
- The migration applies through `pnpm db:migrate`; the deterministic seed creates or repairs `seed.version=phase-0` and leaves an already-correct record unchanged.
- No backfill is required. Rollback is a local environment teardown/recreation; production down-migration is not authorized by Phase 0.

# Test status

- `pnpm verify` passed on 2026-07-16: formatting, lint, strict typecheck, 15 unit tests, 2 database integration tests, and all production builds.
- `pnpm test:e2e` passed: 1 Chromium foundation/health workflow.
- `pnpm security:audit` reports no known moderate-or-higher vulnerabilities after compatible patched transitive overrides.
- Frozen install, setup helper execution from outside the repository root, Compose validation, all five infrastructure health checks, migration, repeat-seed stability, OpenAPI drift check, API ready/not-ready behavior, worker heartbeat, and web/API/worker runtime image checks passed locally.
- Runtime images run as the non-root `node` user; review builds were approximately 157 MB (API), 148 MB (worker), and 69 MB (web).

# Phase 0 review defects remediated

- Repeat seeds incremented version/timestamp instead of being idempotent.
- Object-storage readiness listed account buckets instead of checking the configured private bucket.
- Production-mode configuration accepted local placeholder credentials, local environment defaults, malformed origins/timezones, and insecure browser origins.
- Compose exposed local dependency and administrative ports on all host interfaces.
- The setup helper could report success after a failed native command and implied application processes were started when they were not.
- CI duplicated the local verification chain, did not compare generated OpenAPI, audited a weaker severity threshold, and left its dependency-review policy unused.
- Runtime images copied the full development workspace, and tracked Next.js generated types oscillated between development and production builds.
- Docker contexts did not exclude all environment-file variants or nested generated workspace outputs.
- The metadata-light API development transpiler did not infer the health-controller dependency, so the documented `pnpm dev` liveness endpoint returned HTTP 500.
- Nested API and worker watch supervisors under Turbo could leave orphaned Windows processes without a running application child; direct persistent processes now give Turbo sole lifecycle ownership.
- The previous implementation status incorrectly described a timestamp index that the committed Phase 0 migration does not create.

# Known defects

- None known that block the bounded Phase 0 acceptance criteria after remediation.

# Security review status

- Phase 0 trust boundaries are documented and reviewed. Startup configuration is validated without echoing secret values and production mode rejects documented local placeholders; object storage is private; local ports bind to loopback; logs and health responses avoid credentials; dependency build scripts are deny-by-default with an explicit allowlist.
- Public health endpoints expose only coarse status and opaque dependency names. There are no supplier-facing or business resources yet.
- Business authorization, production OIDC, persistent audit, CSRF, rate limiting, upload/download controls, and operational field filtering remain intentionally unimplemented and must not be treated as complete.

# Deployment status

- Local Compose infrastructure is healthy and filtered/standalone web/API/worker production images build and run successfully as non-root.
- No staging or production deployment has occurred or is authorized by Phase 0. Production secret management, TLS/proxy, backup rehearsal, monitoring, hardening, and deployment approval remain Phase 9 requirements.

# Review limitations

- GitHub-hosted CI and pull-request dependency review were inspected but cannot be executed from the local workstation; their commands were executed locally where applicable.
- Only the documented Chromium foundation workflow exists in Phase 0; broader browser/accessibility workflows belong to later functional phases.
- Prisma's published client peer closure retains Prisma/TypeScript packages in the filtered API/worker production dependency trees. Playwright, ESLint, Vitest, source trees, and unrelated workspace applications are excluded; further peer pruning must not weaken strict dependency checks.

# Next recommended task

- After explicit approval, begin one bounded Phase 1 task: implement the Keycloak OIDC authentication boundary and identity synchronization design with its authorization and negative-test plan. Do not begin operational business modules.
