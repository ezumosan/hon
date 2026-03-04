import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "cover.openbd.jp" },
      { protocol: "https", hostname: "**.openbdapi.com" },
    ],
  },
};

export default nextConfig;
