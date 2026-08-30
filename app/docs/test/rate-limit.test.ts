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

describe('app/docs rate limiting', () => {
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

  it('keys the limiter on the Cloudflare client IP', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    env['RATE_LIMITER'] = { limit };

    await checkRateLimit(request({ 'cf-connecting-ip': '203.0.113.9' }));

    expect(limit).toHaveBeenNthCalledWith(1, { key: '203.0.113.9' });
  });

  // A missing `CF-Connecting-IP` must not put every such request into one shared
  // bucket: that bucket is a bypass for the clients inside it and a denial of
  // service against each other, since any one of them can spend it for all.
  it('falls back to a per-path key, not one bucket shared by every caller', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    env['RATE_LIMITER'] = { limit };

    await checkRateLimit(request());

    expect(limit).toHaveBeenCalledWith({ key: 'no-ip:/' });
  });

  it('keeps two header-less requests to different paths in different buckets', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    env['RATE_LIMITER'] = { limit };

    await checkRateLimit(new Request('http://localhost/about'));
    await checkRateLimit(new Request('http://localhost/'));

    expect(limit).toHaveBeenNthCalledWith(1, { key: 'no-ip:/about' });
    expect(limit).toHaveBeenNthCalledWith(2, { key: 'no-ip:/' });
  });

  // An empty header value is as unattributable as an absent one.
  it('treats an empty cf-connecting-ip as absent', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    env['RATE_LIMITER'] = { limit };

    await checkRateLimit(request({ 'cf-connecting-ip': '' }));

    expect(limit).toHaveBeenCalledWith({ key: 'no-ip:/' });
  });

  // The 429 is a bare document on purpose: `src/request-handler.ts` is what puts
  // the security headers on it, in the same place it headers every other
  // response this unit answers.
  it('returns the 429 without security headers, leaving them to the request handler', async () => {
    env['RATE_LIMITER'] = { limit: vi.fn().mockResolvedValue({ success: false }) };

    const response = await checkRateLimit(request());

    expect(response?.headers.get('Content-Security-Policy')).toBeNull();
    expect(response?.headers.get('Content-Type')).toBe('text/html; charset=UTF-8');
  });
});
