import { afterEach, describe, expect, it, vi } from 'vitest';

import { handleRequest } from '../src/request-handler';
import { resetEnv, setEnv } from './__mocks__/cloudflare-workers';

/*
 * The request boundary: what happens around the router on every request.
 *
 * `src/server.ts` is the wiring that supplies TanStack's fetch handler, and it
 * cannot be imported here — `@tanstack/react-start/server-entry` resolves only in
 * the Worker build. So the handler is passed in, which is also what makes the
 * ordering assertions below possible at all.
 */
afterEach(resetEnv);

const ok = () => Promise.resolve(new Response('<html></html>', { status: 200 }));

describe('request handler', () => {
  it('adds the security headers to whatever the router returns', async () => {
    const response = await handleRequest(new Request('http://localhost/'), ok, true);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });

  it('adds them to a 404 the router produced, where no route hook runs', async () => {
    const notFound = () => Promise.resolve(new Response('<html></html>', { status: 404 }));

    const response = await handleRequest(new Request('http://localhost/nope'), notFound, true);

    expect(response.status).toBe(404);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('uses the production policy when told to, and the looser one when not', async () => {
    const production = await handleRequest(new Request('http://localhost/'), ok, true);
    const development = await handleRequest(new Request('http://localhost/'), ok, false);

    expect(production.headers.get('Content-Security-Policy')).not.toContain("'unsafe-eval'");
    expect(development.headers.get('Content-Security-Policy')).toContain("'unsafe-eval'");
  });

  it('answers 429 without running the router at all', async () => {
    setEnv({ RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) } });
    const router = vi.fn(ok);

    const response = await handleRequest(new Request('http://localhost/'), router, true);

    expect(response.status).toBe(429);
    expect(router).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=UTF-8');
  });

  /*
   * The 429 goes through the security-header wrapper, and this reverses an
   * earlier rule that exempted it for being "self-contained".
   *
   * `Cache-Control` and `Content-Type` are caching headers, not security ones.
   * Exempting the 429 left the single easiest response for an attacker to elicit
   * as the one HTML document on this origin served with no CSP, no
   * `X-Frame-Options` and no `nosniff` — a framable page, on demand.
   */
  it('hardens the 429 too, which is the easiest document to elicit on this origin', async () => {
    setEnv({ RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) } });

    const response = await handleRequest(new Request('http://localhost/'), vi.fn(ok), true);

    expect(response.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  });

  /*
   * One mint per request, read twice: the policy must authorise the script the
   * document actually carries. A second `createNonce()` call for the header
   * would emit a policy that blocks the very script TanStack just stamped.
   */
  it('names one nonce in the policy per production request, and a fresh one each time', async () => {
    const first = await handleRequest(new Request('http://localhost/'), ok, true);
    const second = await handleRequest(new Request('http://localhost/'), ok, true);

    const nonceOf = (response: Response) =>
      /'nonce-([^']+)'/u.exec(response.headers.get('Content-Security-Policy') ?? '')?.[1];

    expect(nonceOf(first)).toBeDefined();
    expect(nonceOf(second)).toBeDefined();
    expect(nonceOf(first)).not.toBe(nonceOf(second));
  });

  // Development mints none: naming a nonce makes a browser ignore
  // 'unsafe-inline', which is what Vite's own injected scripts rely on.
  it('mints no nonce in development, where Vite injects scripts it cannot stamp', async () => {
    const response = await handleRequest(new Request('http://localhost/'), ok, false);

    expect(response.headers.get('Content-Security-Policy')).not.toContain('nonce-');
    expect(response.headers.get('Content-Security-Policy')).toContain("'unsafe-inline'");
  });

  it('runs the router when the limiter allows the request', async () => {
    setEnv({ RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } });
    const router = vi.fn(ok);

    const response = await handleRequest(new Request('http://localhost/'), router, true);

    expect(router).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
  });
});
