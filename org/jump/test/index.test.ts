import { describe, expect, it } from 'vite-plus/test';
import app from '../src/index.tsx';

describe('app/jump', () => {
  it('returns OK on root', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('OK');
  });
});
