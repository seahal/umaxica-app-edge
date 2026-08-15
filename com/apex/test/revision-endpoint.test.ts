import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('revision endpoint', () => {
  it('returns Cloudflare version metadata without caching', async () => {
    const response = await app.request(
      '/revision',
      {},
      {
        CF_VERSION_METADATA: {
          id: 'version-id',
          tag: 'git-sha',
          timestamp: '2026-08-11T00:00:00.000Z',
        },
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      id: 'version-id',
      tag: 'git-sha',
      timestamp: '2026-08-11T00:00:00.000Z',
    });
  });
});
