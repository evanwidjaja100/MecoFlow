import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@mecoflow/contracts", "@mecoflow/ui"],
};

export default nextConfig;
