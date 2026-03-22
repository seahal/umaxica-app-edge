import { DEFAULT_BRAND_NAME } from '../brand';

const HEALTH_ROBOTS_HEADER = 'noindex, nofollow';

export function buildHealthPageHtml(brandName: string, timestampIso: string): string {
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

export function getBrandName(env?: { BRAND_NAME?: string }): string {
  return env?.BRAND_NAME || DEFAULT_BRAND_NAME;
}
