import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getTimestamp() {
  return new Date().toISOString();
}

function getFallbackTimestamp() {
  const now = new Date();

  try {
    return now.toISOString();
  } catch {
    return now.toUTCString();
  }
}

export async function GET() {
  try {
    const timestamp = getTimestamp();

    return NextResponse.json(
      { status: 'ok', timestamp },
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
      { status: 'error', timestamp: getFallbackTimestamp() },
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

// Healthz endpoint for compatibility
export async function GET_healthz() {
  return GET();
}
