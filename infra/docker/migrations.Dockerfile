FROM node:24-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts/prepare.mjs scripts/prepare.mjs
COPY packages/database/package.json packages/database/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN pnpm install --frozen-lockfile --filter @mecoflow/database...

FROM dependencies AS build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY packages/database/prisma packages/database/prisma
COPY packages/database/prisma.config.ts packages/database/prisma.config.ts
COPY packages/database/src packages/database/src
COPY packages/database/tsconfig.json packages/database/tsconfig.json
COPY packages/typescript-config packages/typescript-config
RUN pnpm --filter @mecoflow/database build

FROM node:24-alpine AS runtime
ARG APP_VERSION=0.0.0-unknown
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.title="MECO Flow database deployment" \
      org.opencontainers.image.version=$APP_VERSION
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production
WORKDIR /workspace
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-v* && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx
COPY --from=dependencies /workspace /workspace
COPY --from=build /workspace/packages/database/dist packages/database/dist
COPY --from=build /workspace/packages/database/prisma packages/database/prisma
COPY --from=build /workspace/packages/database/prisma.config.ts packages/database/prisma.config.ts
COPY infra/staging/load-secrets.mjs /usr/local/bin/load-secrets.mjs
COPY infra/staging/provision-smoke.mjs /workspace/infra/staging/provision-smoke.mjs
COPY infra/pilot/provision-pilot.mjs /workspace/infra/pilot/provision-pilot.mjs
USER node
ENTRYPOINT ["node", "/usr/local/bin/load-secrets.mjs"]
CMD ["packages/database/node_modules/.bin/prisma", "migrate", "deploy", "--config", "packages/database/prisma.config.ts"]
