/**
 * Shared-FQDN Core dispatch for `jp.umaxica.com`.
 *
 * This is the browser-facing counterpart to `rails-client.ts` /
 * `rails-health.ts`, which stay untouched server-to-server health-check
 * clients (see `adr/007-shared-fqdn-core-dispatch.md`). This module is
 * deliberately separate: it forwards the browser's own `Cookie`/CSRF/auth
 * headers to Rails verbatim, which is the opposite of what
 * `rails-client.ts`'s header strip does and must keep doing for its own
 * caller.
 *
 * Consumed only by `src/worker.ts`, which is the first code the Workers
 * runtime invokes for every request — before any Next.js/OpenNext code runs.
 */

/**
 * The public, browser-facing hostname for this app's Core frame. Used as the
 * literal origin of the outbound Rails request — not just a header value.
 *
 * Per the Cloudflare Workers VPC binding docs (`fetch()` on a VPC-bound
 * `Fetcher`): "The host provided in fetch() does not control routing. It
 * only populates the Host header and, when using https, the SNI value" —
 * routing is entirely determined by the binding's `service_id`
 * (`UMAXICA_APPS_EDGE_CF_WORKERS_VPC`, see `wrangler.jsonc`). So building the
 * request against this public origin costs nothing on routing correctness,
 * and satisfies Rails' Host Authorization, which expects a public host.
 *
 * `Host` is deliberately NOT set by mutating a `Headers` object: `host` is a
 * forbidden header name under the Fetch standard and silently fails to set
 * on a `Request` (confirmed against Fetch spec / runtime `Headers`
 * behavior). Driving it through the request URL itself is the only reliable
 * way to control it, in both a Workers runtime and this file's own tests.
 */
const PUBLIC_CORE_HOST = 'jp.umaxica.com';
const PUBLIC_CORE_ORIGIN = `https://${PUBLIC_CORE_HOST}`;

export type PathOwnership = 'rails' | 'blocked' | 'next';

// Prefix match unless noted otherwise. Source: the initial audit table in
// the mission brief, reconciled against nothing else — this repository
// cannot read Rails' `config/routes/core.rb`. Treat this table as the
// current best knowledge, not a guarantee it matches Rails today.
const RAILS_OWNED_PREFIXES = ['/api/v0/', '/web/v0/', '/edge/v0/', '/oidc/'];

// Exact match only.
const RAILS_OWNED_EXACT = new Set([
  '/sign/out',
  '/sign/out/complete',
  '/.well-known/jwks.json',
  '/csp-violation-report',
]);

// Blocked at the edge: reachable by neither Rails nor Next.js. Deliberately
// scoped to `/health/*` (a further path segment under `/health`), NOT the
// exact `/health` path — that exact path is Next.js's own existing Route
// Handler (`src/app/health/route.ts`), used today by ops tooling, and
// nothing in this repo suggests Rails owns that exact path. See
// `adr/007-shared-fqdn-core-dispatch.md` for the reasoning.
const BLOCKED_PREFIX = '/health/';

function matchesPrefix(pathname: string, prefix: string): boolean {
  const withoutTrailingSlash = prefix.slice(0, -1);
  return pathname === withoutTrailingSlash || pathname.startsWith(prefix);
}

export function classifyCorePath(pathname: string): PathOwnership {
  if (pathname.startsWith(BLOCKED_PREFIX)) {
    return 'blocked';
  }
  if (RAILS_OWNED_EXACT.has(pathname)) {
    return 'rails';
  }
  if (RAILS_OWNED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return 'rails';
  }
  return 'next';
}

export function blockedCoreResponse(): Response {
  return new Response(null, {
    status: 404,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function railsNotConfiguredResponse(): Response {
  // Fail closed, visibly — same principle as `getRailsClient()` returning
  // `null`. Never falls through to Next.js, never silently succeeds against
  // a dev resource in production.
  return new Response('Rails transport not configured', {
    status: 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

/**
 * Builds the outbound Rails request for a browser-facing, Rails-owned path.
 *
 * Preserves method, path, query, body (streamed, not buffered), and every
 * header the browser sent — Cookie, Origin, Referer, CSRF headers,
 * content-type, accept, user-agent, conditional/cache headers — verbatim.
 *
 * `Host` is the PUBLIC Core hostname — not a VPC routing label, and not
 * `X-Forwarded-Host` (deliberately absent). The VPC binding's `fetch()`
 * routes entirely by `service_id`, so building the request against the
 * public origin does not affect routing, and satisfies Rails' Host
 * Authorization expectation of a public host.
 */
function buildRailsRequest(request: Request, incomingUrl: URL): Request {
  const target = new URL(incomingUrl.pathname + incomingUrl.search, PUBLIC_CORE_ORIGIN);
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) {
    if (name === 'forwarded' || name === 'x-real-ip' || name.startsWith('x-forwarded-')) {
      headers.delete(name);
    }
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD' && request.body !== null;

  return new Request(target, {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual',
    ...(hasBody ? ({ duplex: 'half' } as { duplex: 'half' }) : {}),
  });
}

/**
 * Dispatches a Rails-owned browser request over the Workers VPC binding.
 * Never calls into Next.js/OpenNext. Returns Rails' response unchanged
 * (status, `Location`, `Set-Cookie`, body, content-type, cache headers).
 */
export async function dispatchToRails(
  request: Request,
  env: Pick<CloudflareEnv, 'UMAXICA_APPS_EDGE_CF_WORKERS_VPC'>,
): Promise<Response> {
  const binding = env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC;
  if (!binding) {
    return railsNotConfiguredResponse();
  }

  const incomingUrl = new URL(request.url);
  const railsRequest = buildRailsRequest(request, incomingUrl);
  return binding.fetch(railsRequest);
}
