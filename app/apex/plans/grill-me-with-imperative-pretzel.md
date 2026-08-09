# Shared-FQDN Core Router Audit — Phase 1 Report

## Context

The mission asks for a comparison of Cloudflare dispatch architectures (dedicated
Router Worker vs. Next.js-as-entry vs. Cloudflare-rules-only) for a future state
where `jp.umaxica.{app,com,org}` serves both Rails and Next.js from one
browser-facing FQDN. No code changes are authorized; this document is the
Phase 1 deliverable (inventory, ownership matrices, architecture comparison,
recommendation) plus a Grill round of open questions before Phase 2 is drafted.

**The single most important finding of Phase 0 reframes the whole mission**: no
browser ever reaches Rails directly today, at any hostname, in this repository.
Rails is called exclusively **server-side**, from within each `*/core` Next.js
app's own request lifecycle (health check today; presumably more later). There
is no existing Rails-owned browser path to preserve, no existing recursion risk
to fix, and no existing Router Worker or gateway anywhere in the workspace. The
architecture this mission describes (Option A/B/C) is new work layered on top
of a Rails integration that is itself still "not verified end to end in
production" per ADR 006. Everything below is scoped with that in mind.

---

## A. Deployable-unit inventory (Core-relevant)

| Deployable                                                                | Kind                          | Domain                                                       | Talks to Rails?                                                                                                         |
| ------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `app/apex`, `com/apex`, `org/apex`                                        | Hono Worker                   | apex/root domain                                             | No (Rails client removed here, see git status `D src/rails-client.ts`)                                                  |
| `net/apex`                                                                | Hono Worker                   | umaxica.net apex                                             | No                                                                                                                      |
| `app/core`, `com/core`, `org/core`                                        | Next.js on Workers (OpenNext) | regional subdomain (`jp.umaxica.*` today, per apex redirect) | Yes — `src/lib/rails-client.ts` + `rails-health.ts`                                                                     |
| `app/info`, `com/info`, `org/info`, and `docs`/`news`/`help` × 3 families | Next.js on Workers            | content subdomains                                           | Yes — same `rails-client.ts`/`rails-health.ts` pattern, rollout in progress (untracked files in git status for several) |
| `dev/apex`, `dev/acme`                                                    | Vercel/edge fn                | umaxica.dev                                                  | Not investigated (out of scope — separate domain family)                                                                |

No Core Router Worker, no Hono gateway, no cross-worker `services` binding
exists anywhere. Every `wrangler.jsonc`'s `services` array binds only
`WORKER_SELF_REFERENCE` to itself.

## B. Current routing map

```text
Browser
  |
  v
apex.{app,com,org}   (Hono Worker, */apex)
  |
  | 301 redirect (?ri=jp default), no Rails involvement
  v
jp.umaxica.{app,com,org}   (Next.js Worker, */core — OpenNext on Cloudflare Workers)
  |
  | server-side only, inside Route Handlers / Server Components
  v
getRailsClient().fetch(path)
  |
  +-- production: Workers VPC binding (env.production — currently REMOVED,
  |     no VPC Service/tunnel exists in production yet; getRailsClient()
  |     returns null; /rails-health answers 503 "not-configured")
  |
  +-- env.preview (dev-only opt-in): Workers VPC binding, remote:true,
  |     proxied through wrangler login to a development tunnel/VPC Service
  |     that fronts a local Rails container
  |
  +-- development fallback: HTTPS + Cloudflare Access to core-jp.umaxica.app
        (same dev tunnel as above, different transport)
```

Rails has **no public origin** in any environment (ADR 005). `core-jp.*` is a
Cloudflare-Tunnel-fronted hostname used only as (a) the Access-protected dev
fallback transport target and (b) never resolved by a browser. Production
Rails connectivity does not exist yet — ADR 006 removed the VPC binding from
`env.production` because it pointed at a development resource.

## C. Next.js path ownership matrix

| Path/prefix                                                                                        | Current owner                                                                            | Proposed owner          | Must bypass Next? | Cookie relevant?                                                         | Evidence                                                       |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------- | ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `/` , `/explore`, `/doctor`, `/messages`, `/notifications`, `/configuration*`, `/home` (→redirect) | Next.js (`*/core` App Router)                                                            | Next.js                 | No                | Unknown — no `cookies()`/`next/headers` usage found anywhere in `*/core` | `{app,com,org}/core/src/app/(page)/*`                          |
| `/about`                                                                                           | Next.js                                                                                  | Next.js                 | No                | No                                                                       | same                                                           |
| `/health`                                                                                          | Next.js Route Handler (`GET` only)                                                       | Next.js                 | No                | No                                                                       | `*/core/src/app/health/route.ts`                               |
| `/rails-health`                                                                                    | Next.js (Server Component calling Rails server-side)                                     | Next.js                 | No                | No                                                                       | `*/core/src/app/(page)/rails-health/page.tsx`                  |
| `/robots.txt`, `/sitemap.xml`                                                                      | Next.js, **placeholder content** (`FIXME: rewrite!`, points at `acme.com`/`example.com`) | Next.js                 | No                | No                                                                       | `*/core/src/app/robots.ts`, `sitemap.ts`                       |
| `/_next/*`, favicon                                                                                | Next.js framework default                                                                | Next.js                 | No                | No                                                                       | no custom favicon/error/not-found files found                  |
| Any Rails-owned browser path                                                                       | **None exists**                                                                          | **Open — see Grill Q1** | —                 | —                                                                        | Rails is never reached except server-side from within `*/core` |

