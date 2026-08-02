import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // See apps/storefront/next.config.ts for why this points at the monorepo
  // root rather than this app's own directory — same pnpm-symlink reason.
  turbopack: {
    root: path.join(process.cwd(), "..", ".."),
  },
};

export default nextConfig;
