# Edge Network Boundary Audit — Phase 1 Discovery (No Changes)

## Context

The user requested a comprehensive Phase-1-only audit (per a detailed copy-paste prompt) of network
boundaries across this monorepo: Next.js `*/core`+content workspaces, Hono `*/apex` workers, Cloudflare
Tunnel, Access, and Workers VPC. The prompt assumes most of this is undecided greenfield territory.

Discovery (via 3 parallel Explore agents) shows that's **not quite true**: this repo already has a
documented, partially-implemented architecture for Tunnel/Access/VPC (ADRs 005/006,
`docs/operations/cloudflare-access.md`, `docs/operations/cloudflare-tunnel-development.md`, and an
enforcement test `test/compose-tunnel-invariants.test.ts`). The valuable next step is a **gap/consistency
audit against that existing design**, not a from-scratch discovery exercise — plus resolving the handful
of things the docs don't cover (apex workers' own Tunnel/Access posture, the abandoned ADR-001 Rails
health-check plan, compat-date/version drift).

This plan file _is_ the Phase 1 deliverable (inventory + matrices + findings + grill questions), per the
audit prompt's instruction not to implement anything yet.

---

## A. Deployable-unit inventory

**21 pnpm workspaces** (`pnpm-workspace.yaml`): `app/{apex,core,docs,help,info,news}`,
`com/{apex,core,docs,help,info,news}`, `org/{apex,core,docs,help,info,news}`, `net/apex`, `dev/{acme,apex}`.

| Group                                 | Framework                   | Count | Notes                                                                   |
| ------------------------------------- | --------------------------- | ----- | ----------------------------------------------------------------------- |
| `{app,com,org}/apex`                  | Hono on Workers             | 3     | Region router (`?ri=jp\|us`), CSRF, rate-limit, health                  |
| `net/apex`                            | Hono on Workers             | 1     | Plain same-origin `/`→`/about` redirect, per-route rate-limit key       |
| `{app,com,org}/core`                  | Next.js/OpenNext on Workers | 3     | Only tier with `/health` route + custom `worker.ts`                     |
| `{app,com,org}/{docs,news,help,info}` | Next.js/OpenNext on Workers | 12    | Stock `.open-next/worker.js`, no `/health`                              |
| `dev/acme`                            | Next.js, **Vercel**         | 1     | Sentry-instrumented, no Rails client, no wrangler config at all         |
| `dev/apex`                            | ?                           | 1     | Not yet investigated (out of scope in this pass — flagged as open item) |

Observed: `pnpm-workspace.yaml`, root `package.json`, per-workspace `package.json`/`wrangler.jsonc`.

## B. Project matrix

| Folder                                | Framework/runtime                                      | Purpose                                                                                                                                  | Dev listener                   | Prod URL pattern                  | Tunnel for dev?                             | Access on dev?                     | VPC needed?                                                     | Rails dep?                                             | Browser-facing? | apex-redirect responsibility                                                | Risk                     | Verdict                                                                                                   |
| ------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------- | ------------------------------------------- | ---------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ | --------------- | --------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `{app,com,org}/core`                  | Next.js/OpenNext Worker                                | Regional subdomain app                                                                                                                   | `next dev :5402/5102/5302`     | `{jp,us}.umaxica.{app,com,org}`   | Per existing dev doc (Rails-side connector) | Per existing Access doc            | **YES** (prod: fail-closed, no binding; preview env only)       | Yes — VPC binding prod, Access service-token HTTPS dev | Yes             | No                                                                          | Low (already documented) | **INVESTIGATE** compat-date/wrangler-version drift only                                                   |
| `{app,com,org}/{docs,news,help,info}` | Next.js/OpenNext Worker                                | Content subdomains                                                                                                                       | `next dev :54xx/51xx/53xx`     | `{docs,news,help,info}.umaxica.*` | Same as core                                | Same as core                       | Same rails-client copy present but **no `/health` route**       | Yes (same client)                                      | Yes             | No                                                                          | Low                      | **INVESTIGATE** why `/health` absent here but present in `core` — intentional?                            |
| `{app,com,org}/apex`                  | Hono Worker                                            | Region router at bare domain                                                                                                             | `wrangler dev :5401/5101/5301` | `umaxica.{app,com,org}`           | Not currently addressed by existing docs    | Not currently addressed            | **NO** (no Rails call in current code — ADR-001 plan abandoned) | **NO** (deleted)                                       | Yes             | **YES** — but it's a region router, not apex→www                            | Low-Med                  | **INVESTIGATE** — should this reacquire Rails health, and does it need its own dev-hostname/Access story? |
| `net/apex`                            | Hono Worker                                            | Same-origin path redirect                                                                                                                | `wrangler dev :5201`           | `umaxica.net`                     | N/A (no Rails dep)                          | Low value (no cross-boundary call) | NO                                                              | NO                                                     | Yes             | Different pattern — `/`→`/about`, not host redirect                         | Low                      | **NO** for Tunnel/Access/VPC                                                                              |
| `dev/acme`                            | Next.js, Vercel                                        | Standalone dev-brand app                                                                                                                 | `next dev`                     | Vercel-hosted                     | **NO** — not on Cloudflare at all           | N/A                                | NO                                                              | NO                                                     | Yes             | No                                                                          | Low                      | **NO** — out of Cloudflare boundary entirely                                                              |
| `dev/apex`                            | Hono, **Vercel** (`vercel dev`/`vercel deploy --prod`) | Redirects `umaxica.dev` root → `DEV_CORE_URL` or `www.umaxica.dev`; serves `/health*` and a static `/about` page pointing at app/com/org | `vercel dev :5501`             | `umaxica.dev` (Vercel)            | **NO** — Vercel, not Cloudflare             | **NO**                             | NO                                                              | NO — no rails-client anywhere in this workspace        | Yes             | **YES** — genuine apex→(www\|core) redirect, and it's on Vercel not Workers | Low                      | **NO** for Tunnel/Access/VPC (out of Cloudflare boundary); note asymmetry vs the other three families     |

