FROM clamav/clamav:1.4.5@sha256:4de20bd9ab45a4b763c5412b769217ef5082572ebc8a63aff1a77943419e5dd8

ARG APP_VERSION=0.0.0-unknown
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.title="MECO Flow staging malware scanner" \
      org.opencontainers.image.version=$APP_VERSION

COPY infra/staging/clamav-entrypoint.sh /usr/local/bin/mecoflow-clamav
RUN chmod 0555 /usr/local/bin/mecoflow-clamav
USER clamav
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/mecoflow-clamav"]
