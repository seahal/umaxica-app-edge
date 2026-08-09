# Plan 005: Rails ↔ Edge connectivity over a Cloudflare Workers VPC binding

## Status: Completed

## Supersedes

ADR 001 (`001-rails-health-check.md`). That record describes a `RAILS_API_URL`
environment variable, a plain `fetch`, and a `shared/apex/routes/health.ts`
module. None of those exist any more: `RAILS_*` variables appear nowhere in the
repository, and a `shared/` directory is explicitly forbidden by `CLAUDE.md`.

## Problem

Edge needs to reach Rails, which in production lives inside a private network
and must not be exposed to the internet. The earlier design pointed Hono apex
workers at a public `RAILS_API_URL`. That has two defects:

- It requires Rails to have a public origin, which is the thing we are trying to
  eliminate.
- It put the Rails dependency on the apex workers, which own the root domain and
  must stay available even when Rails is down.

## Decision

### 1. Rails always sits behind the Cloudflare Tunnel — the way in differs by environment

Rails has no origin reachable from the public internet. Every path to it lands on
the Rails-side Cloudflare Tunnel. What changes between environments is **where
the Edge runs**, and therefore what it is able to use to get there:

| Env           | Edge runs on       | Rails runs on     | Transport                               |
| ------------- | ------------------ | ----------------- | --------------------------------------- |
| `production`  | Cloudflare Workers | AWS containers    | Workers VPC binding                     |
| `development` | a local container  | a local container | HTTPS to an Access-protected hostname   |
| `test`        | vitest, no runtime | —                 | none; `getRailsClient()` returns `null` |

**production** declares the binding, in `env.production` only:

```jsonc
"vpc_services": [
  {
    "binding": "UMAXICA_APPS_EDGE_CF_WORKERS_VPC",
    "service_id": "019f5fe0-287f-7040-9f2f-036cb5b21df7",
    "remote": true
  }
]
```

**development cannot use that binding**, and this is not a configuration gap but
a property of where the code runs. A VPC binding is a Workers-runtime facility;
locally the Edge is a Node process in a container, so there is no runtime to
grant it. wrangler can proxy the binding out to Cloudflare's edge, but only by
opening a preview session that requires an API token with **Workers Scripts
write access** — an account-wide deploy credential, permanently resident on
every developer's machine, in exchange for routing container-to-container
traffic through Cloudflare and back. That trade was rejected.

development therefore makes an ordinary HTTPS request to a Cloudflare
Access-protected hostname that fronts the same Rails tunnel, authenticating with
an **Access service token**. The token grants entry to one Access application and
nothing else — it cannot deploy or modify a Worker.

Configuration comes from **`.env.development.local`** — the ordinary Next.js
convention, read through `process.env`:

```
RAILS_ORIGIN=https://core-jp.umaxica.app
RAILS_ACCESS_CLIENT_ID=
RAILS_ACCESS_CLIENT_SECRET=
```

Each frame ships a committed `.env.example` to copy from. `.env.example` is not
one of the names Next.js loads, so it can carry the origin without taking effect.

**Why the Next.js convention and not a Cloudflare binding.** These are plain
strings, and plain strings are what `process.env` is for. Routing them through
`wrangler.jsonc` would put a credential into `vars`, which is plaintext
configuration that ships with the Worker. Routing them through `.dev.vars` would
work but is wrangler's mechanism, invisible to `next dev`'s own env handling and
to anyone reading the app as a Next.js app. `.dev.vars` stays in the repository
for the one thing it is actually for here: `NEXTJS_ENV`, which selects the
`.env*` file OpenNext loads on Workers.

The split is: **bindings come from `getCloudflareContext().env`, values come from
`process.env`.** The VPC binding is a live Cloudflare object and can only come
from the former; nothing else here is.

Load order matters and is why `.env.development.local` specifically: Next.js
reads `.env.$(NODE_ENV).local` ahead of `.env.local`, `.env.$(NODE_ENV)`, and
`.env`, and only when `NODE_ENV` is `development`. A production build never picks
it up.

All three or none — a partial configuration would reach the Access hostname
unauthenticated, get a login page, and read as a Rails outage.

#### One origin for all fifteen frames, for now

The Rails tunnel publishes per-brand hostnames — `core-jp.umaxica.app`,
`core-jp.umaxica.com`, `core-jp.umaxica.org` — fronting three separate internal
services. It is tempting to give each brand's frames its own.

Do not, yet. **The VPC service production uses targets exactly one of them**
(`core.app.localhost:3000`). Splitting development per brand while production
stays single-origin would make the two environments reach different backends,
and the divergence would only appear after a deploy — the precise class of bug
this whole arrangement exists to avoid.

So every frame uses `https://core-jp.umaxica.app`, the public hostname for the
same internal service the VPC binding targets. Frames stay distinguishable by
their path prefix, identically on both transports.

Per-brand origins are a later, deliberate migration:

1. Create per-brand VPC services in the Cloudflare dashboard.
2. Point each `env.production.vpc_services` at its brand's service.
3. Change all fifteen `.env.development.local` origins together.
4. Update the equality assertion in `test/rails-connection-invariants.test.ts`.

