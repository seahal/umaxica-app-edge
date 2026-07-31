# Context

Continuation of the earlier issue-triage session (7 stale/implemented/obsolete
issues already closed: #6, #151, #249, #257, #258, #274, #276). The user
reviewed the remaining 9 open issues and gave concrete direction on each:

- **#275** (next/image, next/font) — wants Cloudflare Images/next-image
  adopted since the stack already uses Next.js on Cloudflare.
- **#273** (remove dormant Sentry/OpenTelemetry) — go ahead and remove Sentry.
- **#271** (@hono/structured-logger) — believed not doable (target folder
  missing).
- **#247** (Rails health check) / **#260** (rate limiting) — expand scope to
  everywhere Cloudflare Workers is used, not just the original narrow scope.
- **#269** (jump.umaxica redirect workers) — already migrated to a separate
  project (`umaxica-apps-edge-jump`); leave untouched, no action.
- **#277** (parseWithZod convention) — drop the convention (Option B).

Three research agents then investigated the actual codebase against each
claim (issue bodies are often stale/inaccurate — as already proven with the 7
closed issues), and the user answered two follow-up clarifications. This plan
converts those findings + decisions into concrete engineering work per issue.

# Issue-by-issue plan

## #275 — next/image / next/font: **close, no code change**

Investigation found the premise already satisfied:

- `next/font` (`Inter` from `next/font/google`) is already used in every
  `{app,com,org}/core/src/app/layout.tsx`.
- Zero `<img>` tags exist anywhere in those three workspaces' `src/` — nothing
  to convert to `next/image`.
- `next.config.ts` already has an `images` block (`./image-config.ts`,
  identical per frame) and `wrangler.jsonc` already declares the Cloudflare
  `IMAGES` binding, wired implicitly via OpenNext (no custom loader needed).

User confirmed: close as already-satisfied. **Action:** `gh issue close 275`
with a comment noting fonts are done and there are no `<img>` tags to migrate.

## #273 — remove dormant Sentry: **real implementation, ~15 workspaces**

Correcting the issue's stale claims: there is **no OpenTelemetry** anywhere in
`app/com/org` workspaces (only `dev/acme`, explicitly out of scope), and
**no Sentry in any `*/apex`** — both false leads in the issue body. What
actually exists: `@sentry/nextjs`, wired identically, in all 15
`{app,com,org}/{core,docs,news,help,info}` workspaces, with
`NEXT_PUBLIC_SENTRY_DSN` set to an **empty string** in every `wrangler.jsonc`
— confirming Sentry is genuinely unconfigured/dormant everywhere.

**Per-workspace removal pattern** (identical in each of the 15; representative
paths from `app/core`, repeat for all 15):

- Delete `sentry.server.config.ts`, `sentry.edge.config.ts`
- In `next.config.ts`: remove `import { withSentryConfig } from '@sentry/nextjs'`
  and unwrap the `withSentryConfig(nextConfig, {...})` call back to a plain
  `export default nextConfig`
- In `package.json`: remove the `@sentry/nextjs` dependency
- In `wrangler.jsonc`: remove the `NEXT_PUBLIC_SENTRY_DSN` var (both
  `env.development.vars` and `env.production.vars`)

**Verification:** `pnpm install`, then `pnpm run --filter <ws> build` for a
couple of representative workspaces, `pnpm run typecheck`, `pnpm run test`.
Grep afterward: `grep -rl "sentry" --include=*.ts --include=*.json .` (case
insensitive) should return nothing under `app/com/org`.

## #247 — Rails backend health check in apex `/health`: **implement in app/apex, com/apex, org/apex only**

Existing reusable pattern already solved in `{app,com,org}/core`:

- `src/lib/rails-client.ts` — Cloudflare VPC-binding-based client (NOT a
  `RAILS_API_URL` fetch as the issue assumed), with path validation, header
  stripping, `AbortSignal.timeout(5000)`, and a discriminated-union result
  type (`ok | http-error | unreachable | invalid-path`).
- `src/lib/rails-health.ts` — wraps it for `/health/liveness.json`, returning
  `ok | http-error | unreachable | not-configured`.

**Plan:**

1. Add a `vpc_services` binding (`UMAXICA_APPS_EDGE_CF_WORKERS_VPC`) to each
   of `app/apex/wrangler.jsonc`, `com/apex/wrangler.jsonc`,
   `org/apex/wrangler.jsonc` (dev + prod envs) — mirroring the sibling
   `*/core` block. **Verify the correct `service_id` per frame first** (do
   not blindly copy core's — apex may need its own VPC service registration;
   confirm via Cloudflare dashboard/`wrangler` before writing the binding).
2. Port `rails-client.ts` + a trimmed `rails-health.ts` into each apex's
   `src/` (per-frame duplicated copies, consistent with this repo's AHA
   architecture — no `shared/`), reusing the existing hostname convention
   (`core.app.localhost:3000`, etc. — apex hits the same Rails backend per
   frame as core does).
3. Extend `renderHealthJson`/`renderHealthPage` in each apex's
   `health-page.ts` to call `checkRailsHealth()` and merge the result into
   the existing `{status, service, version, edge, time}` payload as a new
   `rails` field.
4. Reconcile timeouts: the apex route currently wraps `/health` in Hono's
   `timeout(2000)` middleware, but the Rails client's internal timeout is
   5000ms — shorten `RAILS_FETCH_TIMEOUT_MS` to something under the route
   timeout (e.g. 1500ms) so a slow Rails backend can't get killed mid-flight
   in a way that produces a wrong/empty response.
