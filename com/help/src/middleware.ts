import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const { env } = getCloudflareContext() as { env: Partial<CloudflareEnv> };
  const rateLimiter = env.RATE_LIMITER;
  if (!rateLimiter) {
    return NextResponse.next();
  }

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const { success } = await rateLimiter.limit({ key: ip });
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  return NextResponse.next();
}
