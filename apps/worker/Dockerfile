FROM node:24-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mecoflow/worker... build

FROM base AS production-dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts/prepare.mjs scripts/prepare.mjs
COPY apps/worker/package.json apps/worker/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/readiness/package.json packages/readiness/package.json
RUN pnpm install --prod --frozen-lockfile --filter @mecoflow/worker...

FROM node:24-alpine AS runtime
ARG APP_VERSION=0.0.0-unknown
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.title="MECO Flow worker" \
      org.opencontainers.image.version=$APP_VERSION
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production
WORKDIR /workspace
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-v* && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx
COPY --from=production-dependencies /workspace /workspace
COPY --from=build /workspace/apps/worker/dist apps/worker/dist
COPY --from=build /workspace/packages/config/dist packages/config/dist
COPY --from=build /workspace/packages/database/dist packages/database/dist
COPY --from=build /workspace/packages/readiness/dist packages/readiness/dist
COPY infra/staging/load-secrets.mjs /usr/local/bin/load-secrets.mjs
USER node
WORKDIR /workspace/apps/worker
ENTRYPOINT ["node", "/usr/local/bin/load-secrets.mjs"]
CMD ["node", "dist/main.js"]
