import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
  images: { remotePatterns: [] },
  output: "standalone"
};

export default nextConfig;