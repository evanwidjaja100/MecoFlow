FROM golang:1.26-alpine AS build

ARG MINIO_SOURCE_REF=9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a
ARG MINIO_SOURCE_SHA256=45521908307306e925c98d629e1c17d78c8b72b6ee242b1bfb1409f7d8ee5841
WORKDIR /build
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    apk add --no-cache ca-certificates curl tar && \
    curl --fail --location --silent --show-error \
      "https://codeload.github.com/minio/minio/tar.gz/${MINIO_SOURCE_REF}" \
      --output /tmp/minio-source.tar.gz && \
    echo "${MINIO_SOURCE_SHA256}  /tmp/minio-source.tar.gz" | sha256sum -c - && \
    tar --extract --gzip --file /tmp/minio-source.tar.gz --strip-components=1 && \
    go get \
      github.com/apache/thrift@v0.23.0 \
      github.com/buger/jsonparser@v1.1.2 \
      github.com/go-jose/go-jose/v4@v4.1.4 \
      github.com/go-openapi/analysis@v0.24.2 \
      github.com/go-openapi/loads@v0.23.2 \
      github.com/go-openapi/spec@v0.22.3 \
      github.com/go-openapi/strfmt@v0.26.1 \
      github.com/go-openapi/swag@v0.25.4 \
      github.com/grafana/regexp@v0.0.0-20250905093917-f7b3be9d1853 \
      github.com/prometheus/prometheus@v0.311.3 \
      go.opentelemetry.io/otel/sdk@v1.43.0 \
      go.yaml.in/yaml/v2@v2.4.4 \
      golang.org/x/text@v0.39.0 \
      google.golang.org/grpc@v1.82.1 && \
    CGO_ENABLED=0 go build -tags kqueue -trimpath \
      -ldflags "-s -w -X github.com/minio/minio/cmd.Version=2025-10-15T17:29:55Z -X github.com/minio/minio/cmd.CopyrightYear=2025 -X github.com/minio/minio/cmd.ReleaseTag=RELEASE.2025-10-15T17-29-55Z -X github.com/minio/minio/cmd.CommitID=${MINIO_SOURCE_REF} -X github.com/minio/minio/cmd.ShortCommitID=9e49d5e7a648" \
      -o /out/minio .

FROM alpine:3.23

ARG APP_VERSION=0.0.0-unknown
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
ARG MINIO_SOURCE_REF=9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.source="https://github.com/minio/minio/tree/${MINIO_SOURCE_REF}" \
      org.opencontainers.image.title="MECO Flow staging object storage" \
      org.opencontainers.image.version=$APP_VERSION
RUN apk upgrade --no-cache && \
    apk add --no-cache ca-certificates curl && \
    addgroup -g 1000 -S minio && \
    adduser -S -D -H -u 1000 -G minio minio && \
    mkdir -p /data && \
    chown -R minio:minio /data
COPY --from=build /out/minio /usr/local/bin/minio
ENV HOME=/tmp
USER 1000:1000
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
