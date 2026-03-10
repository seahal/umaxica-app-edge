import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Hono } from 'hono';
import { apexCsrf } from '../../../shared/apex/csrf';
import { etag } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { applySecurityHeaders, type AssetEnv } from '../../../shared/apex/security-headers';
import { getBrandName } from '../../../shared/apex/brand';
import { buildSitemapXml } from '../../../shared/apex/sitemap';
import { captureException, initObservability } from './observability';
import { renderer } from './renderer';

initObservability();

const app = new Hono<{ Bindings: AssetEnv }>();
const pageRoutes = new Hono<{ Bindings: AssetEnv }>();

function resolvePublicAssetPath(filename: string): string {
  const candidates = [
    resolve(process.cwd(), 'public', filename),
    resolve(process.cwd(), 'dev/core/public', filename),
  ];

  const matchedPath = candidates.find((candidate) => existsSync(candidate));
  if (!matchedPath) {
    throw new Error(`Unable to locate public asset: ${filename}`);
  }

  return matchedPath;
}

function resolveErrorPagePath(filename: string): string {
  const candidates = [
    resolve(process.cwd(), 'src/error-pages', filename),
    resolve(process.cwd(), 'dev/core/src/error-pages', filename),
  ];

  const matchedPath = candidates.find((candidate) => existsSync(candidate));
  if (!matchedPath) {
    throw new Error(`Unable to locate error page template: ${filename}`);
  }

  return matchedPath;
}

const notFoundHtml = readFileSync(resolveErrorPagePath('404.html'), 'utf-8');
const badRequestHtml = readFileSync(resolvePublicAssetPath('400.html'), 'utf-8');

app.use(etag());
app.use(logger());
app.use('*', (c, next) =>
  apexCsrf(c as unknown as Parameters<typeof apexCsrf>[0], next as Parameters<typeof apexCsrf>[1]),
);

app.use('*', async (c, next) => {
  await next();
  if (c.res.status !== 400 && c.res.status !== 404) {
    applySecurityHeaders(c as unknown as { header: (name: string, value: string) => void });
  }
});

pageRoutes.use(renderer);

pageRoutes.get('/', (c) =>
  c.render(
    <>
      <div class="space-y-4">
        <h2 class="text-3xl font-semibold text-gray-800">About this site.</h2>
        <p>
          This domain (<a href="https://umaxica.net">umaxica.net</a>) is not operated as a
          public-facing website. To access our services, please visit our official service site (
          <a href="https://umaxica.app">umaxica.app</a>) or our corporate site (
          <a href="https://umaxica.com">umaxica.com</a>).
        </p>
        <h2 class="text-3xl font-semibold text-gray-800">このサイトについて</h2>
        <p>
          本ドメイン（<a href="https://umaxica.net">umaxica.net</a>
          ）は、一般向けのウェブサイトとして運用いたしておりません。
          弊社サービスの利用につきましては、サービスサイト (
          <a href="https://umaxica.app">umaxica.app</a>) またはコーポレートサイト (
          <a href="https://umaxica.com">umaxica.com</a>)
          の公式ウェブサイトへごアクセス賜りますようお願い申し上げます。
        </p>
      </div>
    </>,
  ),
);

pageRoutes.get('/about', (c) =>
  c.render(
    <div class="space-y-4">
      <h2 class="text-3xl font-semibold text-gray-800">About this site.</h2>
      <p>
        This domain (<a href="https://umaxica.net">umaxica.net</a>) is not operated as a
        public-facing website. To access our services, please visit our official websites (
        <a href="https://umaxica.app">umaxica.app</a>, <a href="https://umaxica.com">umaxica.com</a>
        , <a href="https://umaxica.org">umaxica.org</a>).
      </p>
      <h2 class="text-3xl font-semibold text-gray-800">このサイトについて</h2>
      <p>
        本ドメイン（<a href="https://umaxica.net">umaxica.net</a>
        ）は、一般向けのウェブサイトとして運用いたしておりません。弊社サービスの利用につきましては、
        <a href="https://umaxica.app">umaxica.app</a>、{' '}
        <a href="https://umaxica.com">umaxica.com</a>、{' '}
        <a href="https://umaxica.org">umaxica.org</a>
        の公式ウェブサイトへごアクセス賜りますようお願い申し上げます。
      </p>
    </div>,
  ),
);

pageRoutes.get('/sitemap.xml', (c) => {
  const xml = buildSitemapXml([
    { loc: 'https://umaxica.net/', changefreq: 'monthly', priority: 1.0 },
  ]);
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=UTF-8' });
});

app.onError(async (err, c) => {
  captureException(err, {
    request: {
      method: c.req.method,
      url: c.req.url,
    },
  });

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

  return new Response(badRequestHtml, {
    status: 400,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
});

app.get('/health', (c) => {
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
    <link href="/assets/style.css" rel="stylesheet" />
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
    );
  } catch {
    return c.html(
      `<!doctype html>
<html lang="ja">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brandName}</title>
  </head>
  <body>
    <main>
      <p>status: error</p>
      <p>timestamp: ${timestampIso}</p>
    </main>
  </body>
</html>`,
      503,
    );
  }
});

app.route('/', pageRoutes);
app.notFound(async () => {
  return new Response(notFoundHtml, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
});

export default app;
