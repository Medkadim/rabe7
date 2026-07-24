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
COPY apps/storefront/package.json apps/storefront/package.json
RUN pnpm install --frozen-lockfile --filter @rabe7/storefront...

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/storefront/node_modules ./apps/storefront/node_modules
# The root package.json pins the exact pnpm version (via "packageManager").
# Corepack finds that pin by walking up from the working directory — without
# this file present here too, it silently grabs the latest pnpm instead,
# which behaves differently enough to break the build.
COPY package.json ./
COPY apps/storefront apps/storefront
WORKDIR /repo/apps/storefront
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm run build

FROM base AS runtime
ENV NODE_ENV=production
# Next.js's standalone server defaults to port 3000 regardless of what's
# published outside — admin never needed this because its own port already
# is 3000. Storefront's is 3001, so it has to be told explicitly or it
# listens on the wrong port inside the container and every request outside
# just hits nothing.
ENV PORT=3001
WORKDIR /repo/apps/storefront
COPY --from=build /repo/apps/storefront/.next/standalone ./
COPY --from=build /repo/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=build /repo/apps/storefront/public ./apps/storefront/public

EXPOSE 3001
CMD ["node", "apps/storefront/server.js"]
