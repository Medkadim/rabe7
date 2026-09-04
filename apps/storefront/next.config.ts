import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // pnpm installs packages into a shared store at the monorepo root and
  // symlinks them into each app's node_modules — so the real, resolved
  // location of the "next" package lives one level above this folder, not
  // inside it. Turbopack refuses to follow a resolved path outside its
  // configured root (a deliberate safety check), so the root has to be set
  // to the monorepo root, not this app's own directory, or that check
  // rejects "next" itself. (process.cwd() here is always .../apps/storefront,
  // since the build is only ever run from inside this folder.)
  turbopack: {
    root: path.join(process.cwd(), "..", ".."),
  },
};

export default nextConfig;
