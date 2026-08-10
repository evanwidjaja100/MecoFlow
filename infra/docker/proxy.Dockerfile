FROM nginx:1.29-alpine

ARG APP_VERSION=0.0.0-unknown
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.title="MECO Flow staging reverse proxy" \
      org.opencontainers.image.version=$APP_VERSION
RUN apk upgrade --no-cache
USER 101:101
