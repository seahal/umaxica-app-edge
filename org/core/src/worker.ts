import { blockedCoreResponse, classifyCorePath, dispatchToRails } from './lib/core-dispatch';
import { sanitizeHealthRequest } from './lib/health-request';
import nextWorker from './lib/next-handler';
import { checkRateLimit } from './lib/rate-limit';

/**
 * First code the Workers runtime invokes for every request to this frame's Core
 * hostname — before any Next.js/OpenNext code runs. The hostname itself is
 * `PUBLIC_CORE_HOST` in `./lib/core-dispatch`, which is the one line that
 * differs between the three brands; this file is byte-identical across all
 * three, so it names no brand. See `adr/007-shared-fqdn-core-dispatch.md`.
 *
 * - Rails-owned paths never reach `nextWorker.fetch`: dispatched directly to
 *   Rails over the Workers VPC binding, with the browser's Cookie/CSRF/auth
 *   headers preserved verbatim.
 * - Blocked paths never reach Rails or Next.js.
 * - Everything else (the default) is Next-owned: the inbound `Cookie` header
 *   is stripped before `nextWorker.fetch` is ever called, and any outbound
 *   `Set-Cookie` is stripped from the response before it reaches the
 *   browser — Next.js/OpenNext code never observes a `Cookie` it was sent,
 *   and never gets to set one the browser will keep.
 *
 * Rate limiting happens here, once, for both branches. It used to be two call
 * sites: this file for Rails-owned requests and `src/middleware.ts` for
 * everything else, both against the same Cloudflare `RATE_LIMITER` binding. One
 * request was never charged twice — the Rails branch returns before Next.js is
 * invoked — but it meant a Next-owned request had to boot the OpenNext
 * middleware runtime to answer a question this function could answer first. The
 * middleware is gone; see `adr/010-first-touch-rate-limiting.md`.
 */

/**
 * Paths the rate limiter does not see, carried over verbatim from the matcher
 * the deleted middleware declared (`/((?!_next/static|_next/image|favicon.ico).*)`).
 *
 * Static assets are normally served from the `ASSETS` binding without invoking
 * this Worker at all, so this mostly matters for `/_next/image`, which is a real
 * Worker route: a page with many images would otherwise spend its whole budget
 * on its own thumbnails.
 */
function isRateLimitExempt(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico'
  );
}

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    const pathname = new URL(request.url).pathname;
    const ownership = classifyCorePath(pathname);

    // Cheapest first: a blocked path costs nothing and is not worth a limiter
    // call, since it reaches no application code either way.
    if (ownership === 'blocked') {
      return blockedCoreResponse();
    }

    if (!isRateLimitExempt(pathname)) {
      const rateLimitedResponse = await checkRateLimit(request, env.RATE_LIMITER);
      if (rateLimitedResponse) return rateLimitedResponse;
    }

    if (ownership === 'rails') {
      return dispatchToRails(request, env);
    }

    const sanitizedRequest = pathname === '/health' ? sanitizeHealthRequest(request) : request;
    const strippedHeaders = new Headers(sanitizedRequest.headers);
    strippedHeaders.delete('cookie');
    const nextRequest = new Request(sanitizedRequest, { headers: strippedHeaders });

    return (async () => {
      const response = await nextWorker.fetch(nextRequest, env, ctx);
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete('set-cookie');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    })();
  },
};
