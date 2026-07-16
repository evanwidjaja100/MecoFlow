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
RUN pnpm install --prod --frozen-lockfile --filter @mecoflow/worker...

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=production-dependencies --chown=node:node /workspace /workspace
COPY --from=build --chown=node:node /workspace/apps/worker/dist apps/worker/dist
COPY --from=build --chown=node:node /workspace/packages/config/dist packages/config/dist
COPY --from=build --chown=node:node /workspace/packages/database/dist packages/database/dist
USER node
WORKDIR /workspace/apps/worker
CMD ["node", "dist/main.js"]
