# ADR 007: Shared-FQDN Core dispatch (`worker.ts` as first-touch entry)

## Status: Implemented

## Context

`jp.umaxica.{app,com,org}` (the `*/core` Next.js/OpenNext Worker) is the
sole browser-facing surface for these three domain families. Rails owns a
set of real browser-facing routes under the same FQDN — `/api/v0/*`,
`/web/v0/*`, `/edge/v0/*`, `/oidc/*` (including `/oidc/callback`, which sets
authentication cookies), `/sign/out`, `/sign/out/complete`,
`/.well-known/jwks.json`, `/csp-violation-report` — that must reach Rails,
not Next.js, and must carry the browser's own `Cookie`/CSRF headers
verbatim. Everything else must reach Next.js with no `Cookie` header at all,
and Next.js must never be able to set one the browser keeps. Two prior
architecture options were compared: a dedicated Router Worker in front of
`*/core` (Option A), and a thin custom entry point on the existing
`*/core` Worker itself (Option B).

## Decision

**Option B.** `*/core/src/worker.ts` — already the Worker's `main` per
`wrangler.jsonc`, and already the first code the Workers runtime invokes for
every request — is extended to classify the request's path and branch
_before_ calling into Next.js/OpenNext at all. No new Worker, no new
wrangler project, no `services` binding between two Workers.

**Option A was rejected** because it adds a second Worker with no isolation
benefit Option B lacks: both must do the exact same cookie-boundary logic
at the exact same logical point (before any Next.js code runs); Option A
just does it after an extra network hop (Router → Next.js Worker), with a
second log stream, a second deploy surface, and — per the existing repo
shape (`*/apex` is deliberately Rails-blind, `*/core` is deliberately the
Rails-aware hop) — a component class this codebase has structurally avoided
everywhere else. See `app/apex/plans/grill-me-with-imperative-pretzel.md`
for the full comparison this record summarizes.

## Dispatch table

Path ownership is decided once, in `src/lib/core-dispatch.ts`
(`classifyCorePath`), duplicated identically across the three apps per
`CLAUDE.md`'s no-`shared/`-directory policy:

| Ownership | Match   | Paths                                                                                |
| --------- | ------- | ------------------------------------------------------------------------------------ |
| RAILS     | prefix  | `/api/v0/*`, `/web/v0/*`, `/edge/v0/*`, `/oidc/*`                                    |
| RAILS     | exact   | `/sign/out`, `/sign/out/complete`, `/.well-known/jwks.json`, `/csp-violation-report` |
| BLOCKED   | prefix  | `/health/*` (a path segment _under_ `/health` — see below)                           |
| NEXT      | default | everything else, including the exact path `/health`                                  |

This table is sourced from the mission's initial audit of Rails'
`config/routes/core.rb`, which this workspace cannot read directly. It is
the current best knowledge, not a verified match against the live Rails
route file — reconcile against Rails when that file is available.

**`/health` vs `/health/*`.** The exact path `/health` is Next.js's own
existing Route Handler (`src/app/health/route.ts`), used today by ops
tooling, and nothing in this repo suggests Rails owns that exact path. BLOCK
is scoped to `/health/` with a further segment — a namespace reserved for a
hypothetical Rails-internal health surface — so the working ops route is
left alone. A request to `/health/anything` reaches neither Rails nor
Next.js (404, at the edge, before either is invoked).

**`/robots.txt` / `/sitemap.xml`.** No Rails route evidence assigns these;
treated as NEXT-owned. Their previous placeholder hosts (`acme.com`,
`example.com`, `umaxica.com`) are fixed to `https://jp.umaxica.{app,com,org}`
per app in `src/app/robots.ts` / `sitemap.ts`.

**`/configuration`.** Stays NEXT-owned for all three apps — `org/core` has
the same `(page)/configuration/*` route tree as `app/core` and `com/core`,
no evidence of a difference.

## Cookie boundary mechanism

Enforced entirely in `src/worker.ts`, before `next-handler.ts`'s wrapped
`nextWorker.fetch` is ever called:

- **NEXT-owned request in:** a fresh `Headers` is built from the inbound
  request's headers with `cookie` deleted, and a fresh `Request` is
  constructed from it. Next.js/OpenNext code never observes the original
  `Request` object — only the cookie-stripped one.
- **NEXT-owned response out:** a fresh `Headers` is built from the Next.js
  response's headers with `set-cookie` deleted (all values — Workers
  `Headers.delete()` removes every entry under a name, not just the first,
  unlike `.get()`, which folds them; verified with `.getSetCookie()` in
  `test/worker.test.ts`), and a fresh `Response` is constructed from it
  before it is returned to the browser.
- **RAILS-owned request:** never touches this path. `dispatchToRails()` in
  `src/lib/core-dispatch.ts` forwards the original request's headers
  (`Cookie`, CSRF headers, `Origin`, `Referer`, etc.) unchanged, and returns
  Rails' response (`Set-Cookie`, `Location`, status, body) unchanged.
