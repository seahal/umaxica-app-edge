import type { APIRoute } from 'astro';

import { negotiateLocale } from '../i18n';

/*
 * `/` negotiates a language and redirects. There is deliberately no default
 * landing page — the plan calls for "デフォルトはないけど、どっちかにいってもらう".
 *
 * On-demand (not prerendered) so it can read `Accept-Language`. This is one of
 * only two Worker-served routes on this unit (the other is `/health`); every
 * real page is a static file. `redirectToDefaultLocale: false` in the i18n
 * config is what stops Astro generating its own `/` → `/ja/` redirect and
 * lets this endpoint own the negotiation.
 */
export const prerender = false;

export const GET: APIRoute = ({ request, url }) => {
  const locale = negotiateLocale(request.headers.get('accept-language'));
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(`/${locale}/`, url).href,
      'Cache-Control': 'no-store',
      Vary: 'Accept-Language',
    },
  });
};
