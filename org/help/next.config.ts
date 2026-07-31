import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { imageConfig } from './image-config';
import { imageFontSecurityHeaders } from './security-headers';

const nextConfig: NextConfig = {
  images: imageConfig as NextConfig['images'],
  headers: imageFontSecurityHeaders as NextConfig['headers'],
  cacheComponents: true,
};

export default nextConfig;
void initOpenNextCloudflareForDev();
