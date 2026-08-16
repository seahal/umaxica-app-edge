import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { GET as health } from '../src/app/health/route';
import manifest from '../src/app/manifest';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';

const host = 'info-jp.umaxica.com';
const unitRoot = resolve(import.meta.dirname, '..');

describe('standard metadata', () => {
  it('keeps robots and sitemap on the canonical host', () => {
    expect(robots()).toMatchObject({
      rules: { userAgent: '*', allow: '/' },
      sitemap: `https://${host}/sitemap.xml`,
    });
    expect(sitemap()).toEqual([expect.objectContaining({ url: `https://${host}/` })]);
  });

  it('publishes the minimal manifest and lightweight health response', async () => {
    expect(manifest()).toMatchObject({
      start_url: '/',
      display: 'standalone',
      icons: [expect.objectContaining({ src: '/favicon.ico' })],
    });
    // `/health` itself — shape, both status halves and the absence of any Rails
    // detail — is covered by `test/health-route.test.ts`, which is byte-identical
    // across all fifteen frames. Here it is only asserted that the route exists
    // and is the JSON, no-store surface this frame's metadata promises.
    const response = await health();
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('contains the required browser assets', () => {
    expect(statSync(resolve(unitRoot, 'src/app/favicon.ico')).size).toBeGreaterThan(0);
    const worker = readFileSync(resolve(unitRoot, 'public/service-worker.js'), 'utf8');
    expect(worker).toContain("event.request.mode !== 'navigate'");
    expect(worker).toContain('fetch(event.request).catch');
    expect(worker).toContain('cache.add(OFFLINE_URL)');
  });
});
