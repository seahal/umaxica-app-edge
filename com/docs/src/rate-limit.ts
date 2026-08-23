import { getEdgeEnv } from './lib/cloudflare-env';

/*
 * First-touch rate limiting for this frame.
 *
 * The twelve content frames each carried this in `src/middleware.ts`, because
 * an OpenNext frame has no `worker.ts` and Next middleware was its only
 * first-touch hook (adr/010-first-touch-rate-limiting.md). This unit now owns
 * its server entry outright, so the check moved there — the same move the Cores
 * made — and Next's `matcher` went with it.
 *
 * The matcher is not replaced by anything, and does not need to be: Cloudflare
 * matches static assets BEFORE the Worker runs, so `_next/static`, the favicon
 * and the service worker never reached this code in the first place. That is
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
