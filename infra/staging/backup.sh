#!/bin/sh
set -eu

umask 077

read_secret() {
  value="$(tr -d '\r\n' < "$1")"
  [ -n "$value" ] || {
    echo "Required secret file is empty" >&2
    exit 1
  }
  printf '%s' "$value"
}

backup_id="${BACKUP_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
case "$backup_id" in
  *[!A-Za-z0-9._-]* | "" )
    echo "BACKUP_ID contains unsupported characters" >&2
    exit 1
    ;;
esac

target="/backups/sets/$backup_id"
work="/backups/.incomplete-$backup_id"
case "$work" in
  /backups/.incomplete-*) ;;
  *)
    echo "Refusing unsafe temporary backup path" >&2
    exit 1
    ;;
esac
[ ! -e "$target" ] || {
  echo "Backup set already exists: $backup_id" >&2
  exit 1
}
rm -rf "$work"
mkdir -p "$work/objects"

keycloak_realm="${KEYCLOAK_REALM:-mecoflow-staging}"
case "$keycloak_realm" in
  *[!A-Za-z0-9._-]* | "" )
    echo "KEYCLOAK_REALM contains unsupported characters" >&2
    exit 1
    ;;
esac

admin_token_response="/tmp/keycloak-admin-token.json"
admin_headers="/tmp/keycloak-admin-headers"
trap 'rm -f "$admin_token_response" "$admin_headers"' EXIT
curl --silent --show-error --fail \
  --request POST \
  --data-urlencode "client_id=admin-cli" \
  --data-urlencode "username=${KEYCLOAK_ADMIN_USERNAME:-mecoflow-staging-admin}" \
  --data-urlencode "password@${KEYCLOAK_ADMIN_PASSWORD_FILE}" \
  --data-urlencode "grant_type=password" \
  "${KEYCLOAK_INTERNAL_URL:-http://keycloak:8080}/realms/master/protocol/openid-connect/token" \
  > "$admin_token_response"
admin_token="$(jq -er '.access_token' "$admin_token_response")"
printf 'Authorization: Bearer %s\nContent-Type: application/json\n' \
  "$admin_token" > "$admin_headers"
chmod 0600 "$admin_headers"
curl --silent --show-error --fail \
  --request POST \
  --header "@$admin_headers" \
  --data '{"exportClients":true,"exportGroupsAndRoles":true}' \
  "${KEYCLOAK_INTERNAL_URL:-http://keycloak:8080}/admin/realms/$keycloak_realm/partial-export" \
  > "$work/keycloak-realm.json"
jq -e --arg realm "$keycloak_realm" '.realm == $realm' \
  "$work/keycloak-realm.json" >/dev/null
rm -f "$admin_token_response" "$admin_headers"
trap - EXIT

export PGPASSWORD="$(read_secret "$DATABASE_PASSWORD_FILE")"
schema_version="$(
  psql \
    --host="${DATABASE_HOST:-postgres}" \
    --username="${DATABASE_USER:-mecoflow}" \
    --dbname="${DATABASE_NAME:-mecoflow}" \
    --tuples-only --no-align \
    --command='SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at DESC, migration_name DESC LIMIT 1'
)"
schema_version="$(printf '%s' "$schema_version" | tr -d '\r\n')"
schema_migration_count="$(
  psql \
    --host="${DATABASE_HOST:-postgres}" \
    --username="${DATABASE_USER:-mecoflow}" \
    --dbname="${DATABASE_NAME:-mecoflow}" \
    --tuples-only --no-align \
    --command='SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'
)"
schema_migration_count="$(printf '%s' "$schema_migration_count" | tr -d '\r\n')"
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
  ) counts ORDER BY name" > "$work/application-counts.txt"
psql \
  --host="${DATABASE_HOST:-postgres}" \
  --username="${DATABASE_USER:-mecoflow}" \
  --dbname="${DATABASE_NAME:-mecoflow}" \
  --tuples-only --no-align \
  --command="SELECT sha256 || '  objects/' || \"storageKey\" FROM document_versions WHERE \"uploadedAt\" IS NOT NULL ORDER BY \"storageKey\"" \
  > "$work/document-objects.sha256"
pg_dump \
  --format=custom \
  --host="${DATABASE_HOST:-postgres}" \
  --username="${DATABASE_USER:-mecoflow}" \
  --dbname="${DATABASE_NAME:-mecoflow}" \
  --file="$work/application.dump"
pg_restore --list "$work/application.dump" > "$work/application.restore-list"

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
  ) counts ORDER BY name" > "$work/keycloak-realm-counts.txt"
pg_dump \
  --format=custom \
  --host="${KEYCLOAK_DATABASE_HOST:-keycloak-db}" \
  --username="${KEYCLOAK_DATABASE_USER:-keycloak}" \
  --dbname="${KEYCLOAK_DATABASE_NAME:-keycloak}" \
  --file="$work/keycloak.dump"
pg_restore --list "$work/keycloak.dump" > "$work/keycloak.restore-list"
unset PGPASSWORD

minio_user="$(read_secret "$S3_ACCESS_KEY_FILE")"
minio_password="$(read_secret "$S3_SECRET_KEY_FILE")"
mc --config-dir /tmp/mc alias set staging \
  "${S3_ENDPOINT:-http://minio:9000}" \
  "$minio_user" \
  "$minio_password" >/dev/null
mc --config-dir /tmp/mc mirror \
  "staging/${S3_BUCKET:-mecoflow-staging-private}" \
  "$work/objects" >/dev/null

(
  cd "$work"
  if [ -s document-objects.sha256 ]; then
    sha256sum -c document-objects.sha256 >/dev/null
  fi
  find ./objects -type f -print0 |
    sort -z |
    xargs -0 -r sha256sum > object-storage.sha256
)

cat > "$work/metadata.txt" <<EOF
backup_id=$backup_id
application_version=${APP_VERSION:-unknown}
created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
schema_version=$schema_version
schema_migration_count=$schema_migration_count
database=${DATABASE_NAME:-mecoflow}
keycloak_database=${KEYCLOAK_DATABASE_NAME:-keycloak}
keycloak_realm=$keycloak_realm
keycloak_realm_configuration=keycloak-realm.json
object_bucket=${S3_BUCKET:-mecoflow-staging-private}
consistency=operator-quiesced
EOF

(
  cd "$work"
  find . -type f ! -name manifest.sha256 -print0 |
    sort -z |
    xargs -0 sha256sum > manifest.sha256
  sha256sum -c manifest.sha256 >/dev/null
)
touch "$work/COMPLETE"
mkdir -p /backups/sets
mv "$work" "$target"
printf 'Backup set %s completed and validated\n' "$backup_id"
