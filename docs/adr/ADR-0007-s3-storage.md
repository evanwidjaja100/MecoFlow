# ADR-0007: S3-compatible object storage

## Status

Accepted — 2026-07-15

## Context

Operational documents must be private, scalable and separate from relational metadata.

## Decision

Use MinIO locally and an S3-compatible abstraction in deployment, private buckets, opaque keys, metadata/checksum in PostgreSQL and authorized short-lived URLs.

## Alternatives considered

Database blobs, public buckets and local application filesystems.

## Consequences

Portable object storage and independent backup; metadata/object consistency and scanning workflows require explicit handling.

## Security implications

Validate type/size/name, quarantine until permitted, never expose keys/credentials, and audit upload/download.

## Operational implications

Back up objects with metadata and monitor capacity, availability, checksums and lifecycle policies.
