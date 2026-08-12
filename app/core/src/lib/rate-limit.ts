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
      '<main><h1>リクエストを処理できませんでした</h1><p>HTTP 429</p><a href="/">トップへ戻る</a></main>',
      {
        status: 429,
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=UTF-8' },
      },
    );
  }
  return null;
}
