import type { APIRoute } from 'astro';

/*
 * Which copy of this frame answered — a build-time literal that identifies the
 * code, not the request. Ported from `src/routes/health[.]json.ts`.
 *
 * `service` is deliberately NOT read from the `Host` header. Prerendered: the
 * values are known at build time; `time` is the build time.
 */
export const prerender = true;

const SERVICE = 'com';
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
