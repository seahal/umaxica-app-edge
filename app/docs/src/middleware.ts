import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

export async function middleware(request: NextRequest) {
  const { env } = getCloudflareContext() as { env: Partial<CloudflareEnv> };
  const rateLimiter = env.RATE_LIMITER;
  if (!rateLimiter) return NextResponse.next();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const { success } = await rateLimiter.limit({ key: ip });
  if (!success) {
    return new NextResponse(
      '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">' +
        '<title>リクエストを処理できませんでした — UMAXICA (APP)</title></head>' +
        '<body><main><h1>リクエストを処理できませんでした</h1><p>HTTP 429</p>' +
        '<a href="/">トップへ戻る</a></main></body></html>',
      {
        status: 429,
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=UTF-8' },
      },
    );
  }
  return NextResponse.next();
}
