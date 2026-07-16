import { resolve } from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE === "true"
    ? {
        output: "standalone" as const,
        outputFileTracingRoot: resolve(import.meta.dirname, "../.."),
      }
    : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@mecoflow/contracts", "@mecoflow/ui"],
};

export default nextConfig;
