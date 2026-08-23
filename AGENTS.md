## Module Composition Rules

- Mixin-style modules, shared helpers, and composition utilities MUST keep their own implementation as side-effect-light as possible. Mutations, registration, persistence, external I/O, and other observable side effects MUST be performed or explicitly wired by the caller or consuming module.
- Shared module code MUST expose the smallest public surface practical. Keep internals unexported or locally scoped whenever possible, and only export functions or types that are intentionally part of the consumer-facing API.

## Toolchain

This project uses plain **pnpm** scripts for orchestration, with each tool (Vite, Oxlint, Oxfmt, tsc, Vitest, Hurl, Playwright, Lefthook) invoked directly rather than through a wrapper CLI. pnpm is the only package manager: npm, npx, yarn and bun are not used, `pnpm-lock.yaml` is the only lockfile, and `test/package-manager-invariants.test.ts` fails if another one is ever tracked.

- Install: `pnpm install`
- Format: `pnpm run format` / `pnpm run format:check`
- Lint: `pnpm run lint` / `pnpm run lint:types` (`lint:fix` is the only one that rewrites code)
- Type check: `pnpm run typecheck`
- Test: `pnpm run test` / `pnpm run test:cov` (Vitest — see **Test layers** below)
- HTTP test: `pnpm run test:api` (Hurl)
- Browser test: `pnpm run test:e2e` (Playwright)
- Build: `pnpm run build` (**Vite** everywhere — the fifteen TanStack Start frames and the five apex Hono Workers)
- Dead code / unused dependencies: `pnpm run knip`
- Dependency architecture: `pnpm run check:architecture` (dependency-cruiser)
- Version consistency: `pnpm run check:deps` (syncpack; `fix:deps` rewrites manifests and is local-only)
- Spelling: `pnpm run check:spelling` (CSpell)
- Browser bundle budget: `pnpm run check:size` (Size Limit — needs `pnpm run build` first, so it is NOT in `check:static`)
- Everything static, then unit tests: `pnpm run check`
- Per-workspace: `pnpm --filter <workspace> run <script>` or `pnpm --dir <unit> run <script>`

**Vite builds every deployment unit, and it builds them for production.** `vite build`
produces the deployed Worker bundle and the hashed assets; `deploy` and the CI
upload scripts all run it first. It is a devDependency because it does not run in
production, not because it only builds for development — a build is how the
production artefact exists at all, so CI cannot drop it. Nothing Vite installs
reaches the deployed Worker, and production starts no Node process and no server.
`adr/012-apex-vite-build-and-static-assets.md` is normative.

The root scripts are `pnpm -r` fan-outs over per-unit scripts of the same name; every deployment unit implements the same contract and can run it standalone from its own directory. The three repository-level checks (`check:architecture`, `check:deps`, `check:spelling`) are the exception: they ask about the repository as a whole, so they run once from the root rather than fanning out.

`docs/development/static-analysis-and-hygiene.md` is normative on which tool owns which question, where each gate runs, why dependency-cruiser is scoped to JavaScript only, how the performance budgets were measured, and what has to be true before an ignore is acceptable. Read it before adding a suppression to any of these tools.

Import test utilities from `vitest` (not a wrapper package). Oxlint config is `.oxlintrc.json` and Oxfmt config is `.oxfmtrc.json` — each deployment unit has its own copy of both, alongside its own `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts` and `knip.jsonc`; the root copies apply to repo-level files only. Do not replace a unit's copy with a root `extends` or a shared package — `test/deployment-unit-boundaries.test.ts` enforces this. Type-aware linting works via `oxlint-tsgolint`, invoked automatically by `oxlint --type-aware`.

Tests are per-unit: running vitest from the repo root executes only `test/`, the repository-level invariant suite. A unit's tests live in `<unit>/test/` and run via `pnpm --dir <unit> run test`.

## Test layers

Three tools, split by **responsibility, not by capability**. Each can technically
do the others' job; none may.

