import * as Sentry from '@sentry/cloudflare';
import { Hono } from 'hono';
import { apexCsrf } from '../../../shared/apex/csrf';
import { etag } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';
import { languageDetector } from 'hono/language';
import { logger } from 'hono/logger';
import { timeout } from 'hono/timeout';
import { checkRateLimit } from '../../../shared/apex/rate-limit';
import { applySecurityHeaders, type AssetEnv } from '../../../shared/apex/security-headers';
import { DEFAULT_BRAND_NAME, getBrandName } from '../../../shared/apex/brand';
import { setMeta } from '../../../shared/apex/seo';
import {
  buildRegionErrorPayload,
  getDefaultRedirectUrl,
  resolveRedirectUrl,
} from './root-redirect';
import { renderer } from './renderer';

void languageDetector;

const app = new Hono<{ Bindings: AssetEnv }>();
const pageRoutes = new Hono<{ Bindings: AssetEnv }>();
const ORG_APEX_SENTRY_DSN_KEY = 'UMAXICA_APPS_EDGE_ORG_APEX_SENTRY_DSN';

function buildApexTitle(env: AssetEnv, domain: string, pageName?: string): string {
  void env;
  const brandName = DEFAULT_BRAND_NAME;
  const baseTitle = `${brandName} (${domain}) - Apex`;
  return pageName ? `${pageName} | ${baseTitle}` : baseTitle;
}

app.use(etag());
app.use(logger());
app.use(async (c, next) => {
  const sentryDsn = c.env[ORG_APEX_SENTRY_DSN_KEY as keyof typeof c.env] as string | undefined;

  // Temporary diagnostic log for deployed environment verification.
  console.error('Sentry DSN status', {
    service: 'org-apex',
    hasSentryDsn: Boolean(sentryDsn),
    sentryDsnLength: sentryDsn?.length ?? 0,
    sentryEnvironment: c.env.SENTRY_ENVIRONMENT ?? null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RATE_LIMITER binding from wrangler.jsonc
  const blocked = await checkRateLimit(c.req.raw, (c.env as any)?.RATE_LIMITER);
  if (blocked) return blocked;
  await next();
});
app.use('*', (c, next) =>
  apexCsrf(c as unknown as Parameters<typeof apexCsrf>[0], next as Parameters<typeof apexCsrf>[1]),
);

app.use('*', async (c, next) => {
  await next();
  if (c.res.status !== 400 && c.res.status !== 404) {
    applySecurityHeaders(c);
  }
});

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

pageRoutes.use(renderer as unknown as Parameters<typeof pageRoutes.use>[0]);

pageRoutes.get('/about', timeout(2000), (c) => {
  setMeta(c, {
    title: buildApexTitle(c.env, 'org', 'About'),
    description:
      'umaxica.org is the apex domain of the UMAXICA platform. Services and content are available on dedicated subdomains',
    canonical: 'https://umaxica.org/about',
    robots: 'index,follow',
  });

  throw new Error('Intentional /about error for Sentry DSN verification');

  return c.render(
    <div class="space-y-4">
      <h2 class="text-3xl font-semibold text-gray-800">About this site.</h2>
      <p>
        This domain (<a href="https://umaxica.org">umaxica.org</a>) is not operated as a
        public-facing website. To access our services, please visit our official websites (
        <a href="https://umaxica.app">umaxica.app</a>, <a href="https://umaxica.com">umaxica.com</a>
        , <a href="https://umaxica.org">umaxica.org</a>).
      </p>
      <h2 class="text-3xl font-semibold text-gray-800">このサイトについて</h2>
      <p>
        本ドメイン（<a href="https://umaxica.org">umaxica.org</a>
        ）は、一般向けのウェブサイトとして運用いたしておりません。弊社サービスの利用につきましては、
        <a href="https://umaxica.app">umaxica.app</a>、{' '}
        <a href="https://umaxica.com">umaxica.com</a>、{' '}
        <a href="https://umaxica.org">umaxica.org</a>
        の公式ウェブサイトへごアクセス賜りますようお願い申し上げます。
      </p>
    </div>,
  );
});

app.onError(async (err, c) => {
  Sentry.captureException(err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled apex error', {
    method: c.req.method,
    url: c.req.url,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  if (!c.env.ASSETS) {
    // eslint-disable-next-line no-console
    console.error('ASSETS binding is missing for 400 fallback', { url: c.req.url });
    return c.text('Bad Request', 400);
  }

  const url = new URL('/400.html', c.req.url);
  const res = await c.env.ASSETS.fetch(new Request(url.toString()));
  return new Response(res.body, {
    status: 400,
    headers: res.headers,
  });
});

app.get('/health', timeout(2000), (c) => {
  const timestampIso = new Date().toISOString();
  const brandName = getBrandName(c.env);
  try {
    return c.html(
      `<!doctype html>
<html lang="ja">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brandName}</title>
    <meta name="robots" content="noindex, nofollow" />
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
</html>`,
      200,
      { 'X-Robots-Tag': 'noindex, nofollow' },
    );
  } catch {
    return c.html(
      `<!doctype html>
<html lang="ja">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brandName}</title>
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body>
    <main>
      <p>status: error</p>
      <p>timestamp: ${timestampIso}</p>
    </main>
  </body>
</html>`,
      503,
      { 'X-Robots-Tag': 'noindex, nofollow' },
    );
  }
});

app.route('/', pageRoutes);
app.notFound(async (c) => {
  if (!c.env.ASSETS) {
    // eslint-disable-next-line no-console
    console.error('ASSETS binding is missing for 404 fallback', { url: c.req.url });
    return c.text('Not Found', 404);
  }

  // Let the asset layer (and Vite in dev) handle static/dev paths first.
  const assetRes = await c.env.ASSETS.fetch(c.req.raw);
  if (assetRes.status !== 404) {
    return assetRes;
  }

  const fallbackUrl = new URL('/404.html', c.req.url);
  const fallbackRes = await c.env.ASSETS.fetch(new Request(fallbackUrl.toString()));
  return new Response(fallbackRes.body, {
    status: 404,
    headers: fallbackRes.headers,
  });
});

export default Sentry.withSentry(
  (
    env?: AssetEnv & {
      UMAXICA_APPS_EDGE_ORG_APEX_SENTRY_DSN?: string;
      SENTRY_ENVIRONMENT?: string;
    },
  ) => ({
    dsn: env?.UMAXICA_APPS_EDGE_ORG_APEX_SENTRY_DSN,
    environment: env?.SENTRY_ENVIRONMENT,
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: 1.0,
  }),
  app,
);