No path collision exists today because Rails owns zero browser paths. The
"Rails ownership vs Next ownership" conflict the mission anticipates has not
materialized yet in this repo.

## D. Rails path dependency matrix

Not applicable in the form the mission expects (`Rails-owned request`
contract), because no request from a browser is ever dispatched to Rails.
The only Rails contract that exists today is server-to-server:

| Concern                | Current behavior                                                                                                                                                                                             | Evidence                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Path matching          | Exact path Rails serves (`/health/liveness.json`); no prefix rewriting — ADR 006 §4 explicitly retracted the earlier `/{frame}/{brand}` prefix scheme after Rails 404'd on it                                | ADR 006                                              |
| Method                 | Always `GET` today (health check only)                                                                                                                                                                       | `rails-client.ts`                                    |
| Headers                | `cookie`, `authorization`, `cf-access-client-id`, `cf-access-client-secret` are **stripped** from any inbound-derived headers before the outbound call; transport's own credentials applied after            | ADR 005 §6, `test/compose-tunnel-invariants.test.ts` |
| Host                   | `RAILS_VPC_ORIGIN = http://core.app.localhost:3000` — a **VPC routing label**, not a DNS-resolved hostname; production and dev both use the same label because the VPC Service (not DNS) decides destination | ADR 005 §3, §5                                       |
| Redirects / Set-Cookie | Not exercised — only a health-check GET has ever been made                                                                                                                                                   | ADR 006 Outcome                                      |
| Timeout/retry          | 5000ms `AbortSignal.timeout`, no retry (deliberate — caller decides)                                                                                                                                         | ADR 005 §7                                           |

If/when Rails gains a browser-facing path under the shared FQDN, this
contract (Set-Cookie fidelity, CSRF headers, Origin/Referer, redirect
`Location` rewriting) is undefined and must come from the Rails repo, which
is outside this workspace.

## E. Architecture comparison

| Criterion                    | A: Dedicated Router Worker                                                                                                             | B: Next.js Worker as entry                                                                                                               | C: Cloudflare rules/config split                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL path matching            | Full control, app-level logic                                                                                                          | Full control, app-level logic                                                                                                            | Wildcard-only, path-prefix, no infix — Cloudflare Routes docs confirm this is for "always the same origin," not conditional dispatch                                                           |
| Same-FQDN guarantee          | Yes                                                                                                                                    | Yes (trivially — it already is the entry)                                                                                                | Yes, if Routes are correctly scoped per prefix                                                                                                                                                 |
| Cookie preservation          | Depends on implementation; extra hop = extra chance to mishandle `Set-Cookie`                                                          | Fewer hops if Next forwards via VPC binding directly                                                                                     | N/A — Cloudflare Routes don't touch bodies/headers, only which Worker receives the request                                                                                                     |
| Streaming (req/resp)         | Must be implemented carefully (Workers `fetch` proxying supports streaming, but naive router code can buffer)                          | Same code path Next.js already uses for its own responses                                                                                | Not applicable — no app logic in the split itself                                                                                                                                              |
| WebSocket/SSE                | Extra hop must forward Upgrade correctly                                                                                               | Direct — Next.js Worker already terminates connections                                                                                   | Routes can point a hostname/prefix at a Worker; the Worker itself must still handle WS                                                                                                         |
| Service binding availability | Router → Next.js Worker: yes, in-process (docs: "both Workers run on the same thread")                                                 | N/A (self)                                                                                                                               | N/A                                                                                                                                                                                            |
| Recursion risk               | New component: risk exists only if it re-fetches its own public hostname (no evidence of a pattern like this in the repo — greenfield) | None — no self-referential fetch in current `*/core` code                                                                                | None — Cloudflare Routes don't call back into app code                                                                                                                                         |
| Observability                | New Worker = new log stream, new place for silent failure                                                                              | Reuses existing Next.js Worker observability (OpenNext, `X-Robots-Tag`, `/health` patterns already established)                          | Least app-level observability — routing decisions aren't logged as app events                                                                                                                  |
| Deployment coupling          | Adds a deploy dependency: Router must ship in lockstep with both Next and Rails path changes                                           | Next.js Worker deploy already governs the whole surface                                                                                  | Route config lives in Cloudflare dashboard/Terraform, decoupled from any Worker deploy — but that's also a _risk_: routing changes don't go through this repo's tests/CI                       |
| Failure isolation            | Router Worker down = **everything** down (new single point of failure not present today)                                               | Next.js Worker down = everything down (already true today — apex has no Rails coupling, but core does route ALL current browser traffic) | Cloudflare-level failure isolation is strong (per-Worker), but requires Rails to have its **own** Worker/Custom Domain to route to, which doesn't exist                                        |
| Rollback                     | New Worker adds a rollback surface                                                                                                     | Existing Next.js deploy rollback covers it                                                                                               | Route config rollback is a dashboard/API operation, separate from `wrangler deploy`                                                                                                            |
| Next.js compatibility        | N/A — Router is Rails-agnostic to Next internals                                                                                       | Native — Next.js Worker already IS the OpenNext entry                                                                                    | N/A                                                                                                                                                                                            |
| Config complexity            | New wrangler project, new tests, new CI                                                                                                | Zero new deployables — extends existing `*/core`                                                                                         | Lowest app-code complexity, but Cloudflare-side routing config is currently **absent from this repo entirely** (no `routes`/`custom_domain` in any wrangler.jsonc today — greenfield here too) |

