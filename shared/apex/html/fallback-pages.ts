import type { Context } from 'hono';

const HEALTH_ROBOTS_HEADER = 'noindex, nofollow';
type FallbackStatus = 400 | 404;

type AssetEnv = {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  BRAND_NAME?: string;
};

type ApexContext = Context<{ Bindings: AssetEnv }>;

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

export function createBadRequestFallback(c: ApexContext): Promise<Response> {
  return fetchHtmlFallback(c, '/400.html', 400, 'Bad Request');
}

export async function createNotFoundFallback(c: ApexContext): Promise<Response> {
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

export function buildHealthErrorHtml(brandName: string, timestampIso: string): string {
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
