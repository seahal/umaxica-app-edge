import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { httpInstrumentationMiddleware } from '@hono/otel';
import {
  etagMiddleware,
  rateLimitMiddleware,
  apexCsrfMiddleware,
  securityHeadersMiddleware,
  i18nMiddleware,
} from '../../../shared/apex/middleware';
import { createAboutRoute, createRootRoute, handleHealthError } from '../../../shared/apex/routes';
import { createNotFoundFallback } from '../../../shared/apex/html/fallback-pages';
import { createRootRedirect } from '../../../shared/apex/root-redirect';
import { getAboutMeta, renderAboutContent } from './page-content';
import { buildHealthPageHtml } from './site';
import { renderer } from './renderer';

import type { ApexBindings } from '../../../shared/apex/create-apex-app';

const BRAND_NAME = process.env.BRAND_NAME ?? 'UMAXICA';

const { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload } =
  createRootRedirect('umaxica.app');

const app = new Hono<ApexBindings>();

// OpenTelemetry — outermost middleware to trace the full request lifecycle
app.use(httpInstrumentationMiddleware());

// Shared middleware
app.use(etagMiddleware() as unknown as Parameters<typeof app.use>[0]);
app.use(rateLimitMiddleware() as unknown as Parameters<typeof app.use>[0]);
app.use('*', apexCsrfMiddleware() as unknown as Parameters<typeof app.use>[1]);
app.use('*', securityHeadersMiddleware() as unknown as Parameters<typeof app.use>[1]);
app.use(i18nMiddleware() as unknown as Parameters<typeof app.use>[0]);

// Routes
app.get('/health', (c) => {
  const timestampIso = new Date().toISOString();
  const brandName = c.env?.BRAND_NAME ?? BRAND_NAME;
  const html = buildHealthPageHtml(brandName, timestampIso);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
});

app.route(
  '/',
  createRootRoute('redirect', renderer, {
    resolveRedirectUrl,
    getDefaultRedirectUrl,
    buildRegionErrorPayload,
  }) as unknown as Parameters<typeof app.route>[1],
);
app.route(
  '/',
  createAboutRoute(renderer, { getAboutMeta, renderAboutContent }) as unknown as Parameters<
    typeof app.route
  >[1],
);

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
    return handleHealthError(c as unknown as Parameters<typeof handleHealthError>[0]);
  }

  return c.text('Internal Server Error', 500);
});

// Not found handler
app.notFound((c) =>
  createNotFoundFallback(c as unknown as Parameters<typeof createNotFoundFallback>[0]),
);

export { app };
