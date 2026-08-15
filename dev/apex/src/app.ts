import { Hono } from 'hono';
import type { Context } from 'hono';
import { defaultLocale, isLocale, type Locale } from './i18n/config';

const BRAND_NAME = process.env.BRAND_NAME ?? 'UMAXICA';
const TITLE_BRAND_NAME = 'UMAXICA';
const BRAND_TLD = 'DEV';
/** EM DASH — the UMAXICA title contract is `{PAGE} — UMAXICA ({TLD})`. */
const BRAND_SEPARATOR = ' — ';
const SITE_URL = 'umaxica.dev';
const HEALTH_ROBOTS_HEADER = 'noindex, nofollow';

/*
 * Repeated Tailwind class lists, named once. Tailwind scans this file as plain
 * text, so these have to be whole literals — a class name concatenated at
 * runtime would never make it into the generated stylesheet.
 */
const HEADING = 'text-3xl font-semibold leading-heading';
const LINK = 'text-brand underline';
const PAGE_FOOTER = 'mt-12 border-t border-gray-200 pt-4 text-sm text-gray-600';

type HealthPayload = {
  status: 'OK';
  service: 'dev';
  version: string | null;
  edge: 'vercel';
  time: string;
};

/**
 * Root title -> `UMAXICA (DEV)`; page title -> `{PAGE} — UMAXICA (DEV)`.
 * Surface and runtime names must never reach this function.
 */
function buildApexTitle(pageName?: string): string {
  const root = `${TITLE_BRAND_NAME} (${BRAND_TLD})`;
  return pageName ? `${pageName}${BRAND_SEPARATOR}${root}` : root;
}

function detectLanguage(c: Context): Locale {
  const language =
    c.req.query('lang') ?? c.req.header('accept-language')?.split(',')[0]?.split('-')[0];
  return language !== undefined && isLocale(language) ? language : defaultLocale;
}

function buildPageShell(options: {
  lang: Locale;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  body: string;
}): string {
  const { lang, title, description, canonical, robots, body } = options;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="${robots}">
  <link rel="stylesheet" href="/style.css">
</head>
<body class="mx-auto max-w-3xl bg-gray-50 p-8 text-gray-900 leading-body">
  ${body}
</body>
</html>`;
}

function buildHealthPayload(): HealthPayload {
  return {
    status: 'OK',
    service: 'dev',
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    edge: 'vercel',
    time: new Date().toISOString(),
  };
}

function buildHealthPageHtml(brandName: string, payload: HealthPayload): string {
  return `<!doctype html>
<html lang="${defaultLocale}">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${buildApexTitle('Health status')}</title>
    <meta name="robots" content="${HEALTH_ROBOTS_HEADER}" />
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body class="bg-gray-50 p-8 text-gray-900 leading-body">
    <main class="mx-auto max-w-3xl">
      <h1 class="mb-4 text-3xl font-semibold leading-heading">status</h1>
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        <dt class="font-medium text-gray-600">status</dt>
        <dd>${payload.status}</dd>
        <dt class="font-medium text-gray-600">service</dt>
        <dd>${payload.service}</dd>
        <dt class="font-medium text-gray-600">version</dt>
        <dd>${String(payload.version)}</dd>
        <dt class="font-medium text-gray-600">edge</dt>
        <dd>${payload.edge}</dd>
        <dt class="font-medium text-gray-600">time</dt>
        <dd>${payload.time}</dd>
      </dl>
    </main>
    <footer class="mx-auto mt-12 max-w-3xl text-sm text-gray-600">&copy; ${new Date(payload.time).getUTCFullYear()} ${brandName}</footer>
  </body>
</html>`;
}

function renderHealthHtmlResponse(): Response {
  return new Response(buildHealthPageHtml(BRAND_NAME, buildHealthPayload()), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
    },
  });
}

const app = new Hono();

app.get('/health', (_c) => renderHealthHtmlResponse());

app.get('/health.html', (_c) => renderHealthHtmlResponse());

app.get('/health.json', (_c) => {
  return new Response(JSON.stringify(buildHealthPayload()), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
    },
  });
});

app.get('/about', (c) => {
  const lang = detectLanguage(c);
  const isJapanese = lang === 'ja';
  const title = isJapanese ? 'このサイトについて' : 'About';
  const description = isJapanese ? `${SITE_URL} について` : `About ${SITE_URL}`;
  const canonical = `https://${SITE_URL}/about`;
  const body = isJapanese
    ? `
  <main class="space-y-4">
    <h1 class="${HEADING}">このサイトについて</h1>
    <p>本ドメイン（<strong>${SITE_URL}</strong>）は、一般向けのウェブサイトとして運用いたしておりません。</p>
    <p>他のドメインもご訪問ください: <a class="${LINK}" href="https://umaxica.app">umaxica.app</a>、 <a class="${LINK}" href="https://umaxica.com">umaxica.com</a>、 <a class="${LINK}" href="https://umaxica.org">umaxica.org</a>。</p>
  </main>
  <footer class="${PAGE_FOOTER}">
    <p>&copy; ${new Date().getUTCFullYear()} ${BRAND_NAME}</p>
  </footer>
`
    : `
  <main class="space-y-4">
    <h1 class="${HEADING}">About this site.</h1>
    <p>This domain (<strong>${SITE_URL}</strong>) is not operated as a public-facing website.</p>
    <p>You may also visit our other domains: <a class="${LINK}" href="https://umaxica.app">umaxica.app</a>, <a class="${LINK}" href="https://umaxica.com">umaxica.com</a>, <a class="${LINK}" href="https://umaxica.org">umaxica.org</a>.</p>
  </main>
  <footer class="${PAGE_FOOTER}">
    <p>&copy; ${new Date().getUTCFullYear()} ${BRAND_NAME}</p>
  </footer>
`;

  const html = buildPageShell({
    lang,
    title: buildApexTitle(title),
    description,
    canonical,
    robots: 'index,follow',
    body,
  });

  return c.html(html);
});

app.get('/', (c) => {
  const redirectUrl = process.env.DEV_CORE_URL ?? 'https://www.umaxica.dev/';
  return c.redirect(redirectUrl, 301);
});

/**
 * 404 and 500 are served by this repository, not by the hosting platform's
 * built-in error page: the title contract covers every HTML document shown to a
 * user, and a platform default cannot satisfy it.
 */
function renderStatusDocument(status: number, heading: string): Response {
  const reload = status >= 500 ? `<a class="${LINK}" href="">再読み込み</a> · ` : '';
  const html = buildPageShell({
    lang: 'ja',
    title: buildApexTitle(heading),
    description: heading,
    canonical: `https://${SITE_URL}/`,
    robots: 'noindex, nofollow',
    body: `
  <main class="space-y-4">
    <h1 class="${HEADING}">${heading}</h1>
    <p>HTTP ${status}</p>
    <p>${reload}<a class="${LINK}" href="/">トップへ戻る</a></p>
  </main>
`,
  });

  return new Response(html, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=UTF-8' },
  });
}

app.notFound(() => renderStatusDocument(404, 'ページが見つかりません'));

app.onError(() => renderStatusDocument(500, '現在、このページを表示できません'));

export { app };
