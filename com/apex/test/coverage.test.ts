import { describe, expect, it, vi } from 'vitest';
import app from '../src/index';

describe('com/src/index.tsx coverage', () => {
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
    await expect(res.text()).resolves.toContain('HTTP 500');

    isoSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
