/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer';
import { createApexApp } from '../create-apex-app';
import { describe, expect, it, vi } from 'vite-plus/test';

const renderer = jsxRenderer(({ children }, c) => {
  const meta = c.get('meta') as { pageTitle?: string } | undefined;

  return (
    <html lang="en">
      <head>
        <title>{meta?.pageTitle ?? 'missing-meta'}</title>
      </head>
      <body>{children}</body>
    </html>
  );
});

function createPageApp(options?: {
  renderAboutContent?: (language: string | undefined) => unknown;
}) {
  return createApexApp({
    rootHandler: 'page',
    getRootMeta: () => ({ pageTitle: 'Root page' }),
    renderRootContent: (language) => `root:${language ?? 'missing-language'}`,
    getAboutMeta: () => ({ pageTitle: 'About page' }),
    renderAboutContent:
      options?.renderAboutContent ?? ((language) => `about:${language ?? 'missing-language'}`),
    renderer,
  });
}

describe('createApexApp', () => {
  it('renders page routes with metadata and security headers', async () => {
    const app = createPageApp();

    const response = await app.request('https://umaxica.app/about');
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('<title>About page</title>');
    expect(body).toContain('about:en');
    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('rejects cross-site form POST requests', async () => {
    const app = createPageApp();

    const response = await app.request('https://umaxica.app/about', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'sec-fetch-site': 'cross-site',
      },
      body: 'a=1',
    });

    expect(response.status).toBe(403);
  });

  it('returns 429 when the rate limiter blocks the request', async () => {
    const app = createPageApp();
    const rateLimiter = {
      limit: vi.fn().mockResolvedValue({ success: false }),
    };

    const response = await app.request(
      'https://umaxica.app/about',
      {
        headers: { 'cf-connecting-ip': '203.0.113.9' },
      },
      { RATE_LIMITER: rateLimiter } as never,
    );

    expect(response.status).toBe(429);
    expect(await response.text()).toBe('Too Many Requests');
    expect(rateLimiter.limit).toHaveBeenCalledWith({ key: '203.0.113.9' });
  });

  it('renders the health page from inlined logic', async () => {
    const app = createPageApp();

    const response = await app.request('https://umaxica.app/health', {}, {
      BRAND_NAME: 'TestBrand',
    } as never);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(body).toContain('TestBrand');
    expect(body).toContain('<strong>Status:</strong> OK');
  });

  it('returns a 404 fallback page without security headers', async () => {
    const app = createPageApp();
    const fetchAsset = vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      if (url.pathname === '/missing') {
        return new Response('missing asset', { status: 404 });
      }

      if (url.pathname === '/404.html') {
        return new Response('<html>custom not found</html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=UTF-8' },
        });
      }

      throw new Error(`Unexpected asset fetch: ${url.pathname}`);
    });

    const response = await app.request('https://umaxica.app/missing', {}, {
      ASSETS: { fetch: fetchAsset },
    } as never);

    expect(response.status).toBe(404);
    expect(await response.text()).toContain('custom not found');
    expect(response.headers.get('strict-transport-security')).toBeNull();
    expect(fetchAsset).toHaveBeenCalledTimes(2);
  });

  it('returns a 400 fallback page when rendering throws', async () => {
    const app = createPageApp({
      renderAboutContent: () => {
        throw new Error('boom');
      },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchAsset = vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      if (url.pathname === '/400.html') {
        return new Response('<html>custom bad request</html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=UTF-8' },
        });
      }

      throw new Error(`Unexpected asset fetch: ${url.pathname}`);
    });

    try {
      const response = await app.request('https://umaxica.app/about', {}, {
        ASSETS: { fetch: fetchAsset },
      } as never);

      expect(response.status).toBe(400);
      expect(await response.text()).toContain('custom bad request');
      expect(response.headers.get('strict-transport-security')).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Unhandled apex error', expect.any(Object));
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
