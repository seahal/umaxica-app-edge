import { checkRateLimit } from './rate-limit';
import { withSecurityHeaders } from './security-headers';

/*
 * Everything this unit does around the router, in a function that takes its
 * collaborators as arguments.
 *
 * `src/server.ts` is the wiring that hands it TanStack's fetch handler; keeping
 * the behaviour here is what makes the request boundary testable without
 * resolving `@tanstack/react-start/server-entry`, which only the Worker build
 * can resolve.
 *
 * Order is the contract: the rate limiter answers before the router runs at all,
 * and the security headers are applied to whatever comes back — including the
 * documents the router produces for a 404 or a thrown error, where no
 * route-level hook runs.
 *
 * A 429 deliberately does NOT go through `withSecurityHeaders`. It is a complete,
 * self-contained document with its own `Cache-Control` and `Content-Type`, and
 * the contract `api/status-surfaces.hurl` and `test/rate-limit.test.ts` pin is
 * exactly those two headers.
 */
export async function handleRequest(
  request: Request,
  // Widened to what TanStack's handler actually is — it may answer synchronously
  // — rather than narrowed at the call site with an assertion.
  routerFetch: (request: Request) => Response | Promise<Response>,
  isProduction: boolean,
): Promise<Response> {
  const limited = await checkRateLimit(request);
  if (limited) return limited;

  return withSecurityHeaders(await routerFetch(request), isProduction);
}
