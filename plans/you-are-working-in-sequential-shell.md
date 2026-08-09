# Edge connectivity acceptance — extend from 3 surfaces to all 15

## Context

Yesterday's session built a repeatable connectivity acceptance check
(`tools/verify-edge-connectivity.mjs`, `pn run check:*`) and got every gate green —
but only across the **three `*/core` frames**. The stated goal was to connect
**every place that needs the Cloudflare Workers VPC ↔ Next.js path**, and that is
fifteen frames: `{app,com,org}/{core,docs,news,help,info}`. The twelve content
frames were never exercised. This plan finishes that.

They are not optional extras. All fifteen ship a byte-identical
`src/lib/rails-client.ts`, all fifteen declare the same VPC binding in
`env.preview`, and `tools/workers-manifest.json#railsBacked` already lists all
fifteen. The checker is the only thing that stopped at three —
`loadSurfaces()` filters `ws.endsWith('/core')`.

Intended outcome: `pn run check:preview:vpc` proves **all fifteen** frames reach
Rails over the real binding, and every other mode covers all fifteen too.

## What is already done (2026-08-09, verified — do not redo)

- `tools/verify-edge-connectivity.mjs` with modes
  `config` / `vpc` / `next` / `preview` / `preview:vpc` / `host` / `all`;
  statuses PASS/WARN/FAIL/BLOCKED/SKIP; failures attributed to a named layer using
  Cloudflare's documented VPC error codes; logs to `tmp/connectivity-check/`;
  process-group cleanup via signal handlers.
- `tools/vpc-probe/` — a Worker binding only the VPC service, fixed destination, no
  fallback path. **Measured PASS: HTTP 200** from
  `core.app.localhost:3000/health/liveness.json`, confirmed on the Rails side as
  `Core::App::Health::LivenessesController#show`.
- `tools/lib/wrangler-config.mjs` — JSONC parser + manifest loader, shared with
  `tools/check-workers.mjs`.
- `test/verify-edge-connectivity.test.ts` (35 tests),
  `test/workerd-runtime-invariants.test.ts` (16 tests).
- Docs: `docs/operations/connectivity-acceptance.md`; ADR 006 amended; the
  `--env-file` trap recorded in both.

### Two defects found and fixed

1. **`*/core/src/lib/next-handler.ts` imported `'../.open-next/worker.js'`** — one
   level too shallow. esbuild failed to resolve it and `wrangler dev` then bound
   8787 without ever serving, so every request hung with no `Ready on`. Fixed to
   `'../../.open-next/worker.js'`; `@ts-expect-error` → `@ts-ignore` because with
   `allowJs: true` the corrected path resolves once `.open-next` exists, making the
   directive's validity flip with build state.
2. **`cacheComponents: true`** in all sixteen `next.config.ts`. Next's Cache
   Components need `setTimeout()` semantics workerd lacks; every prerendered (`○`)
   and PPR (`◐`) route hung until the runtime cancelled it. Only Route Handlers
   (`ƒ`) survived — which is why `/health` answered 200 while `/` did not. Nothing
   uses `use cache`/`cacheLife`/`cacheTag`, so it bought nothing. Removed from the
   fifteen Cloudflare frames (`dev/acme` keeps it — Vercel), guarded by
   `test/workerd-runtime-invariants.test.ts`.

**This second fix is why the twelve content frames must now be re-verified.** They
were equally affected, and their existing `.open-next` builds predate the fix.

### Key operational facts (keep)

- A remote-binding session **cannot** be opened with an API token (`10405`); OAuth
  only. `CLOUDFLARE_API_TOKEN` must be blanked **and** the root `.env` kept away from
  wrangler via `--env-file <empty file>` — wrangler reads that `.env` itself.
- `remote: true` runs the Worker locally and proxies only the binding. Never pass
  `--local`; it disables remote bindings.
- The VPC `fetch()` URL's host does **not** route — it sets `Host` (and SNI) only,
  and the port is ignored. Rails picks the brand from that `Host`.
