# Application containers

Application Dockerfiles live with each deployable. Images use Node 24, non-root runtime users, and multi-stage production outputs: API/worker images contain filtered production dependencies and compiled artifacts, while the web image uses Next.js standalone output. Build tools, package managers, source trees, tests, and unrelated workspace applications are not copied into runtime stages.

Production-oriented dependency images in this directory provide the PostgreSQL, MinIO, operations, ClamAV, migrations, and reverse-proxy runtimes used by `compose.staging.yaml`. They are patched during their builds, contain only the required runtime artifacts, declare non-root users, and include OCI application-version metadata where applicable. The staging Compose file also forces non-root execution for upstream Redis and Keycloak images.

Before a release candidate is deployed, build every image named in `security/container-scan-policy.json` and run `pnpm security:image-scan`. See `docs/CONTAINER_SECURITY.md` for the pinned scanner, exception policy, evidence location, and current blockers; see `docs/DEPLOYMENT.md` for controlled staging deployment commands.
