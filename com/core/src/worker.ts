import appHandler from './lib/app-handler';
import { blockedCoreResponse, classifyCorePath, dispatchToRails } from './lib/core-dispatch';
import { sanitizeHealthRequest } from './lib/health-request';
import { checkRateLimit } from './lib/rate-limit';

/**
 * First code the Workers runtime invokes for every request to this frame's Core
 * hostname — before any application code runs. The hostname itself is
 * `PUBLIC_CORE_HOST` in `./lib/core-dispatch`, which is the one line that
 * differs between the three brands; this file is byte-identical across all
 * three, so it names no brand. See `adr/007-shared-fqdn-core-dispatch.md`.
 *
 * - Rails-owned paths never reach `appHandler.fetch`: dispatched directly to
 *   Rails over the Workers VPC binding, with the browser's Cookie/CSRF/auth
 *   headers preserved verbatim.
 * - Blocked paths never reach Rails or the application.
 * - Everything else (the default) is application-owned: the inbound `Cookie`
 *   header is stripped before `appHandler.fetch` is ever called, and any
 *   outbound `Set-Cookie` is stripped from the response before it reaches the
 *   browser — application code never observes a `Cookie` it was sent, and never
 *   gets to set one the browser will keep.
 *
 *   This file names `./lib/app-handler` rather than a framework, so which
 *   framework renders the application half stays behind that one-function seam.
 *
 * Rate limiting happens here, once, for both branches — the first-touch position
 * `adr/010-first-touch-rate-limiting.md` requires. Answering it here rather than
 * inside the application half is what keeps a rejected request from booting the
 * application at all.
 */

/**
 * Paths the rate limiter does not see.
 *
 * Cloudflare matches static assets BEFORE this Worker runs, so in production
 * none of these reach this function at all — the exemption is what keeps that
 * true in the places where they do, and it costs one string comparison.
 *
 * `/assets/` is where Vite writes this frame's hashed output, and the favicon is
 * the one unhashed file a document references. There is no image-optimisation
 * route: if one is ever added it is a real Worker route, so a page with many
 * images could spend its whole budget on its own thumbnails — exempt it here at
 * the same time.
 */
function isRateLimitExempt(pathname: string): boolean {
  return pathname.startsWith('/assets/') || pathname === '/favicon.ico';
}

export default {
  // `_ctx` is unused: the application half is a plain `Request -> Response`
  // function. The parameter stays in the signature because the runtime supplies
  // it and a future `waitUntil` would want it.
  async fetch(request: Request, env: CloudflareEnv, _ctx: ExecutionContext) {
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
    const strippedRequest = new Request(sanitizedRequest, { headers: strippedHeaders });

    return (async () => {
      const response = await appHandler.fetch(strippedRequest);
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
