import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import app from './index';

app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/favicon.ico', serveStatic({ root: './public' }));
app.use('/robots.txt', serveStatic({ root: './public' }));
app.use('/400.html', serveStatic({ root: './public' }));
app.use('/404.html', serveStatic({ root: './public' }));
app.use('/500.html', serveStatic({ root: './public' }));
app.use('/sitemap.xml', serveStatic({ root: './public' }));

const port = 5501;

serve(
  {
    fetch: app.fetch,
    port,
    hostname: '127.0.0.1',
  },
  (info) => {
    // eslint-disable-next-line no-console
    console.log(`dev/apex listening on http://127.0.0.1:${info.port}`);
  },
);
