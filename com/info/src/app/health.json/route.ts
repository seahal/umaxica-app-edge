import { connection } from 'next/server';

/*
 * Which copy of this frame answered — the same role `service` plays in
 * `createApexApp(..., { service })` on the apex workers, and a build-time
 * literal for the same reason: it identifies the code, not the request.
 *
 * The three `info` frames are otherwise indistinguishable in every response.
 * The markup, the response headers and `/rails-health` are the same bytes on
 * all three, and the only per-brand value in the source — `PRIVATE_RAILS_ORIGIN`
 * in `src/lib/rails-client.ts` — never reaches a response. Without this route an
 * ingress that sent a sibling brand's hostname to this port would answer
 * exactly like a correct one, so "correct FQDN → correct application" would be unprovable
 * rather than merely unproven.
 *
 * `service` is deliberately NOT read from the `Host` header: a value echoed
 * back from the request proves nothing about which application received it.
 *
 * The path matches the apexes' `/health.json` so one Access Bypass rule,
 * `/health*`, keeps every surface machine-checkable.
 * See docs/operations/cloudflare-tunnel-development.md.
 */
const SERVICE = 'com';
const FRAME = 'info';

export async function GET() {
  // Forces dynamic rendering. A prerendered copy would freeze `time` at build
  // and stop distinguishing a live dev server from a stale deployed Worker,
  // which is the other half of what this route is for.
  await connection();

  return Response.json(
    {
      status: 'OK',
      service: SERVICE,
      frame: FRAME,
      environment: process.env.NODE_ENV ?? null,
      time: new Date().toISOString(),
    },
    { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  );
}
