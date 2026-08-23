// First-touch rate limiting, previously `src/middleware.ts` and asserted by
// `test/middleware.test.ts`.
//
// The behaviour under test is unchanged: no binding is a pass-through, a refusal
// is the 429 document, and an allowance is a pass-through. What changed is where
// it lives — `src/server.ts` calls it directly, so there is no Next middleware
// signature to imitate and the function returns the 429 Response or `null`
// rather than a `NextResponse.next()`.

import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkRateLimit } from '../src/rate-limit';
import { env } from './__mocks__/cloudflare-workers';

function request(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/', { headers });
}

afterEach(() => {
  for (const key of Object.keys(env)) delete env[key];
});

describe('com/docs rate limiting', () => {
  it('passes the request through when no RATE_LIMITER binding is present', async () => {
    await expect(checkRateLimit(request())).resolves.toBeNull();
  });

  it('passes the request through when the rate limiter allows it', async () => {
    env['RATE_LIMITER'] = { limit: vi.fn().mockResolvedValue({ success: true }) };

    await expect(checkRateLimit(request())).resolves.toBeNull();
  });

  it('answers 429 with a no-store HTML document when the limiter refuses', async () => {
    env['RATE_LIMITER'] = { limit: vi.fn().mockResolvedValue({ success: false }) };

    const response = await checkRateLimit(request());

    expect(response?.status).toBe(429);
    expect(response?.headers.get('Cache-Control')).toBe('no-store');
    expect(response?.headers.get('Content-Type')).toBe('text/html; charset=UTF-8');
    await expect(response?.text()).resolves.toContain('HTTP 429');
  });

  it('keys the limiter on the Cloudflare client IP, and buckets the rest together', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    env['RATE_LIMITER'] = { limit };

    await checkRateLimit(request({ 'cf-connecting-ip': '203.0.113.9' }));
    await checkRateLimit(request());

    expect(limit).toHaveBeenNthCalledWith(1, { key: '203.0.113.9' });
    expect(limit).toHaveBeenNthCalledWith(2, { key: 'unknown' });
  });
});
