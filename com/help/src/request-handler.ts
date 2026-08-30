import { checkRateLimit } from './rate-limit';
import { withSecurityHeaders } from './security-headers';
import { createNonce, runWithNonce } from './security-nonce';
import './security-nonce-als';

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
 * The 429 goes through `withSecurityHeaders` too, and that is a reversal of the
 * previous rule. It used to be exempted for being "a complete, self-contained
 * document with its own `Cache-Control` and `Content-Type`" — but those are
 * caching headers, not security ones, and the exemption left the single easiest
 * response for an attacker to elicit as the one HTML document on this origin
 * served with no CSP, no `X-Frame-Options` and no `nosniff`. It keeps the two
 * headers it always set; it now also carries the policy every other document
 * here carries.
 *
 * The nonce is minted once per request and used twice: `runWithNonce` publishes
 * it to `getRouter()` so TanStack stamps it on the inline hydration script, and
 * `withSecurityHeaders` names the same value in `script-src`. Two mints would
 * emit a policy that does not authorise the script the document actually
 * carries. Development mints nothing — see `security-nonce.ts` for why a nonce
 * there would block Vite's own bootstrap — and the 429 needs none, because it
 * carries no script.
 */
export async function handleRequest(
  request: Request,
  // Widened to what TanStack's handler actually is — it may answer synchronously
  // — rather than narrowed at the call site with an assertion.
  routerFetch: (request: Request) => Response | Promise<Response>,
  isProduction: boolean,
): Promise<Response> {
  const limited = await checkRateLimit(request);
  if (limited) return withSecurityHeaders(limited, isProduction);

  const nonce = isProduction ? createNonce() : undefined;
  const response = await runWithNonce(nonce, () => routerFetch(request));

  return withSecurityHeaders(response, isProduction, nonce);
}
