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
    // A complete, self-contained document: it carries its own two headers and
    // deliberately does not go through the security-header wrapper.
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=UTF-8');
  });

  it('runs the router when the limiter allows the request', async () => {
    setEnv({ RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } });
    const router = vi.fn(ok);

    const response = await handleRequest(new Request('http://localhost/'), router, true);

    expect(router).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
  });
});
