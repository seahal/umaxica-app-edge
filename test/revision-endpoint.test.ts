import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import appApex from '../app/apex/src/index';
import comApex from '../com/apex/src/index';
import netApex from '../net/apex/src/index';
import orgApex from '../org/apex/src/index';
import { GET as getNextRevision } from '../app/docs/src/app/revision/route';

const apexApps = [
  ['app/apex', appApex],
  ['com/apex', comApex],
  ['net/apex', netApex],
  ['org/apex', orgApex],
] as const;

const nextApps = [
  'app/core',
  'app/docs',
  'app/help',
  'app/info',
  'app/news',
  'com/core',
  'com/docs',
  'com/help',
  'com/info',
  'com/news',
  'org/core',
  'org/docs',
  'org/help',
  'org/info',
  'org/news',
] as const;

describe.each(apexApps)('%s revision endpoint', (_workspace, app) => {
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

describe('Next.js revision endpoint', () => {
  it('returns a stable local fallback with no caching', async () => {
    const response = getNextRevision();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ id: null, tag: null, timestamp: null });
  });

  it.each(nextApps)('%s defines the route', (workspace) => {
    expect(statSync(resolve(workspace, 'src/app/revision/route.ts')).size).toBeGreaterThan(0);
  });
});