**Repo-native observation**: this codebase already treats `*/apex` as "the
thing that owns the apex/root domain and must survive a Rails outage" and
`*/core` as "the thing that talks to Rails, behind its own `/rails-health`
circuit breaker." That pattern — a thin, Rails-blind Worker at the true entry,
and a Rails-aware Worker one hop in — is structurally closer to **Option B**
than Option A, except Option B says the Next.js Worker (not a new Router)
_is_ that Rails-aware hop. Introducing a **third** component (Option A) adds
exactly the kind of duplicated failure surface `*/apex`'s Rails-blindness was
designed to avoid at the apex layer.

## F. Recommended shared-FQDN request path (subject to Grill Q1 answer)

If the answer to Grill Q1 is "Rails stays server-side-only, Next.js remains
the sole browser-facing entry" (which is what today's code already does),
no new Router Worker is needed at all — Option B is not even a change, it's
confirming the status quo:

```text
Browser
  |
  v
jp.umaxica.{app,com,org}
  |
  v
Next.js Worker (*/core, OpenNext on Cloudflare Workers)
  |
  +--> own route rendering (all current browser-facing paths)
  |
  +--> Rails, server-side only, via Workers VPC binding
         (production: not yet provisioned; dev: env.preview)
```

If the answer is "Rails must own some browser-visible paths directly" (e.g.
an OAuth/OIDC callback, a Rails-rendered admin page), Option A vs B is a real
decision and needs Rails-repo evidence on what those paths are before
recommending — see Grill Q1/Q2.

## G. Cookie/session analysis

- No `cookies()`, `headers()`, or any `next/headers` import exists anywhere in
  `*/core` today — Next.js currently reads and sets **no cookies at all**.
- Rails session cookie handling is a non-issue today because no request path
  carries one: `rails-client.ts` actively **strips** any inbound cookie/auth
  header before the Rails call, on both transports, and this stripping is
  guarded by `test/compose-tunnel-invariants.test.ts`.
- Cookie/session authority has not been moved to Next.js, and constraint 10
  ("don't move it") is presently satisfied trivially — there is no session
  authority in Next.js to move away from.
- If Rails ever needs Next.js to read/forward its session cookie (Track G
  territory), that is new design work, not a bug to fix.

## H. Workers VPC Host decision

**Observed** (not inferred): the VPC binding's `fetch()` **Host header does
not control routing** — confirmed against current Cloudflare Workers VPC
docs (`developers.cloudflare.com/workers-vpc/api/`): "The host provided in
fetch() does not control routing. It only populates the Host header and,
when using https, the SNI value." Routing is entirely determined by
`service_id` (which VPC Service/tunnel/target the binding points at).

This means the mission's PUBLIC_CORE_* vs PRIVATE_CORE_* Host comparison is
**decoupled from VPC routing correctness** — either Host value reaches the
same Rails backend, because the VPC Service, not the Host header, decides
the destination. The actual decision is about what `Host` header **Rails'
`Host Authorization`** expects to see, which is a Rails-repo contract this
workspace cannot resolve.

**Current reality**: neither a `PUBLIC_CORE_*` nor `PRIVATE_CORE_*` env var
family exists in this repo. The current constant is `RAILS_VPC_ORIGIN =
http://core.app.localhost:3000`, described in ADR 005 as "a VPC addressing
label... not a hostname resolved by DNS." It doesn't map onto either
proposed family. **Open decision — Grill Q3.**

## I. Canonical hostname migration