- One VPC Service (`019f5fe0-…`) serves all fifteen frames on
  `core.app.localhost:3000`. Staged on purpose: one endpoint first, per-brand routes
  later. `STRICT_BRAND_ROUTING=1` flips the check when the split begins.

## The fifteen frames, as they actually differ

Inventory read from each `package.json` and `src/app/`:

| Frames               | Dev ports          | `/health`         | `/rails-health`                    | wrangler `main`         |
| -------------------- | ------------------ | ----------------- | ---------------------------------- | ----------------------- |
| `{app,com,org}/core` | 5405 / 5105 / 5305 | `route.ts` (JSON) | **HTML page**                      | `src/worker.ts` wrapper |
| `{app,com,org}/info` | 5403 / 5103 / 5303 | **absent**        | **JSON route**, 200 if ok else 503 | `.open-next/worker.js`  |
| `{app,com,org}/docs` | 5406 / 5106 / 5306 | **absent**        | same                               | same                    |
| `{app,com,org}/news` | 5407 / 5107 / 5307 | **absent**        | same                               | same                    |
| `{app,com,org}/help` | 5408 / 5108 / 5308 | **absent**        | same                               | same                    |

The twelve content frames' `rails-health/route.ts` is byte-identical (md5
`f7a30a85…`) and dynamic (`await connection()`), which is why ADR 006's `app/docs`
preview succeeded even with `cacheComponents` enabled — it never entered the
prerender path. Their prerendered pages were broken all along; nobody had served
them on workerd.

All fifteen ports are already in `devcontainer.json#forwardPorts`, so host
reachability needs no new plumbing.

## Changes to make

Everything is in `tools/verify-edge-connectivity.mjs` plus its test. No application
code changes are expected — if a content frame fails, that is a finding to report,
not something to patch blind.

### 1. `loadSurfaces()` — all fifteen, with their differences as data

Drop the `.endsWith('/core')` filter; take `manifest.railsBacked` whole. Each
surface gains:

- `key` — `APP/CORE`, `APP/DOCS`, … (brand + frame, so the matrix stays readable)
- `port` — still parsed from that workspace's own `dev` script, never hard-coded
- `hasHealthRoute` — `existsSync(<ws>/src/app/health/route.ts)`, **derived, not a
  hard-coded list of cores**, so adding `/health` to a content frame starts being
  checked without touching the tool
- `railsHealthForm` — `'html'` if `src/app/(page)/rails-health/page.tsx` exists,
  `'json'` if `src/app/rails-health/route.ts` does; if neither, that is a FAIL, not
  a silent skip

### 2. Readiness and probing

Readiness polls **`/rails-health`** for every surface, not `/health`: it is the one
route all fifteen have, and it always answers (200 when `ok`, 503 otherwise), so it
is a deterministic liveness signal. `/health` becomes its own gate, PASS for the
three cores and `SKIP: frame has no /health route` for the twelve — with the reason
printed, since silence is not allowed to look like coverage.

Add `parseRailsHealthJson()` beside the existing `parseRailsHealthPage()`, reading
`{ rails: { kind } }`. Also assert the JSON route's **status matches its kind**
(200 iff `ok`, else 503) — a cheap correctness check the HTML page cannot offer.

### 3. Matrix rendering — transpose

Fifteen surfaces will not fit as columns. Flip it: rows = surface, columns = gate,
with short headers and a legend. Keep `findMissingCells` as-is; it already refuses
to let a gate omit a surface.

### 4. Concurrency

- `next` — all fifteen at once (ports differ; the box has 32 cores and 128 GB, and
  root `pnpm dev` already fans out to nineteen workspaces). Cap at 8 concurrent
  anyway, so a smaller machine degrades rather than thrashes.
- `preview` — parallelisable, because it carries no binding. Pass a distinct
  `--port` per frame (`opennextjs-cloudflare` forwards unknown flags to wrangler,
  and `pnpm run <script> -- --port N` appends to the last command in the `&&`
  chain). Batch of 4.
