import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/db"],
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
