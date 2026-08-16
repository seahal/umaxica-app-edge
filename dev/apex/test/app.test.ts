import { afterEach, describe, expect, it, vi } from 'vitest';

import { app } from '../src/app';

/*
 * THE ONE EXCEPTION to this repository's three-layer test split.
 *
 * Everywhere else, an assertion on a response — status, headers, body — lives
 * in `<unit>/api/*.hurl` and runs against a real server, because `app.request()`
 * shares no code path with the deployed handler and cannot see a cookie jar, a
 * connection or a redirect. This unit has no such suite.
 *
 * The reason is `vercel dev`, which is the only server it has. Run it without a
 * linked project and it answers `No existing credentials found. Starting login
 * flow...` and waits on device authentication, so it never listens in CI or in
 * a clean checkout. (`playwright.config.ts` names the same command as its
 * `webServer`, which is why `test:e2e` has the same limitation here — that is
 * not new.)
 *
 * So these cases stay, knowingly weaker than their counterparts in the four
 * Cloudflare apexes. What would retire them is not a rewrite but a server: once
 * this unit can be served without interactive auth, `api/routes.hurl`,
 * `api/health.hurl` and `api/title-contract.hurl` should be ported from
 * `app/apex/api/` and the response assertions below deleted, leaving only the
 * cases where `app.request()` is the driver rather than the subject (the
 * `DEV_CORE_URL` env injection here, and the 500 document in
 * `title-contract.test.ts`).
 */

afterEach(() => vi.unstubAllEnvs());

describe('dev apex root dispatch', () => {
  it('redirects to the default dev core origin', async () => {
    const response = await app.request('/');
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://www.umaxica.dev/');
  });

  it('uses the configured dev core origin when present', async () => {
    vi.stubEnv('DEV_CORE_URL', 'https://preview.umaxica.dev/');
    const response = await app.request('/');
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://preview.umaxica.dev/');
  });
});

describe('dev apex public routes', () => {
  it.each(['/health', '/health.html'])(
    'renders the health status page at %s',
    async (path: string) => {
      const response = await app.request(path);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      await expect(response.text()).resolves.toMatch(/<h1[^>]*>status<\/h1>/u);
    },
  );

  it('returns machine-readable health with deployment identity', async () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'revision-id');
    const response = await app.request('/health.json');
    await expect(response.json()).resolves.toMatchObject({
      status: 'OK',
      service: 'dev',
      version: 'revision-id',
      edge: 'vercel',
    });
  });

  it('renders English about content by default', async () => {
    const response = await app.request('/about');
    const html = await response.text();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('About this site.');
    expect(html).toContain('<link rel="canonical" href="https://umaxica.dev/about">');
  });

  it.each([
    ['query parameter', 'https://umaxica.dev/about?lang=ja', {}],
    ['Accept-Language', 'https://umaxica.dev/about', { 'accept-language': 'ja-JP,en;q=0.8' }],
  ])(
    'renders Japanese about content from the %s',
    async (_source: string, url: string, headers: Record<string, string>) => {
      const response = await app.request(url, { headers });
      const html = await response.text();
      expect(html).toContain('<html lang="ja">');
      expect(html).toContain('このサイトについて');
    },
  );
});