- `preview:vpc` — **strictly sequential on 8787.** ADR 006 is explicit that fifteen
  concurrent remote-proxy sessions against Cloudflare is exactly what not to do.

Every `preview*` run rebuilds, so the stale pre-fix `.open-next` directories are
replaced automatically.

### 5. Scripts and docs

Root `package.json` script names stay. Update
`docs/operations/connectivity-acceptance.md` for fifteen surfaces, the
`/health`-absent SKIP, and the expected runtime of each mode.

## Verification

Run in this order; the first three are fast, the last is the long pole.

1. `pn run test` / `lint:check` / `format:check` / `typecheck` / `check:workers`.
2. `pn run check:config` — expect 15 × PASS for Toolchain and VPC config.
3. `pn run check:vpc` — expect PASS (HTTP 200). One shared VPC Service, so this is
   one transport recorded against fifteen surfaces; the report must keep saying so
   rather than implying fifteen paths.
4. `pn run check:local` — 15 dev servers; expect `/rails-health` `not-configured`
   everywhere (no binding under `--env development`) and `/health` PASS on the three
   cores, SKIP on the twelve.
5. `pn run check:preview:vpc` — **the goal, so it runs first.** Expect
   `rails-health: ok` on all fifteen. Sequential; budget ~30–45 min. A content
   frame still broken by `cacheComponents` would surface here as a 500 on a
   prerendered route.
6. `pn run check:preview` — the no-binding baseline across fifteen. Parallel, so
   cheaper. Expect `not-configured`. Runs second because it proves less.
7. `pgrep -f 'next dev|wrangler'` — no orphans.

Ordering matters because of the clock: the user is away until ~09:00 JST (~2 h from
now) and 5 + 6 together are roughly an hour. If anything does not finish, report
per-frame results for what actually ran and **name the frames not yet covered**
rather than letting the matrix imply they passed.

On failures found along the way: fix unambiguous blockers the way the
`cacheComponents` one was fixed — diagnose, prove the diagnosis by experiment, fix,
re-verify. Do not guess at anything that is really a design decision (how much of
OpenNext's worker a wrapper may rewrap, whether a frame should gain a `/health`
route); report those instead.

## Follow-up, same day — wrangler environments restructured

After the fifteen-frame verification came a question that turned out to be
well-founded: why is the VPC binding in an environment called `preview` when
this is development? Research against current Cloudflare, Next.js and OpenNext
documentation showed the Rails one-axis intuition does not map, because there
are three independent axes here:

| Axis                   | Decides                                      | Values                                            |
| ---------------------- | -------------------------------------------- | ------------------------------------------------- |
| `NODE_ENV`             | Next's build/runtime mode, `.env.*` order    | **exactly** `development` / `test` / `production` |
| Cloudflare environment | which infrastructure; deploys `<name>-<env>` | any name                                          |
| where the code runs    | Node / local workerd / edge                  | —                                                 |

Only the first is the `RAILS_ENV` analogue, and the repo already had it right.
Two things were wrong on the second axis, and both were fixed:

**`env.preview` → `env.vpc`.** "Preview" is an official Cloudflare term for the
versioned URLs of a _deployed_ Worker, so it named close to the opposite of this
never-deployed, local-only environment.

**`env.production` deleted; the top level is production.** A wrangler
environment deploys to `<name>-<env>`, so `env.production` existed only to
re-declare `name` and cancel that out. Applied to the four `*/apex` workers too,
for one shape across the repo. The deployed Worker name is unchanged, so nothing
is orphaned.

**The hazard that created, measured before relying on it.** With no `--env`,
`CLOUDFLARE_ENV` picks the environment — and `compose.yaml` exports
`CLOUDFLARE_ENV=development`:

```
CLOUDFLARE_ENV=development, no --env  →  env.CLOUDFLARE_ENV ("development")
CLOUDFLARE_ENV=,            no --env  →  env.CLOUDFLARE_ENV ("production")
```

