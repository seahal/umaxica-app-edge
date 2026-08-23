import { getEdgeEnv } from './lib/cloudflare-env';

/*
 * First-touch rate limiting for this frame.
 *
 * The check runs at this unit's own server entry — the first-touch position
 * `adr/010-first-touch-rate-limiting.md` requires, and the same place the Cores
 * run it from.
 *
 * There is no path matcher and none is needed: Cloudflare matches static assets
 * BEFORE the Worker runs, so the hashed bundles, the favicon and the service
 * worker never reach this code in the first place. That is
 * also why `run_worker_first` stays unset — turning it on would invoke the
 * Worker for every asset request, converting free static-asset serving into
 * billed invocations.
 *
 * An absent binding is a no-op, exactly as before: `vite dev` under
 * `CLOUDFLARE_ENV=local` has no rate limiter, and a local loop that
 * rate-limited itself would be a worse contract than one that does not.
 */
const RATE_LIMITED_DOCUMENT =
  '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">' +
  '<title>リクエストを処理できませんでした — UMAXICA (COM)</title></head>' +
  '<body><main><h1>リクエストを処理できませんでした</h1><p>HTTP 429</p>' +
  '<a href="/">トップへ戻る</a></main></body></html>';

export function rateLimitedResponse(): Response {
  return new Response(RATE_LIMITED_DOCUMENT, {
    status: 429,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=UTF-8' },
  });
}

/**
 * Returns the 429 document when the limiter refuses, and `null` when the
 * request may proceed — including when no limiter is bound at all.
 */
export async function checkRateLimit(request: Request): Promise<Response | null> {
  const rateLimiter = getEdgeEnv().RATE_LIMITER;
  if (!rateLimiter) return null;

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const { success } = await rateLimiter.limit({ key: ip });
  return success ? null : rateLimitedResponse();
}
