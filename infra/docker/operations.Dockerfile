FROM golang:1.26-alpine@sha256:0178a641fbb4858c5f1b48e34bdaabe0350a330a1b1149aabd498d0699ff5fb2 AS minio-client

ARG MC_SOURCE_REF=77f82e18b5401a65958f1619df6ebb994634bd88
ARG MC_SOURCE_SHA256=167415edd21bc29f5360943dac64272aa5cda0a39f3070b15cfeca671c43d975
WORKDIR /build
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    apk add --no-cache ca-certificates curl tar && \
    curl --fail --location --silent --show-error \
      "https://codeload.github.com/minio/mc/tar.gz/${MC_SOURCE_REF}" \
      --output /tmp/mc-source.tar.gz && \
    echo "${MC_SOURCE_SHA256}  /tmp/mc-source.tar.gz" | sha256sum -c - && \
    tar --extract --gzip --file /tmp/mc-source.tar.gz --strip-components=1 && \
    go get \
      github.com/grafana/regexp@v0.0.0-20250905093917-f7b3be9d1853 \
      github.com/prometheus/prometheus@v0.311.3 \
      go.yaml.in/yaml/v2@v2.4.4 \
      golang.org/x/text@v0.39.0 \
      google.golang.org/grpc@v1.82.1 && \
    CGO_ENABLED=0 go build -tags kqueue -trimpath \
      -ldflags "-s -w -X github.com/minio/mc/cmd.Version=2025-11-06T16:25:29Z -X github.com/minio/mc/cmd.CopyrightYear=2025 -X github.com/minio/mc/cmd.ReleaseTag=RELEASE.2025-11-06T16-25-29Z -X github.com/minio/mc/cmd.CommitID=${MC_SOURCE_REF} -X github.com/minio/mc/cmd.ShortCommitID=77f82e18b540" \
      -o /out/mc .

FROM postgres:18-alpine@sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15 AS runtime
ARG APP_VERSION=0.0.0-unknown
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.title="MECO Flow staging backup and restore" \
      org.opencontainers.image.version=$APP_VERSION
ENV APP_VERSION=$APP_VERSION
COPY --from=minio-client /out/mc /usr/local/bin/mc
COPY infra/staging/backup.sh /usr/local/bin/mecoflow-backup
COPY infra/staging/object-persistence-probe.sh /usr/local/bin/mecoflow-object-probe
COPY infra/staging/restore.sh /usr/local/bin/mecoflow-restore
RUN apk upgrade --no-cache && \
    apk add --no-cache curl jq && \
    rm -f /usr/local/bin/gosu && \
    mkdir -p /backups/sets /tmp/mc && \
    chown -R postgres:postgres /backups /tmp/mc && \
    chmod 0555 /usr/local/bin/mecoflow-backup \
      /usr/local/bin/mecoflow-object-probe \
      /usr/local/bin/mecoflow-restore
USER postgres
WORKDIR /backups
CMD ["mecoflow-backup"]
