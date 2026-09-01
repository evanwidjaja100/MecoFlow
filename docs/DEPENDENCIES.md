# Dependency rationale

Phase 0 uses only stack-required foundations: Next.js/React for the web shell; NestJS, Swagger, RxJS and reflection metadata for REST; Prisma with the PostgreSQL driver adapter; Zod for boundary configuration/contracts; ioredis and AWS S3 client for readiness/integration boundaries; Pino-compatible structured logging; Tailwind/PostCSS for local UI styling; Vitest and Playwright for tests; and ESLint, Prettier, TypeScript, pnpm and Turborepo for workspace quality.

Dependencies are exact in package manifests and lockfile. The application does not add a global client store, alternate ORM, GraphQL layer, microservice framework or generic utility suite. CI performs frozen install, a moderate-or-higher vulnerability audit, and GitHub's dependency diff review on pull requests using the checked-in license/severity policy. Updates require compatibility, security and maintenance evaluation.

Container runtime stages use filtered `--prod` installations and copy compiled/standalone outputs. Repository source, unrelated applications, Playwright, ESLint, Vitest and the wider build toolchain are not shipped in application runtime images. Prisma's published client peer closure currently retains Prisma/TypeScript packages in API and worker images; this is a documented packaging limitation rather than a reason to disable strict peer checks.

TypeScript 6.0.3 is intentionally pinned instead of the newer 7.x release because the selected current `typescript-eslint` release declares support below TypeScript 6.1. Strict peer checking remains enabled; this compatibility pin is preferred to suppressing the warning or weakening lint guarantees.

The S3 client is pinned one stable patch behind the registry head because the head release was less than one day old at initialization and failed pnpm 11's minimum-release-age supply-chain policy. This keeps the policy enabled rather than bypassing it.

Phase 5A adds the matching exact-version `@aws-sdk/s3-request-presigner` package. It is the AWS-maintained signer for the existing S3 client and avoids implementing or maintaining custom Signature Version 4 cryptography. It adds no alternate storage SDK; version alignment limits compatibility and maintenance risk. Virus scanning uses Node's built-in TCP client and the bounded ClamAV `INSTREAM` protocol, so no additional scanner dependency is introduced.

Dependency build scripts are deny-by-default. Prisma engines, Prisma, esbuild, and sharp are explicitly allowed because they provide required generated/native runtime artifacts; Scarf's optional install-time analytics script is explicitly ignored.

Phase 1 adds no third-party runtime dependency. OIDC discovery, code exchange, PKCE, and bounded RS256/JWKS verification use Node's built-in `fetch` and `crypto` APIs; the implementation accepts only the documented Keycloak-compatible RS256 profile and validates issuer, audience, signature, expiry, issued-at, nonce, and browser-bound state. This keeps the supply-chain surface unchanged, but any future algorithm/client-authentication expansion requires a security review and may justify a maintained OIDC library.

Phase 9A updates Next.js to 16.2.12, Prisma packages to 7.9.0, ESLint to
10.8.0, and the direct PostCSS package to 8.5.23 in response to the supported
dependency audit. Workspace overrides require patched `find-my-way` 9.7.0,
PostCSS 8.5.23, Sharp 0.35.3, and Valibot 1.4.2 because their parent packages
still resolve vulnerable transitive versions. The Sharp override crosses the
package's 0.x minor boundary because no patched 0.34 release exists; production
web build and browser verification are therefore mandatory before release.
Overrides are exact, lockfile-enforced, and should be removed when the owning
packages resolve equal or newer patched versions directly.

Phase 9C adds no npm dependency. Staging pins purpose-specific container
versions for PostgreSQL 18 Alpine, Redis 8.2 Alpine, Keycloak 26.7.2, ClamAV
1.4.5, and nginx 1.29 Alpine. They supply the documented database,
cache/coordination, OIDC, malware-scanning, backup, and TLS reverse-proxy
responsibilities instead of embedding substitutes in application code.

MinIO's upstream repository is archived and did not publish a container for
its final October 2025 authorization fix. The staging server and client are
therefore checksum-verified source builds pinned to exact commits. Their build
stages apply exact scanner-recommended Go module fixes; runtime stages contain
only the resulting binary and required runtime utilities. This avoids shipping
known vulnerable 2025 binaries but creates a downstream maintenance and
compatibility obligation documented in `CONTAINER_SECURITY.md`.

Container scanning uses Trivy 0.72.0 as a Docker-only release tool pinned by
digest; it is not an application dependency and is not installed into runtime
images. The repository policy tests exact, expiring exceptions and CI scans all
release images. Scanner/image upgrades require signature/provenance review,
fresh builds, full scans, runtime smoke, and evidence retention.

The production external-control preflight adds no dependency. It uses Node's
built-in filesystem, path, URL, crypto, and X.509 APIs to validate external
secret files, certificate/key consistency, and safe KMS/off-site evidence.
Provider SDKs are deliberately not embedded because no production provider is
approved; provider-specific provisioning and evidence collection remain
deployment integrations with independent access and maintenance review.

Operational readiness adds no npm dependency. The API writes the Prometheus
text exposition format with repository-owned bounded code, and the capacity
runner uses Node's built-in fetch, URL, filesystem, timing, and test APIs.
Staging pins official Prometheus 3.12.0 busybox, Alertmanager 0.32.1, and
black-box exporter 0.28.0 containers. They provide time-series collection,
alert routing/state, and independent HTTPS/TLS probing instead of embedding
provider-specific agents in the application. They run non-root on private
networks with read-only roots, bounded retention/logs, configuration checks,
and complete image scanning. Upgrades require upstream release/CVE review,
configuration validation, paging drill, retention compatibility, image scan,
and monitoring smoke evidence.

Patch/major upgrades require migration/format compatibility review,
release-note and CVE review, fresh image builds, persistence/backup checks,
health gates, and full staging smoke. The pnpm audit does not scan container
operating systems. The image gate now covers those layers, but the current
Keycloak findings and any future red gate remain release blockers until fixed
or externally approved under the narrow exception policy.
