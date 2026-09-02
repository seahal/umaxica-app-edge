import { describe, expect, it, vi } from 'vitest';

import { onRequest } from '../src/middleware';

describe('request middleware', () => {
  it('rewrites the trailing-slash offline URL onto /offline', async () => {
    const rewritten = new Response('offline-doc', { status: 200 });
    const rewrite = vi.fn(() => rewritten);
    const next = vi.fn();

    const response = await onRequest(
      {
        url: new URL('https://example.test/offline/'),
        rewrite,
      } as never,
      next,
    );

    expect(rewrite).toHaveBeenCalledWith('/offline');
    expect(next).not.toHaveBeenCalled();
    expect(response).toBe(rewritten);
  });

  it('stamps security headers on every other response', async () => {
    const next = vi.fn(async () => new Response('ok', { status: 200 }));

    const response = await onRequest(
      {
        url: new URL('https://example.test/ja/'),
        rewrite: vi.fn(),
      } as never,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
  });
});
