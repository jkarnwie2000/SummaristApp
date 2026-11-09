import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Book covers come from the Summarist Firebase Storage bucket; next/image
    // resizes them and serves WebP/AVIF instead of full-size PNGs.
    remotePatterns: [
      new URL("https://firebasestorage.googleapis.com/v0/b/summaristt.appspot.com/**"),
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // A package-lock.json in the home folder confuses root detection.
  turbopack: { root: path.resolve(__dirname) },
  // firebase-admin is only used on the server; keep it out of the bundler.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
