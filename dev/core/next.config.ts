import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost', '*.localhost', '172.18.0.2'],
};

export default nextConfig;
