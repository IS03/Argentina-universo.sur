import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async redirects() {
    return [{ source: "/provincias/catamarca", destination: "/provincias/catarmaca", permanent: true }];
  },
  images: {
    qualities: [75, 85],
    localPatterns: [
      {
        pathname: "/img/**",
        // Incluye logo, home, etc. Sin 'search' se permiten query strings (?v=2)
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
