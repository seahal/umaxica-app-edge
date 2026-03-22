import { etag } from 'hono/etag';
import type { MiddlewareHandler } from 'hono';

export function etagMiddleware(): MiddlewareHandler {
  return etag();
}