- **BLOCKED request:** never reaches either branch; a bare 404 is returned
  directly from `worker.ts`.

`next-handler.ts` exists only to isolate the one import
(`../.open-next/worker.js`) that doesn't exist until
`opennextjs-cloudflare build` has run, so `test/worker.test.ts` can
`vi.mock` it wholesale without Vite needing to resolve a build artifact on
disk.

## Rails transport (Host, VPC)

`dispatchToRails()` is a new, narrowly-scoped function — not a change to
`rails-client.ts`/`rails-health.ts`, which stay byte-for-byte the
server-to-server health-check clients they already are (ADR 005/006). It is
deliberately separate because it does the opposite thing:
`rails-client.ts` strips `cookie`/`authorization`/`cf-access-*` from every
outbound call; this dispatch forwards the browser's own `Cookie` and CSRF
headers to Rails on purpose, because that's what a Rails-owned browser
request needs.

The outbound request is built against `https://jp.umaxica.{app,com,org}` —
the PUBLIC Core hostname — as its literal origin, not
`rails-client.ts`'s `PRIVATE_CORE_RAILS_ORIGIN` VPC label
(`http://core.app.localhost:3000`) and not `X-Forwarded-Host`. Per the
Cloudflare Workers VPC binding docs: "The host provided in `fetch()` does
not control routing. It only populates the Host header and, when using
https, the SNI value" — routing is entirely by the binding's `service_id`.
Building the request against the public origin therefore costs nothing on
routing correctness and satisfies Rails' Host Authorization, which expects
a public host.

