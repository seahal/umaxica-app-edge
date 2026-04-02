import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      },
    );
  } catch {
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString() },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      },
    );
  }
}
