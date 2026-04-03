import { csrf } from 'hono/csrf';
import type { MiddlewareHandler } from 'hono';

const PRODUCTION_APEX_ORIGIN = /^https:\/\/umaxica\.(com|org|app|net)$/;
const LOCAL_APEX_ORIGIN = /^http:\/\/(com|org|app|net)\.localhost(?::\d+)?$/;
const PREVIEW_APEX_ORIGIN = /^https:\/\/[\w-]+\.workers\.dev$/;

export function isAllowedApexOrigin(origin?: string): boolean {
  if (!origin) {
    return false;
  }

  return (
    PRODUCTION_APEX_ORIGIN.test(origin) ||
    LOCAL_APEX_ORIGIN.test(origin) ||
    PREVIEW_APEX_ORIGIN.test(origin)
  );
}

export function apexCsrfMiddleware(): MiddlewareHandler {
  /* v8 ignore next 3 */
  return csrf({
    origin: (origin) => isAllowedApexOrigin(origin),
  });
}
