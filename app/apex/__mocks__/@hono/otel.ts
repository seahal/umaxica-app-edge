import type { MiddlewareHandler } from 'hono';

export const httpInstrumentationMiddleware = (): MiddlewareHandler => {
  return async (_c, next) => {
    await next();
  };
};
