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
  '<title>リクエストを処理できませんでした — UMAXICA (APP)</title></head>' +
  '<body><main><h1>リクエストを処理できませんでした</h1><p>HTTP 429</p>' +
  '<a href="/">トップへ戻る</a></main></body></html>';

export function rateLimitedResponse(): Response {
  return new Response(RATE_LIMITED_DOCUMENT, {
    status: 429,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=UTF-8' },
  });
}

/*
 * The bucket a request with no `CF-Connecting-IP` counts against.
 *
 * Cloudflare sets that header on every request it forwards, so in production
 * this fallback is unreachable. It is reachable in `vite dev`, in `vite preview`
 * and on any future path that reaches this Worker without going through the
 * edge — and the previous spelling, `|| 'unknown'`, put every such request into
 * ONE shared bucket. A shared bucket is both a bypass (many clients sharing one
 * budget is only a restriction if they are the same client) and a denial of
 * service against everyone else in it: one caller can spend the whole budget and
 * lock out every other unattributable request.
 *
 * Keying by pathname instead keeps the fallback per-path rather than global. It
 * is deliberately NOT a fallthrough that skips the limiter: an unattributable
 * request is still counted, just not counted together with unrelated ones.
 */
function rateLimitKey(request: Request): string {
  const ip = request.headers.get('cf-connecting-ip');
  if (ip !== null && ip !== '') {
    return ip;
  }

  return `no-ip:${new URL(request.url).pathname}`;
}

/**
 * Returns the 429 document when the limiter refuses, and `null` when the
 * request may proceed — including when no limiter is bound at all.
 *
 * The document is bare: `src/request-handler.ts` puts the security headers on
 * it, in the same place it puts them on every other response this unit answers.
 */
export async function checkRateLimit(request: Request): Promise<Response | null> {
  const rateLimiter = getEdgeEnv().RATE_LIMITER;
  if (!rateLimiter) return null;

  const { success } = await rateLimiter.limit({ key: rateLimitKey(request) });
  return success ? null : rateLimitedResponse();
}