Whether Rails needs that at all depends on how it distinguishes brands —
by `Host`, or by the `/{frame}/{brand}` path prefix it already receives. That is
a question for the Rails repository and is **not settled here**; if the prefix is
sufficient, steps 1–4 may never be needed.

**Consequence: local development needs no Cloudflare credentials at all.** No
API token, no `wrangler login`. That is the point of keeping `vpc_services` out
of `env.development`, and `tools/check-workers.mjs` fails the build if it
reappears there or at the top level.

### 2. The apex workers no longer talk to Rails at all

`{app,com,net,org}/apex` contain no Rails client, no VPC binding, and no Rails
field in `/health.json`. An apex worker's health reflects only the worker, so a
Rails outage cannot take the root domain down. Rails health moved to the Next.js
frames — see decision 4.

### 3. Frames are identified by path prefix, not by Host

There is one VPC service, terminating on one fixed host. Frames therefore
identify themselves to Rails with a path prefix rather than a distinct hostname:

| Constant                 | Value                                                   |
| ------------------------ | ------------------------------------------------------- |
| `RAILS_VPC_ORIGIN`       | `http://core.app.localhost:3000` — **all three brands** |
| `RAILS_FETCH_TIMEOUT_MS` | `5000`                                                  |
| `RAILS_FRAME_PREFIX`     | `/{frame}/{brand}` — see the table below                |

The development origin is deliberately **not** a constant here: it comes from
`RAILS_ORIGIN` in `.env.development.local` at runtime, so no deployment-specific hostname is
committed. The path prefix is shared by both transports — Rails routes by prefix
regardless of how the request arrived.

The prefix is `/{frame}/{brand}`, giving fifteen distinct values:

| Frame  | app         | com         | org         |
| ------ | ----------- | ----------- | ----------- |
| `core` | `/core/app` | `/core/com` | `/core/org` |
| `docs` | `/docs/app` | `/docs/com` | `/docs/org` |
| `news` | `/news/app` | `/news/com` | `/news/org` |
| `help` | `/help/app` | `/help/com` | `/help/org` |
| `info` | `/info/app` | `/info/com` | `/info/org` |

`core.app.localhost` is an addressing label routed by the VPC service, not a
hostname that is resolved by DNS. It reads as a development value but is
correct in production too, because the VPC service — not DNS — decides where
the request lands.

Each frame owns its own copy of `src/lib/rails-client.ts`. The fifteen copies
differ only in `RAILS_FRAME_PREFIX`. This duplication is deliberate and required
by `CLAUDE.md`; do not extract a shared module.

### 4. Health is per-frame, at `/rails-health`

Every frame exposes `/rails-health`, backed by `checkRailsHealth()` against
Rails' `/health/liveness.json`. The surface differs by frame kind:

| Frames                      | Surface                                | Form                                      |
| --------------------------- | -------------------------------------- | ----------------------------------------- |
| `core`                      | `src/app/(page)/rails-health/page.tsx` | HTML status page for an operator          |
| `docs`/`news`/`help`/`info` | `src/app/rails-health/route.ts`        | JSON Route Handler; 200 on `ok`, else 503 |

`core` is the authenticated, human-facing frame and already has UI, so it
renders status. The content frames have no such UI and expose the probe
directly, which also gives scripted checks a JSON endpoint to target. The route
group `(page)` does not appear in the URL, so the path is `/rails-health` in
both cases.

`checkRailsHealth` returns one of four kinds — `ok`, `http-error`,
`unreachable`, `not-configured` — and deliberately never includes the Rails
response body, so an internal error message cannot leak to a client.

### 5. Endpoint resolution per environment

`getRailsClient()` resolves the same way in **every** environment, with no
branch on the environment name:

1. **VPC binding present** → use it. Only `env.production` declares one.
2. **`RAILS_ORIGIN` + both Access token halves present** → HTTPS to the
   Access-protected hostname. Only development supplies these, from
   `.env.development.local` via `process.env`.
3. **Neither, or a partial configuration** → return `null`, and
   `checkRailsHealth(null)` reports `not-configured`. **Fail closed.**

Nothing reads `CLOUDFLARE_ENV` or `NODE_ENV`. Which transport is live is a
consequence of which configuration exists, so an environment cannot end up on
the wrong one by being renamed, and a misconfigured environment degrades to
`not-configured` rather than to a surprise.

An earlier revision had a third branch: a plain `fetch` to
`http://core.app.localhost:3000` when the binding was missing and
`NODE_ENV === 'development'`. It was removed because **it could never have
worked** — `core.app.localhost` is a VPC addressing label resolved by the VPC
service, not by DNS, and `dns.lookup()` on it returns `ENOTFOUND`. It could only
turn a clear `not-configured` into a misleading DNS error while presenting
itself as a supported path. The current development transport differs in that
its origin is real, configured, and authenticated.

