import {
  createStartHandler,
  defaultRenderHandler,
  defineHandlerCallback,
} from '@tanstack/react-start/server';
import { createServerEntry } from '@tanstack/react-start/server-entry';

import { handleRequest } from './request-handler';

/*
 * This unit's request boundary, and the reason it is a custom server entry
 * rather than global request middleware.
 *
 * Two things have to happen around every response: the rate limiter must be able
 * to answer 429 without the router running at all, and the security headers must
 * reach every document the router produces — including the ones it produces for
 * a 404 or a thrown error, where a route-level hook does not run. A plain
 * `Request -> Response` wrapper does both with no framework machinery, and it
 * sidesteps the reported unreliability of `setResponseStatus` inside global
 * middleware. TanStack's own `createServerEntry` is the documented seat for it.
 *
 * This file is wiring only. The behaviour lives in `src/request-handler.ts`,
 * because `@tanstack/react-start/server-entry` resolves in the Worker build and
 * nowhere else — so a test can reach the boundary's logic but not this module.
 *
 * Static assets never reach here: Cloudflare matches them before the Worker
 * runs. That is why neither concern needs a path matcher.
 *
 * `defaultRenderHandler`, NOT `defaultStreamHandler`, and the choice is
 * load-bearing. Measured 2026-08-22 against the streaming default:
 *
 *   route component throws  ->  HTTP 200, no <title>, no <main>
 *   route loader throws     ->  HTTP 500, no <title>, no <main>
 *
 * because streaming flushes the shell before the failure is known, leaving the
 * error document to render on the client after hydration. The contract requires
 * a served 500 that already carries `HTTP 500` and a conforming `<title>`, so
 * this unit renders to a string first and responds once. Nothing here streams
 * anything worth keeping: the three HTML routes hold static copy and no route
 * has an async loader, so the only thing streaming bought was the defect above.
 *
 * `import.meta.env.PROD` is replaced with a literal at build time, so the
 * development branch of the CSP is eliminated from the deployed bundle rather
 * than shipped and skipped.
 */
const fetchHandler = createStartHandler(defineHandlerCallback((ctx) => defaultRenderHandler(ctx)));

export default createServerEntry({
  fetch: (request: Request) => handleRequest(request, fetchHandler, import.meta.env.PROD),
});
