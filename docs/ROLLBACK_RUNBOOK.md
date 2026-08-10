# Staging rollback runbook

This runbook returns staging service code to a previously approved image set.
It is not a database down-migration procedure and does not authorize a
production rollback.

## Preconditions

Record the incident, current/target application versions and image digests,
database migration state, backup set, operator, and approver. Close nginx
traffic and stop API/worker/web before changing images. Preserve logs and
audit evidence. Validate the selected backup before any destructive action.

## Application-only rollback

Use this path only when the target application version is compatible with the
current database schema:

1. Set `APP_VERSION` and immutable image references to the previously approved
   release.
2. Run `docker compose ... config --quiet` and inspect the resolved image
   names/digests and external secret paths.
3. Recreate API, worker, web, and proxy with `--wait`.
4. Verify `/health/live`, dependency-aware `/health/ready`, worker heartbeat,
   web health/version, OIDC login/callback, core internal flow, supplier flow,
   and Supplier A/B isolation.
5. Record the result. If compatibility is uncertain or any gate fails, keep
   traffic closed.

## Migration failure

Prisma deploys forward-only migrations. Do not run ad-hoc reverse SQL, edit an
applied migration, delete `_prisma_migrations`, or directly force workflow
states.

- If a transactional migration failed without schema residue, diagnose and
  test a corrected forward migration on an isolated restored copy. Marking a
  record rolled back is allowed only after that fact is proven.
- If a migration partially committed or transformed data, restore into an
  isolated environment or prepare a reviewed forward fix. Verify counts,
  constraints, authorization predicates, audit records, and smoke tests
  before reopening traffic.
- If the previous application cannot run against the new schema, restore the
  coordinated pre-deployment application/Keycloak/object backup into an
  isolated replacement environment and cut over only after full acceptance.

## Rollback verification

Require all Compose services healthy, no root runtime process, expected image
version/revision metadata, no secret values in container inspect metadata,
successful migration status, successful staging smoke/isolation, and relevant
regression gates. Record data-integrity checks and any writes that occurred
between deployment and rollback. Escalate ambiguous email/object side effects
instead of replaying them automatically.

## Stop condition

If no schema-compatible image or validated restore exists, keep staging closed
and report the exact blocker. Do not claim production readiness.
