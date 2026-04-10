# Plan 002: Create `dev/apex` — Vite + Hono on Vercel

## Status: Completed (partial — see Outcome)

## GitHub Issue

https://github.com/seahal/umaxica-apps-edge/issues/248

## Problem

`dev/core` (umaxica.dev) is deployed on Vercel as a Next.js app. There is currently no apex-layer Hono service for the `dev` domain. A lightweight `dev/apex` service is needed to handle:

- Root redirect (`/`) → `dev/core` (umaxica.dev)
- Health check (`/health`) → proxy and display Rails `/edge/v0/health` JSON
- About page (`/about`) → domain description

Previously, attempts to combine Vite + Hono for Vercel failed. This plan targets a minimal, working setup.

## Approach

### Runtime Target: Vercel Edge Functions

Use Hono's `hono/vercel` adapter, which exports a `handle(app)` function compatible with Vercel's Edge Runtime.

```ts
// src/index.ts
import { handle } from 'hono/vercel';
import { app } from './app';

export const runtime = 'edge';
export default handle(app);
```

### Vite Config

No `@cloudflare/vite-plugin`. Use a plain Vite config that builds to a Node-compatible ESM bundle. The entry point is `src/index.ts`.

```ts
// vite.config.ts
import { defineConfig } from 'vite-plus';
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rollupOptions: { external: ['hono', 'hono/vercel'] },
  },
});
```

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

No `vercel.json` is required. Vercel auto-detects `src/index.ts` as the Hono entrypoint, and `export const runtime = 'edge'` keeps the deployment on the Edge Runtime.

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
    index.ts        # Vercel Edge entry: export default handle(app)
    health.ts       # /health route handler
    about.ts        # /about route handler
  vite.config.ts
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
    "vite": "catalog:",
    "vite-plus": "catalog:",
    "typescript": "catalog:",
    "@types/node": "catalog:"
  }
}
```

## Notes

- `hono/vercel` requires Edge Runtime; do not use Node.js-only APIs.
- Keep the app stateless — no KV, no rate limiting (Vercel handles that at the CDN layer).
- Health route must not crash the worker when Rails is unreachable; it should return 200 with an error payload.
- No Tailwind, no JSX renderer — responses are plain HTML strings to keep the bundle tiny.

---

## Outcome

**Implemented and merged.**

### Changes Made

- `dev/apex/` workspace created with `src/app.ts`, `src/index.ts`, `vite.config.ts`, `package.json`, `tsconfig.json`
- `pnpm-workspace.yaml` — added `dev/apex`
- Uses `hono/vercel` Edge adapter (`export const runtime = 'edge'`)
- Routes: `GET /` → 301 redirect to `process.env.DEV_CORE_URL ?? 'https://umaxica.dev/'`; `GET /about` → bilingual HTML; `GET /health` → Worker's own health JSON
- Removed `dev/apex/vercel.json` after Vercel rejected the `functions.runtime = "edge"` schema

### Deviation from Plan

`GET /health` returns the Worker's own health status `{status:'ok', timestamp, service:'dev-apex'}` rather than proxying Rails `/edge/v0/health`. `RAILS_API_URL` is not used. This is intentional per the implementer — Rails proxy is tracked in plan/issue #247.

### Known Gap

No test files added for `dev/apex`. Consider adding smoke tests if the workspace grows.

### Verification

- `./node_modules/.bin/tsc --noEmit` in `dev/apex`: ✅ passes
- `pnpm dlx vercel build --yes`: blocked locally because the Vercel token is not valid in this environment
- `vp check` / `vp test`: not rerun here because the local `vp` wrapper currently fails to resolve `vite-plus/bin/vp`

### Closes

https://github.com/seahal/umaxica-apps-edge/issues/248
