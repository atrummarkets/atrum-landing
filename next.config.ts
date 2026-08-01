import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three.js ships untranspiled ESM in places; keeping it on the server's
  // external list would break the R3F client bundle.
  transpilePackages: ["three"],
  // Sibling projects in this repo each have a lockfile; pin the root so the
  // build does not infer the parent directory.
  turbopack: { root: __dirname },
};

export default nextConfig;
