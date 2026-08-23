import { createFileRoute } from '@tanstack/react-router';

import { CANONICAL_ORIGIN } from '../lib/canonical';

/*
 * One entry, matching what `src/app/sitemap.ts` produced: the canonical home
 * page, weekly, priority 0.5. `/about` is deliberately absent here as it was
 * before — adding it is a content decision, not a migration one.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            '<url>\n' +
            `<loc>${CANONICAL_ORIGIN}/</loc>\n` +
            '<changefreq>weekly</changefreq>\n' +
            '<priority>0.5</priority>\n' +
            '</url>\n' +
            '</urlset>\n',
          { headers: { 'Content-Type': 'application/xml' } },
        ),
    },
  },
});
