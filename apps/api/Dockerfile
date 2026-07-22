# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @rabe7/api...

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY apps/api apps/api
COPY tsconfig.base.json ./
WORKDIR /repo/apps/api
RUN pnpm exec prisma generate
RUN pnpm run build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /repo/apps/api
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/apps/api/node_modules ./node_modules
COPY apps/api/package.json ./

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
