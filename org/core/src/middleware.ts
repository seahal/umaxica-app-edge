import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './lib/rate-limit';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const { env } = getCloudflareContext() as { env: Partial<CloudflareEnv> };
  const blocked = await checkRateLimit(request, env.RATE_LIMITER);
  return blocked ?? NextResponse.next();
}
