# Connectivity acceptance check

`tools/verify-edge-connectivity.mjs` is a repeatable regression test for the Edge
development network. Run it after any change to Node, pnpm, Wrangler, OpenNext,
Next.js, the Workers VPC configuration, the tunnel, or devcontainer networking.

It covers **all fifteen Rails-backed frames** —
`{app,com,org}/{core,docs,news,help,info}` — taken from
`tools/workers-manifest.json#railsBacked`. Every one of them ships a rails-client
copy and declares the VPC binding, so checking only the three `*/core` frames
would leave twelve unverified.

```bash
pn run check:config            # static only, seconds, no network
pn run check:vpc               # the direct Workers VPC transport probe
pn run check:local             # next dev × 15, batched
pn run check:preview:vpc       # workerd + the real binding × 15, SEQUENTIAL, ~30-45 min
pn run check:preview           # workerd, no binding × 15, parallel
pn run check:host              # run this from the HOST OS, not the container
pn run check:connectivity      # everything except `host` — budget an hour
```

Logs land in `tmp/connectivity-check/` (gitignored), one per frame per mode. The
terminal shows only the tail of a failing child; the full output stays in the log.

Tune with `CHECK_NEXT_CONCURRENCY` (default 8) and `CHECK_PREVIEW_CONCURRENCY`
(default 4). `preview:vpc` ignores both and stays sequential — see below.

## Why the modes are separate

They are not interchangeable, and collapsing them hides the failure that matters.

| Mode          | Runtime                            | VPC binding | Cloudflare credential |
| ------------- | ---------------------------------- | ----------- | --------------------- |
| `next`        | Node, `next dev`                   | no          | none                  |
| `preview`     | local workerd, `--env development` | no          | none                  |
| `preview:vpc` | local workerd, `--env vpc`         | **yes**     | `wrangler login`      |
| `vpc`         | the binding alone                  | **yes**     | `wrangler login`      |

**A green `/rails-health` is never proof that the VPC binding works.**
`getRailsClient()` falls back to a global `fetch()` against an Access-protected
hostname that fronts the _same_ tunnel, and `RailsHealthResult` records no
transport identity — so `ok` is consistent with a completely broken binding.
That is why `check:vpc` exists, and why `check:local` labels its `/rails-health`
result `transport=access-or-none (NOT VPC)` no matter what it says.

Under `--env development` the generated `CloudflareEnv` carries no binding at
all, so `not-configured` is the **expected, passing** result for `next dev` and
for `preview`.

### Why `preview:vpc` is the slow one, and stays that way

It is sequential on purpose. Each frame's session opens its own remote-binding
proxy against Cloudflare, and ADR 006 is explicit that fifteen of those at once is
exactly what not to do. Plain `preview` opens no remote session, so it runs in
parallel batches with a distinct `--port` per frame.

**Parallel `preview` needs `--inspector-port` too.** wrangler's inspector defaults
to `9229` for every instance, so varying only `--port` still collides the moment
two run together, and the loser dies with
`Address already in use (127.0.0.1:9229)` — a failure that looks like a broken
frame and is not. The checker passes both.

## The fifteen frames are not identical

The checker reads each frame's shape off disk rather than assuming it:

|                      | `/health`     | `/rails-health`                       | wrangler `main`         |
| -------------------- | ------------- | ------------------------------------- | ----------------------- |
| `{app,com,org}/core` | Route Handler | **HTML status page**                  | `src/worker.ts` wrapper |
| the other twelve     | **absent**    | **JSON route**, 200 iff `ok` else 503 | `.open-next/worker.js`  |

Consequences worth knowing when you read a report:

- **Readiness is polled on `/rails-health`, not `/health`.** It is the only route
  all fifteen have, and it always answers, so it is a clean liveness signal.
  Polling `/health` would hang forever on twelve frames.
- **`/health` is `SKIP: frame has no /health route`** on those twelve. That is the
  frame's design, not a failure — but it is printed with its reason, because a
  blank cell must never read as coverage.
- The JSON route additionally has its **status checked against its kind** (200 iff
  `ok`). A healthy body under a failing status, or the reverse, is a FAIL.

Add a `/health` route to a content frame and the checker starts testing it with no
change to the tool — the shape is derived, not listed.

## `check:vpc` — the direct probe

`tools/vpc-probe/` is a Worker that binds only the VPC service and fetches one
fixed URL. It imports nothing from the application, reads no environment
variables, and has no `fetch()` path, so it cannot fall back to anything.

Two flags in the invocation are load-bearing:

```bash
CLOUDFLARE_API_TOKEN= CLOUDFLARE_ENV= \
  pnpm exec wrangler dev --config tools/vpc-probe/wrangler.jsonc \
    --env-file tools/vpc-probe/empty.env --ip 127.0.0.1 --port 8799
```

- **`--env-file tools/vpc-probe/empty.env`.** Blanking `CLOUDFLARE_API_TOKEN` in
  the environment is _not_ sufficient: wrangler loads the repo-root `.env`
  itself and re-injects the real token, and the session then dies with
  `remote session could not be authenticated … authenticating via a custom API
token`. An API token cannot open a remote-binding session at all — the
  `edge-preview` endpoint answers `10405 Method not allowed for this
authentication scheme` — so the token has to be out of the way for the
  `wrangler login` OAuth session to be used. ADR 006 records the blanking rule
  for `next build`; this is the equivalent for `wrangler dev`.
- **`CLOUDFLARE_ENV=`.** The container exports `CLOUDFLARE_ENV=development`, and
  the probe config declares no environments.

Note that the host in the probe's URL does **not** route the request. Per
Cloudflare's Workers VPC documentation, routing comes wholly from the VPC Service
record; the URL's host only populates `Host` (and SNI over https) and its port is
ignored. Rails picks the brand from that `Host`.

