import { Hono } from 'hono';
import { etag } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';
import { languageDetector } from 'hono/language';
import { timeout } from 'hono/timeout';
import { BRAND_TLD, buildBrandTitle, DEFAULT_BRAND_NAME } from './brand';
import { apexCsrf } from './csrf';
import { renderHealthJson, renderHealthPage } from './health-page';
import { checkRateLimit } from './rate-limit';
import { renderer } from './renderer';
import { apexSecurityHeaders, type AssetEnv } from './security-headers';
import type { Meta } from './seo';
import { apexStructuredLogger } from './structured-logger';

export type ApexEnv = {
  Bindings: AssetEnv;
  Variables: {
    meta?: Meta;
  };
};

type ConfigurePageRoutes = (pageRoutes: Hono<ApexEnv>) => void;

type CreateApexAppOptions = {
  service: string;
};

function statusPage(status: number, title: string) {
  const reload = status >= 500 ? '<a href="">再読み込み</a> · ' : '';
  return new Response(
    `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${buildBrandTitle(title, { brandName: DEFAULT_BRAND_NAME, tld: BRAND_TLD })}</title></head><body><main><h1>${title}</h1><p>HTTP ${status}</p><p>${reload}<a href="/">トップへ戻る</a></p></main></body></html>`,
    {
      status,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=UTF-8' },
    },
  );
}

export function createApexApp(
  configurePageRoutes: ConfigurePageRoutes,
  options: CreateApexAppOptions,
) {
  const app = new Hono<ApexEnv>();
  const pageRoutes = new Hono<ApexEnv>();

  app.use('*', apexSecurityHeaders);
  app.use(etag());
  app.use(apexStructuredLogger);
  app.use(async (c, next) => {
    const blocked = await checkRateLimit(c.req.raw, c.env?.RATE_LIMITER);
    if (blocked) return blocked;
    await next();
  });
  app.use('*', apexCsrf);
  app.use(languageDetector({ supportedLanguages: ['en', 'ja'], fallbackLanguage: 'en' }));

  pageRoutes.use(renderer);
  configurePageRoutes(pageRoutes);

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      const response = err.getResponse();
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      headers.set('Content-Type', 'text/html; charset=UTF-8');
      return new Response(statusPage(response.status, 'リクエストを処理できませんでした').body, {
        status: response.status,
        headers,
      });
    }

    // oxlint-disable-next-line no-console
    console.error('Unhandled apex error', {
      error: err instanceof Error ? err.name : 'UnknownError',
      method: c.req.method,
      path: new URL(c.req.url).pathname,
    });

    return statusPage(500, '現在、このページを表示できません');
  });

  app.get('/health', timeout(2000), (c) => renderHealthPage(c.env, options));
  app.get('/health.html', timeout(2000), (c) => renderHealthPage(c.env, options));
  app.get('/health.json', timeout(2000), (c) => renderHealthJson(c.env, options));
  app.get('/revision', (c) => {
    const { id = null, tag = null, timestamp = null } = c.env?.CF_VERSION_METADATA ?? {};
    return c.json({ id, tag, timestamp }, 200, {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    });
  });
  app.get('/offline', (c) =>
    c.html(
      `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${buildBrandTitle('オフライン', { brandName: DEFAULT_BRAND_NAME, tld: BRAND_TLD })}</title></head><body><main><h1>オフラインです</h1><p>ネットワーク接続を確認して再読み込みしてください。</p><p><a href="/">トップへ戻る</a></p></main></body></html>`,
    ),
  );
  app.route('/', pageRoutes);
  app.notFound(() => statusPage(404, 'ページが見つかりません'));

  return app;
}
