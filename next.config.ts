import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright usa su propio directorio de build (NEXT_DIST_DIR) para no chocar con un `npm run dev` abierto.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
