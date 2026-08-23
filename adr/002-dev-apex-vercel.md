# Plan 002: Create `dev/apex` — Hono on Vercel

## Status: Superseded 2026-08-19 by [ADR 012](012-apex-vite-build-and-static-assets.md)

**`dev/apex` no longer runs on Vercel.** It deploys to Cloudflare Workers on
the shared apex archetype, and the Vercel surface this record describes —
`vercel.json`, `api/index.ts` and `hono/vercel`'s `handle` — has been deleted.
The record is kept unedited below because it is the history of how the unit
came to exist, which is still true.

_Originally: Completed (partial — see Outcome)._

## GitHub Issue

https://github.com/seahal/umaxica-apps-edge/issues/248

## Problem

`umaxica.dev` is deployed on Vercel. There is currently no apex-layer Hono service for the `dev` domain. A lightweight `dev/apex` service is needed to handle:

- Root redirect (`/`) → `umaxica.dev`
- Health check (`/health`) → proxy and display Rails `/edge/v0/health` JSON
- About page (`/about`) → domain description

This plan targets a minimal, working setup that Vercel can deploy as a function without emitting a static JavaScript bundle.

## Approach

### Runtime Target: Vercel Edge Functions

Export the Hono app directly from `src/index.ts` so Vercel can treat it as a function entrypoint.

```ts
// src/index.ts
import { app } from './app';

export const runtime = 'edge';
export default app;
```

### Build Setup

No Vite build is needed. Keep the package build step limited to type-checking so the deployed output stays function-based.

### App Structure (`src/app.ts`)

Direct composition — no `createApexApp` factory.

```ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.redirect('https://umaxica.dev/', 301));
app.get('/health', handleHealth);
app.get('/about', handleAbout);

export { app };
```

### Routes

| Route         | Behaviour                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| `GET /`       | 301 redirect to `https://umaxica.dev/` (configurable via `DEV_CORE_URL` env) |
| `GET /health` | Fetch `${RAILS_API_URL}/edge/v0/health`, display JSON or error               |
| `GET /about`  | Static HTML describing the umaxica.dev apex domain                           |

### Vercel Config

No `vercel.json` is required. Vercel should auto-detect `src/index.ts` as the entrypoint and deploy it as a function.

### Environment Variables

| Variable        | Purpose                   | Dev value                          |
| --------------- | ------------------------- | ---------------------------------- |
| `RAILS_API_URL` | Base URL of Rails backend | `http://host.docker.internal:3000` |
| `DEV_CORE_URL`  | Redirect target for `/`   | `https://umaxica.dev`              |

## File Structure

```
dev/apex/
  src/
    app.ts          # Hono app, direct composition
    index.ts        # Vercel entry: export default app
    health.ts       # /health route handler
    about.ts        # /about route handler
  package.json
  tsconfig.json
```

## Changes to Repo Root

- `pnpm-workspace.yaml`: add `dev/apex` to packages list

## Dependencies

```json
{
  "dependencies": {
    "hono": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "@types/node": "catalog:"
  }
}
```

## Notes

- Keep the app stateless — no KV, no rate limiting (Vercel handles that at the CDN layer).
- Health route must not crash the worker when Rails is unreachable; it should return 200 with an error payload.
- No Tailwind, no JSX renderer — responses are plain HTML strings to keep the bundle tiny.

---

## Outcome

**Implemented and merged.**

### Changes Made

- `dev/apex/` workspace created with `src/app.ts`, `src/index.ts`, `package.json`, `tsconfig.json`
- `pnpm-workspace.yaml` — added `dev/apex`
- Routes: `GET /` → 301 redirect to `process.env.DEV_CORE_URL ?? 'https://umaxica.dev/'`; `GET /about` → bilingual HTML; `GET /health` → Worker's own health JSON
- Removed the Vite build path and `dev/apex/vercel.json`; Vercel should now serve the Hono function instead of the bundled source file

### Deviation from Plan

`GET /health` returns the Worker's own health status `{status:'ok', timestamp, service:'dev-apex'}` rather than proxying Rails `/edge/v0/health`. `RAILS_API_URL` is not used. This is intentional per the implementer — Rails proxy is tracked in plan/issue #247.

### Known Gap

No test files added for `dev/apex`. Consider adding smoke tests if the workspace grows.

### Verification

- `./node_modules/.bin/tsc --noEmit` in `dev/apex`: ✅ passes
- `pnpm dlx vercel build --yes`: blocked locally because the Vercel token is not valid in this environment
- `vp check` / `vp test`: not rerun here because the local `vp` wrapper currently fails to resolve `vite-plus/bin/vp`

> Superseded: Vite+ (`vp`) has since been removed. The equivalent commands are
> now `pnpm run check` and `pnpm run test`. Retained above as a historical record.

### Note on Deletion

After implementation, it was decided that this workspace was no longer necessary, and it has been intentionally removed from the repository.

### Note on Revival — 2026-08-12

**`dev/apex` exists again, deliberately, and is not going away.** The deletion
note above is history, not the current state; it was left standing long enough
that a reader could take it for the present tense.

The workspace is on disk with its own `package.json`, `vitest.config.ts`,
`vitest.setup.ts`, `.oxlintrc.json`, `.oxfmtrc.json`, `tsconfig.json` and
`knip.jsonc`, so it satisfies the standalone-unit contract
`test/deployment-unit-boundaries.test.ts` enforces. It is classified `external` in
`tools/workers-manifest.json` alongside `dev/acme` — Vercel-hosted, no wrangler
config, no Rails client, no VPC binding — and it has tests now, which closes the
"Known Gap" noted above.

### Note on Supersession — 2026-08-19

The Vercel hosting decided here was reversed by
[ADR 012](012-apex-vite-build-and-static-assets.md). `dev/apex` is now a
Cloudflare Worker built with Vite, classified `standalone` in
`tools/workers-manifest.json` rather than `external`, and `dev/acme` — named
above as its companion — was deleted along with the rest of the Vercel surface.

The two exceptions this record's hosting choice created are closed with it:
`dev/apex` is in the `test-api` CI matrix, because `vite dev` starts without the
interactive device authentication `vercel dev` required, and it carries a
`check:size` budget.

### Closes

https://github.com/seahal/umaxica-apps-edge/issues/248
