import * as Sentry from '@sentry/cloudflare';
import { Hono } from 'hono';
import { apexCsrf } from '../../../shared/apex/csrf';
import { etag } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';
import { languageDetector } from 'hono/language';
import { logger } from 'hono/logger';
import { timeout } from 'hono/timeout';
import { checkRateLimit } from '../../../shared/apex/rate-limit';
import { applySecurityHeaders, type AssetEnv } from '../../../shared/apex/security-headers';
import { withResolvedSecretValue } from '../../../shared/cloudflare/secrets-store';
import { setMeta } from '../../../shared/apex/seo';
import {
  buildRegionErrorPayload,
  getDefaultRedirectUrl,
  resolveRedirectUrl,
} from './root-redirect';
import { createBadRequestFallback, createNotFoundFallback } from './fallback-response';
import { renderHealthPage } from './health-page';
import { getAboutMeta, renderAboutContent } from './page-content';
import { renderer } from './renderer';

void languageDetector;

const app = new Hono<{ Bindings: AssetEnv }>();
const pageRoutes = new Hono<{ Bindings: AssetEnv }>();
const ORG_APEX_SENTRY_DSN_KEY = 'UMAXICA_APPS_EDGE_ORG_APEX_SENTRY_DSN';

app.use(etag());
app.use(logger());
app.use(languageDetector({ supportedLanguages: ['en', 'ja'], fallbackLanguage: 'en' }));
app.use(async (c, next) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RATE_LIMITER binding from wrangler.jsonc
  const blocked = await checkRateLimit(c.req.raw, (c.env as any)?.RATE_LIMITER);
  if (blocked) return blocked;
  await next();
});
app.use('*', (c, next) =>
  apexCsrf(c as unknown as Parameters<typeof apexCsrf>[0], next as Parameters<typeof apexCsrf>[1]),
);

app.use('*', async (c, next) => {
  await next();
  if (c.res.status !== 400 && c.res.status !== 404) {
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
  return c.json(buildRegionErrorPayload(), 400);
});

pageRoutes.use(renderer as unknown as Parameters<typeof pageRoutes.use>[0]);

pageRoutes.get('/about', timeout(2000), (c) => {
  setMeta(c, getAboutMeta(c.env));
  return c.render(renderAboutContent(c.get('language')));
});

app.onError(async (err, c) => {
  Sentry.captureException(err);

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

  return createBadRequestFallback(c);
});

app.get('/health', timeout(2000), (c) => renderHealthPage(c.env));

app.route('/', pageRoutes);
app.notFound(createNotFoundFallback);

const sentryHandler = Sentry.withSentry(
  (
    env?: AssetEnv & {
      UMAXICA_APPS_EDGE_ORG_APEX_SENTRY_DSN?: string;
      SENTRY_ENVIRONMENT?: string;
    },
  ) => ({
    dsn: env?.UMAXICA_APPS_EDGE_ORG_APEX_SENTRY_DSN,
    environment: env?.SENTRY_ENVIRONMENT,
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: 1.0,
  }),
  app,
);

export default {
  async fetch(request: Request, env: AssetEnv, ctx: Parameters<typeof sentryHandler.fetch>[2]) {
    const runtimeEnv = await withResolvedSecretValue(
      env as Record<string, unknown>,
      ORG_APEX_SENTRY_DSN_KEY,
    );
    return sentryHandler.fetch(request, runtimeEnv, ctx);
  },
  request: app.request.bind(app),
};
