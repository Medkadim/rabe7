# syntax=docker/dockerfile:1

# node:22-slim (Debian, glibc) instead of node:22-alpine (musl): argon2 and
# msgpackr-extract are native binaries, and their prebuilt packages only
# reliably target glibc — Alpine's musl libc caused a real build failure.
# Slim keeps the image small while avoiding that whole class of problem.
FROM node:22-slim AS base
# openssl: Prisma's engine needs it to detect which library version the
# system uses, both to generate the client and to run it later — without
# it, `prisma generate` and the running API server both fail the same way.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @rabe7/api...

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
# The root package.json pins the exact pnpm version (via "packageManager").
# Corepack finds that pin by walking up from the working directory — without
# this file present here too, it silently grabs the latest pnpm instead,
# which behaves differently enough to break the build.
COPY package.json ./
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
