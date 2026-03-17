import { Hono } from 'hono';
import { apexCsrf } from './csrf';
import { createBadRequestFallback, createNotFoundFallback } from './fallback-response';
import { renderHealthPage } from './health-page';
import { etag } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';
import { languageDetector } from 'hono/language';
import { logger } from 'hono/logger';
import { timeout } from 'hono/timeout';
import { checkRateLimit } from './rate-limit';
import { applySecurityHeaders, type AssetEnv } from './security-headers';
import { setMeta } from './seo';
import type { Meta } from './seo';

type RootRedirectConfig = {
  resolveRedirectUrl: (regionParam: string | null | undefined) => string | null;
  getDefaultRedirectUrl: () => string | null;
  buildRegionErrorPayload: () => { error: string; message: string };
};

// oxlint-disable-next-line no-explicit-any
type AnyMiddleware = any;

type ApexConfig = {
  rootHandler: 'redirect' | 'page';
  rootRedirect?: RootRedirectConfig;
  getRootMeta?: (env: AssetEnv) => Meta;
  renderRootContent?: (language: string | undefined) => unknown;
  getAboutMeta: (env: AssetEnv) => Meta;
  renderAboutContent: (language: string | undefined) => unknown;
  renderer: AnyMiddleware;
};

export function createApexApp(config: ApexConfig): Hono<{ Bindings: AssetEnv }> {
  const app = new Hono<{ Bindings: AssetEnv }>();
  const pageRoutes = new Hono<{ Bindings: AssetEnv }>();

  app.use(etag());
  app.use(logger());
  app.use(async (c, next) => {
    const blocked = await checkRateLimit(c.req.raw, c.env?.RATE_LIMITER);
    if (blocked) return blocked;
    await next();
  });
  app.use('*', (c, next) =>
    apexCsrf(
      c as unknown as Parameters<typeof apexCsrf>[0],
      next as Parameters<typeof apexCsrf>[1],
    ),
  );
  app.use('*', async (c, next) => {
    await next();
    if (c.res.status !== 400 && c.res.status !== 404) {
      applySecurityHeaders(c);
    }
  });
  app.use(languageDetector({ supportedLanguages: ['en', 'ja'], fallbackLanguage: 'en' }));

  if (config.rootHandler === 'redirect' && config.rootRedirect) {
    const { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload } =
      config.rootRedirect;
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
  }

  pageRoutes.use(config.renderer);

  if (config.rootHandler === 'page' && config.getRootMeta && config.renderRootContent) {
    const { getRootMeta, renderRootContent } = config;
    pageRoutes.get('/', timeout(2000), (c) => {
      setMeta(c, getRootMeta(c.env));
      return c.render(renderRootContent(c.get('language')) as string);
    });
  }

  pageRoutes.get('/about', timeout(2000), (c) => {
    setMeta(c, config.getAboutMeta(c.env));
    return c.render(config.renderAboutContent(c.get('language')) as string);
  });

  app.onError(async (err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    // oxlint-disable-next-line no-console
    console.error('Unhandled apex error', {
      method: c.req.method,
      url: c.req.url,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    return createBadRequestFallback(c as unknown as Parameters<typeof createBadRequestFallback>[0]);
  });

  app.get('/health', timeout(2000), (c) =>
    renderHealthPage(c.env as unknown as Parameters<typeof renderHealthPage>[0]),
  );

  app.route('/', pageRoutes);
  app.notFound(createNotFoundFallback as unknown as Parameters<typeof app.notFound>[0]);

  return app;
}
