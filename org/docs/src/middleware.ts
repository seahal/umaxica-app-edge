import { defineMiddleware } from 'astro:middleware';

import { withSecurityHeaders } from './lib/security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (path === '/offline/') {
    return context.rewrite('/offline');
  }
  const response = await next();
  return withSecurityHeaders(response, import.meta.env.PROD);
});
