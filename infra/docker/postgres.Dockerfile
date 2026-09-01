FROM postgres:18-alpine@sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15

ARG APP_VERSION=0.0.0-unknown
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.title="MECO Flow PostgreSQL" \
      org.opencontainers.image.version=$APP_VERSION
RUN apk upgrade --no-cache && \
    rm -f /usr/local/bin/gosu && \
    mkdir -p /var/lib/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql
USER postgres
