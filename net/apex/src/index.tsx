/** @jsxImportSource hono/jsx */
import { timeout } from 'hono/timeout';

import { createApexApp } from './create-apex-app';
import { getAboutMeta, renderAboutContent } from './page-content';
import { setMeta } from './seo';

const app = createApexApp(
  (pageRoutes) => {
    pageRoutes.get('/', timeout(2000), (c) => c.redirect('/about', 301));

    pageRoutes.get('/about', timeout(2000), (c) => {
      setMeta(c, getAboutMeta(c.env, c.get('language')));
      return c.render(renderAboutContent(c.get('language')));
    });
  },
  { service: 'net' },
);

// Sentry: to re-enable, wrap app with Sentry.withSentry() and export the handler.
export default app;
