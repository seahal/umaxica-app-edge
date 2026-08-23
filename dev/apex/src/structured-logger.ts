import { structuredLogger } from '@hono/structured-logger';

// @hono/structured-logger v1 stopped exporting BaseLogger, so the shape the
// middleware expects of a logger lives here now.
export type BaseLogger = {
  info(data: unknown, msg?: string): void;
  warn(data: unknown, msg?: string): void;
  error(data: unknown, msg?: string): void;
  debug(data: unknown, msg?: string): void;
};

function emit(level: 'info' | 'warn' | 'error' | 'debug', data: unknown, msg?: string) {
  const line = JSON.stringify(msg === undefined ? { level, data } : { level, msg, data });
  if (level === 'error') {
    // oxlint-disable-next-line no-console
    console.error(line);
  } else if (level === 'warn') {
    // oxlint-disable-next-line no-console
    console.warn(line);
  } else {
    // oxlint-disable-next-line no-console
    console.log(line);
  }
}

const consoleLogger: BaseLogger = {
  info: (data, msg) => emit('info', data, msg),
  warn: (data, msg) => emit('warn', data, msg),
  error: (data, msg) => emit('error', data, msg),
  debug: (data, msg) => emit('debug', data, msg),
};

// v1 also dropped the default hooks; these keep the request start/end/error
// lines the middleware used to emit on its own.
export const apexStructuredLogger = structuredLogger({
  createLogger: () => consoleLogger,
  onRequest: (logger, c) =>
    logger.info({ method: c.req.method, path: c.req.path }, 'request start'),
  onResponse: (logger, c, elapsedMs) =>
    logger.info(
      { method: c.req.method, path: c.req.path, status: c.res.status, elapsedMs },
      'request end',
    ),
  onError: (logger, err, c) =>
    logger.error(
      { err, method: c.req.method, path: c.req.path, status: c.res.status },
      'request error',
    ),
});
