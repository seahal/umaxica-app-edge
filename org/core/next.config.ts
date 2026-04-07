import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
    authInterrupts: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/health',
          destination: '/api/health',
        },
      ],
    };
  },
  typedRoutes: true,
  allowedDevOrigins: ['localhost', '*.localhost', '172.18.0.2'],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  poweredByHeader: false,
  compiler: {
    styledComponents: true,
  },
  cacheComponents: false,
};

export default nextConfig;
void initOpenNextCloudflareForDev();