## Reading the output

| Status    | Meaning                                                                  |
| --------- | ------------------------------------------------------------------------ |
| `PASS`    | tested and worked                                                        |
| `WARN`    | worked, but not in the way that proves what you might think              |
| `FAIL`    | tested and failed — the only status that makes the command exit non-zero |
| `BLOCKED` | an external prerequisite is missing (usually Cloudflare auth)            |
| `SKIP`    | deliberately not run here, with the reason given                         |

`BLOCKED` is never reported as `FAIL`: an absent Cloudflare credential is not a
network regression, and the modes that need no credential still run.

Every non-PASS names the layer responsible, using the codes Cloudflare documents
for a VPC `fetch()` — `connection_refused`, `destination_unavailable`,
`dns_error`, `tls_certificate_error`, `connection_timeout`, `rate_limited`, and
so on. It never reports "network error".

A **404 from Rails is recorded as a transport PASS** with a Rails-layer failure
beside it. The request demonstrably arrived; that is exactly where ADR 006's
first verified run landed.

## The staged single-host state

All fifteen frames declare the same VPC Service and the same
`PRIVATE_CORE_RAILS_ORIGIN = http://core.app.localhost:3000`. This is deliberate:
reach one Rails endpoint over VPC first, split the routes per brand afterwards.
So `check:vpc` is **one transport exercised three times**, not three independent
paths, and the report says so rather than printing three PASSes that imply
otherwise.

When the per-brand split begins, set `STRICT_BRAND_ROUTING=1` and the checker
requires each frame to send its own Host (`app`→`core.app`, `com`→`core.com`,
`org`→`core.org`). The split needs no second VPC Service and no tunnel change —
only the origin constant in each frame's `rails-client.ts`.

The checker cannot observe which Rails brand a request landed on: the liveness
payload carries `status`, `check`, `dependencies` and `details` only, with no
controller or brand. That is visible solely in the Rails log. If Edge-side
verification of the landing brand is wanted later, Rails has to include it in the
health document.

`STRICT_ENV_ISOLATION=1` additionally requires a production VPC Service to exist
and to differ from the development one. It fails today on purpose — production
carries no binding until a production tunnel exists (ADR 006).

## Host reachability

`check:host` must run **on the host OS**, not in the container; inside, it
reports `SKIP` and prints the exact commands to run outside, one per frame. All
fifteen ports are published by Compose and listed in
`.devcontainer/devcontainer.json#forwardPorts`, and `next dev --hostname 0.0.0.0`
binds every interface, so while `pn run check:local` is running:

```bash
# cores answer /health; the other twelve only have /rails-health
curl -fsS http://127.0.0.1:5405/health        # app/core
curl -fsS http://127.0.0.1:5105/health        # com/core
curl -fsS http://127.0.0.1:5305/health        # org/core
curl -fsS http://127.0.0.1:5406/rails-health  # app/docs   (5407 news, 5408 help, 5403 info)
curl -fsS http://127.0.0.1:5106/rails-health  # com/docs   (5107, 5108, 5103)
curl -fsS http://127.0.0.1:5306/rails-health  # org/docs   (5307, 5308, 5303)
```

`preview` and `preview:vpc` bind loopback _inside_ the container, so 8787 is not
reachable from the host unless wrangler is given `--ip 0.0.0.0`. That is expected
and is not reported as a failure.

## What `check:preview` caught on its first run

Worth knowing, because both defects passed every other gate — `typecheck`,
`lint`, `check:workers` and 1143 unit tests — and both only appear once the app
is actually served by the Workers runtime.

**1. A wrong relative import.** `*/core/src/lib/next-handler.ts` imported
`'../.open-next/worker.js'`; from `src/lib/` that is `<ws>/src/.open-next/`, one
level below the real build output. esbuild reported `Could not resolve`, but
**`wrangler dev` did not exit** — it bound 8787 and never served, so every
request just hung and no `Ready on` was printed. `@ts-expect-error` on the import
hid it from `tsgo`, and every test `vi.mock`s that module so Vitest never
resolved it.

Note the directive is now `@ts-ignore`, deliberately: with `allowJs: true` the
corrected path _does_ resolve once `.open-next` exists, and `@ts-expect-error`
then fails typecheck as unused (TS2578) — its validity would flip with build
state.

**2. `cacheComponents: true`.** Next's Cache Components depend on `setTimeout()`
semantics workerd does not provide. Next warns at request time:

```
▲ Next.js cannot guarantee that Cache Components will run as expected
  due to the current runtime's implementation of `setTimeout()`.
```

and every prerendered (`○`) and PPR (`◐`) route then hangs until the runtime
cancels it — 500, "your Worker's code had hung". Only Route Handlers (`ƒ`)
survive, which is why `/health` answered 200 while `/` and `/rails-health` did
not. All sixteen frames had it enabled and nothing uses `use cache`,
`cacheLife` or `cacheTag`, so it bought nothing.

It is now removed from the fifteen Cloudflare frames (`dev/acme` keeps it — it
deploys to Vercel), and `test/workerd-runtime-invariants.test.ts` fails offline
in seconds if it comes back, rather than after a ten-minute OpenNext build.

## When the far side is at fault

The tunnel connector and Rails live in another repository, so this repo can name
those failures but not fix them. Worth checking there first:

- `cloudflared` must be **2025.7.0 or newer**;
- Workers VPC requires **QUIC** transport with outbound **UDP 7844** allowed;
- after a Cloudflare role change, `wrangler logout && wrangler login`;
- `config.hosts` in Rails must allow the `Host` the frames send.
