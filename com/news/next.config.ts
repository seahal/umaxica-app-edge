import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
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
  images: imageConfig as NextConfig['images'],
  headers: imageFontSecurityHeaders as NextConfig['headers'],
  // Reached through the Rails-shared Cloudflare Tunnel under this frame's own
  // hostname, so that hostname has to be listed here. Next blocks cross-origin
  // requests to `/_next/*` and `/__nextjs*` by default: the initial HTML and
  // same-origin asset GETs still pass, but the HMR WebSocket sends an `Origin`
  // and gets a 403 without this. See
  // docs/operations/cloudflare-tunnel-development.md.
  allowedDevOrigins: ['localhost', '*.localhost', 'news-jp.umaxica.com'],
};

export default nextConfig;
// `remoteBindings: false` is load-bearing, not a default being restated.
//
// `initOpenNextCloudflareForDev(options?: GetPlatformProxyOptions)` forwards
// straight to `getPlatformProxy()`, whose `remoteBindings` option defaults to
// **true** (wrangler 4.120.1, `GetPlatformProxyOptions.remoteBindings`). The
// container exports `CLOUDFLARE_ENV=development` (compose.yaml), and
// `env.development` now carries a `remote: true` VPC Service binding — so with
// the default, plain `next dev` would try to open a remote-binding session
// against Cloudflare. That session cannot be opened with an API token at all
// (`edge-preview` rejects the scheme), so it would demand an interactive
// `wrangler login` before the Node dev server would start.
//
// Node dev does not need the binding: it reaches Rails directly over the
// private Podman network, gated on EDGE_LOCAL_NODE_RUNTIME +
// EDGE_LOCAL_RAILS_ENABLED (`src/lib/rails-client.ts`). Only the workerd
// preview (`pnpm preview`, `--env development`) uses the remote binding.
//
// This is the lifecycle/runtime split made concrete: one lifecycle environment
// (development), two runtimes, two transports. See adr/009.
void initOpenNextCloudflareForDev({ remoteBindings: false });
