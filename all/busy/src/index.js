/**
 * Serve the maintenance HTML as 503 so crawlers keep the live index
 * and retry later. Favicon is excluded via `run_worker_first` and served
 * as a static asset.
 */
export default {
  async fetch(request, env) {
    const page = await env.ASSETS.fetch(new URL('/', request.url));
    const headers = new Headers(page.headers);
    headers.set('Retry-After', '3600');
    headers.set('Cache-Control', 'no-store');
    return new Response(page.body, { status: 503, statusText: 'Service Unavailable', headers });
  },
};
