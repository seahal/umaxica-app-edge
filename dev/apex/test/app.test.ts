import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';

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
  it.each(['/health', '/health.html'])('renders the health status page at %s', async (path) => {
    const response = await app.request(path);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(response.text()).resolves.toMatch(/<h1[^>]*>status<\/h1>/);
  });

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
  ])('renders Japanese about content from the %s', async (_source, url, headers) => {
    const response = await app.request(url, { headers });
    const html = await response.text();
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('このサイトについて');
  });
});
