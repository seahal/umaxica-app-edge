import { Hono } from 'hono';
import { applySecurityHeaders, type AssetEnv } from '../../../shared/apex/security-headers';
import { buildSitemapXml } from '../../../shared/apex/sitemap';
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

apiRoutes.get('/v1/health', (c) => {
  const timestampIso = new Date().toISOString();
  return c.json({ status: 'ok', timestamp: timestampIso });
});

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
    <>
      <h2>About</h2>
      <p>For more information, please visit our main page.</p>
    </>,
  ),
);

pageRoutes.get('/sitemap.xml', (c) => {
  const xml = buildSitemapXml([
    { loc: 'https://umaxica.net/', changefreq: 'monthly', priority: 1.0 },
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
