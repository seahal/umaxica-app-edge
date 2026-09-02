# ADR 013: The fifteen frames run TanStack Start on Vite, not Next.js on OpenNext

## Status: Implemented 2026-08-23 — CONDITIONAL GO

`{app,com,org}/{core,docs,help,info,news}` — fifteen units — build with Vite,
`@cloudflare/vite-plugin` and `@tanstack/react-start`, and run in workerd in
development, preview and production. `next`, `@opennextjs/cloudflare`,
`next/server`, the App Router and `.open-next/` are absent from the repository.
`server-only`, `@sentry/nextjs` and `@tailwindcss/postcss` left with them.

The five Hono apex Workers were **never in scope** and are untouched;
`adr/011-apex-workers-stay-hono.md` still holds and its reasoning is unaffected
by this record. What changed is that all twenty deployment units now share one
bundler.

> **Partially superseded 2026-09-02 by `adr/015-public-content-surfaces-astro.md`.**
> The twelve public content surfaces (`{app,com,org}/{docs,help,info,news}`) move
> to Astro. For those units the framework, the bundler-owned build,
> `defaultRenderHandler`, the committed `routeTree.gen.ts` and the "No `prerender`"
> sub-decision below no longer apply. Everything this record says about the three
> `*/core` units and the shared Rails / Workers VPC contract still holds, and the
> four constraints below still bind the Cores.

This record supersedes nothing and rewrites nothing.
`adr/004-public-information-surfaces-astro.md` rejected an earlier framework move
for the twelve content frames and invited the question to be reopened "as a new
record, with a new number"; this is that record, and it reaches a different
conclusion for a different framework and a different reason.

**This record is the only place in the repository that discusses Next.js.**
Everywhere else — the units, the tooling, `docs/`, every `AGENTS.md` — TanStack
Start is stated as the plain premise, with no account of what preceded it. The
working-notes file this migration was written against
(`plans/info-nextjs-to-tanstack-start.md`) was deleted once its evidence was
folded in here. Cite this ADR when a decision below needs a reason; do not
reintroduce the archaeology elsewhere.

The exception is the guards described under _Repository-level changes_. They
exist to catch a return to Next.js, so they necessarily name it — that is their
function, not commentary.

## Context

Fifteen units ran Next.js 16 on `@opennextjs/cloudflare`. That layer built a
Worker out of a Next.js application: it emitted `.open-next/worker.js`, carried
its own middleware runtime, and declared Durable Objects and an incremental cache
that nothing in this repository used. The five apex Workers had already moved to
Vite (`adr/012`), so the estate had two bundlers, two dev-server runtimes — `next
dev` was Node, `wrangler dev`/`vite dev` were workerd — and two answers to every
build question.

The work began as a three-surface evaluation of `info`. `app/info` cleared its
acceptance gate, so the remaining `info` frames followed, then the nine other
satellites, then the three Cores. Each step was gated on the previous one
passing.

## Decision

**Migrate all fifteen frames to TanStack Start on Vite, without changing any
externally observable contract.**

The acceptance gate was written before the work started and every unit had to
clear it: every URL, status, `<title>`, security header and `X-Robots-Tag`
preserved; `/health` 200/503 semantics and the four VPC failure modes preserved;
the credential strip toward Rails preserved; the rate limiter and the 429
contract preserved; 99% coverage thresholds held; and **every unit's own
`api/*.hurl` suite passing unmodified**. Those files encode each unit's brand,
host, title and status contract, and none of them was edited — that is the
strongest evidence in this record.

Four sub-decisions are worth pinning here, because reversing any of them
silently breaks something:

1. **`defaultRenderHandler`, not `defaultStreamHandler`.** The framework default
   streams, which flushes the shell before a failure is known, so a throwing
   loader answered HTTP 200 with no `<title>`. `defaultRenderHandler` produces a
   correct 500 with the error document. Nothing here streams today, so the cost
   is latent — but it will bite the first route that wants an async loader.
2. **No `prerender`.** Cloudflare matches static assets before the Worker runs,
   so a prerendered document would sit in front of the security headers and the
   rate limiter in `src/server.ts`, where neither applies.
3. **`remoteBindings: false` unless `CLOUDFLARE_ENV=vpc`.** The plugin defaults
   it to true, and a Workers VPC Service has no local simulator, so any command
   that resolves a config declaring `vpc_services` would open a remote proxy
   session that only an interactive `wrangler login` can authenticate. `env.vpc`
   is the one tier whose purpose is the real binding, so it is the one tier that
   opts back in.
4. **`src/routeTree.gen.ts` is generated and committed**, in every frame. No CLI
   regenerates it on its own — only `vite dev` and `vite build` do — so
   `typecheck`, `lint` and `test` would all fail on a clone that had never built.
   This contradicts the repository's instinct that generated files are gitignored
   and is recorded as a cost, not as a preference.

