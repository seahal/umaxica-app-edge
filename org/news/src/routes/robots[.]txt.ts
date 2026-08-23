import { createFileRoute } from '@tanstack/react-router';

import { CANONICAL_ORIGIN } from '../lib/canonical';

/*
 * Next generated this from `src/app/robots.ts` through its Metadata Route
 * convention. TanStack has no such convention, so the file is written out — and
 * the `Content-Type` that Next inferred is now stated, because nothing else
 * will.
 */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(`User-Agent: *\nAllow: /\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`, {
          headers: { 'Content-Type': 'text/plain' },
        }),
    },
  },
});
