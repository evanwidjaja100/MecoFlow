#!/bin/sh
set -eu

read_secret() {
  value="$(tr -d '\r\n' < "$1")"
  [ -n "$value" ] || {
    echo "Required secret file is empty" >&2
    exit 1
  }
  printf '%s' "$value"
}

backup_id="${BACKUP_SET:-}"
case "$backup_id" in
  *[!A-Za-z0-9._-]* | "" )
    echo "BACKUP_SET is required and contains unsupported characters" >&2
    exit 1
    ;;
esac

target="/backups/sets/$backup_id"
[ -f "$target/COMPLETE" ] || {
  echo "Backup set is incomplete or missing: $backup_id" >&2
  exit 1
}
(
  cd "$target"
  sha256sum -c manifest.sha256
  pg_restore --list application.dump >/dev/null
  pg_restore --list keycloak.dump >/dev/null
  keycloak_realm="$(sed -n 's/^keycloak_realm=//p' metadata.txt)"
  [ -n "$keycloak_realm" ]
  jq -e --arg realm "$keycloak_realm" '.realm == $realm' \
    keycloak-realm.json >/dev/null
)

if [ "${RESTORE_VALIDATE_ONLY:-true}" = "true" ]; then
  printf 'Backup set %s passed restore validation\n' "$backup_id"
  exit 0
fi

[ "${RESTORE_CONFIRM:-}" = "RESTORE_STAGING" ] || {
  echo "Set RESTORE_CONFIRM=RESTORE_STAGING for an actual restore" >&2
  exit 1
}
[ "${RESTORE_ALLOW_OBJECT_DELETE:-}" = "true" ] || {
  echo "Set RESTORE_ALLOW_OBJECT_DELETE=true for an actual restore" >&2
  exit 1
}

keycloak_realm="$(sed -n 's/^keycloak_realm=//p' "$target/metadata.txt")"
case "$keycloak_realm" in
  *[!A-Za-z0-9._-]* | "" )
    echo "Backup metadata has an invalid Keycloak realm" >&2
    exit 1
    ;;
esac

minio_user="$(read_secret "$S3_ACCESS_KEY_FILE")"
minio_password="$(read_secret "$S3_SECRET_KEY_FILE")"
mc --config-dir /tmp/mc alias set staging \
  "${S3_ENDPOINT:-http://minio:9000}" \
  "$minio_user" \
  "$minio_password" >/dev/null

if [ "${RESTORE_REQUIRE_EMPTY:-false}" = "true" ]; then
  export PGPASSWORD="$(read_secret "$DATABASE_PASSWORD_FILE")"
  application_tables="$(
    psql \
      --host="${DATABASE_HOST:-postgres}" \
      --username="${DATABASE_USER:-mecoflow}" \
      --dbname="${DATABASE_NAME:-mecoflow}" \
      --tuples-only --no-align \
      --command="SELECT count(*) FROM pg_tables WHERE schemaname = 'public'"
  )"
  export PGPASSWORD="$(read_secret "$KEYCLOAK_DATABASE_PASSWORD_FILE")"
  keycloak_tables="$(
    psql \
      --host="${KEYCLOAK_DATABASE_HOST:-keycloak-db}" \
      --username="${KEYCLOAK_DATABASE_USER:-keycloak}" \
      --dbname="${KEYCLOAK_DATABASE_NAME:-keycloak}" \
      --tuples-only --no-align \
      --command="SELECT count(*) FROM pg_tables WHERE schemaname = 'public'"
  )"
  unset PGPASSWORD
  application_tables="$(printf '%s' "$application_tables" | tr -d '[:space:]')"
  keycloak_tables="$(printf '%s' "$keycloak_tables" | tr -d '[:space:]')"
  [ "$application_tables" = "0" ] || {
    echo "Restore target application database is not empty" >&2
    exit 1
  }
  [ "$keycloak_tables" = "0" ] || {
    echo "Restore target Keycloak database is not empty" >&2
    exit 1
  }
  empty_object_list="/tmp/restore-empty-object-list.jsonl"
  rm -f "$empty_object_list"
  mc --config-dir /tmp/mc ls --recursive --json \
    "staging/${S3_BUCKET:-mecoflow-staging-private}" \
    > "$empty_object_list"
  existing_objects="$(wc -l < "$empty_object_list" | tr -d '[:space:]')"
  rm -f "$empty_object_list"
  [ "$existing_objects" = "0" ] || {
    echo "Restore target object bucket is not empty" >&2
    exit 1
  }
  echo "Clean restore target precondition: PASS"
fi

export PGPASSWORD="$(read_secret "$DATABASE_PASSWORD_FILE")"
pg_restore \
  --clean \
  --if-exists \
  --no-acl \
  --no-owner \
  --exit-on-error \
  --host="${DATABASE_HOST:-postgres}" \
  --username="${DATABASE_USER:-mecoflow}" \
  --dbname="${DATABASE_NAME:-mecoflow}" \
  "$target/application.dump"