A deploy from inside the container would have shipped to `<name>-development`
and left production untouched. Every deploy/build/typegen script now blanks it,
and `check-workers.mjs` fails any wrangler invocation that has neither `--env`
nor the blanking.

**A comment that was simply false, corrected.** `check-workers.mjs` justified
banning a top-level `vpc_services` with "it applies to every environment,
including development". Measured: it does not. Top-level non-inheritable keys do
not reach `env.*` at all — wrangler warns and the environment resolves with **no
bindings found**.

**A test that would have gone quiet, caught.** `rails-connection-invariants`
sliced the config from `indexOf('"production"')`; with the key gone that is
`slice(-1)`, so the "production must not reuse the development service_id"
assertion would have passed vacuously. Rewritten to read the parsed config.

Re-verified after the restructure: `check:preview:vpc` 15/15 `rails-health: ok`,
`check:vpc` 15/15, `check:local` all green, 1185 tests, lint/typecheck/
check-workers clean.

## Result — executed 2026-08-09, all fifteen frames

Every cell below was actually run. No FAILs.

| Surface  | tool | cfg | VPC→ | dev | d:hlt    | d:/ | d:rh | build | wd  | p:/ | v:/ | v:rh |
| -------- | ---- | --- | ---- | --- | -------- | --- | ---- | ----- | --- | --- | --- | ---- |
| APP/CORE | ok   | ok  | ok   | ok  | ok       | ok  | ok   | ok    | ok  | ok  | ok  | ok   |
| APP/DOCS | ok   | ok  | ok   | ok  | skip     | ok  | ok   | ok    | ok  | ok  | ok  | ok   |
| APP/NEWS | ok   | ok  | ok   | ok  | skip     | ok  | ok   | ok    | ok  | ok  | ok  | ok   |
| APP/HELP | ok   | ok  | ok   | ok  | skip     | ok  | ok   | ok    | ok  | ok  | ok  | ok   |
| APP/INFO | ok   | ok  | ok   | ok  | skip     | ok  | ok   | ok    | ok  | ok  | ok  | ok   |
| COM/…    | ok   | ok  | ok   | ok  | as above | ok  | ok   | ok    | ok  | ok  | ok  | ok   |
| ORG/…    | ok   | ok  | ok   | ok  | as above | ok  | ok   | ok    | ok  | ok  | ok  | ok   |

`d:hlt` is `skip` on the twelve content frames because they have no `/health`
route — printed with that reason, never blank. `Host port reachability` is SKIP
everywhere: this ran inside the container.

**The goal is met: `Preview → Rails VPC` is `rails-health: ok` on all fifteen** —
the application itself, on workerd, through `getRailsClient()`, over the real
remote binding. `Direct VPC → Rails` is separately PASS (HTTP 200) from the probe
worker, which has no application code in the path.

```
Development VPC Service: 019f5fe0-… (tunnel 1d501e9a-…, core.app.localhost:3000, verified live)
Production VPC Service:  none — env.production declares no binding; production fails closed (ADR 006)
Environment isolation:   OK — production and development share no service_id
```

Quality gates: format / lint / typecheck / check-workers clean; **1170 tests
passed across 165 files**. No orphan processes.

### One defect found in the new parallelism, fixed

Splitting `--port` per frame was not enough for parallel `preview`: wrangler's
**inspector** port defaults to `9229` for every instance, so 7 of 15 frames died
with `Address already in use (127.0.0.1:9229)`. It looked like seven broken
frames and was one missing flag — the same seven had already passed
`preview:vpc`, which is sequential, and that discrepancy is what gave it away.
Fixed by also passing `--inspector-port`; re-run went 15/15.

### Still open

- `Host port reachability` — needs a run from the host OS while `check:local` is
  up. The tool prints the exact per-frame commands.
- Per-brand Rails routing — all fifteen still send `Host: core.app.localhost`, by
  design. `STRICT_BRAND_ROUTING=1` starts enforcing the split when it begins.
- Whether the `cacheComponents` breakage also affected deployed production is not
  established here; production runs the same workerd, but I did not check whether
  these Workers are deployed.
