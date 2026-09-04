import { defineMiddleware } from 'astro:middleware';

import { checkRateLimit } from './lib/rate-limit';
import { withSecurityHeaders } from './lib/security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (path === '/offline/') {
    return context.rewrite('/offline');
  }

  /*
   * First touch for this unit (adr/010). Prerendered routes run this middleware
   * at BUILD time, where there is no limiter to call and no client to limit, so
   * they are skipped: `isPrerendered` is the only thing that distinguishes the
   * two, since the module is loaded by both the prerender build and the Worker.
   *
   * `./lib/env` reads `cloudflare:workers`, which the prerender build (running
   * under `prerenderEnvironment: 'node'`) cannot resolve. Importing it inside
   * this branch keeps it out of the prerender module graph entirely; the Worker
   * pays the dynamic import once, on the first on-demand request.
   */
  if (!context.isPrerendered && path !== '/api/v0/health.json') {
    const { getEdgeBindings } = await import('./lib/env');
    const limited = await checkRateLimit(context.request, getEdgeBindings().RATE_LIMITER);
    if (limited) {
      return withSecurityHeaders(limited, import.meta.env.PROD);
    }
  }

  const response = await next();
  const secured = withSecurityHeaders(response, import.meta.env.PROD);
  if (path === '/health' || path.startsWith('/health/')) {
    const headers = new Headers(secured.headers);
    headers.set('Cache-Control', 'no-store');
    headers.set('Content-Type', 'text/plain; charset=utf-8');
    return new Response(secured.body, {
      status: secured.status,
      statusText: secured.statusText,
      headers,
    });
  }
  if (path === '/api/v0/health.json') {
    const headers = new Headers(secured.headers);
    headers.set('Cache-Control', 'no-store');
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(secured.body, {
      status: secured.status,
      statusText: secured.statusText,
      headers,
    });
  }
  return secured;
});
