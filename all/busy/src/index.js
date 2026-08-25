/**
 * Serve the maintenance HTML as 503 so crawlers keep the live index
 * and retry later. Favicon is excluded via `run_worker_first` and served
 * as a static asset.
 *
 * The binding is typed here rather than by `wrangler types`: this Worker has no
 * package.json and no tsconfig of its own, so nothing generates or reads a
 * `worker-configuration.d.ts` for it. `ASSETS` is the only binding it has.
 *
 * @typedef {{ ASSETS: { fetch(input: Request | string | URL): Promise<Response> } }} Env
 */
export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    const page = await env.ASSETS.fetch(new URL('/', request.url));
    const headers = new Headers(page.headers);
    headers.set('Retry-After', '3600');
    headers.set('Cache-Control', 'no-store');
    return new Response(page.body, { status: 503, statusText: 'Service Unavailable', headers });
  },
};
