import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  allowedDevOrigins: ['http://100.90.139.121:3002', 'http://100.90.139.121:3001', 'http://100.90.139.121:3000', 'http://100.90.139.121'],
};

export default nextConfig;