## Consequences

### Better

- **45% less client JavaScript.** A satellite fell from 184.87 kB gzipped to
  101.84 kB, a Core to 117.3 kB. Budgets were rebaselined to the measured value
  plus 10%.
- **One bundler for all twenty units.** `vite build` completes in under a second
  where `opennextjs-cloudflare build` took tens of seconds.
- **Dev, preview and production are all workerd.** `next dev` was Node, so
  production parity was something to reason about rather than to observe.
- **Content-hashed static assets**, which is what makes `immutable` in
  `public/_headers` honest — Cloudflare serves an asset without a content hash in
  its filename as `max-age=0, must-revalidate` regardless of what the file says.
- **Testing got closer to the truth.** Driving a real router renders the document
  a browser gets, rather than calling a layout function. Coverage is 100% in
  every frame.
- **One binding-read failure mode disappeared.** `getCloudflareContext()` threw
  whenever it ran outside a request context, so every binding read needed a live
  try/catch. `cloudflare:workers` cannot throw that way. The guards stay — each
  frame's `test/__mocks__/cloudflare-workers.ts` can still force the throw — but
  they are defensive now rather than load-bearing.
- **Two Next-only surfaces went away with nothing to replace.** `loading.tsx` was
  a route-level suspense fallback that no frame had an async boundary to show;
  TanStack expresses the same idea as a route `pendingComponent` when one is
  needed. `unauthorized.tsx` is under _Worse_ — it lost a capability rather than a
  need.

### Worse

- **A route component that throws still answers HTTP 200.** With
  `defaultRenderHandler` a _loader_ throw produces a correct 500 with the error
  document; a synchronous throw in a route _component_ produces 200 with no
  `<title>`, because React resolves the boundary on the client after hydration.
  Next server-rendered `error.tsx` with a 500 in both cases. **This is the single
  worst finding in this migration.**
- **404 and 500 gained shell chrome on the twelve satellites.** Next's
  `global-not-found.tsx` and `global-error.tsx` replaced the layout; TanStack
  renders inside the root document. The three Cores were unaffected — their
  chrome already sat on a nested layout, which maps onto a pathless layout route
  exactly. `docs/design/ui-shell-contract.md` §15 records the archetype split.
- **No title-template primitive.** `metadata.title.template` was one line per
  unit; `src/lib/title.ts` plus a call in every route replaces it, and a route
  that sets a title without it produces a wrong suffix or a second `<title>`.
- **`next/font` is gone**, replaced by a self-hosted `@fontsource-variable/inter`
  import and seven woff2 files in the client build.
- **Two lint suppressions.** `only-throw-error` is disabled in two files per
  Core: TanStack's `notFound()` and `redirect()` return plain objects, so no code
  change satisfies the rule and keeps the behaviour.
- **`experimental.authInterrupts` has no equivalent**, so `unauthorized.tsx` was
  deleted. Nothing invoked it, but the capability is gone rather than moved.
- **TanStack Start is at Release Candidate**, not GA. Next.js 16 was stable, and
  the framework moved from 1.168 to 1.171 within the session that did this work.

### Regressions found during the work, and fixed

Each was found by measurement rather than by reading, and each is fixed. They are
listed because the fix is load-bearing in every case — reverting one silently
reintroduces the fault.

1. **Two `<title>` elements on the 404.** A root-route title plus the not-found
   document's own. Fixed by moving the document default onto the index route.
   `test/html-title-contract.test.ts` asserts exactly one `<title>` in the final
   HTML of every unit, page and error document.
2. **A thrown render error answered HTTP 200 with no `<title>`.** The streaming
   handler flushes the shell before the failure is known. Fixed with
   `defaultRenderHandler`; the residue is under _Worse_.
3. **The error document never rendered server-side for a child route.** The
   root's `errorComponent` does not cover descendants; `defaultErrorComponent` on
   the router does.
4. **The local Rails transport stopped working.** See the first silent-failure
   mode below.
5. **`EDGE_LOCAL_*` leaked into a production build.** See the same.
6. **`/configuration/account` silently rendered `/configuration`.** See the
   second silent-failure mode below.
7. **`notFound()` stopped throwing.** Next's threw internally; TanStack's returns
   the signal for the caller to throw. An unsupported locale would have crashed
   instead of 404ing.

### Two new silent-failure modes

Both were caught here by luck or by coverage rather than by a gate, and neither
has an analogue in the Next.js setup:

