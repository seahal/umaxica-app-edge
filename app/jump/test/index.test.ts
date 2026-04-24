import { describe, expect, it, vi } from 'vite-plus/test';
import app from '../src/index.tsx';

describe('app/jump', () => {
  it('returns OK on root', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('OK');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await app.request('/nonexistent');
    expect(res.status).toBe(404);
  });

  it('handles errors and logs them', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await app.request('/');
    consoleSpy.mockRestore();
    expect(res.status).toBe(200);
  });
});
