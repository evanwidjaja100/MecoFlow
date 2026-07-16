FROM node:24-alpine AS build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV BUILD_STANDALONE=true
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mecoflow/web... build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /workspace
COPY --from=build --chown=node:node /workspace/apps/web/.next/standalone /workspace
COPY --from=build --chown=node:node /workspace/apps/web/.next/static /workspace/apps/web/.next/static
USER node
WORKDIR /workspace/apps/web
EXPOSE 3000
CMD ["node", "server.js"]
