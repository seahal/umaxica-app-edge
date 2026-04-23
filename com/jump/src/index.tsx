import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import { structuredLogger } from '@hono/structured-logger';

const app = new Hono();

app.use('*', requestId());
app.use(
  '*',
  structuredLogger({
    createLogger: () => console,
    onRequest: (logger, c) => {
      logger.info(
        {
          method: c.req.method,
          path: c.req.path,
          requestId: c.get('requestId'),
        },
        'request start',
      );
    },
    onResponse: (logger, c, elapsedMs) => {
      logger.info(
        {
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          requestId: c.get('requestId'),
          elapsedMs,
        },
        'request end',
      );
    },
    onError: (logger, err, c) => {
      logger.error(
        {
          err,
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          requestId: c.get('requestId'),
        },
        'request error',
      );
    },
  }),
);

app.get('/', (c) => c.text('OK'));

export default app;
