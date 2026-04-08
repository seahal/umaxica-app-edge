import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost', '*.localhost', '172.18.0.2'],
  poweredByHeader: false,
};

export default nextConfig;
void initOpenNextCloudflareForDev();