| Hostname                        | Found?                                                                                                        | Role today                                                                                                                                     | Migration status                                                                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `jpx.umaxica.*`                 | **Not found anywhere** — zero code, config, docs, or git-history hits (`git log --all -- '**/jpx*'` is empty) | None                                                                                                                                           | Nothing to migrate — treat as hypothetical unless the user has out-of-repo context. **Grill Q5.**                                                                                                                              |
| `core-jp.umaxica.{app,com,org}` | Found — Rails Cloudflare Tunnel's own public hostname                                                         | Dev-only Access-protected fallback transport target (server-to-server, never browser-facing) and the string embedded in `RAILS_ORIGIN` example | Per constraint 5 ("don't confuse Rails private routing target with HTTP Host"), this should likely **stay** as Rails' private tunnel endpoint, not become a browser-facing alias of `jp.*`. Needs confirmation — **Grill Q2.** |
| `jp.umaxica.{app,com,org}`      | Found — the locale-redirect target apex Workers send browsers to                                              | Already canonical for Next.js browser traffic today                                                                                            | No migration needed for Next.js; only relevant if Rails paths get added under it                                                                                                                                               |

## J. Development topology (already correctly separated in this repo)

The two-mode design the mission asks for **already exists**, built in ADR
005/006, and should be treated as a Do-Not-Change baseline rather than
something to redesign:

| Mode                                | Command                 | Runtime                            | VPC binding                                                        | Credential                                                                          |
| ----------------------------------- | ----------------------- | ---------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Fast local dev                      | `pnpm dev` (`next dev`) | Node                               | No                                                                 | None                                                                                |
| Cloudflare integration (no VPC)     | `pnpm preview`          | local workerd, `--env development` | No                                                                 | None                                                                                |
| Cloudflare integration (with Rails) | `pnpm preview:vpc`      | local workerd, `--env preview`     | Yes, `remote: true`                                                | `wrangler login` (OAuth; API token explicitly rejected by Cloudflare for this flow) |
| Deploy                              | `pnpm deploy`           | Cloudflare, `--env production`     | **None today** — production VPC Service/tunnel not yet provisioned | API token                                                                           |

## K. Risks and failure modes (current state)

- Production Rails connectivity **does not exist** — `getRailsClient()`
  returns `null` in production, `/rails-health` answers 503
  `not-configured`, by design ("fail closed, visibly" — ADR 005/006). This
  is not a bug to fix under this mission; it's a prerequisite the mission's
  browser-facing-Rails-paths goal depends on.
- `robots.ts`/`sitemap.ts` still contain placeholder domains
  (`acme.com`/`example.com`) with `FIXME: rewrite!` comments — unrelated to
  routing architecture but flagged since it's adjacent Core-surface content.
- No recursion risk exists today (no self-referential fetch to `jp.*` from
  any Worker) — but Option A (new Router Worker) would introduce the first
  component capable of creating one, which is exactly the scenario Track E
  asks to avoid. Option B carries no such risk because Next.js never fetches
  its own canonical hostname.
- Introducing Option A also introduces a new single point of failure
  upstream of both Rails and Next.js that doesn't exist today.

## L. Do-not-change list

- `*/apex`'s Rails-blindness (constraint: apex must survive Rails outages) —
  confirmed intact post-deletion of `rails-client.ts`/`rails-health.ts` from
  `*/apex`.
- The `getRailsClient()` transport-resolution order and the four-header
  strip in `rails-client.ts` (ADR 005 §5, §6) — security-load-bearing,
  guarded by `test/compose-tunnel-invariants.test.ts` and
  `test/rails-connection-invariants.test.ts`.
- `env.production` having **no** `vpc_services` block — deliberate fail-closed
  state (ADR 006 §2), not an oversight to "fix" as part of this mission.
- The per-frame duplication of `rails-client.ts`/`rails-health.ts` (×15) —
  required by `CLAUDE.md`'s no-`shared/`-directory policy.
- `tools/check-workers.mjs` and its binding-placement enforcement.
- No `routes`/`custom_domain`/`services` (cross-worker) exist in any
  `wrangler.jsonc` today — any Phase 2 design that adds these is new
  surface area, not a modification of existing config.

## M. Grill round #1

### Q1 — Does Rails need any browser-facing path at all under `jp.umaxica.*`, or does it stay server-side-only?

- **Observed**: Today, Rails is reached exclusively from server-side code
  inside `*/core` (Route Handlers / Server Components calling
  `getRailsClient()`). No browser request is ever routed to Rails, at any
  hostname, in any environment. ADR 005/006 built exactly this "Next.js is
  the only browser-facing surface; Rails is a private backend" shape,
  deliberately.
- **Decision needed**: whether the mission's "Rails-owned paths" (e.g. an
  OAuth callback, a Rails-rendered page) are (a) real upcoming requirements
  not yet reflected in this repo, or (b) a generic architecture description
  that in this repo's case resolves to "Next.js Route Handlers that happen to
  call Rails," with no browser-visible Rails path ever existing.
