import { createFileRoute } from '@tanstack/react-router';

import { CANONICAL_ORIGIN } from '@/lib/canonical';

/*
 * One entry, matching what `src/app/sitemap.ts` produced. The `<loc>` carries no
 * trailing slash, which is how this frame has always advertised itself and is
 * the one place it differs from the satellites.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            '<url>\n' +
            `<loc>${CANONICAL_ORIGIN}</loc>\n` +
            '<changefreq>weekly</changefreq>\n' +
            '<priority>0.5</priority>\n' +
            '</url>\n' +
            '</urlset>\n',
          { headers: { 'Content-Type': 'application/xml' } },
        ),
    },
  },
});
