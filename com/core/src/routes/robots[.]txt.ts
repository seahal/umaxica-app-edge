import { createFileRoute } from '@tanstack/react-router';

import { CANONICAL_ORIGIN } from '@/lib/canonical';

/*
 * An ordinary server route. TanStack has no metadata-file convention, so the
 * body is written out here and the `Content-Type` is stated explicitly, because
 * nothing else will infer it.
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
