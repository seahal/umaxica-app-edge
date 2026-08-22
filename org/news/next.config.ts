import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';

import { imageConfig } from './image-config';
import { imageFontSecurityHeaders } from './security-headers';

const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
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
  images: imageConfig,
  headers: imageFontSecurityHeaders,
  // Reached through the Rails-shared Cloudflare Tunnel under this frame's own
  // hostname, so that hostname has to be listed here. Next blocks cross-origin
  // requests to `/_next/*` and `/__nextjs*` by default: the initial HTML and
  // same-origin asset GETs still pass, but the HMR WebSocket sends an `Origin`
  // and gets a 403 without this. See
  // docs/operations/cloudflare-tunnel-development.md.
  allowedDevOrigins: ['localhost', '*.localhost', 'news-jp.umaxica.org'],
};

export default nextConfig;
void initOpenNextCloudflareForDev();
