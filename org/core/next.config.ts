import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { imageConfig } from './image-config';
import { imageFontSecurityHeaders } from './security-headers';

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
    authInterrupts: true,
  },
  typedRoutes: true,
  cacheComponents: true,
  images: imageConfig as NextConfig['images'],
  headers: imageFontSecurityHeaders as NextConfig['headers'],
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
};

export default nextConfig;
void initOpenNextCloudflareForDev();
