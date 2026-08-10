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

mode="${1:-}"
case "$mode" in
  create | check) ;;
  *)
    echo "Usage: mecoflow-object-probe create|check" >&2
    exit 1
    ;;
esac

minio_user="$(read_secret "$S3_ACCESS_KEY_FILE")"
minio_password="$(read_secret "$S3_SECRET_KEY_FILE")"
mc --config-dir /tmp/mc alias set staging \
  "${S3_ENDPOINT:-http://minio:9000}" \
  "$minio_user" \
  "$minio_password" >/dev/null

probe="staging/${S3_BUCKET:-mecoflow-staging-private}/operations/phase9c-persistence.txt"
if [ "$mode" = "create" ]; then
  printf 'phase9c-persistence\n' |
    mc --config-dir /tmp/mc pipe "$probe" >/dev/null
  echo "MinIO persistence probe created"
  exit 0
fi

mc --config-dir /tmp/mc stat "$probe" >/dev/null
echo "MinIO object persistence: PASS"
