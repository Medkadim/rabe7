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
COPY apps/driver/package.json apps/driver/package.json
RUN pnpm install --frozen-lockfile --filter @rabe7/driver...

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/driver/node_modules ./apps/driver/node_modules
# The root package.json pins the exact pnpm version (via "packageManager").
# Corepack finds that pin by walking up from the working directory — without
# this file present here too, it silently grabs the latest pnpm instead,
# which behaves differently enough to break the build.
COPY package.json ./
COPY apps/driver apps/driver
WORKDIR /repo/apps/driver
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm run build

FROM base AS runtime
ENV NODE_ENV=production
# Next.js's standalone server defaults to port 3000 regardless of what's
# published outside — it has to be told explicitly or it listens on the
# wrong port inside the container.
ENV PORT=3002
WORKDIR /repo/apps/driver
COPY --from=build /repo/apps/driver/.next/standalone ./
COPY --from=build /repo/apps/driver/.next/static ./apps/driver/.next/static
COPY --from=build /repo/apps/driver/public ./apps/driver/public

EXPOSE 3002
CMD ["node", "apps/driver/server.js"]
