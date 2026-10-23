import type { NextConfig } from "next";
import { PUBLIC_REDIRECTS } from "./lib/seo.ts";
import { ACTIVIDADES_FILTRO_REWRITES, ACTIVIDADES_FILTRO_REDIRECTS } from "./lib/site-links.ts";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async redirects() {
    return [...PUBLIC_REDIRECTS, ...ACTIVIDADES_FILTRO_REDIRECTS];
  },
  // beforeFiles: /actividades existe como página estática y, si no, ganaría al rewrite.
  async rewrites() {
    return { beforeFiles: ACTIVIDADES_FILTRO_REWRITES, afterFiles: [], fallback: [] };
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