- **Options**: (a) Rails gets real browser-facing paths → Option A/B
  comparison in section E matters and needs Rails-repo path list; (b) Rails
  stays server-side-only → no Router Worker, no dispatch architecture change
  needed at all, and this mission's Phase 2 becomes "confirm/harden the
  existing pattern," not "build a router."
- **Recommendation**: (b), unless you have specific Rails-owned browser
  routes in mind — the repo shows no pressure toward (a).
- **Docs basis**: N/A — this is a product/architecture question, not a
  Cloudflare capability question.

### Q2 — Should `core-jp.umaxica.*` ever become browser-facing, or does it stay Rails' private/dev-only tunnel endpoint permanently?

- **Observed**: `core-jp.*` today is only the Rails Cloudflare Tunnel's own
  hostname, used solely as a dev-only Access-protected fallback transport
  (server-to-server). It has never been browser-facing.
- **Decision needed**: confirms Track H's migration scope — if it never
  becomes browser-facing, there is no "migrate `core-jp` → `jp`" work to plan,
  only "keep it as Rails' tunnel endpoint, unrelated to the `jp.*` canonical
  browser hostname."
- **Options**: (a) `core-jp.*` stays private/dev-only forever; (b) it becomes
  a public alias eventually (contradicts constraint 5's routing-target vs
  Host distinction, so likely not intended).
- **Recommendation**: (a).
- **Docs basis**: N/A — repo-evidence question.

### Q3 — Should the existing `RAILS_VPC_ORIGIN`/`RAILS_ORIGIN` naming be renamed to `PUBLIC_CORE_*`/`PRIVATE_CORE_*`, or is that just how you described the concept generically?

- **Observed**: Neither `PUBLIC_CORE_*` nor `PRIVATE_CORE_*` exists anywhere
  in the repo. Current code uses `RAILS_VPC_ORIGIN` (a VPC routing label,
  confirmed by Cloudflare docs to not affect routing, only the Host header
  sent to Rails) and `RAILS_ORIGIN` (dev HTTPS fallback).
- **Decision needed**: whether Phase 2 should introduce an actual
  `PUBLIC_CORE_*`/`PRIVATE_CORE_*` rename (touching all 15 `rails-client.ts`
  copies + guardrail tests), or whether constraint 3 is satisfied by treating
  "the VPC label" as the PRIVATE family and something not-yet-built as the
  PUBLIC family.
- **Options**: (a) rename existing constants to the two-family scheme; (b)
  keep current naming, treat constraint 3 as a design principle rather than a
  literal variable-name requirement.
- **Recommendation**: (b) for Phase 1 (no rename without explicit
  authorization per constraint 3's own spirit — CLAUDE.md forbids
  unauthorized config-shape changes); flag as a Phase 2 candidate if you want
  literal naming.
- **Docs basis**: N/A — naming convention question.

### Q4 — Should Phase 2 treat "finish production Rails connectivity" (provision a production VPC Service/tunnel) as a prerequisite (P0), in scope, or explicitly out of scope for this mission?

- **Observed**: ADR 006 left production with **zero** Rails connectivity by
  design (`env.production` has no `vpc_services`), pending a production
  tunnel + VPC Service that must be created via the Cloudflare
  dashboard/API — explicitly **outside this repository**. Any browser-facing
  shared-FQDN design for Rails is unreachable in production until that
  exists.
- **Decision needed**: whether this mission's P0/P1/P2 roadmap should list
  "provision production VPC Service" as P0 (blocking), or whether that's
  tracked elsewhere and this mission should design assuming it will exist.
- **Options**: (a) P0 blocker in this mission's roadmap; (b) out of scope,
  assumed as an external dependency.
- **Recommendation**: (b) — it's explicitly a dashboard action per ADR
  006, not something this codebase/mission can execute, but it should still
  be listed as an **external blocking dependency** in the roadmap output.
- **Docs basis**: ADR 006 §"Restoring it is two steps, both outside this
  repository."

### Q5 — Is `jpx.umaxica.*` a real hostname from context outside this repo, or should Track H drop it as not-applicable?

- **Observed**: Zero evidence anywhere — no file, string, config, or git
  history (including deleted/renamed files) matches `jpx`.
- **Decision needed**: whether you have external knowledge (DNS records,
  Cloudflare dashboard state, another repo) that `jpx.*` exists, or whether
  it was included in the mission template speculatively.
- **Options**: (a) it's real, tell us where (DNS/dashboard/other repo) so it
  can be accounted for; (b) drop it from Track H entirely.
- **Recommendation**: (b) unless you confirm otherwise.
- **Docs basis**: N/A — repo-evidence question.

---

## Answers received (Q1–Q3)

