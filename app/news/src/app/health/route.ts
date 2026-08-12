export function GET() {
  return Response.json(
    { status: 'ok' },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  );
}
