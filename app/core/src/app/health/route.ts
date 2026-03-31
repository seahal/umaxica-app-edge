import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      {
        status: 200,
        headers: { 'X-Robots-Tag': 'noindex, nofollow' },
      },
    );
  } catch {
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString() },
      {
        status: 503,
        headers: { 'X-Robots-Tag': 'noindex, nofollow' },
      },
    );
  }
}