- **Q1 — Rails stays server-side-only.** No browser-facing Rails path is
  planned. This collapses Track B to: no Router Worker, no new dispatch
  architecture — Phase 2 confirms/hardens the existing "Next.js is the sole
  browser-facing entry, Rails is a server-side-only dependency behind
  `/rails-health`" pattern.
- **Q2 — `core-jp.umaxica.*` stays private/dev-only forever.** Track H's
  canonical-hostname migration concerns only `jp.*` for Next.js; `core-jp.*`
  is left untouched as Rails' tunnel endpoint.
- **Q3 — Keep current naming** (`RAILS_VPC_ORIGIN`/`RAILS_ORIGIN`). No rename
  to `PUBLIC_CORE_*`/`PRIVATE_CORE_*` is in scope. The two-family constraint
  is treated as satisfied in principle (VPC binding = private-network path,
  Access-fronted dev fallback = the public-hostname path), not as a literal
  variable-name requirement.

**Consequence for Phase 2**: with Q1 resolved this way, the mission's central
question ("Router Worker vs Next.js-as-entry vs Cloudflare rules") has a
clear answer — **Option B, which is already what this repo does**. Phase 2
will be a confirm-and-harden plan (e.g., finishing production Rails
connectivity, closing the `robots.ts`/`sitemap.ts` placeholder gap, verifying
`/rails-health` semantics) rather than a net-new router design. Q4 and Q5
remain open below and will be folded into Phase 2's roadmap.

## Answers received (Q4–Q5)

- **Q4 — External blocking dependency.** Provisioning a production Cloudflare
  Tunnel + VPC Service is a dashboard/API action outside this repo. The
  roadmap will list it as a prerequisite this mission does not execute, not
  as an owned P0 task.
- **Q5 — Drop `jpx.umaxica.*` as not-applicable.** No evidence found; Track H
  scopes to `jp.*` (canonical, unchanged) and `core-jp.*` (stays private/
  dev-only per Q2) only.

## All open questions resolved — summary of Phase 2 scope

With Q1–Q5 settled: no Router Worker, no browser-facing Rails path, no env-var
rename, no `jpx.*` migration, and production VPC provisioning treated as an
external prerequisite. Phase 2 is therefore a **confirm-and-harden** plan for
the existing "Next.js Worker is the sole browser-facing Core entry; Rails is
a server-side-only dependency behind `/rails-health`" architecture (already
Option B, already built by ADR 005/006) — not a new dispatch architecture.

Phase 2 will cover, at minimum:

- P0 (external prerequisite, not executed here): production Cloudflare
  Tunnel + VPC Service provisioning, so `env.production` can regain a
  `vpc_services` block per ADR 006's documented restoration steps.
- P1 candidates: closing the `robots.ts`/`sitemap.ts` placeholder-domain gap
  (`acme.com`/`example.com` → real `jp.umaxica.*` hostnames) in `*/core`;
  verifying `/rails-health` behaves correctly once production connectivity
  exists; confirming the 12 in-progress content-frame `rails-client.ts`
  rollouts (untracked files per git status) land consistently with the 3
  `*/core` copies.
- P2 candidates: any future decision to give Rails a real browser-facing
  path would reopen the Option A/B/C comparison in Section E — documented
  here so it isn't re-litigated from scratch if that need arises later.

No implementation begins until you explicitly authorize it per the mission's
Implementation gate.

---

# Phase 2 revision — Q1 reopened, Track B re-litigated

**Status: Phase 2 refactor (env-var rename) was started, then stopped by the
user before completion. It ran in an isolated worktree
(`.claude/worktrees/agent-a8e16574535167ace`) which has been deleted. Nothing
landed in the main repo — `git status` on `app/apex`, `CLAUDE.md`, `adr/`
shows only the pre-existing, pre-session working-tree state. The rename is
not applied, not merged, not queued.**

## What changed

The Rails repo audit supplies a fact Phase 1 didn't have: **Rails Core owns
real browser-facing routes** — `/api/v0/*`, `/web/v0/*`, `/edge/v0/*`,
`/oidc/*`, `/sign/out*`, and others in `config/routes/core.rb`. `/oidc/callback`
is browser-facing and **sets authentication cookies**. This falsifies Q1's
answer ("Rails stays server-side-only"). Track B is reopened on that basis.

**Q3 stands as originally answered — no rename.** `RAILS_VPC_ORIGIN` /
`RAILS_ORIGIN` naming is unchanged. Naming is deferred until routing
architecture is finalized, per your instruction.

## Revised target architecture

```text
Browser
  |
  v
jp.umaxica.{app,com,org}                 (single browser-facing FQDN)
  |
  v
one Worker, first code to see the raw Request
  |
  +-- Rails-owned path (/api/v0/*, /web/v0/*, /edge/v0/*, /oidc/*, /sign/out*, ...)
  |     -> forwarded to Rails via Workers VPC binding, Cookie header preserved verbatim
  |     -> Rails' Set-Cookie returned to the browser untouched
  |
  +-- Next.js-owned path (everything else)
        -> inbound Cookie header stripped from the Request BEFORE it reaches
           any Next.js/OpenNext code
        -> Set-Cookie stripped from the Response before it reaches the browser
```

