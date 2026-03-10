import { describe, it, expect, vi } from 'vitest';
// @ts-ignore
import app from '../src/index';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const notFoundHtml = readFileSync(resolve(__dirname, '../public/404.html'), 'utf-8');
const badRequestHtml = readFileSync(resolve(__dirname, '../public/400.html'), 'utf-8');

describe('net/apex/src/index.tsx coverage', () => {
  it('returns custom 404 page in notFound', async () => {
    const res = await app.request('/nonexistent-404', {}, {});
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toBe(notFoundHtml);
  });

  it('handles health check error and hits onError catch block', async () => {
    const isoSpy = vi.spyOn(Date.prototype, 'toISOString').mockImplementation(() => {
      throw new Error('ISO String error');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await app.request('/health', {}, {});
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe(badRequestHtml);

    isoSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
