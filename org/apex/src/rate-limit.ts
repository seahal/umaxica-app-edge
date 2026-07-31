export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

function routePrefix(pathname: string): string {
  return pathname.split('/').filter(Boolean)[0] ?? 'root';
}

export async function checkRateLimit(
  request: Request,
  rateLimiter: RateLimiter | undefined,
): Promise<Response | null> {
  if (!rateLimiter) return null;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const prefix = routePrefix(new URL(request.url).pathname);
  const { success } = await rateLimiter.limit({ key: `${prefix}:${ip}` });
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
  return null;
}
