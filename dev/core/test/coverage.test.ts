import { describe, it, expect, vi } from 'vitest';
// @ts-ignore
import { badRequestHtml, notFoundHtml } from '../src/error-pages';
import app from '../src/index';

describe('net/apex/src/index.tsx coverage', () => {
  it('returns custom 404 page in notFound', async () => {
    const res = await app.request('/nonexistent-404', {}, {});
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text.trimEnd()).toBe(notFoundHtml.trimEnd());
  });

  it('handles health check error and hits onError catch block', async () => {
    const isoSpy = vi.spyOn(Date.prototype, 'toISOString').mockImplementation(() => {
      throw new Error('ISO String error');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await app.request('/health', {}, {});
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text.trimEnd()).toBe(badRequestHtml.trimEnd());

    isoSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
