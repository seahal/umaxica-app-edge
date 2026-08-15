import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { imageConfig } from './image-config';
import { imageFontSecurityHeaders } from './security-headers';

const nextConfig: NextConfig = {
  // `cacheComponents` is deliberately absent. Next's Cache Components depend on
  // `setTimeout()` semantics workerd does not provide — Next itself warns
  // "cannot guarantee that Cache Components will run as expected due to the
  // current runtime's implementation of `setTimeout()`" — and every prerendered
  // and PPR route then hangs until the Workers runtime cancels the request
  // (500, "your Worker's code had hung"). Only Route Handlers survive it, which
  // is why `/health` kept working while `/` and `/rails-health` did not.
  // Nothing here uses `use cache`, `cacheLife` or `cacheTag`, so it bought
  // nothing. `pnpm run check:preview` catches a regression; see
  // docs/operations/connectivity-acceptance.md.
  experimental: {
    globalNotFound: true,
    authInterrupts: true,
  },
  typedRoutes: true,
  images: imageConfig as NextConfig['images'],
  headers: imageFontSecurityHeaders as NextConfig['headers'],
  allowedDevOrigins: ['localhost', '*.localhost', '172.18.0.2'],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  poweredByHeader: false,
};

export default nextConfig;
void initOpenNextCloudflareForDev();
