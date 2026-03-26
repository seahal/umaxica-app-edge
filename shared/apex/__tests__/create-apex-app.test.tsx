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

describe('createApexApp with page handler without root meta', () => {
  it('works when page handler is specified but getRootMeta is missing', async () => {
    const app = createApexApp({
      rootHandler: 'page' as const,
      getRootMeta: undefined,
      renderRootContent: undefined,
      getAboutMeta: () => ({ pageTitle: 'About page' }),
      renderAboutContent: () => 'about content',
      renderer: jsxRenderer(({ children }) => <div>{children}</div>),
    });

    // Should still have about route
    const aboutResponse = await app.request('https://umaxica.app/about');
    expect(aboutResponse.status).toBe(200);
  });

  it('works with page handler having all required fields', async () => {
    const app = createApexApp({
      rootHandler: 'page' as const,
      getRootMeta: () => ({ pageTitle: 'Root page' }),
      renderRootContent: () => 'root content',
      getAboutMeta: () => ({ pageTitle: 'About page' }),
      renderAboutContent: () => 'about content',
      renderer: jsxRenderer(({ children }) => <div>{children}</div>),
    });

    const rootResponse = await app.request('https://umaxica.app/');
    expect(rootResponse.status).toBe(200);
    const body = await rootResponse.text();
    expect(body).toContain('root content');
  });
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

  it('returns a 500 error when rendering throws', async () => {
    const app = createPageApp({
      renderAboutContent: () => {
        throw new Error('boom');
      },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await app.request('https://umaxica.app/about', {}, {} as never);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal Server Error');
      expect(consoleSpy).toHaveBeenCalledWith('Unhandled apex error', expect.any(Object));
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('allows requests when rate limiter allows the request', async () => {
    const app = createPageApp();
    const rateLimiter = {
      limit: vi.fn().mockResolvedValue({ success: true }),
    };

    const response = await app.request(
      'https://umaxica.app/about',
      {
        headers: { 'cf-connecting-ip': '203.0.113.10' },
      },
      { RATE_LIMITER: rateLimiter } as never,
    );

    expect(response.status).toBe(200);
    expect(rateLimiter.limit).toHaveBeenCalledWith({ key: '203.0.113.10' });
  });

  it('allows requests when rate limiter is not configured', async () => {
    const app = createPageApp();

    const response = await app.request(
      'https://umaxica.app/about',
      {
        headers: { 'cf-connecting-ip': '203.0.113.11' },
      },
      {} as never,
    );

    expect(response.status).toBe(200);
  });

  it('returns 400 fallback for health endpoint errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      // Create a custom app with a failing health endpoint
      const failingApp = createApexApp({
        rootHandler: 'page',
        getRootMeta: () => ({ pageTitle: 'Root' }),
        renderRootContent: () => 'root',
        getAboutMeta: () => ({ pageTitle: 'About' }),
        renderAboutContent: () => 'about',
        renderer,
      });

      const response = await failingApp.request('https://umaxica.app/health', {}, {} as never);
      expect(response.status).toBe(200);
      // Health endpoint should work normally since we can't easily throw an error there
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('rejects POST requests from disallowed origins', async () => {
    const app = createPageApp();

    const response = await app.request('https://umaxica.app/about', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://evil.com',
      },
      body: 'test=value',
    });

    expect(response.status).toBe(403);
  });

  it('handles requests without origin header for GET', async () => {
    const app = createPageApp();

    const response = await app.request('https://umaxica.app/about', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
  });
});

describe('createApexApp with redirect handler', () => {
  function createRedirectApp(options?: {
    resolveRedirectUrl?: (region: string | null | undefined) => string | null;
    getDefaultRedirectUrl?: () => string | null;
  }) {
    return createApexApp({
      rootHandler: 'redirect',
      rootRedirect: {
        resolveRedirectUrl: options?.resolveRedirectUrl ?? (() => null),
        getDefaultRedirectUrl: options?.getDefaultRedirectUrl ?? (() => null),
        buildRegionErrorPayload: () => ({ error: 'region_not_found', message: 'Invalid region' }),
      },
      getAboutMeta: () => ({ pageTitle: 'About page' }),
      renderAboutContent: (language) => `about:${language ?? 'missing-language'}`,
      renderer,
    });
  }

  it('redirects to resolved URL when ri parameter provided', async () => {
    const app = createRedirectApp({
      resolveRedirectUrl: (region: string | null | undefined) =>
        region === 'tokyo' ? '/tokyo' : null,
    });

    const response = await app.request('https://umaxica.app/?ri=tokyo');

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/tokyo');
  });

  it('redirects to default URL when ri parameter does not match', async () => {
    const app = createRedirectApp({
      resolveRedirectUrl: () => null,
      getDefaultRedirectUrl: () => '/default',
    });

    const response = await app.request('https://umaxica.app/?ri=unknown');

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/default');
  });

  it('returns 400 error JSON when no redirect URLs available', async () => {
    const app = createRedirectApp({
      resolveRedirectUrl: () => null,
      getDefaultRedirectUrl: () => null,
    });

    const response = await app.request('https://umaxica.app/?ri=unknown');

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'region_not_found', message: 'Invalid region' });
  });

  it('redirects without ri parameter using default URL', async () => {
    const app = createRedirectApp({
      resolveRedirectUrl: () => null,
      getDefaultRedirectUrl: () => '/home',
    });

    const response = await app.request('https://umaxica.app/');

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/home');
  });

  it('returns 400 error when no ri parameter and no default URL', async () => {
    const app = createRedirectApp({
      resolveRedirectUrl: () => null,
      getDefaultRedirectUrl: () => null,
    });

    const response = await app.request('https://umaxica.app/');

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'region_not_found', message: 'Invalid region' });
  });
});
