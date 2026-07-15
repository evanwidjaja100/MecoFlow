# MinIO

Local Compose creates one private bucket through the idempotent `minio-init` job. Original filenames are never object keys. Production credentials, lifecycle and backup policy are external configuration.
