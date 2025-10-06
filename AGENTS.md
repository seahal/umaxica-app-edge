# Repository Guidelines

## Project Structure & Module Organization
- Root is a Cloudflare Workers monorepo using Hono/Honox + Vite (SSR).
- App site: `app/`
  - Routes grouped by host: `app/routes/<host>/*` (e.g., `app/routes/jp.umaxica.app/index.tsx`).
  - Shared entries: `server.tsx`, `client.tsx`, `global.tsx`; static assets in `app/public/`.
  - Reusable components/utilities in `app/src/`.
- Additional worker sites: `com/`, `org/` (each has `src/`, `public/`, and its own `.wrangler` config).
- Tests: `test/*.test.ts`.
- Key config: `vite.config.ts` (root `./app`, dev on `:4000`), `tsconfig.json`, `lefthook.yml`, `biome.json`.

## Build, Test, and Development Commands
- Install deps: `bun install` (requires Bun; verify with `bun -v`).
- Dev server: `bun run dev` → Vite at `http://localhost:4000`.
- Build workers: `bun run build`.
- Preview built app: `bun run preview`.
- Test: `bun run test` (Vitest).
- Lint/format: `bun run lint`, `bun run format` (Biome).
- Type check: `bun run typecheck`.
- Deploy: `bun run deploy` (build + `wrangler deploy`).
- CF bindings types: `bun run cf-typegen`.

## Coding Style & Naming Conventions
- Formatting: Biome — 2-space indent, single quotes, trailing commas.
- Route files live under `app/routes/<host>/` using clear names like `index.tsx`, `about.tsx`.
- Keep components/hooks/utils under `app/src/`; prefer descriptive filenames.

## Testing Guidelines
- Framework: Vitest with `happy-dom` for DOM.
- Location: `test/*.test.ts`; name files after the unit under test.
- Run with `bun run test`. Favor fast, isolated unit tests for route handlers and utilities.

## Commit & Pull Request Guidelines
- Commits: short, imperative subject; optional bracketed scope (e.g., `[system]`, `[misc]`). Group related changes; keep refactors separate.
- PRs: clear description, linked issues, steps to test, and screenshots/GIFs for UI changes. Ensure CI hooks are clean and tests pass.

## Security & Configuration Tips
- Do not commit secrets. Use `.dev.vars` only for local dev mapping.
- For production, store secrets with `wrangler secret put <NAME>`.
- Keep `wrangler.jsonc` in sync with bindings and rerun `bun run cf-typegen` after changes.
