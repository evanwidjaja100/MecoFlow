FROM node:24-alpine AS build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mecoflow/worker... build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
RUN corepack enable
COPY --from=build --chown=node:node /workspace /workspace
USER node
WORKDIR /workspace/apps/worker
CMD ["node", "dist/main.js"]
