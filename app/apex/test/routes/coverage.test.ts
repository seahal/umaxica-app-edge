import { describe, expect, it, vi } from 'vitest';
import app from '../../src/index';

describe('app/src/index.tsx coverage', () => {
  it('returns 404 text for unknown routes', async () => {
    const res = await app.request('/nonexistent-404', {}, {});

    expect(res.status).toBe(404);
    await expect(res.text()).resolves.toContain('HTTP 404');
  });

  it('handles health check error and hits onError catch block', async () => {
    const isoSpy = vi.spyOn(Date.prototype, 'toISOString').mockImplementation(() => {
      throw new Error('ISO String error');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await app.request('/health', {}, {});

    expect(res.status).toBe(500);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    await expect(res.text()).resolves.toContain('HTTP 500');
    expect(consoleSpy).toHaveBeenCalledWith('Unhandled apex error', {
      error: 'Error',
      method: 'GET',
      path: '/health',
    });

    isoSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('adds security headers to CSRF rejections', async () => {
    const res = await app.request('/about', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'sec-fetch-site': 'cross-site',
      },
      body: 'a=1',
    });

    expect(res.status).toBe(403);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('adds security headers to rate-limit rejections', async () => {
    const limit = vi.fn().mockResolvedValue({ success: false });
    const res = await app.request('/about', {}, { RATE_LIMITER: { limit } });

    expect(res.status).toBe(429);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
  });
});
