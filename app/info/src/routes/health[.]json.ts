import { createFileRoute } from '@tanstack/react-router';

/*
 * Which copy of this frame answered — the same role `service` plays in
 * `createApexApp(..., { service })` on the apex workers, and a build-time
 * literal for the same reason: it identifies the code, not the request.
 *
 * The three `info` frames are otherwise indistinguishable in every response.
 * The markup and the response headers are the same bytes on all three, and the
 * only per-brand value in the source — `PRIVATE_RAILS_ORIGIN` in
 * `src/lib/rails-client.ts` — never reaches a response. Without this route an
 * ingress that sent a sibling brand's hostname to this port would answer exactly
 * like a correct one, so "correct FQDN → correct application" would be unprovable
 * rather than merely unproven.
 *
 * `service` is deliberately NOT read from the `Host` header: a value echoed back
 * from the request proves nothing about which application received it.
 *
 * The path matches the apexes' `/health.json` so one Access Bypass rule,
 * `/health*`, keeps every surface machine-checkable. The `[.]` in the filename
 * is TanStack Router's escape for a literal dot — an unescaped `.` would nest
 * this under `/health` as `/health/json`.
 * See docs/operations/cloudflare-tunnel-development.md.
 */
const SERVICE = 'app';
const FRAME = 'info';

// `environment` reports the build mode this Worker was produced with. Next read
// it from `process.env.NODE_ENV` through `Reflect.get`, because the
// Wrangler-generated `NodeJS.ProcessEnv` declared it as a non-optional literal
// while the runtime could genuinely lack it — so the route carried a `| null`
// branch and a test that deleted the variable to reach it.
//
// `import.meta.env.MODE` is replaced by a literal at build time, so it is a
// string on every code path and that branch is now unreachable. It is gone
// rather than kept as dead defence.
export const Route = createFileRoute('/health.json')({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          {
            status: 'OK',
            service: SERVICE,
            frame: FRAME,
            environment: import.meta.env.MODE,
            time: new Date().toISOString(),
          },
          { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        ),
    },
  },
});