Rails remains sole session/auth authority on both branches: it either
receives cookies directly (Rails-owned path) or the browser never sees
Next.js emit any `Set-Cookie` and Next.js never sees an inbound `Cookie`
(Next-owned path) — there is no third state where a cookie touches Next.js
code.

## The load-bearing question, answered from current docs

**Can Option B (the existing Next.js/OpenNext Worker) inspect and route the
raw Request before any Next.js/OpenNext runtime code sees it — specifically,
before the Cookie header reaches the application boundary?**

**Yes — and it's already an officially documented extension point, not a
hack.** Per `opennext.js.org/cloudflare/howtos/custom-worker`, the entire
OpenNext-Cloudflare build output is just a JS module:

```ts
// worker.ts — this file, not .open-next/worker.js, is the actual Worker entry
// @ts-ignore — generated at build time
import { default as handler } from './.open-next/worker.js';

export default {
  fetch: handler.fetch,
  // ...
} satisfies ExportedHandler<CloudflareEnv>;
```

`handler.fetch` is a plain function reference you own. Nothing requires you
to call it unconditionally. A custom entry can be:

```ts
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (isRailsOwnedPath(url.pathname)) {
      // Cookie header (and every other header) forwarded verbatim.
      // handler.fetch is never called — no Next.js/OpenNext code runs
      // for this request at all.
      return env.PRIVATE_CORE_RAILS_VPC.fetch(buildRailsRequest(request));
    }
    // Next-owned path: construct a new Request with Cookie removed
    // BEFORE any OpenNext/Next.js code observes the original one.
    const strippedHeaders = new Headers(request.headers);
    strippedHeaders.delete('cookie');
    const nextRequest = new Request(request, { headers: strippedHeaders });
    const response = await handler.fetch(nextRequest, env, ctx);
    // Strip Set-Cookie from the Next.js response before it reaches the browser.
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('set-cookie');
    return new Response(response.body, {
      ...response,
      headers: responseHeaders,
    });
  },
} satisfies ExportedHandler<CloudflareEnv>;
```

This is architecturally sound because **the custom `worker.ts` file is the
true Worker entry point** (it's what `wrangler.jsonc`'s `main` points at,
after the OpenNext build step generates `.open-next/worker.js` as an
importable module, not the deployed entry). `handler.fetch(request, env,
ctx)` is an ordinary function call your code makes or doesn't make. There is
no framework boundary the Cookie header must cross to reach this dispatch
point — it's the first line of the first function the Workers runtime
invokes.

I checked whether the documented **Multi-Worker Advanced Setup**
(`opennext.js.org/cloudflare/howtos/multi-worker`) changes this answer — it
doesn't. That guide only splits Next.js's own middleware/server internals
across multiple Workers connected by service bindings; it does not add a
capability the single-file custom-worker pattern above lacks, and routing
still happens inside code you write, not inside undocumented framework
internals.

## Option A vs Option B, revised

| Criterion                                                               | A: Dedicated Core Router Worker                                                                                                                                                                                                                                        | B: Custom `worker.ts` on the existing Next.js/OpenNext Worker                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Can it see the raw Request (incl. Cookie) before any Next.js code runs? | Yes, trivially — it's a separate Worker                                                                                                                                                                                                                                | **Yes, equally** — confirmed above; `handler.fetch` is a plain function call, not a framework boundary the request must cross                                                                                                    |
| Extra network hop for Next-owned traffic                                | Yes — Router → Next.js Worker via service binding, in-process but still a second `fetch()`/RPC call, second set of Workers-runtime overhead (CPU-time billing, cold-start surface)                                                                                     | **No** — dispatch and OpenNext handling run in the same invocation, same Worker                                                                                                                                                  |
| New deployable / new failure surface                                    | Yes — a new wrangler project, new CI, new rollback surface, and (per Phase 1 §K) a new single point of failure upstream of both Rails and Next.js                                                                                                                      | **No** — extends `*/core`'s existing deployable; no new SPOF is introduced                                                                                                                                                       |
| Deployment coupling                                                     | Router must ship in lockstep with both Rails-path and Next-path changes — two repos' route lists both live in a third project                                                                                                                                          | Route list lives beside the code it dispatches to; a Next.js route addition and its dispatch-table entry are the same PR                                                                                                         |
| Recursion risk (Track E)                                                | Structurally possible if misconfigured (Router → Next.js Worker → back out to `jp.*` publicly) — must be actively avoided via service binding, not just care                                                                                                           | **Not applicable** — there is only one Worker; it cannot recurse into itself over the network                                                                                                                                    |
| Cookie-stripping correctness                                            | Same code either way — the logic in the snippet above is identical regardless of which Worker hosts it                                                                                                                                                                 | Same                                                                                                                                                                                                                             |
| VPC binding placement                                                   | Router Worker needs the `vpc_services` binding                                                                                                                                                                                                                         | `*/core` needs it — same binding, same `service_id`, already documented in ADR 005/006 §Worker VPC config; no change to where the binding lives                                                                                  |
| Observability                                                           | Two log streams to correlate per request (Router + Next.js Worker)                                                                                                                                                                                                     | One log stream per request                                                                                                                                                                                                       |
| Performance                                                             | Extra hop adds latency (service-binding calls are in-process/same-thread per Cloudflare docs, so the cost is small but non-zero — extra `fetch()` construction, extra Workers invocation accounting) on **every** Next-owned request, which is the majority of traffic | No added latency for Next-owned requests; Rails-owned requests cost the same VPC hop either way                                                                                                                                  |
| Rails-owned request path                                                | Router forwards to Rails via VPC (1 hop) or to Next.js Worker via service binding (1 hop)                                                                                                                                                                              | `*/core` forwards to Rails via VPC directly (1 hop) — same hop count as Option A's Rails branch, without Option A's extra hop on the Next.js branch                                                                              |
| Matches existing repo shape                                             | No — introduces a new component class                                                                                                                                                                                                                                  | **Yes** — `*/core` is already "the Worker that talks to Rails, with Next.js behind it"; this only moves the Rails call earlier in the same file, and makes it conditional on path instead of happening inside a Server Component |

