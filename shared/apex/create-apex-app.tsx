import { Hono, type Context } from 'hono';
import { csrf } from 'hono/csrf';
import { etag } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';
import { languageDetector } from 'hono/language';
import { timeout } from 'hono/timeout';

type RootRedirectConfig = {
  resolveRedirectUrl: (regionParam: string | null | undefined) => string | null;
  getDefaultRedirectUrl: () => string | null;
  buildRegionErrorPayload: () => { error: string; message: string };
};

type RateLimiter = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
};

type OpenGraphMeta = {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  image?: string;
};

type TwitterMeta = {
  card?: string;
  site?: string;
};

type Meta = {
  title?: string;
  pageTitle?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  og?: OpenGraphMeta;
  twitter?: TwitterMeta;
};

type AssetEnv = {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  BRAND_NAME?: string;
  RATE_LIMITER?: RateLimiter;
};

type SecurityContext = {
  header: (name: string, value: string, options?: { append?: boolean }) => void;
};

type MetaContext = {
  set: (key: unknown, value: unknown) => void;
};

type ApexBindings = {
  Bindings: AssetEnv;
};

type ApexContext = Context<ApexBindings>;
type FallbackStatus = 400 | 404;

// oxlint-disable-next-line no-explicit-any
type AnyMiddleware = any;

type ApexConfig = {
  rootHandler: 'redirect' | 'page';
  rootRedirect?: RootRedirectConfig;
  getRootMeta?: (env: AssetEnv) => Meta;
  renderRootContent?: (language: string | undefined) => unknown;
  getAboutMeta: (env: AssetEnv) => Meta;
  renderAboutContent: (language: string | undefined) => unknown;
  renderer: AnyMiddleware;
};

const PRODUCTION_APEX_ORIGIN = /^https:\/\/umaxica\.(com|org|app|net)$/;
const LOCAL_APEX_ORIGIN = /^http:\/\/(com|org|app|net)\.localhost(?::\d+)?$/;
const PREVIEW_APEX_ORIGIN = /^https:\/\/[\w-]+\.[\w-]+\.workers\.dev$/;
const DEFAULT_CSP_STYLE_SRC = "'self'";
const HEALTH_ROBOTS_HEADER = 'noindex, nofollow';
const DEFAULT_BRAND_NAME = 'UMAXICA';

function isAllowedApexOrigin(origin?: string): boolean {
  if (!origin) {
    return false;
  }

  return (
    PRODUCTION_APEX_ORIGIN.test(origin) ||
    LOCAL_APEX_ORIGIN.test(origin) ||
    PREVIEW_APEX_ORIGIN.test(origin)
  );
}

const apexCsrf = csrf({
  origin: (origin) => isAllowedApexOrigin(origin),
});

async function checkRateLimit(
  request: Request,
  rateLimiter: RateLimiter | undefined,
): Promise<Response | null> {
  if (!rateLimiter) {
    return null;
  }

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const { success } = await rateLimiter.limit({ key: ip });
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  return null;
}

function buildCspHeader(styleSrc: string = DEFAULT_CSP_STYLE_SRC): string {
  return `default-src 'self'; base-uri 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src ${styleSrc}; style-src-attr 'none'; upgrade-insecure-requests`;
}

function applySecurityHeaders(c: SecurityContext): void {
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header('Content-Security-Policy', buildCspHeader());
  c.header(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  );
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
}

function setMeta(c: MetaContext, meta: Meta): void {
  c.set('meta', meta);
}

async function fetchHtmlFallback(
  c: ApexContext,
  path: string,
  status: FallbackStatus,
  fallbackText: string,
): Promise<Response> {
  if (!c.env?.ASSETS) {
    // oxlint-disable-next-line no-console
    console.error(`ASSETS binding is missing for ${status} fallback`, { url: c.req.url });
    return c.text(fallbackText, status);
  }

  const url = new URL(path, c.req.url);
  const res = await c.env.ASSETS.fetch(new Request(url.toString()));
  return new Response(res.body, {
    status,
    headers: res.headers,
  });
}

function createBadRequestFallback(c: ApexContext): Promise<Response> {
  return fetchHtmlFallback(c, '/400.html', 400, 'Bad Request');
}

