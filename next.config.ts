import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "cover.openbd.jp" },
      { protocol: "https", hostname: "**.openbdapi.com" },
      { protocol: "https", hostname: "ndlsearch.ndl.go.jp" },
      { protocol: "https", hostname: "www.hanmoto.com" },
    ],
  },
};

export default nextConfig;