`compatibility_flags` includes `global_fetch_strictly_public`
(`app/core/wrangler.jsonc:6`), which prevents a deployed Worker from fetching a
private or non-publicly-resolvable host. Note what it does **not** cover: the
Access hostname is public, so the flag would not stop a production Worker that
was mistakenly given `RAILS_ORIGIN`. That case is closed by
`test/rails-connection-invariants.test.ts`, which fails if any `wrangler.jsonc`
carries `RAILS_ORIGIN` or either token name.

### 6. Credentials only ever flow outward, never through

`rails-client.ts` strips four headers from **every** outbound request on **both**
transports — `cookie`, `authorization`, `cf-access-client-id`,
`cf-access-client-secret` — and applies its own transport credentials only
afterwards. So:

- A credential belonging to the **end user** — a session cookie, an
  `Authorization` header, the browser's own Access token — is never forwarded to
  Rails. Rails identity is never derived from something the caller supplied.
- A caller cannot smuggle or override the service token through `init.headers`,
  because the strip runs first and the `set` runs second.

The ordering is load-bearing, so `test/compose-tunnel-invariants.test.ts`
asserts the strip appears before the application in every copy.

In production the trust boundary is the VPC service plus the Rails-side tunnel,
with no shared secret at all. In development it is the Access service token,
which is scoped to one Access application and cannot deploy or modify a Worker.
`rails-client.ts` imports `server-only`, so neither can reach a browser bundle.

### 7. Timeout 5000 ms, no retry

`AbortSignal.timeout(5000)` bounds every call. There is deliberately no retry
and no backoff: the only current caller is a health check, where a retry would
mask the very latency the check exists to reveal. A caller that needs retry
should implement it at its own layer, where it can decide whether the operation
is idempotent.

`fetch` is also pinned to `redirect: 'manual'` and `cache: 'no-store'`, and the
path is validated against empty strings, missing leading slash, `//`, `://`,
backslashes, and control characters before the URL is built. The result is
returned as a discriminated union rather than thrown.

## Environment separation

The three environments share no Rails configuration at all:

| Env           | Config carrying Rails         | Where it lives                       | Credential           |
| ------------- | ----------------------------- | ------------------------------------ | -------------------- |
| `production`  | `vpc_services`                | `wrangler.jsonc`, committed          | none                 |
| `development` | `RAILS_ORIGIN` + token halves | `.env.development.local`, gitignored | Access service token |
| `test`        | nothing                       | —                                    | none                 |

This is what makes them decoupled rather than three names for one service.
Changing the development origin cannot affect production, because production
does not read it and the file it lives in is never deployed. Adding a staging
tier means adding a fourth block with its own transport — not editing a shared
one.

Because the binding is declared **only** in `env.production`, and wrangler does
not inherit bindings into `env` blocks, no other environment can acquire it by
accident. A top-level declaration would defeat this by applying everywhere, so
`tools/check-workers.mjs` rejects one.

To give production its own VPC service later (today one service serves the only
Rails deployment there is):

1. Create a second VPC service in the Cloudflare dashboard. **Dashboard action;
   it cannot be done from this repository.**
2. Replace `service_id` in the `env.production.vpc_services` block of each of the
   fifteen `wrangler.jsonc` files.

No application code changes, and no test changes — the invariants test asserts
the fifteen frames agree with each other, not what the value is.

## Outcome

**Implemented.**

The VPC/production half documented an existing design. The development transport
and the environment split were built as part of this record, after establishing
that the previous arrangement could not work locally: `remote: true` bindings
demanded a write-scoped API token, and the direct-`fetch` fallback that was
supposed to avoid that requirement targeted a hostname which does not resolve.

Changed:

- `*/src/lib/rails-client.ts` (×15) — `createRailsClient` takes an origin and
  optional auth headers instead of host/port; `getRailsClient` selects between
  the two transports.
- `wrangler.jsonc` (×15) — `vpc_services` removed from the top level,
  `env.development`, and `env.test`; kept in `env.production`.
- `.env.example` (×15) and `.gitignore` — development configuration, with
  every example now actually tracked (six were silently ignored).
- `tools/workers-manifest.json` / `tools/check-workers.mjs` — the twelve content
  surfaces are `railsBacked` now that they own clients, and the checker enforces
  production-only bindings.

Guardrails:

- `test/rails-connection-invariants.test.ts` — fifteen-frame completeness, the
  `/{frame}/{brand}` prefix rule, constant agreement across copies, a regression
  guard keeping Rails out of `*/apex`, binding-in-production-only, and no
  credential in any `wrangler.jsonc`.
- `test/compose-tunnel-invariants.test.ts` — inbound credentials are stripped
  before the transport's own are applied, in that order, in every copy.
- `tools/check-workers.mjs` — the same binding placement rule, from the parsed
  config rather than the file text.

**Not verified end to end.** No request has been made to Rails over either
transport from this repository. production needs a deployed Worker; development
needs the Rails-side Access application and hostname, which do not exist yet —
see the operations docs.

Operational procedure lives in `docs/operations/cloudflare-tunnel-development.md`
(local tunnel) and `docs/operations/cloudflare-access.md` (who may reach a
tunnelled hostname, and the Rails-side application the dev transport needs).
