export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export async function checkRateLimit(
  request: Request,
  rateLimiter: RateLimiter | undefined,
): Promise<Response | null> {
  if (!rateLimiter) return null;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const { success } = await rateLimiter.limit({ key: ip });
  if (!success) {
    return new Response(
      '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">' +
        '<title>リクエストを処理できませんでした — UMAXICA (COM)</title></head>' +
        '<body><main><h1>リクエストを処理できませんでした</h1><p>HTTP 429</p>' +
        '<a href="/">トップへ戻る</a></main></body></html>',
      {
        status: 429,
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=UTF-8' },
      },
    );
  }
  return null;
}
