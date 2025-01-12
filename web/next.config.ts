import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Serve static files from the 'uploads' directory
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/uploads/:path*", // Static files will be served from this directory
      },
    ];
  },
};

export default nextConfig;
