import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3002', '*.vercel.app'],
    },
  },
};

export default nextConfig;