`Host` is driven through the request's URL, not through
`Headers.set('host', …)` — `host` is a forbidden header name under the
Fetch standard, and mutating it via `Headers` is a silent no-op in both
Node's `undici` and browser-grade Fetch implementations (confirmed
empirically while writing `test/core-dispatch.test.ts`). Using the URL
itself is the only reliable way to control it, and matches the observed
Workers VPC behavior above (the fetch target's host _is_ the Host header).

## Production fail-closed behavior

`dispatchToRails()` checks for `env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC`
(the existing binding, unchanged name, unchanged `service_id`, unchanged
`env.vpc`-only placement — see ADR 005/006). If it is absent, it
returns `503` directly — it never calls `nextWorker.fetch` and never
retries against any other resource. This mirrors `getRailsClient()`'s own
"fail closed, visibly" principle:

| Tier                                  | Binding present?                                      | Behavior                                |
| ------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `pnpm dev` (Node, `next dev`)         | no — no Workers runtime at all                        | 503, fails closed                       |
| `pnpm preview` (`--env development`)  | no                                                    | 503, fails closed                       |
| `pnpm preview:vpc` (`--env vpc`)      | yes, `remote: true`                                   | dispatches to Rails over the dev tunnel |
| `pnpm deploy` (top level, no `--env`) | **not yet** — no production VPC Service/tunnel exists | 503, fails closed                       |

Restoring production Rails dispatch needs exactly what ADR 006 already
documents for `getRailsClient()`: a production Cloudflare Tunnel next to
production Rails, and a production Workers VPC Service on it, created via
the Cloudflare dashboard/API — outside this repository — then
the top-level `vpc_services` gains the same block `env.vpc` already
has, with that service's `service_id`. No application code changes.

## What this record explicitly did NOT change

- Rails transport variable naming. This record touched none of it. Note that
  the repository had already moved to `PRIVATE_CORE_RAILS_ORIGIN` (the VPC
  routing label constant) and `PUBLIC_CORE_RAILS_ORIGIN` /
  `PUBLIC_CORE_ACCESS_CLIENT_ID` / `PUBLIC_CORE_ACCESS_CLIENT_SECRET` (the
  development Access-fallback values) before this dispatch work landed —
  that rename arrived separately and is not recorded in an ADR of its own.
  ADR 005 §1/§3/§5 and ADR 006 still spell the pre-rename names; read them
  as historical. See "Naming drift" below.
- The `UMAXICA_APPS_EDGE_CF_WORKERS_VPC` binding name, its `service_id`, and
  its `env.vpc`-only placement (ADR 006 §1).
- top level (production)/`env.vpc`/`env.development`/`env.test` separation
  and the `pnpm dev` / `pnpm preview` / `pnpm preview:vpc` topology.
- `rails-client.ts` / `rails-health.ts` — no edits; the new
  `core-dispatch.ts` is a sibling module, not a rewrite.
- `*/apex` — untouched, stays Rails-blind (out of scope by design).
- No shared/`common/` package: `core-dispatch.ts`, `next-handler.ts`, and
  `worker.ts` are duplicated three times, once per app, per `CLAUDE.md`.

## Guardrails

- `test/worker.test.ts` (×3) — the mandatory acceptance tests: Cookie
  stripped before `handler.fetch`, `Set-Cookie` stripped from the response
  (multi-value safe), Rails-owned dispatch bypasses `handler.fetch`
  entirely and preserves Cookie/CSRF/path/query, `/oidc/callback`
  passthrough, Rails 404/405 don't fall through to Next.js, Next.js's own
  404 doesn't retry against Rails, `/health/*` is blocked from both while
  `/health` itself still reaches Next.js, a non-GET Rails-owned request with
  a body forwards without buffering, and the VPC-binding-absent case fails
  closed with 503.
- `test/core-dispatch.test.ts` (×3) — `classifyCorePath` table coverage, the
  public-Host behavior, the explicit absence of `X-Forwarded-Host`, and the
  fail-closed 503.

## Outcome

**Implemented**, all four verification commands pass for `app/core`,
`com/core`, `org/core`, and the full repo test suite (see the
implementation report for exact output). `pnpm --filter <core-app> run
build` could not be exercised in this environment — it requires a live
Cloudflare credential to open the OpenNext build's remote preview session,
which this sandbox does not have; this is an environment limitation, not a
code defect, and should be re-run wherever a valid `wrangler login` /
`CLOUDFLARE_API_TOKEN` is available before deploying.

## Naming drift, reconciled here

The Rails transport variables were renamed to the `PUBLIC_CORE_*` /
`PRIVATE_CORE_*` family separately from, and before, this dispatch work,
without an ADR recording it. The rename reached `rails-client.ts`, all
fifteen `.env.example` files, and all fifteen `.env.development.local`
files, but left two guardrail assertions and two operations documents
spelling the old names. That half-state is what made
`test/rails-connection-invariants.test.ts` fail. Corrected alongside this
record:

- `test/rails-connection-invariants.test.ts` — the credential-absence
  assertion now matches `PUBLIC_CORE_ACCESS_CLIENT_ID` /
  `PUBLIC_CORE_ACCESS_CLIENT_SECRET`.
- `test/compose-tunnel-invariants.test.ts` — the "may carry a value"
  allowlist is now `PUBLIC_CORE_RAILS_ORIGIN`. Note this test iterates
  **git-tracked** `.env.example` files, and none are currently tracked, so
  it passes vacuously; see the open item below.
- `docs/operations/cloudflare-access.md` §2b.4 and the guardrail summary,
  and `docs/operations/cloudflare-tunnel-development.md`'s troubleshooting
  table — now name the variables a developer must actually set.

ADR 005 and ADR 006 are left spelling the pre-rename names deliberately:
they record what was decided when they were written, and rewriting them
would erase that. This section is the pointer forward.

**Tracking regression, fixed.** None of the sixteen `.env.example` files was
git-tracked, though `.gitignore` carries `!.env.example` to permit them —
a regression against ADR 005's Outcome ("every example now actually
tracked"). The fifteen frame examples are tracked again. Each carries
exactly one assigned value, `PUBLIC_CORE_RAILS_ORIGIN`, the public tunnel
hostname ADR 005 commits on purpose; both Access token halves are empty.
The `ships value-free .env examples everywhere` assertion had been passing
vacuously — it iterates _tracked_ examples and there were none — and now
inspects all fifteen and passes, which is what confirms the absence of a
committed credential rather than anyone's reading of the files.

**Repository-root `.env.example`, deleted.** It was never tracked, and its
content had gone dead: `CLOUDFLARED_TOKEN` and `EDGE_PUBLIC_ORIGIN` were
read by `bin/tunnel-warn`, `bin/tunnel-status`, and `compose.custom.yaml`,
none of which exist, and `compose.yaml` names neither variable. It also
documented a connector token for an "Edge-specific tunnel" — the exact
arrangement ADR 006 §6 forbids in this repository and
`test/compose-tunnel-invariants.test.ts` guards against — so committing it
would have enshrined guidance contradicting the current architecture.

Only `UID`/`GID` were still live (`compose.yaml:8-9`, rootless Podman build
args), and they carry their own defaults there (`${UID:-1000}`,
`${GID:-1000}`), so nothing breaks in their absence. Nothing in the
codebase, the tests, or the operations documents referenced this file: every
`.env.example` mention elsewhere is to a _frame's_ copy (`*/.env.example`).
`test/compose-tunnel-invariants.test.ts:95` keeps a `path !== '.env.example'`
exclusion for it; that clause is now inert rather than wrong.

The repository-root `.env` itself is untouched and, being gitignored,
remains the only place root-level Compose values live.

# Historical note

References below to `PUBLIC_CORE_*` describe the historical Access fallback. The active
development environment no longer loads those values into Next.js. Access is validated only
by `scripts/check-tunnel`; see `docs/development/cloudflare-development-network.md`.
