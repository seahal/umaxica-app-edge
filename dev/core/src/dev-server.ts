import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import app from './index';

const statusPublicRoot = '../status/public';

app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/favicon.ico', serveStatic({ root: statusPublicRoot }));
app.use('/robots.txt', serveStatic({ root: './public' }));
app.use('/400.html', serveStatic({ root: './public' }));
app.use('/500.html', serveStatic({ root: './public' }));
app.use('/sitemap.xml', serveStatic({ root: './public' }));

const port = 5501;

serve(
  {
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
  },
  (info) => {
    // eslint-disable-next-line no-console
    console.log(`dev/core listening on http://127.0.0.1:${info.port}`);
  },
);
