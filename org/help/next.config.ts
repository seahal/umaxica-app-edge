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
  allowedDevOrigins: ['localhost', '*.localhost', 'help-jp.umaxica.org'],
};

export default nextConfig;
// `remoteBindings: false` is load-bearing, not a default being restated.
//
// `initOpenNextCloudflareForDev(options?: GetPlatformProxyOptions)` forwards its
// options straight to `getPlatformProxy()`, whose `remoteBindings` option
// defaults to **true** (wrangler 4.125.0). Its guard is only
// `shouldContextInitializationRun()` — the presence of `AsyncLocalStorage` — so
// despite the name it also runs during `next build`, not just `next dev`.
//
// A Workers VPC binding has no local simulation, so with the default wrangler
// must open a remote proxy session for it. This Worker declares `vpc_services`
// at the top level (production) and in `env.development`, so every build tried
// to reach Cloudflare. Locally that merely succeeded slowly against a logged-in
// session; in CI it failed outright:
//
//   Failed to start the remote proxy session. ... it's necessary to set a
//   CLOUDFLARE_API_TOKEN environment variable for wrangler to work
//
// Node dev does not need the binding either: it reaches Rails directly over the
// private Podman network, gated on EDGE_LOCAL_NODE_RUNTIME +
// EDGE_LOCAL_RAILS_ENABLED (`src/lib/rails-client.ts`). Only the workerd preview
// (`--env development`) uses the remote binding.
void initOpenNextCloudflareForDev({ remoteBindings: false });
