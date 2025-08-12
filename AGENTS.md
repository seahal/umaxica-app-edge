# Repository Guidelines

## Project Structure & Modules

- Root: Cloudflare Workers project using Hono/Honox + Vite.
- `app/`: SSR app and routes grouped by host (e.g., `app/routes/jp.umaxica.app/*`, `app/routes/com.localdomain/*`).
  Shared entrypoints: `server.tsx`, `client.tsx`, `global.tsx`, assets in `app/public/`.
- `com/`, `org/`: Additional worker sites with their own `src/`, `public/`, and `.wrangler` configs.
- `test/`: Bun tests (`*.test.ts`).
- Config: `vite.config.ts` (root: `./app`, dev on port 4000), `tsconfig.json`, `lefthook.yml`, `biome.json`.

## Build, Test, Develop (Bun)

- Install: `bun install` (requires Bun). Confirm with `bun -v`.
- Dev: `bun run dev` → Vite at `http://localhost:4000`.
- Build: `bun run build` → production build for Workers.
- Preview: `bun run preview` → preview built app.
- Test: `bun test` or `bun run test`.
- Lint/format: `bun run lint`, `bun run format` (Biome)。
- Type check: `bun run typecheck`。
- Deploy: `bun run deploy`（build + `wrangler deploy`）。
- CF typegen: `bun run cf-typegen`。

## Coding Style & Naming

- Language: TypeScript (strict). JSX via Hono (`jsxImportSource: hono/jsx`).
- Formatting/linting: Biome. Use 2-space indentation, single quotes, trailing commas where valid.
- Routes: organize by host directory under `app/routes/<host>/<page>.tsx` (e.g., `index.tsx`, `about.tsx`). Components
  and utilities live under `app/src/`.

## Testing Guidelines

- Framework: `bun:test` with `happy-dom` for DOM.
- Location/pattern: `test/*.test.ts`.
- Run: `bun test` or `npm run test`.
- Aim for meaningful unit tests of route handlers and utilities; prefer fast, isolated tests.

## Commits & Pull Requests

- Commits: short, imperative subject; include a bracketed scope when helpful (e.g., `[system]`, `[misc]`). Group related
  changes; keep noisy refactors separate.
- PRs: clear description, linked issues, steps to test, and screenshots/GIFs for UI changes. Ensure CI passes and hooks
  are clean.

## Security & Config

- Local env: `.dev.vars` is for development host mapping. Do not commit secrets. Use `wrangler secret put <NAME>` for
  production.
- Bindings/types: keep `wrangler.jsonc` in sync and regenerate with `npm run cf-typegen` after changes.
