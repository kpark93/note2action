import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Consume the shared workspace package as raw TypeScript source.
  transpilePackages: ["@note2action/shared"],
};

export default nextConfig;
