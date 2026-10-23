import type { NextConfig } from "next";
import { PUBLIC_REDIRECTS } from "./lib/seo.ts";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async redirects() {
    return PUBLIC_REDIRECTS;
  },
  async headers() {
    return process.env.VERCEL_ENV === "preview"
      ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
      : [];
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