| Layer           | Tool       | Lives in       | Answers                            |
| --------------- | ---------- | -------------- | ---------------------------------- |
| `pnpm test`     | Vitest     | `<unit>/test/` | did the internal logic break?      |
| `pnpm test:api` | Hurl       | `<unit>/api/`  | did the HTTP contract break?       |
| `pnpm test:e2e` | Playwright | `<unit>/e2e/`  | did the user's browser path break? |

What decides where a test goes is **what the assertion is about**, never what the
tool can reach:

- An assertion on a **response** — status, headers, body, cookies, redirects —
  goes in a `.hurl` file and runs against a real server. It must not import from
  `src/` and must not call `app.request()`.
- An assertion on something **no HTTP client can produce** — a route that throws,
  an injected `RATE_LIMITER`, a Workers binding, a `console` line — stays in
  Vitest. `app.request()` is allowed there as the _driver_; say so in a comment,
  because the next reader cannot tell the two apart from the code alone.
- An assertion needing a **real engine** — rendering, the accessibility tree,
  service-worker activation, offline navigation — goes in Playwright. Status
  codes and `Content-Type` do not belong in a `.spec.ts`.

Duplicating one behaviour across layers is allowed only when the layers fail for
different reasons. `POST /sign/in → Set-Cookie → GET /me` in Hurl, the JWT parser
behind it in Vitest, and the login screen in Playwright is a valid three-layer
split; the same `GET /health → 200` in all three is not.

`pnpm test:api` starts its own server: each unit's `api/run.mjs` spawns
`pnpm run dev`, waits, runs Hurl and stops it — reusing a server that is already
listening, so `pnpm run dev` in another terminal is unaffected. `EDGE_API_BASE`
points the same files at a deployment and spawns nothing. Each unit's
`api/README.md` restates this locally and names the Vitest file every `.hurl`
file replaced.

One thing is deliberately not true yet, and should not be quietly "fixed":

- CI runs `test:api` but **not** `test:e2e`: no browser binary is installed by
  `Containerfile` or by the workflow. Run `pnpm exec playwright install chromium`
  before `test:e2e` locally.

There used to be a second exception — `dev/apex` had no `test:api`, because its
only server was `vercel dev`, which blocks on interactive device authentication
and so never listened in CI. That unit now runs on Cloudflare Workers with
`vite dev` as its server, so it carries the same nine `.hurl` files as every
other apex and is in the `test-api` matrix. All twenty-one units implement the
same contract; none is exempt from the split.

## Logging

`no-console` is an **error**, in every unit. Do not reach for `console` directly
and do not silence the rule at a new call site — the disable comments that exist
today mark the two sanctioned emitters, and each one is a closed, typed surface:

- `*/apex/src/structured-logger.ts` — `@hono/structured-logger` middleware, wired
  in `create-apex-app.ts`
- `*/core/src/lib/rails-dispatch-log.ts` — the Edge → Workers VPC → Rails hop

Both emit one JSON line as `{ level, msg, data }`, which is what
`observability.logs.enabled` in each `wrangler.jsonc` collects into Workers Logs.
There is no external observability vendor and adding one is a decision, not a
detail.

`RailsDispatchLogEntry` has no free-text field on purpose: every value is a number
or a member of a fixed union, so a raw Cookie, an `Authorization` header, a CSRF
token, a body, a query string, a user id, an internal hostname or a VPC service id
has no route into a log line. If you need a new field, add it to the type as a
closed union — do not widen one to `string`.

## Cookies

**Browser code reads and writes cookies through the Cookie Store API — the global
`cookieStore` — and through nothing else.** Do not add a cookie library to any
unit, and do not reach for `document.cookie`: the API is asynchronous, returns
`CookieListItem` objects rather than one string to parse, and costs no bundle
bytes, so a wrapper has nothing left to wrap. Nothing in a browser touches a
cookie today, and no wrapper module should be written before a feature needs one.