async function createNotFoundFallback(c: ApexContext): Promise<Response> {
  if (!c.env?.ASSETS) {
    // oxlint-disable-next-line no-console
    console.error('ASSETS binding is missing for 404 fallback', { url: c.req.url });
    return c.text('Not Found', 404);
  }

  const assetRes = await c.env.ASSETS.fetch(c.req.raw);
  if (assetRes.status !== 404) {
    return assetRes;
  }

  return fetchHtmlFallback(c, '/404.html', 404, 'Not Found');
}

function buildHealthPageHtml(brandName: string, timestampIso: string): string {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brandName}</title>
    <meta name="robots" content="${HEALTH_ROBOTS_HEADER}" />
    <link href="/src/style.css" rel="stylesheet" />
  </head>
  <body class="min-h-screen flex flex-col bg-gray-50">
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
      <div class="space-y-4">
        <p><strong>Status:</strong> OK</p>
        <p><strong>Timestamp:</strong> ${timestampIso}</p>
      </div>
    </main>
  </body>
</html>`;
}

// oxlint-disable-next-line no-unused-vars
function buildHealthErrorHtml(brandName: string, timestampIso: string): string {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brandName}</title>
    <meta name="robots" content="${HEALTH_ROBOTS_HEADER}" />
  </head>
  <body>
    <main>
      <p>status: error</p>
      <p>timestamp: ${timestampIso}</p>
    </main>
  </body>
</html>`;
}

function getBrandName(env?: { BRAND_NAME?: string }): string {
  return env?.BRAND_NAME || DEFAULT_BRAND_NAME;
}

function renderHealthPage(env: AssetEnv): Response {
  const timestampIso = new Date().toISOString();
  const brandName = getBrandName(env);

  return new Response(buildHealthPageHtml(brandName, timestampIso), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
    },
  });
}

export function createApexApp(config: ApexConfig): Hono<ApexBindings> {
  const app = new Hono<ApexBindings>();
  const pageRoutes = new Hono<ApexBindings>();

  app.use(etag());
  app.use(async (c, next) => {
    const blocked = await checkRateLimit(c.req.raw, c.env?.RATE_LIMITER);
    if (blocked) return blocked;
    await next();
  });
  app.use('*', apexCsrf);
  app.use('*', async (c, next) => {
    await next();
    if (c.res.status !== 400 && c.res.status !== 404) {
      applySecurityHeaders(c);
    }
  });
  app.use(languageDetector({ supportedLanguages: ['en', 'ja'], fallbackLanguage: 'en' }));

  if (config.rootHandler === 'redirect' && config.rootRedirect) {
    const { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload } =
      config.rootRedirect;
    pageRoutes.get('/', (c) => {
      const regionParam = c.req.query('ri');
      const redirectUrl = resolveRedirectUrl(regionParam);
      if (redirectUrl) {
        return c.redirect(redirectUrl, 301);
      }
      const defaultRedirectUrl = getDefaultRedirectUrl();
      if (defaultRedirectUrl) {
        return c.redirect(defaultRedirectUrl, 301);
      }
      return c.json(buildRegionErrorPayload(), 400);
    });
  }

  pageRoutes.use(config.renderer);

  if (config.rootHandler === 'page' && config.getRootMeta && config.renderRootContent) {
    const { getRootMeta, renderRootContent } = config;
    pageRoutes.get('/', timeout(2000), (c) => {
      setMeta(c, getRootMeta(c.env));
      return c.render(renderRootContent(c.get('language')) as string);
    });
  }

  pageRoutes.get('/about', timeout(2000), (c) => {
    setMeta(c, config.getAboutMeta(c.env));
    return c.render(config.renderAboutContent(c.get('language')) as string);
  });

  app.onError(async (err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    // oxlint-disable-next-line no-console
    console.error('Unhandled apex error', {
      method: c.req.method,
      url: c.req.url,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    // For health endpoint errors, return 400 Bad Request with fallback page
    if (c.req.path === '/health') {
      return createBadRequestFallback(c);
    }

    return c.text('Internal Server Error', 500);
  });

  app.get('/health', timeout(2000), (c) => renderHealthPage(c.env));

  app.route('/', pageRoutes);
  app.notFound((c) => createNotFoundFallback(c));

  return app;
}