5. **net/apex is excluded** — it has no VPC binding, no `net/core`
   counterpart, and no Rails backend to check (`umaxica.net` is a static
   about/redirect site). Provisioning a backend for it would be a separate,
   larger initiative, not part of this issue.
6. docs/news/help/info workspaces: confirmed no health route, no Rails
   interaction — out of scope, no action.

**Verification:** `pnpm run --filter app/apex dev` (and com/org), curl
`/health.json` locally against a running Rails dev server on
`localhost:3000`, confirm the `rails` field appears with the right
ok/unreachable state; `pnpm run typecheck`, `pnpm run test`.

## #260 — Rate limiting coverage: **enable enforcement everywhere the binding already exists**

Correcting the issue's claim that core has no binding: **every workspace
already declares `RATE_LIMITER` in `wrangler.jsonc`** (all 4 apex + all 3 core

- all 12 docs/news/help/info — 19 files total). The binding is simply never
  invoked outside apex. Apex's own key strategy is also flagged as weak (raw
  `cf-connecting-ip` only, no path/user differentiation).

**Plan:**

1. **`{app,com,org}/core`**: add a `middleware.ts` (Next.js edge middleware)
   that calls the existing `RATE_LIMITER` binding via `getCloudflareContext()`
   and returns 429 on rejection — same pattern/shape as apex's
   `checkRateLimit`, ported per-frame (duplicated, not shared, per AHA).
2. **`{app,com,org}/{docs,news,help,info}`**: since these are static content
   sites with no forms/mutations, add the same lightweight `middleware.ts`
   enforcement purely as edge-level scrape/DoS protection (low priority but
   low effort since the binding is already declared) — a single global limit
   is enough, no per-path tiering needed here.
3. **Apex key-strategy fix** (`*/apex/src/rate-limit.ts`, 4 copies): replace
   the flat `key: ip` with a composite key (e.g. route-prefix + IP) so one
   abusive path can't exhaust the limit for the whole worker. Keep it simple
   — no need for the full tiered anon/authenticated namespace scheme from the
   original issue text unless a concrete need shows up later.
4. Skip: JA3/JA4 fingerprint or `cf.botManagement`-based keys — no existing
   usage in this codebase and out of scope for this pass.

**Verification:** `pnpm run --filter <core-ws> dev`, hammer an endpoint past
the 2000/60s limit locally (or via `wrangler dev --remote` since local
`ratelimits` binding simulation has limits), confirm 429s; `pnpm run
typecheck`, `pnpm run test`.

## #271 — @hono/structured-logger: **implement in apex only (app, com, org, net)**

`@hono/structured-logger` is actually released on npm (`0.1.0`), contrary to
the issue's "after npm release" gate — that blocker is gone. The issue's
"jump workers" half is moot (no `jump/` folders exist in this repo; migrated
to the separate `umaxica-apps-edge-jump` project). User confirmed: implement
in the 4 apex workspaces only.

**Plan:** add `@hono/structured-logger` as a dependency and wire it as
middleware in each `*/apex/src/create-apex-app.ts` (4 per-frame copies),
following the package's standard Hono middleware usage. Update the
AI-implementation-prompt-style checklist from the issue (drop the jump
references) when closing/commenting.

**Verification:** `pnpm run --filter app/apex dev`, confirm structured log
lines appear in console/wrangler tail; `pnpm run typecheck`, `pnpm run test`.

## #269 — jump.umaxica redirect workers: **no action**

User confirmed this is already handled by the separate
`umaxica-apps-edge-jump` project. Leave the issue open and untouched — no
code changes, no closing comment, nothing to do here in this repo.

## #277 — parseWithZod convention: **close via Option B, no code change needed**

User chose Option B (drop the convention). Verified there is nothing to
actually remove: no `zod.ts` file exists anywhere in the repo, and
`AGENTS.md` (root) doesn't currently contain the `parseWithZod` text the
issue quoted — the convention text is already gone/never landed. **Action:**
`gh issue close 277` with a comment noting Option B is chosen and confirming
there's no `zod.ts`/AGENTS.md text left to remove — issue is moot.

# Execution order

1. Quick closes first (no code): **#275**, **#277**.
2. Mechanical, low-risk, wide-but-repetitive: **#273** (Sentry removal, 15
   workspaces).
3. **#271** (structured-logger in 4 apex workspaces) — small, isolated.
4. **#260** (rate limiting) — touches core + content workspaces + apex key
   fix.
5. **#247** (Rails health check in apex) — needs a VPC service_id
   confirmation step before wiring `wrangler.jsonc`; do this last since it
   has an external-verification dependency.

After each code-change issue is implemented, run `pnpm run format:check`,
`pnpm run lint:check`, `pnpm run typecheck`, `pnpm run test` before closing it
with a comment summarizing what was done, per the existing GH issue workflow
in memory (user files issues, AI implements, closes with summary).

# Verification (end-to-end)

- `pnpm install` (fresh deps after Sentry package removal)
- `pnpm run format:check && pnpm run lint:check && pnpm run typecheck && pnpm run test`
- Manual dev-server spot checks per issue as noted above (apex `/health.json`,
  rate-limit 429s, structured logger output)
- Final `gh issue list --state open` to confirm only #269 and any
  intentionally-still-open items remain