export PGPASSWORD="$(read_secret "$KEYCLOAK_DATABASE_PASSWORD_FILE")"
pg_restore \
  --clean \
  --if-exists \
  --no-acl \
  --no-owner \
  --exit-on-error \
  --host="${KEYCLOAK_DATABASE_HOST:-keycloak-db}" \
  --username="${KEYCLOAK_DATABASE_USER:-keycloak}" \
  --dbname="${KEYCLOAK_DATABASE_NAME:-keycloak}" \
  "$target/keycloak.dump"
unset PGPASSWORD

mc --config-dir /tmp/mc mirror \
  --overwrite \
  --remove \
  "$target/objects" \
  "staging/${S3_BUCKET:-mecoflow-staging-private}" >/dev/null

verification="/tmp/restore-verification"
rm -rf "$verification"
mkdir -p "$verification/objects"
mc --config-dir /tmp/mc mirror \
  "staging/${S3_BUCKET:-mecoflow-staging-private}" \
  "$verification/objects" >/dev/null
(
  cd "$verification"
  if [ -s "$target/document-objects.sha256" ]; then
    sha256sum -c "$target/document-objects.sha256" >/dev/null
  fi
  sha256sum -c "$target/object-storage.sha256" >/dev/null
)

export PGPASSWORD="$(read_secret "$DATABASE_PASSWORD_FILE")"
psql \
  --host="${DATABASE_HOST:-postgres}" \
  --username="${DATABASE_USER:-mecoflow}" \
  --dbname="${DATABASE_NAME:-mecoflow}" \
  --tuples-only --no-align --field-separator='=' \
  --command="SELECT name, count FROM (
    SELECT 'audit_events' AS name, count(*)::text AS count FROM audit_events
    UNION ALL SELECT 'document_associations', count(*)::text FROM document_associations
    UNION ALL SELECT 'document_versions', count(*)::text FROM document_versions
    UNION ALL SELECT 'documents', count(*)::text FROM documents
    UNION ALL SELECT 'memberships', count(*)::text FROM memberships
    UNION ALL SELECT 'organizations', count(*)::text FROM organizations
    UNION ALL SELECT 'permissions', count(*)::text FROM permissions
    UNION ALL SELECT 'project_members', count(*)::text FROM project_members
    UNION ALL SELECT 'projects', count(*)::text FROM projects
    UNION ALL SELECT 'readiness_snapshots', count(*)::text FROM readiness_snapshots
    UNION ALL SELECT 'roles', count(*)::text FROM roles
    UNION ALL SELECT 'user_profiles', count(*)::text FROM user_profiles
  ) counts ORDER BY name" > "$verification/application-counts.txt"
diff -u "$target/application-counts.txt" \
  "$verification/application-counts.txt" >/dev/null

export PGPASSWORD="$(read_secret "$KEYCLOAK_DATABASE_PASSWORD_FILE")"
psql \
  --host="${KEYCLOAK_DATABASE_HOST:-keycloak-db}" \
  --username="${KEYCLOAK_DATABASE_USER:-keycloak}" \
  --dbname="${KEYCLOAK_DATABASE_NAME:-keycloak}" \
  --tuples-only --no-align --field-separator='=' \
  --command="SELECT name, count FROM (
    SELECT 'clients' AS name, count(*)::text AS count FROM client c JOIN realm r ON r.id = c.realm_id WHERE r.name = '$keycloak_realm'
    UNION ALL SELECT 'credentials', count(*)::text FROM credential c JOIN user_entity u ON u.id = c.user_id JOIN realm r ON r.id = u.realm_id WHERE r.name = '$keycloak_realm'
    UNION ALL SELECT 'groups', count(*)::text FROM keycloak_group g JOIN realm r ON r.id = g.realm_id WHERE r.name = '$keycloak_realm'
    UNION ALL SELECT 'realms', count(*)::text FROM realm r WHERE r.name = '$keycloak_realm'
    UNION ALL SELECT 'roles', count(*)::text FROM keycloak_role k JOIN realm r ON r.id = k.realm_id WHERE r.name = '$keycloak_realm'
    UNION ALL SELECT 'users', count(*)::text FROM user_entity u JOIN realm r ON r.id = u.realm_id WHERE r.name = '$keycloak_realm'
  ) counts ORDER BY name" > "$verification/keycloak-realm-counts.txt"
unset PGPASSWORD
diff -u "$target/keycloak-realm-counts.txt" \
  "$verification/keycloak-realm-counts.txt" >/dev/null
rm -rf "$verification"

printf 'Backup set %s restored; record counts and object checksums match\n' "$backup_id"
