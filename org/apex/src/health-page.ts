import { styleUrl } from './assets';
import { BRAND_TLD, buildBrandTitle, getBrandName } from './brand';
import { defaultLocale } from './i18n/config';
import type { AssetEnv } from './security-headers';

const HEALTH_ROBOTS_HEADER = 'noindex, nofollow';

type HealthPayload = {
  status: 'OK';
  service: string;
  version: string | null;
  environment: string | null;
  edge: 'cloudflare';
  time: string;
};

type HealthPageOptions = {
  service: string;
};

// `env` is optional because it genuinely is: the bindings object is absent
// outside the Workers runtime, which is why the reads below are guarded. The
// parameter used to claim otherwise, which made those guards look dead.
function buildHealthPayload(env: AssetEnv | undefined, options: HealthPageOptions): HealthPayload {
  return {
    status: 'OK',
    service: options.service,
    version: env?.CF_VERSION_METADATA?.id ?? null,
    environment: env?.EDGE_ENV ?? null,
    edge: 'cloudflare',
    time: new Date().toISOString(),
  };
}

function buildHealthPageHtml(brandName: string, payload: HealthPayload): string {
  return `<!doctype html>
<html lang="${defaultLocale}">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${buildBrandTitle('Health status', { brandName, tld: BRAND_TLD })}</title>
    <meta name="robots" content="${HEALTH_ROBOTS_HEADER}" />
    <link rel="stylesheet" href="${styleUrl}" />
  </head>
  <body class="flex min-h-screen flex-col bg-gray-50 text-gray-900 leading-body">
    <main class="mx-auto w-full max-w-7xl grow px-4 py-8">
      <div class="space-y-4">
        <h1 class="text-3xl font-semibold leading-heading">status</h1>
        <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt class="font-medium text-gray-600">status</dt>
          <dd>${payload.status}</dd>
          <dt class="font-medium text-gray-600">service</dt>
          <dd>${payload.service}</dd>
          <dt class="font-medium text-gray-600">version</dt>
          <dd>${String(payload.version)}</dd>
          <dt class="font-medium text-gray-600">environment</dt>
          <dd>${String(payload.environment)}</dd>
          <dt class="font-medium text-gray-600">edge</dt>
          <dd>${payload.edge}</dd>
          <dt class="font-medium text-gray-600">time</dt>
          <dd>${payload.time}</dd>
        </dl>
      </div>
    </main>
    <footer class="mx-auto w-full max-w-7xl px-4 py-4 text-sm text-gray-600">© ${new Date(payload.time).getUTCFullYear()} ${brandName}</footer>
  </body>
</html>`;
}

function buildHealthErrorHtml(brandName: string, timestampIso: string): string {
  return `<!doctype html>
<html lang="${defaultLocale}">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${buildBrandTitle(undefined, { brandName, tld: BRAND_TLD })}</title>
    <meta name="robots" content="${HEALTH_ROBOTS_HEADER}" />
    <link rel="stylesheet" href="${styleUrl}" />
  </head>
  <body class="flex min-h-screen flex-col bg-gray-50 text-gray-900 leading-body">
    <main class="mx-auto w-full max-w-7xl grow px-4 py-8">
      <p>status: error</p>
      <p>timestamp: ${timestampIso}</p>
    </main>
  </body>
</html>`;
}

export function renderHealthPage(env: AssetEnv, options: HealthPageOptions): Response {
  const payload = buildHealthPayload(env, options);
  const brandName = getBrandName(env);

  try {
    return new Response(buildHealthPageHtml(brandName, payload), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
      },
    });
  } catch {
    return new Response(buildHealthErrorHtml(brandName, payload.time), {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
      },
    });
  }
}

export function renderHealthJson(env: AssetEnv, options: HealthPageOptions): Response {
  const payload = buildHealthPayload(env, options);
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
    },
  });
}