**Recommendation: Option B.** It satisfies every architectural constraint
(same-FQDN, cookie boundary, Rails-VPC-only for Rails paths, no third state)
with strictly fewer moving parts than Option A, and the docs confirm the
cookie-isolation guarantee doesn't depend on which option you pick — it
depends on writing the dispatch-before-`handler.fetch` logic correctly,
which Option A would have to do too, just in a second Worker with an added
hop and an added failure surface for no isolation benefit A provides that B
doesn't already have.

## Exact request lifecycle — both options, cookie boundary marked

**Option A (Router Worker):**

```
Browser --Request(Cookie)--> Router Worker
  Router inspects path, branches:
    Rails-owned --Request(Cookie), VPC binding--> Rails
      Rails --Response(Set-Cookie)--> Router --unchanged--> Browser
    Next-owned --Request(Cookie stripped), service binding--> Next.js Worker
      [[COOKIE BOUNDARY: enforced in Router, before service-binding call]]
      Next.js Worker runs OpenNext/Next.js normally, no Cookie header present
      Next.js Worker --Response--> Router (Router strips any Set-Cookie
        defensively, though none should exist) --> Browser
```

*_Option B (custom worker.ts on */core):*_

```
Browser --Request(Cookie)--> */core Worker (custom worker.ts, first code to run)
  Inspects path, branches, before calling handler.fetch at all:
    Rails-owned --Request(Cookie), VPC binding--> Rails
      Rails --Response(Set-Cookie)--> */core Worker --unchanged--> Browser
    Next-owned --new Request(Cookie header deleted)--> handler.fetch(...)
      [[COOKIE BOUNDARY: enforced in worker.ts, before handler.fetch is
        ever invoked — Next.js/OpenNext code never observes the original
        Request object, only the stripped one]]
      OpenNext/Next.js runs normally on the stripped Request
      handler.fetch returns Response --> worker.ts strips Set-Cookie
        defensively --> Browser
```

Both place the cookie boundary at the same logical point (before any
Next.js/OpenNext code executes) and with the same defensive Set-Cookie strip
on the way out. Option B just does it without a second network hop.

## Rails-owned path list used (authoritative source: Rails route inventory, not the retired `/auth/*`/`/sso/*`/`/settings` contract)

`/api/v0/*`, `/web/v0/*`, `/edge/v0/*`, `/oidc/*`, `/sign/out*`, and any
further entries `config/routes/core.rb` lists — this workspace cannot read
that file (it lives in the Rails repo), so the dispatch table itself must be
sourced from Rails-side output, not hand-maintained here from memory. This
is a concrete Phase 2 implementation dependency, not yet a blocker for the
architecture decision above.

## Still not implemented

Per your instruction, nothing above has been applied. This section
supersedes the "Rails stays server-side-only" framing in Phase 1's Q1 answer
and section F; Phase 1 sections A–D, G (cookie analysis, now to be
implemented rather than "already satisfied"), I, J, K, L stand except where
Track B's reopening changes them. Naming (Q3) is unchanged: no rename.

Next step, on your go-ahead: turn this into a concrete `worker.ts` +
dispatch-table design for `*/core` (×3 brands), including how the
Rails-owned path list is obtained/kept in sync with the Rails repo, then an
actual P0/P1/P2 implementation plan.
