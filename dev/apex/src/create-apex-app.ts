import type { BaseLogger } from '@hono/structured-logger';
import { Hono, type Context } from 'hono';
import { etag } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';
import { languageDetector } from 'hono/language';
import { timeout } from 'hono/timeout';

import { styleUrl } from './assets';
import { BRAND_TLD, buildBrandTitle, DEFAULT_BRAND_NAME } from './brand';
import { apexCsrf } from './csrf';
import { renderHealthJson, renderHealthPage } from './health-page';
import { defaultLocale, locales } from './i18n/config';
import { checkRateLimit } from './rate-limit';
import { renderer } from './renderer';
import { apexSecurityHeaders, type AssetEnv } from './security-headers';
import type { Meta } from './seo';
import { apexStructuredLogger } from './structured-logger';

export type ApexEnv = {
  Bindings: AssetEnv;
  Variables: {
    meta?: Meta;
    // Set by `apexStructuredLogger`. Declared here so `c.get('logger')` is
    // typed at every call site instead of being asserted back into shape.
    logger: BaseLogger;
  };
};

// Hono types `c.env` as always present. It is not: the app runs with no
// bindings at all outside the Workers runtime, which is what every
// `app.request(path)` in the test suite does. Reading it through this
// widening accessor keeps the guards below honest instead of leaving
// optional chains the type checker believes are dead.
const bindings = (c: Context<ApexEnv>): AssetEnv | undefined => c.env;

type ConfigurePageRoutes = (pageRoutes: Hono<ApexEnv>) => void;

type CreateApexAppOptions = {
  service: string;
};

/*
 * The status, offline and 404 documents are chrome-free by design (see
 * docs/design/ui-shell-contract.md §15) but no longer unstyled: they link the
 * same compiled stylesheet as every other document this unit serves, which the
 * assets binding answers without invoking the Worker.
 *
 * The three class strings are constants because Tailwind scans this file as
 * plain text — a class name assembled at runtime would not be generated.
 */
const STATUS_STYLESHEET = `<link rel="stylesheet" href="${styleUrl}">`;
const STATUS_BODY =
  'grid min-h-screen place-content-center gap-3 bg-gray-50 p-6 text-center text-gray-900 leading-body';
const STATUS_HEADING = 'text-2xl font-semibold leading-heading';

function statusPage(status: number, title: string) {
  const reload = status >= 500 ? '<a href="">再読み込み</a> · ' : '';
  return new Response(
    `<!doctype html><html lang="${defaultLocale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${buildBrandTitle(title, { brandName: DEFAULT_BRAND_NAME, tld: BRAND_TLD })}</title>${STATUS_STYLESHEET}</head><body class="${STATUS_BODY}"><main class="grid gap-3"><h1 class="${STATUS_HEADING}">${title}</h1><p>HTTP ${status}</p><p>${reload}<a class="text-brand" href="/">トップへ戻る</a></p></main></body></html>`,
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
    const blocked = await checkRateLimit(c.req.raw, bindings(c)?.RATE_LIMITER);
    if (blocked) return blocked;
    return next();
  });
  app.use('*', apexCsrf);
  // Reads the locale set from this unit's own config rather than repeating
  // it, so the detector and `<html lang>` cannot disagree.
  app.use(languageDetector({ supportedLanguages: [...locales], fallbackLanguage: 'en' }));

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
    const { id = null, tag = null, timestamp = null } = bindings(c)?.CF_VERSION_METADATA ?? {};
    return c.json({ id, tag, timestamp }, 200, {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    });
  });
  app.get('/offline', (c) =>
    c.html(
      `<!doctype html><html lang="${defaultLocale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${buildBrandTitle('オフライン', { brandName: DEFAULT_BRAND_NAME, tld: BRAND_TLD })}</title>${STATUS_STYLESHEET}</head><body class="${STATUS_BODY}"><main class="grid gap-3"><h1 class="${STATUS_HEADING}">オフラインです</h1><p>ネットワーク接続を確認して再読み込みしてください。</p><p><a class="text-brand" href="/">トップへ戻る</a></p></main></body></html>`,
    ),
  );
  app.route('/', pageRoutes);
  app.notFound(() => statusPage(404, 'ページが見つかりません'));

  return app;
}
