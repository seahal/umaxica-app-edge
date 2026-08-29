import { styleUrl } from './assets';
import { BRAND_TLD, buildBrandTitle, getBrandName } from './brand';
import { defaultLocale } from './i18n/config';
import type { AssetEnv } from './security-headers';
import { themeAttributeMarkup, type ThemeAttribute } from './theme';

const HEALTH_ROBOTS_HEADER = 'noindex, nofollow';

/*
 * `EDGE_ENV` is deliberately absent.
 *
 * These surfaces are unauthenticated, and naming the tier a host is serving —
 * production, development, test — tells a prober which of several deployments
 * of the same code it has reached, for no benefit an operator cannot get from
 * `version` (which identifies the deployment exactly) or from the hostname
 * they typed. The binding stays bound; it just does not leave the Worker.
 */
type HealthPayload = {
  status: 'OK';
  service: string;
  version: string | null;
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
    edge: 'cloudflare',
    time: new Date().toISOString(),
  };
}

function buildHealthPageHtml(
  brandName: string,
  payload: HealthPayload,
  theme: ThemeAttribute,
): string {
  return `<!doctype html>
<html lang="${defaultLocale}"${themeAttributeMarkup(theme)}>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${buildBrandTitle('Health status', { brandName, tld: BRAND_TLD })}</title>
    <meta name="robots" content="${HEALTH_ROBOTS_HEADER}" />
    <link rel="stylesheet" href="${styleUrl}" />
  </head>
  <body class="flex min-h-screen flex-col bg-gray-50 text-gray-900 leading-body dark:bg-gray-950 dark:text-gray-100">
    <main class="mx-auto w-full max-w-7xl grow px-4 py-8">
      <div class="space-y-4">
        <h1 class="text-3xl font-semibold leading-heading tracking-tight">status</h1>
        <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt class="font-medium text-gray-600 dark:text-gray-400">status</dt>
          <dd class="font-mono">${payload.status}</dd>
          <dt class="font-medium text-gray-600 dark:text-gray-400">service</dt>
          <dd class="font-mono">${payload.service}</dd>
          <dt class="font-medium text-gray-600 dark:text-gray-400">version</dt>
          <dd class="font-mono">${String(payload.version)}</dd>
          <dt class="font-medium text-gray-600 dark:text-gray-400">edge</dt>
          <dd class="font-mono">${payload.edge}</dd>
          <dt class="font-medium text-gray-600 dark:text-gray-400">time</dt>
          <dd class="font-mono">${payload.time}</dd>
        </dl>
      </div>
    </main>
    <footer class="mx-auto w-full max-w-7xl px-4 py-4 text-sm text-gray-600 dark:text-gray-400">© ${new Date(payload.time).getUTCFullYear()} ${brandName}</footer>
  </body>
</html>`;
}

function buildHealthErrorHtml(
  brandName: string,
  timestampIso: string,
  theme: ThemeAttribute,
): string {
  return `<!doctype html>
<html lang="${defaultLocale}"${themeAttributeMarkup(theme)}>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${buildBrandTitle(undefined, { brandName, tld: BRAND_TLD })}</title>
    <meta name="robots" content="${HEALTH_ROBOTS_HEADER}" />
    <link rel="stylesheet" href="${styleUrl}" />
  </head>
  <body class="flex min-h-screen flex-col bg-gray-50 text-gray-900 leading-body dark:bg-gray-950 dark:text-gray-100">
    <main class="mx-auto w-full max-w-7xl grow px-4 py-8">
      <p>status: error</p>
      <p>timestamp: ${timestampIso}</p>
    </main>
  </body>
</html>`;
}

export function renderHealthPage(
  env: AssetEnv,
  options: HealthPageOptions,
  theme: ThemeAttribute,
): Response {
  const payload = buildHealthPayload(env, options);
  const brandName = getBrandName(env);

  try {
    return new Response(buildHealthPageHtml(brandName, payload, theme), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
      },
    });
  } catch {
    return new Response(buildHealthErrorHtml(brandName, payload.time, theme), {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
      },
    });
  }
}

export function renderHealthJson(env: AssetEnv, options: HealthPageOptions): Response {
  return new Response(JSON.stringify(buildHealthPayload(env, options)), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'X-Robots-Tag': HEALTH_ROBOTS_HEADER,
    },
  });
}