- **Flat routing can make a sibling into a parent.** `_page.configuration.tsx`
  became the parent of `_page.configuration.account.tsx`, and that parent renders
  no `<Outlet />`, so `/configuration/account` silently rendered
  `/configuration`. The URL and the title were both still correct. Renamed to
  `_page.configuration.index.tsx`, and each Core's `test/pages-smoke.test.tsx`
  now compares every page's `<h1>` against its dictionary entry so it cannot
  recur.
- **workerd's `process.env` is not the shell's.** The `EDGE_LOCAL_*` flags that
  select the direct Rails transport used to arrive for free in a Node process.
  Each `vite.config.ts` now forwards them explicitly, **and only while serving** —
  without that guard a build inside the development container baked them into
  `dist/server/wrangler.json`, and a production Worker carrying them would take
  the direct transport to a `.localhost` origin and report `unreachable` forever.

### Repository-level changes this required

The migration could not be confined to the units. `tools/workers-manifest.json`
gained a fourth class, `railsBackedVite`; `tools/check-workers.mjs` gained
`checkViteWorker()` and a `local` tier in `VPC_POLICY`;
`tools/verify-edge-connectivity.mjs` was made bundler-agnostic; and five
repository-level test files were made framework-aware rather than pinned to
fifteen identical OpenNext frames.

**The Next-shaped guards are kept, not deleted**, even though their sets are now
empty — `checkOpenNext`, the `cacheComponents` assertion and the root-layout
metadata guard are the only written record of what an OpenNext frame had to
declare, and a frame returning to Next.js has to come back through them.

## Measured results

Every unit passes its own `api/*.hurl` suite **unmodified**. Those files encode
each unit's brand, host, title and status contract, and none of them was edited
— that is the strongest single piece of evidence here.

| Unit                 | Vitest   | Coverage | Hurl | Client JS (gzip) |
| -------------------- | -------- | -------- | ---- | ---------------- |
| `{app,com,org}/info` | 119 each | 100%     | pass | 101.84 kB        |
| `{app,com,org}/docs` | 116 each | 100%     | pass | 101.93 kB        |
| `{app,com,org}/news` | 116 each | 100%     | pass | 101.85 kB        |
| `{app,com,org}/help` | 116 each | 100%     | pass | 101.86 kB        |
| `{app,com,org}/core` | 282 each | 100%     | pass | 117.3 kB         |

Repository level: the root invariant suite green, `check:workers` OK on twenty
Workers, `check:local` 15/15, and `check:architecture`, `check:spelling`,
`typecheck`, `knip`, `lint`, `lint:types` and `format:check` all green.

Two incidental numbers, measured on `app/info`: its Hurl suite went from 1576 ms
to 111 ms, and `vite build` finishes in under a second where
`opennextjs-cloudflare build` took tens of seconds.

## Remaining risks

| Risk                                                          | Severity | Probability |
| ------------------------------------------------------------- | -------- | ----------- |
| Release Candidate; API churn between minors                   | High     | High        |
| SSR status codes undocumented and partly defective            | High     | Medium      |
| No deployment or live-Rails verification has been done        | High     | Medium      |
| `src/routeTree.gen.ts` is committed and can go stale          | Medium   | Medium      |
| Flat-routing nesting can silently swallow a child route       | Medium   | Low         |
| `only-throw-error` disagrees with TanStack's control-flow API | Low      | High        |

## Constraints this decision is conditional on

This is a **CONDITIONAL GO**, and the conditions are part of the decision:

1. **Keep `defaultRenderHandler`.** Reverting to the streaming default silently
   re-breaks the 500 path.
2. **Treat a route component that throws as an unhandled fault.** Put failure
   paths in loaders, where the status is correct.
3. **Pin TanStack minors and read the changelog.** RC plus observed drift within
   one session is not a stable target.
4. **Do not deploy on this evidence alone.** See below.

## Outcome

**Implemented, 2026-08-23,** in commit `5a016e10`. All fifteen frames build,
typecheck, lint and pass their own Vitest and Hurl suites; the root invariant
suite passes; `pnpm run check` is green across all twenty units.

Four things were deliberately **not** verified, stated rather than assumed:

- **No live Rails connectivity.** Rails does not run in this environment, so
  every `/health` observation is `not-configured` or `unreachable`. The transport
  selection is verified; a successful Rails response is not.
- **No Workers VPC with `remote: true`.** That needs an interactive
  `wrangler login`; `check:vpc`, `check:preview:vpc` and `dev:vpc` were not run.
- **No real deployment.** `wrangler deploy` was never run. The generated
  `dist/server/wrangler.json` — which is what would be uploaded — was inspected
  instead.
- **Playwright on 17 of 20 units.** A sample of three was run; CI does not run
  `test:e2e` at all, because no browser binary is installed.

A real deploy and a live Rails path are both still owed before this is trusted in
production.