## C. Traffic matrix (Rails calls)

All 15 `app/com/org × core/docs/news/help/info` workspaces ship a **byte-identical**
`src/lib/rails-client.ts`, always invoked **server-side only** (Server Component on `/rails-health` page,
`await connection()`), never from a client component or `apex` worker.

Transport is selected by which config is present, not by env name:

1. `env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC` binding present → Workers VPC service call to fixed label
   `http://core.app.localhost:3000` (production; label never DNS-resolves, VPC/Tunnel resolves it Rails-side).
2. Else `RAILS_ORIGIN` + `RAILS_ACCESS_CLIENT_ID` + `RAILS_ACCESS_CLIENT_SECRET` present (from
   `.env.development.local`, gitignored) → plain `fetch` over HTTPS with `cf-access-client-id`/
   `cf-access-client-secret` headers (dev, Access service token).
3. Else → `null`, `/rails-health` reports `not-configured` (fail closed, visible).

Forbidden inbound headers (`cookie`, `authorization`, `cf-access-client-id`, `cf-access-client-secret`)
are stripped before every outbound Rails call — prevents credential relay.

`*/apex` workers currently make **no** Rails calls (client + health files were deleted; ADR-001's plan to
add `RAILS_API_URL` health-fetching to apex was apparently reverted).

## D. Tunnel topology inventory

- **No cloudflared config, credentials, or tunnel_id anywhere in this repo** — by design.
  `compose.yaml` states explicitly: the Tunnel connector runs **beside Rails**, not in this repo, and
  `test/compose-tunnel-invariants.test.ts` fails the build if one reappears here.
- `docs/operations/cloudflare-tunnel-development.md` documents the intended topology (not re-derived here
  — should be read directly before Phase 2 design work).
- Only `preview` wrangler env carries `vpc_services` (binding `UMAXICA_APPS_EDGE_CF_WORKERS_VPC`,
  `service_id: 019f5fe0-287f-7040-9f2f-036cb5b21df7`, `remote: true`) — this is the dev-tunnel-backed VPC
  path. `production` env deliberately has none.
- `*/apex` workers have no Tunnel/VPC references at all currently.

## E. Access application/policy inventory

- `docs/operations/cloudflare-access.md` already documents: two policy types — interactive login for
  human-facing Edge dev surfaces, Service Auth token for Rails calls (`core-jp.umaxica.app` reference) —
  and states enforcement is edge-side only (repo code never checks `Cf-Access-Jwt-Assertion`, confirmed:
  no such header handling exists anywhere in the sweep).
- Dev-side Access service-token credential is expected in `.env.development.local` (gitignored,
  server-only), never `NEXT_PUBLIC_*`. `docs/operations/cloudflare-access.md:75` codifies this rule and
  `test/compose-tunnel-invariants.test.ts` enforces the NEXT_PUBLIC_/VITE_ secret-name check.
