import { blockedCoreResponse, classifyCorePath, dispatchToRails } from './lib/core-dispatch';
import { sanitizeHealthRequest } from './lib/health-request';
import nextWorker from './lib/next-handler';

/**
 * First code the Workers runtime invokes for every request to
 * `jp.umaxica.app` — before any Next.js/OpenNext code runs. See
 * `adr/007-shared-fqdn-core-dispatch.md`.
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
 */
export default {
  fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    const pathname = new URL(request.url).pathname;
    const ownership = classifyCorePath(pathname);

    if (ownership === 'blocked') {
      return blockedCoreResponse();
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
