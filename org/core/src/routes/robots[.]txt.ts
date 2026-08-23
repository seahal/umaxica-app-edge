import { createFileRoute } from '@tanstack/react-router';

import { CANONICAL_ORIGIN } from '@/lib/canonical';

/*
 * Next generated this from `src/app/robots.ts` through its Metadata Route
 * convention. TanStack has no such convention, so the file is written out — and
 * the `Content-Type` that Next inferred is now stated, because nothing else
 * will.
 *
 * The `Disallow` is this frame's own: the Core serves Rails-owned paths on the
 * same FQDN, and `/private/` is kept out of the index. The satellite frames have
 * no equivalent line.
 */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          `User-Agent: *\nAllow: /\nDisallow: /private/\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`,
          { headers: { 'Content-Type': 'text/plain' } },
        ),
    },
  },
});