- No Access config exists in any `wrangler.jsonc` (expected — Access is a dashboard-side policy, not IaC
  in this repo).
- `*/apex` workers: **no Access story exists yet** for them (open item for Track C/E).

## F. Workers VPC inventory

- Binding name: `UMAXICA_APPS_EDGE_CF_WORKERS_VPC`, only declared in each `*/core` (and presumably other
  Next.js workspace) `preview` env, `service_id: 019f5fe0-287f-7040-9f2f-036cb5b21df7`, `remote: true`.
  Production intentionally omits it (fail-closed comment in `wrangler.jsonc`).
- No `vpc_networks` config found anywhere — only VPC **Service** style binding is in use, consistent with
  "one known Rails host is sufficient" (Track B's stated preference).
- `*/apex` workers have zero VPC bindings and zero Rails dependency currently — correctly **NOT REQUIRED**
  per the audit's own principle ("Hono apps that don't need VPC must not gain it for consistency").

## G. URL / environment-variable inventory

- `JIT_{DOMAIN}_{WORKSPACE}_URL` naming convention (`jit-url.ts`, identical in all 15 workspaces) — e.g.
  `JIT_APP_CORE_URL`, `JIT_COM_DOCS_URL` — used to self-report the current workspace's own JIT URL on the
  `/rails-health` page. Where these 15 vars are actually _set_ (`.dev.vars`/CI secrets) was not located —
  open item.
- `RAILS_ORIGIN`, `RAILS_ACCESS_CLIENT_ID`, `RAILS_ACCESS_CLIENT_SECRET` — dev-only, expected in
  `.env.development.local` (gitignored), never in `wrangler.jsonc` `vars` (asserted by a test per the doc).
- `NEXT_PUBLIC_SENTRY_DSN` — only real `NEXT_PUBLIC_*` var found repo-wide, in `dev/acme` only (Sentry,
  browser-safe by design).
- Planning docs (`plans/*.md`, not live code) reference a **retired** `NEXT_PUBLIC_APP_URL` var, replaced
  by the `JIT_*_URL` convention above — confirms the repo already migrated away from generic `BASE_URL`
  proliferation, consistent with the audit's stated goal.
- `.oxlintrc.json` `no-restricted-imports` already blocks `shared/` imports — per-frame duplication of
  `rails-client.ts`/`jit-url.ts`/security headers etc. is intentional (confirmed, not a finding).

## H. apex→www redirect inventory (reframed: these are region routers, not apex→www)

| Worker                             | Behavior                                                                                           | Status | Path/query preserved?                                                              | Notes                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `app/apex`, `com/apex`, `org/apex` | `GET /?ri=jp\|us` → `https://{jp,us}.umaxica.{app,com,org}/`; default `jp` on missing/invalid `ri` | 301    | **No** — target is always root `/`, extra query params dropped (tested explicitly) | Heavy open-redirect-protection test suite (dots, slashes, unicode, null bytes, etc.) |
| `net/apex`                         | `GET /` → `/about` (relative, same-origin)                                                         | 301    | N/A — not a host redirect at all                                                   | Single test, no query/path assertions needed                                         |

This differs materially from the audit prompt's assumed invariant
(`https://example.tld/a?b=c` → `https://www.example.tld/a?b=c`). **Current behavior is intentional and
tested** — flag to user rather than assume a bug.

## I. Rails ↔ Next.js integration findings

- Already follows the audit's stated preference: server-side-only Rails calls, no browser-direct Rails
  access found anywhere.
- Credential hygiene already enforced: forbidden-header stripping, Access secrets never in
  `wrangler.jsonc`/`NEXT_PUBLIC_*`, fail-closed `not-configured` state when neither VPC nor dev creds
  present.
- Gap: no evidence of retry/idempotency/schema-validation/cache-control policy beyond the single
  `/health/liveness.json` check — the audit's Track H items beyond basic health-check are unexplored
  (would need reading actual Rails-calling code paths beyond `/rails-health`, if any exist beyond that one
  page — sweep found none, i.e. Rails integration today is _only_ the health-check, not a real data path).

## J. Security/exposure findings

1. **`compatibility_date` drift**: `*/apex` workers pin `2026-02-27`; all 15 Next.js workspaces pin
   `2026-05-13`. Two-and-a-half-month gap, internally consistent within each group but inconsistent across
   groups. Not necessarily wrong, but worth an explicit decision.
2. **wrangler version mismatch**: root `package.json` devDependency pins `wrangler: ^4.118.0`; catalog
   (`pnpm-workspace.yaml`) pins `^4.93.0`. Minor but should be reconciled to avoid dual installed versions.
3. **CSRF allowlist in `*/apex/src/csrf.ts`** permits both `*.localhost` (any port) and
   `*.*.workers.dev` origins even though `workers_dev: false` in `wrangler.jsonc` (only matters because
   `preview_urls: true` is still set) — worth confirming preview URLs are actually needed given
   `workers_dev` is off.
4. **No `/health` route on `docs`/`news`/`help`/`info` tiers** (only `core` has it) — likely intentional
   (core is the canonical health-checked tier) but not documented anywhere found; worth confirming.
5. **`dev/apex`** workspace exists in `pnpm-workspace.yaml` but was not investigated by any of the three
   discovery agents — true coverage gap for this Phase 1 pass.
6. ADR-001 (`adr/001-rails-health-check.md`) documents a plan to give `*/apex` workers their own
   `RAILS_API_URL` Rails health-fetching — code shows this was implemented then reverted (git status shows
   `rails-client.ts`/`rails-health.ts` deleted from `app/apex`, `com/apex`). Whether this reversion was
   intentional (simplification) or accidental (regression) is unconfirmed — **grill question**.

## K. "Do not change" list

- No wrangler.jsonc, .env*, or Access/VPC dashboard config may be edited in this pass — Phase 1 is
  discovery-only per user's explicit instruction and current plan-mode restrictions.
- Do not touch `.oxlintrc.json`, `.oxfmtrc.json`, `tsgo`, or `vitest` config (per CLAUDE.md).
- Do not reintroduce a `shared/` module to de-duplicate `rails-client.ts`/`jit-url.ts`/apex files — the
  per-frame duplication is intentional (CLAUDE.md, enforced by oxlint).
- Do not assume the apex "redirect" is broken or should become apex→www — current region-router behavior
  is deliberate and tested.

## L. Grill round #1 — resolved

User decisions (locked in for Phase 2):

1. **Scope**: Gap/consistency audit against the existing docs (ADR-005/006,
   `docs/operations/cloudflare-access.md`, `docs/operations/cloudflare-tunnel-development.md`) — not a
   fresh redesign. Those two docs are read in full below (§O) and now treated as the settled architecture.
2. **Apex redirect semantics**: current region-router (`app/com/org`) and same-origin (`net`) behavior
   stays as-is; Track D narrows to Tunnel/Access posture only, not redirect-logic changes.
3. **ADR-001 reversion**: intentional. Apex workers (`app/com/org`) stay Rails-independent by design — Rails
   health belongs on the `*/core` tier via the VPC binding, confirmed by the tunnel doc itself
   ("The apex workers do not contact Rails, so `/health.json` reports only the worker itself.").
4. **Coverage gap**: `dev/apex` investigated (§H/B above) and both docs read in full — Phase 1 now complete.

## O. What the existing docs settle (read in full — §D/E of this doc summarized their content;

this section captures what's now authoritative for Phase 2)

**`cloudflare-tunnel-development.md`** (one connector, in the Rails repo, not here):

- Exactly one Tunnel connector for the whole system, living in the **Rails** repository — this repo used to
  run a second connector on its own `Edge` tunnel and it was **removed**. Two connectors on one tunnel
  load-balance unpredictably; a connector here couldn't reach Rails anyway (different Compose project).
  `test/compose-tunnel-invariants.test.ts` fails the build if a connector/`compose.custom.yaml`/
  `CLOUDFLARED_TOKEN` reappears here. **This resolves Track F (Tunnel topology) outright: Option C (a
  different current architecture) — one shared connector, zero connectors in this repo — not A or B.**
- Edge→Rails dev: Workers VPC binding, `env.preview` only (`preview:vpc` script), OAuth-only
  (`wrangler login`; API tokens are rejected by the `edge-preview` endpoint with `10405`). Fallback for
  developers without a Cloudflare credential: HTTPS to `core-jp.umaxica.app` + Access service token — this
  is the **same tunnel**, a different route type, not a second environment.
- Edge→Rails prod: **nothing yet** — no production VPC Service exists; production fails closed
  (`not-configured`). This is intentional, not a gap: the only VPC Service today terminates on a
  developer's laptop, so pointing prod at it would leak prod traffic onto a dev machine.
- Browser→local dev surfaces: **`localhost` only, not tunnelled, not exposed** today. The
  "Unifying onto one connector" section documents _how_ to re-expose them (shared container network +
  Public Hostname entries on the Rails-side tunnel + an Access application) but explicitly states **this is
  not done yet** — this is the one genuinely open/undecided item the docs flag themselves.
- `*/apex` workers are explicitly called out as never contacting Rails — confirms decision 3 above from the
  docs' own text, independent of the user's answer.

**`cloudflare-access.md`** (who reaches a tunnelled hostname):

- Two non-mixable policy types: interactive-login-only for human-facing Edge dev surfaces, Service-Auth
  token only for the Rails hostname (`core-jp.umaxica.app`). Enforcement is **edge-side only** — repo code
  verifiably contains no `Cf-Access-Jwt-Assertion` handling, no `aud` check; this is declared a deliberate
  boundary, not a gap, and re-implementing it in-app is explicitly forbidden ("would duplicate an upstream
  control with a weaker copy").
- Repository-side work is stated **complete, no work outstanding**: dev transport config
  (`.env.development.local`), secret-leak guards, header-stripping, no-connector-here — all asserted by
  `test/compose-tunnel-invariants.test.ts`. Remaining work is **dashboard-only** (§2, §2b, §3 — Access
  application/policy creation, Entra ID as IdP) and explicitly **not applicable yet** because nothing is
  tunnelled/published yet (same open item as above).
- Rails Access application (§2b) is a **second, separate** Access application from the Edge one — conflating
  them would let a browser reach Rails directly, which the docs treat as a hard boundary violation.

**Net effect on Tracks C/E/F for `*/apex` workers**: the docs cover only the `*/core`-tier Rails path.
They say nothing about giving `*/apex` workers their own dev-hostname/Tunnel/Access story — because apex
workers have no Rails dependency, and per Track F's "Unifying onto one connector" section, _any_ future
Edge dev-surface exposure (apex included) would ride the **same** shared Rails-side connector + Access
application design, not a bespoke one. So Track C/E for apex isn't a new decision to make — it's "when/if
local dev surfaces get re-exposed, apex joins the same unified-connector plan as everything else," which is
already-designed, not-yet-executed infra work, not a code change in this repo.

## M. Baseline commands/tests run

None executed in this pass (read-only discovery via Explore agents: file reads, grep sweeps, git status/diff
inspection). No `pnpm install`/`lint`/`typecheck`/`test` run — appropriate for a discovery-only Phase 1.

## N. Official documentation consulted

None fetched live in this pass — findings are based on in-repo ADRs/docs
(`adr/001,005,006`, `docs/operations/cloudflare-access.md`, `docs/operations/cloudflare-tunnel-development.md`)
plus repository source. Per the audit prompt's doc policy, live Cloudflare/Next.js/Hono doc verification
(Tunnel, Access, Workers VPC, workers.dev routing) should happen in Phase 2 once the direction from the
grill-round answers is known, so verification targets the actual decisions being made rather than
speculative ones.

---

## Phase 1 status: complete

All grill-round questions resolved (§L), `dev/apex` investigated (§B/H), both operations docs read in full
(§O). Remaining open items carried into Phase 2, all already flagged by the docs themselves rather than
newly discovered here:

1. **"Unifying onto one connector" is designed but not executed** — local dev surfaces (Next.js and, per
   this audit, apex too) are `localhost`-only today. Re-exposing them means: shared container network
   (`compose.custom.yaml`, currently deliberately unwired), Public Hostname entries on the Rails-side
   tunnel, and an Access application — all dashboard/ops work in the _Rails_ repo and Cloudflare dashboard,
   not code changes here. Ask the user in Phase 2 whether this is in scope now or still deferred.
2. **Minor drift items from §J** (compat-date split apex-vs-core, wrangler version pin mismatch, apex CSRF
   allowing `workers.dev`/`localhost` origins despite `workers_dev:false`, `docs/news/help/info` lacking a
   `/health` route that `core` has) — small, low-risk, worth a decision each but none block anything.
3. **`dev/apex`** is architecturally the odd one out: real apex→(www|core) redirect semantics (unlike the
   region-router pattern in app/com/org), on Vercel rather than Cloudflare, with its own `/health*` +
   `/about` implementation duplicating the app/com/org apex pattern. No Tunnel/Access/VPC applies to it
   (outside the Cloudflare boundary) — flagged for awareness, not a finding requiring action.

Phase 2 (concrete per-folder plan, minimal-change vs strong-separation options) is **not started** —
requires explicit authorization per the audit prompt's Phase 3 implementation gate, and per plan-mode rules
governing this session.
