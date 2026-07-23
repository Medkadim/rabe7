# syntax=docker/dockerfile:1

# node:22-slim (Debian, glibc) instead of node:22-alpine (musl): Next.js's
# compiler and sharp are native binaries, and their prebuilt packages only
# reliably target glibc — Alpine's musl libc caused real build failures.
# Slim keeps the image small while avoiding that whole class of problem.
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/admin/package.json apps/admin/package.json
RUN pnpm install --frozen-lockfile --filter @rabe7/admin...

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/admin/node_modules ./apps/admin/node_modules
COPY apps/admin apps/admin
WORKDIR /repo/apps/admin
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm run build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /repo/apps/admin
COPY --from=build /repo/apps/admin/.next/standalone ./
COPY --from=build /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build /repo/apps/admin/public ./apps/admin/public

EXPOSE 3000
CMD ["node", "apps/admin/server.js"]