This governs the browser only. Hono's `hono/cookie` and the `languageDetector`
that sets `language` in the apex workers, the frames on the server, and every cookie
Rails owns all stay exactly as they are. One consequence of the ADR 007 boundary
is worth knowing before you start: `*/core/src/worker.ts` deletes every
`Set-Cookie` from the application-owned response, so a cookie the browser can see
cannot be issued by a frame — only by an apex worker or by Rails.

`docs/development/browser-cookie-access.md` is normative on this: the five
constraints an implementer hits (`HttpOnly`, secure context, async, a support
floor below our browserslist, and a DOM type that declares the global
non-optional), and where the code goes when there is code. Read it before writing
anything that touches a cookie in a browser.

## Styling

**Tailwind CSS v4 is the styling layer.** There is no other one: no CSS Modules,
no CSS-in-JS, no `tailwind.config.*` (v4 keeps the theme in CSS), and no static
`style=` attribute anywhere. `docs/design/ui-shell-contract.md` §3a is normative
on how it is wired; the short version:

- Every unit owns **its own** stylesheet with its own `@theme`. There is no
  shared preset, no root config and nothing to `extends` —
  `test/deployment-unit-boundaries.test.ts` enforces that, as it does for every
  other per-unit config.
- Every unit runs the engine through `@tailwindcss/vite`, because every unit
  builds with Vite. `@tailwindcss/postcss` is gone with the Next.js frames that
  used it. Vite emits the stylesheet into `dist/client`
  with a content hash in its name, which is what lets `public/_headers` mark
  `/assets/*` `immutable` — Cloudflare serves static assets
  `max-age=0, must-revalidate` unless the filename is fingerprinted. Each unit
  names the resulting URL once, in `src/assets.ts`; nothing hard-codes it.
- Visual rules go in the markup as utilities. A new CSS rule needs a written
  reason why a utility cannot express it — today each stylesheet has exactly
  four, and `@apply` is never one of them. A repeated run of utilities is a
  component, not a class.
- Design constants are `@theme` tokens, so they are greppable and shared by
  name. `--color-brand` is the one colour pinned by literal value.

## Generated Cloudflare types

`cloudflare-env.d.ts` (the fifteen TanStack Start frames) and
`worker-configuration.d.ts` (the apex workers) are generated by
`wrangler types` and are **gitignored in every unit**. Do not commit them.

Each frame's `typecheck` runs `cf-typegen` first, so a fresh clone regenerates
them before `tsc` needs them; the apex workers do not, because they compile
without the generated file.

`src/routeTree.gen.ts` is different and IS committed, in every TanStack Start
frame. It is generated by the TanStack Router plugin on each `vite dev` and
`vite build`, but no CLI regenerates it on its own, so `typecheck`, `lint` and
`test` would all fail on a fresh clone that had never built. It is excluded from
Oxfmt, Oxlint and coverage — the file says so itself — and
`plans/info-nextjs-to-tanstack-start.md` records the trade-off. Regenerating produces no git diff, which is the point
— a committed copy can silently disagree with the `wrangler.jsonc` it came from,
and nothing checks that. `tools/verify-edge-connectivity.mjs` reports a missing
file as "run cf-typegen" rather than as a failure, for the same reason.

## Review Checklist for Agents

- [ ] Run `pnpm install` after pulling remote changes and before getting started.
- [ ] Run `pnpm run check` to validate changes — `format:check`, `lint`, `lint:types`, `check:generated`, `typecheck`, `knip`, `check:workers`, `check:architecture`, `check:deps`, `check:spelling`, then `test`.
- [ ] Run `pnpm run build && pnpm run check:size` when you touched anything that reaches a browser bundle.
- [ ] Run `pnpm run test:api` when you touched anything a client can observe: a route, a header, a redirect, a status, a rendered document.

## Design Principle

Never forget the spirit of YAGNI (You Aren't Gonna Need It): build only what is needed now, and avoid speculative abstractions or features for imagined future requirements.
