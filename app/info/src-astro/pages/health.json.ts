import type { APIRoute } from 'astro';

/*
 * Which copy of this frame answered — a build-time literal that identifies the
 * code, not the request. Ported from `src/routes/health[.]json.ts`.
 *
 * Without this route an ingress that sent a sibling brand's hostname to this
 * deployment would answer exactly like a correct one, so "correct FQDN → correct
 * application" would be unprovable. `service` is deliberately NOT read from the
 * `Host` header.
 *
 * Prerendered: the values are all known at build time. `time` is the build time
 * rather than the request time — the TanStack unit stamped `new Date()` per
 * request, but this route never touched Rails and its freshness signal is not
 * load-bearing (the machine-checkable liveness answer is `/health`).
 */
export const prerender = true;

const SERVICE = 'app';
const FRAME = 'info';
const BUILT_AT = new Date().toISOString();

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      status: 'OK',
      service: SERVICE,
      frame: FRAME,
      environment: import.meta.env.MODE,
      time: BUILT_AT,
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  );
