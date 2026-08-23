/*
 * Defense-in-depth headers for every response this Worker produces.
 *
 * They are applied at this unit's request boundary, which sees every response
 * the application produces and nothing else — Cloudflare
 * matches static assets BEFORE the Worker runs, so files under `public/` never
 * reach this code and take their headers from `public/_headers` instead. That
 * split is the same one the apex Workers already live with.
 *
 * `vite dev` is the only server that needs a looser `script-src`. The dev
 * bundle and React's development build both call eval(), so a dev server
 * answering with the production policy fails before the page hydrates. React
 * never calls eval() in production mode, so the loosening is keyed to the build
 * mode and confined to `script-src`: `vite build`, every preview and every
 * deployment keep the policy below unchanged.
 * `test/content-security-policy.test.ts` asserts both sides of that branch — the
 * Hurl suite runs against `vite dev` and can only ever observe the development
 * half.
 */
function contentSecurityPolicy(isProduction: boolean): string {
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function securityHeaders(isProduction: boolean): Record<string, string> {
  return {
    'Content-Security-Policy': contentSecurityPolicy(isProduction),
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

/**
 * Applied to a response that already exists, rather than merged into a headers
 * object at construction: the router owns the body and the status, and this has
 * to reach the documents it produces for a 404 or a thrown error too.
 *
 * `set`, not `append`: a route that has already chosen one of these values is
 * not permitted to widen the policy.
 */
export function withSecurityHeaders(response: Response, isProduction: boolean): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders(isProduction))) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
