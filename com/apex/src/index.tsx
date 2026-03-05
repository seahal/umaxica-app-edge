import { Hono } from 'hono';
import { applySecurityHeaders, type AssetEnv } from '../../../shared/apex/security-headers';
import { buildSitemapXml } from '../../../shared/apex/sitemap';
import {
  buildRegionErrorPayload,
  getDefaultRedirectUrl,
  resolveRedirectUrl,
} from './root-redirect';
import { renderer } from './renderer';

const app = new Hono<{ Bindings: AssetEnv }>();
const apiRoutes = new Hono<{ Bindings: AssetEnv }>();
const pageRoutes = new Hono<{ Bindings: AssetEnv }>();

app.use('*', async (c, next) => {
  await next();
  if (c.res.status !== 404 && c.res.status !== 500) {
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

  return c.json(buildRegionErrorPayload(), 500);
});

apiRoutes.get('/v1/health', (c) => c.json({ status: 'ok' }));
apiRoutes.get('/api/health', (c) => c.json({ status: 'ok' }));

pageRoutes.use(renderer);

pageRoutes.get('/health', (c) => {
  const timestampIso = new Date().toISOString();
  return c.render(
    <div class="space-y-4">
      <p>✓ OK</p>
      <p>
        <strong>Timestamp:</strong> {timestampIso}
      </p>
    </div>,
  );
});

pageRoutes.get('/about', (c) =>
  c.render(
    <div class="space-y-4">
      <h2 class="text-3xl font-semibold text-gray-800">About this site.</h2>
      <p>
        This domain (<a href="https://umaxica.com">umaxica.com</a>) is not operated as a
        public-facing website. To access our services, please visit our official websites (
        <a href="https://umaxica.app">umaxica.app</a>, <a href="https://umaxica.com">umaxica.com</a>
        , <a href="https://umaxica.org">umaxica.org</a>).
      </p>
      <h2 class="text-3xl font-semibold text-gray-800">このサイトについて</h2>
      <p>
        本ドメイン（<a href="https://umaxica.com">umaxica.com</a>
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
    { loc: 'https://umaxica.com/', changefreq: 'monthly', priority: 1.0 },
    { loc: 'https://umaxica.com/about', changefreq: 'monthly', priority: 0.5 },
    { loc: 'https://umaxica.com/health', changefreq: 'weekly', priority: 0.3 },
  ]);
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=UTF-8' });
});

app.onError(async (_err, c) => {
  const url = new URL('/500.html', c.req.url);
  const res = await c.env.ASSETS.fetch(new Request(url.toString()));
  return new Response(res.body, {
    status: 500,
    headers: res.headers,
  });
});

app.route('/', apiRoutes);
app.route('/', pageRoutes);
app.notFound((c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
