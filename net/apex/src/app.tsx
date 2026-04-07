import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  apexCsrfMiddleware,
  etagMiddleware,
  i18nMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
} from '../../../shared/apex/middleware';
import {
  createAboutRoute,
  createHealthRoute,
  createRootRoute,
  handleHealthError,
} from '../../../shared/apex/routes';
import { createNotFoundFallback } from '../../../shared/apex/html/fallback-pages';
import {
  getAboutMeta,
  getRootMeta,
  renderAboutContent,
  renderRootContent,
} from './page-content';
import { renderer } from './renderer';

import type { ApexBindings } from '../../../shared/apex/create-apex-app';

const app = new Hono<ApexBindings>();

app.use(etagMiddleware());
app.use(rateLimitMiddleware());
app.use('*', apexCsrfMiddleware());
app.use('*', securityHeadersMiddleware());
app.use(i18nMiddleware());

app.route('/', createHealthRoute());
app.route(
  '/',
  createRootRoute('page', renderer, {
    getRootMeta,
    renderRootContent,
  }),
);
app.route('/', createAboutRoute(renderer, { getAboutMeta, renderAboutContent }));

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

app.notFound((c) => createNotFoundFallback(c));

export { app };
