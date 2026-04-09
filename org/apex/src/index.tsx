import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  etagMiddleware,
  rateLimitMiddleware,
  apexCsrfMiddleware,
  securityHeadersMiddleware,
  i18nMiddleware,
} from '../../../shared/apex/middleware';
import {
  createHealthRoute,
  createAboutRoute,
  createRootRoute,
  handleHealthError,
} from '../../../shared/apex/routes';
import { createNotFoundFallback } from '../../../shared/apex/html/fallback-pages';
import { createRootRedirect } from '../../../shared/apex/root-redirect';
import { getAboutMeta, renderAboutContent } from './page-content';
import { renderer } from './renderer';

import type { ApexBindings } from '../../../shared/apex/create-apex-app';

const { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload } =
  createRootRedirect('umaxica.org');

const app = new Hono<ApexBindings>();

// Shared middleware
app.use(etagMiddleware());
app.use(rateLimitMiddleware());
app.use('*', apexCsrfMiddleware());
app.use('*', securityHeadersMiddleware());
app.use(i18nMiddleware());

// Routes
app.route('/', createHealthRoute());
app.route(
  '/',
  createRootRoute('redirect', renderer, {
    resolveRedirectUrl,
    getDefaultRedirectUrl,
    buildRegionErrorPayload,
  }),
);
app.route('/', createAboutRoute(renderer, { getAboutMeta, renderAboutContent }));

// Error handler
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

  if (c.req.path === '/health') {
    return handleHealthError(c);
  }

  return c.text('Internal Server Error', 500);
});

// Not found handler
app.notFound((c) => createNotFoundFallback(c));

// Sentry: to re-enable, wrap app with Sentry.withSentry() and export the handler.
export default app;
