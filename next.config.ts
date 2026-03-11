import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,  // ← REQUIRED for HMR
  },
  /* config options here */
};

export default nextConfig;
