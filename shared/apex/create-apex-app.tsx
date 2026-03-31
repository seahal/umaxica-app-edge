import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  etagMiddleware,
  rateLimitMiddleware,
  apexCsrfMiddleware,
  securityHeadersMiddleware,
  i18nMiddleware,
} from './middleware';
import { createNotFoundFallback } from './html/fallback-pages';
import { createHealthRoute, createAboutRoute, createRootRoute, handleHealthError } from './routes';

// Re-export types from routes for backward compatibility
export type { RootRedirectConfig, PageConfig, AboutConfig, Meta } from './routes';

interface RateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

interface AssetEnv {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  BRAND_NAME?: string;
  RATE_LIMITER?: RateLimiter;
}

// oxlint-disable-next-line no-explicit-any
type AnyMiddleware = any;

interface ApexConfig {
  rootHandler: 'redirect' | 'page';
  rootRedirect?: {
    resolveRedirectUrl: (regionParam: string | null | undefined) => string | null;
    getDefaultRedirectUrl: () => string | null;
    buildRegionErrorPayload: () => { error: string; message: string };
  };
  getRootMeta?: (env: AssetEnv) => {
    title?: string;
    pageTitle?: string;
    description?: string;
    canonical?: string;
    robots?: string;
  };
  renderRootContent?: (language: string | undefined) => unknown;
  getAboutMeta: (env: AssetEnv) => {
    title?: string;
    pageTitle?: string;
    description?: string;
    canonical?: string;
    robots?: string;
  };
  renderAboutContent: (language: string | undefined) => unknown;
  renderer: AnyMiddleware;
}

interface ApexBindings {
  Bindings: AssetEnv;
}

/**
 * Creates an apex Hono application with common middleware and routes.
 *
 * This function composes various middleware and routes to create a fully-configured
 * Hono application for apex domains. It supports both redirect and page handlers
 * for the root route.
 *
 * @example
 * ```typescript
 * const app = createApexApp({
 *   rootHandler: 'redirect',
 *   rootRedirect: { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload },
 *   getAboutMeta,
 *   renderAboutContent,
 *   renderer,
 * });
 * ```
 */
export function createApexApp(config: ApexConfig): Hono<ApexBindings> {
  const app = new Hono<ApexBindings>();

  // Apply middleware in order
  app.use(etagMiddleware());
  app.use(rateLimitMiddleware());
  app.use('*', apexCsrfMiddleware());
  app.use('*', securityHeadersMiddleware());
  app.use(i18nMiddleware());

  // Mount health route
  const healthRoute = createHealthRoute();
  app.route('/', healthRoute);

  // Mount root route (redirect or page)
  const rootRoute =
    config.rootHandler === 'redirect' && config.rootRedirect
      ? createRootRoute('redirect', config.renderer, config.rootRedirect)
      : config.rootHandler === 'page' && config.getRootMeta && config.renderRootContent
        ? createRootRoute('page', config.renderer, {
            getRootMeta: config.getRootMeta,
            renderRootContent: config.renderRootContent,
          })
        : null;

  if (rootRoute) {
    app.route('/', rootRoute);
  }

  // Mount about route
  const aboutRoute = createAboutRoute(config.renderer, {
    getAboutMeta: config.getAboutMeta,
    renderAboutContent: config.renderAboutContent,
  });
  app.route('/', aboutRoute);

  // Error handler
  app.onError(async (err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    // oxlint-disable-next-line no-console
    console.error('Unhandled apex error', {
      method: c.req.method,
      url: c.req.url,
      message: err instanceof Error ? err.message : /* v8 ignore start */ String(err),
      stack: err instanceof Error ? err.stack : undefined /* v8 ignore end */,
    });

    // For health endpoint errors, return 400 Bad Request with fallback page
    if (c.req.path === '/health') {
      return handleHealthError(c);
    }

    return c.text('Internal Server Error', 500);
  });

  // Not found handler
  app.notFound((c) => createNotFoundFallback(c));

  return app;
}

// Type exports for backward compatibility
export type { ApexConfig, ApexBindings, AssetEnv };
