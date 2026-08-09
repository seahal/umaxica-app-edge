# Plan 006: A development transport over the Workers VPC binding

## Status: Implemented and verified end to end

## Amends

[ADR 005](005-rails-edge-workers-vpc-connection.md). That record stands except
for two things: decision 1's development half together with its placement of the
binding, and **decision 3, which is retracted outright** — Rails does not route
on a `/{frame}/{brand}` prefix. Decisions 2, 4, 5, 6 and 7 are unchanged and are
not restated here.

## Problem

ADR 005 gave development a different transport from production:

| Env           | Transport                                    |
| ------------- | -------------------------------------------- |
| `production`  | Workers VPC binding                          |
| `development` | HTTPS to an Access-protected public hostname |

The two paths share only their last hop. Everything specific to the production
path — that the binding exists, that its `service_id` is right, that the VPC
Service points at the intended host and port, how a Worker behaves when the
tunnel is down — was unobservable until a deploy. ADR 005 recorded that
production had never in fact been exercised: "**Not verified end to end.**"

Two things then turned out to be wrong.

### 1. Development _can_ use the binding

ADR 005 argued:

> A VPC binding is a Workers-runtime facility; locally the Edge is a Node
> process in a container, so there is no runtime to grant it.

This is not correct.

- `opennextjs-cloudflare preview` runs the application in local **workerd** —
  the Workers runtime, on your machine.
- `remote: true` does not upload the Worker. It runs the code locally and
  proxies **only the binding** out to the real Cloudflare resource, over a
  remote-proxy pair that wrangler stands up.
  ([architecture](https://blog.cloudflare.com/connecting-to-production-the-architecture-of-remote-bindings/))
- Cloudflare documents this as _the_ way to reach a VPC Service in local
  development: "`remote: true` … allows access to the VPC Service during local
  development."
  ([VPC Services](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/))
- `*/next.config.ts` already calls `initOpenNextCloudflareForDev()`, and
  `compose.yaml` already carried a comment observing that this authenticates to
  Cloudflare on start-up — the mechanism was known here before it was argued
  away.

What ADR 005 got right is that there is a **cost**, though it turned out to be a
different and sharper one than "a write-scoped API token". Measurement (see
Outcome) showed a remote-binding session cannot be opened with an API token at
all — `edge-preview` rejects that authentication scheme — so `preview:vpc`
requires an interactive `wrangler login` per developer.

That is a real reason to keep the binding off the default development loop. It
is not a reason to have no local VPC path at all.

### 2. `env.production` pointed at a development resource

The account holds exactly one VPC Service:

```
id      019f5fe0-287f-7040-9f2f-036cb5b21df7
name    umaxica-apps-edge-cf-workers-vpc
host    core.app.localhost   HTTP:3000
tunnel  1d501e9a-62f7-4c0d-ba5e-a26e3f10088f
```

Tunnel `1d501e9a-…` is the development tunnel, whose connector runs beside a
local Rails container. All fifteen `env.production` blocks named this service.

So the misconnection ADR 005 set out to prevent already existed, pointing the
other way: a deployed production Worker would have left the production network
and arrived at a developer's machine. It had never fired only because
production had never been exercised.

## Decision

### 1. The binding lives in `env.preview`, and nowhere else

A fourth wrangler environment carries it:

```jsonc
"preview": {
  "vars": { "CLOUDFLARE_ENV": "preview", "NODE_ENV": "development", ... },
  "vpc_services": [
    {
      "binding": "UMAXICA_APPS_EDGE_CF_WORKERS_VPC",
      "service_id": "019f5fe0-287f-7040-9f2f-036cb5b21df7",
      "remote": true
    }
  ],
  ...
}
```

Bindings are **not inherited** into `env.*`
([Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/)),
so this placement is structural rather than procedural: no other environment can
acquire the binding by accident, and a development command's configuration never
names a production resource.

This was preferred to a flag (`--local` / `--remote`) on a shared environment.
A flag leaves the other environment's `service_id` textually reachable from the
development command, and reduces the separation to remembering to pass it.

### 2. `env.production` carries no binding, and fails closed

Production has no Rails transport until a production VPC Service on a production
tunnel exists. Neither exists today. `getRailsClient()` therefore returns `null`
in production and `/rails-health` reports `not-configured` and answers 503.

This removes no working capability — the production path had never carried a
request — and it removes the routing of production traffic to a developer's
machine. The absence is visible rather than silent, which is the point.

Restoring it is two steps, both outside this repository first:

1. Create a production tunnel beside production Rails, and a production VPC
   Service on it. **Dashboard/API action.**
2. Add the `vpc_services` block back to each `env.production` with that
   `service_id`.

`tools/check-workers.mjs` and `test/rails-connection-invariants.test.ts` both
fail if that restoration reuses the development `service_id`.

### 3. Three development tiers

| Command            | Runtime                            | VPC binding     | Cloudflare credential    |
| ------------------ | ---------------------------------- | --------------- | ------------------------ |
| `pnpm dev`         | Node (`next dev`)                  | no              | **none**                 |
| `pnpm preview`     | local workerd, `--env development` | no              | **none**                 |
| `pnpm preview:vpc` | local workerd, `--env preview`     | **yes, remote** | `wrangler login` (OAuth) |
| `pnpm deploy`      | Cloudflare, `--env production`     | none, for now   | API token                |

Note the credentials differ in kind, not just in scope: deploys use the API
token, `preview:vpc` cannot (see Outcome). Run it with the token blanked so the
`.env` copy does not leak back in:

```bash
CLOUDFLARE_API_TOKEN= pnpm --filter umaxica-apps-edge-app-docs run preview:vpc
```

The credential cost falls only on the third, which is named for what it opts
into. ADR 005's best property — that ordinary local development needs no
Cloudflare account — is preserved exactly.

There is deliberately **no root-level `preview:vpc` fan-out**, unlike `dev`.
Fifteen concurrent preview servers would each open their own remote-proxy
session against Cloudflare. Run it one workspace at a time:

```bash
pnpm --filter umaxica-apps-edge-app-docs run preview:vpc
```

### 4. No path prefix — ADR 005 decision 3 is retracted

ADR 005 decision 3 had each frame prepend `/{frame}/{brand}` to every Rails
request, so that fifteen frames sharing one VPC service and one Host could still
be told apart. It flagged its own uncertainty:

> Whether Rails needs that at all depends on how it distinguishes brands — by
> `Host`, or by the `/{frame}/{brand}` path prefix it already receives. That is
> a question for the Rails repository and is **not settled here**.

The first real request settled it:

```
ActionController::RoutingError (No route matches [GET] "/docs/app/health/liveness.json")
```

Rails serves `/health/liveness.json` and routes on the path exactly as given.
`RAILS_FRAME_PREFIX` is removed from all fifteen copies, along with the
`pathPrefix` parameter of `createRailsClient` — a parameter nobody passes reads
as one somebody should.

Frames are consequently **not distinguished at the URL level at all**. If Rails
later needs to know which frame is calling, that will be a deliberate addition
(a header, most likely) rather than a revival of this.

`test/rails-connection-invariants.test.ts` guards the retraction, because the
failure mode is quiet: a prefix reintroduced produces 404s, `checkRailsHealth`
maps those to `http-error`, and `http-error` reads like a Rails outage rather
than a client bug. That is exactly how this one stayed invisible.

### 5. `getRailsClient()` is unchanged

ADR 005 decision 5 resolves the transport by **which configuration exists**,
with no branch on the environment name. `env.preview` supplies a binding, so
branch 1 fires there exactly as it was meant to in production. No application
code changed in this record — which is the evidence that decision 5 was right.

### 6. No connector, and no shared Podman network, in this repository

The path is:

```
local workerd → Cloudflare → VPC Service → tunnel → connector → Rails
```

The connector must sit where it can reach **Rails**, and it does — in the Rails
Compose project. A connector here could not reach Rails (different project, no
shared network), and adding one would register a _second_ connector on the
development tunnel. Cloudflare load-balances across connectors, so roughly half
of all development VPC requests would land on a connector that cannot serve
Rails and fail intermittently. `test/compose-tunnel-invariants.test.ts` keeps
that from being added, and stays as it is.

The Edge container never resolves or dials Rails, so no shared network is
needed. This is unchanged from ADR 005 and from
`docs/operations/cloudflare-tunnel-development.md`.

### 7. Cloudflare Access is not part of this path

Workers VPC reaches a private origin through the tunnel; the trust boundary is
the VPC Service plus the tunnel, with no shared secret. Cloudflare's Workers VPC
documentation involves no Access application or service token
([get started](https://developers.cloudflare.com/workers-vpc/get-started/)).

Access belongs at **browser → Edge** ingress. Workers VPC is **Edge → private
origin** egress. Neither substitutes for the other.

ADR 005's Access transport (branch 2 of `getRailsClient()`) is retained as a
fallback for a developer without a Cloudflare credential, but note that it
currently points at `core-jp.umaxica.app`, which fronts the **same** tunnel —
it is not an independent path, and it is not the recommended one.

## Production parity

Identical: the Workers runtime, `compatibility_date`/`compatibility_flags`, the
OpenNext build output, the binding shape, the `env.<BINDING>.fetch()` call path,
the VPC-service → tunnel → Rails hops, `RAILS_VPC_ORIGIN`, `RAILS_FRAME_PREFIX`,
the 5 s timeout, the header stripping, and the transport-resolution order.

Different, and this is the honest cost:

| Aspect                                   | `preview:vpc`                              | Production                         |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------- |
| Where the binding call originates        | your machine, via the remote-binding proxy | Cloudflare's edge                  |
| Extra hops / latency                     | machine → Cloudflare → tunnel              | edge → tunnel                      |
| Auth for the binding                     | your credential gates the proxy session    | none — the Worker owns the binding |
| Smart placement, real rate limiting, ISR | not exercised                              | exercised                          |
| Rails                                    | local container                            | AWS                                |

Full parity is not achievable and is not claimed. What this buys is the class of
failure the Access transport structurally could not surface: a missing or wrong
binding, a VPC Service aimed at the wrong host or port, a tunnel that is down,
and workerd-versus-Node differences in the request path.

## Environment separation

| Item                | development (`preview`) | production              |
| ------------------- | ----------------------- | ----------------------- |
| Tunnel              | `1d501e9a-…`            | does not exist yet      |
| VPC Service         | `019f5fe0-…`            | does not exist yet      |
| Binding declaration | `env.preview` only      | none                    |
| Worker              | never deployed          | `umaxica-apps-edge-*-*` |
| Rails               | local Podman            | AWS                     |
| Cloudflare account  | shared — deliberate     | shared                  |

Sharing one account is a deliberate trade: a second account would harden the
boundary but double the administration, and the `service_id` assertions already
make the misconnection fail the build rather than fail in production.

## Guardrails

- `tools/check-workers.mjs` — the binding is declared exactly once, in
  `env.preview`, with `remote: true` and the `service_id` recorded in
  `tools/workers-manifest.json`; absent from `development`, `test`,
  `production`, and the top level.
- `test/rails-connection-invariants.test.ts` — the same rules textually, plus
  fifteen-frame agreement on the `service_id`, plus **production must never
  reuse the development `service_id`**. That last one holds vacuously today and
  starts biting the moment production is restored, which is when it is needed.
- `test/compose-tunnel-invariants.test.ts` — unchanged; still rejects a
  connector, a `compose.custom.yaml`, or a tunnel token in this repository.

## Outcome

**Implemented.** Changed:

- `*/wrangler.jsonc` (×15) — added `env.preview` with the binding and its own
  rate-limit namespace (`400{1,2,3}`); removed `vpc_services` from
  `env.production`, leaving a comment explaining the absence.
- `*/package.json` (×15) — added `preview:vpc`.
- `*/cloudflare-env.d.ts` (×15) — regenerated; `CLOUDFLARE_ENV` gains
  `'preview'` and a `Cloudflare.PreviewEnv` appears.
- `tools/workers-manifest.json`, `tools/check-workers.mjs`,
  `test/rails-connection-invariants.test.ts` — as above.
- `compose.yaml` — two comments corrected; they described a `cloudflare-tunnel`
  service in a `compose.custom.yaml` that this repository forbids, and claimed
  `pnpm dev` authenticates to Cloudflare.

No application code changed: no `src/lib/rails-client.ts`, no
`src/lib/rails-health.ts`, no `*/apex`, no Compose service, no network.

**Verified end to end, 2026-08-08** — the first time a request from this
repository has reached Rails, over any transport.

```
$ CLOUDFLARE_API_TOKEN= pnpm --filter umaxica-apps-edge-app-docs run preview:vpc
env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC (019f5fe0-…)   VPC Service   remote
Ready on http://localhost:8787

$ curl -s 127.0.0.1:8787/rails-health
HTTP 503  {"rails":{"kind":"http-error","status":404}}
```

and, in the Rails log on the other side of the tunnel:

```
ActionController::RoutingError (No route matches [GET] "/docs/app/health/liveness.json")
```

`http-error` means Rails answered. The Rails-side log entry is stronger evidence
than the `ok`→`unreachable` comparison originally planned, so that step was
dropped: a routing error recorded at the destination proves arrival directly,
where the comparison only proved departure.

The 404 is a **Rails routing question, not a transport one** — see ADR 005
decision 3, which explicitly left open whether Rails distinguishes frames by
`Host` or by the `/{frame}/{brand}` prefix. That question is now the only thing
between here and a green `/rails-health`.

### Amendment, 2026-08-09 — now a 200, and now a repeatable check

Two things have changed since the run recorded above.

**1. Rails answers 200.** The 404 was the open Rails-side routing question, and
it is resolved. Verified from `tools/vpc-probe/` — a Worker that binds only the
VPC service and imports no application code, so no fallback is possible:

```
env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC (019f5fe0-…)   VPC Service   remote
{"probe":"reached","status":200,"contentType":"application/json; charset=utf-8",
 "body":"{\"status\":\"ok\",\"check\":\"liveness\", …,\"revision\":\"ff1d9f8d…\"}"}
```

and on the far side of the tunnel:

```
Processing by Core::App::Health::LivenessesController#show as JSON
Completed 200 OK in 2ms
```

Note `Core::App::` — **Rails selects the brand from the `Host` header.** The
Workers VPC documentation states that the host in `env.<BINDING>.fetch(url)` does
not route the request (routing comes wholly from the VPC Service record) and only
populates `Host`, while the port is ignored outright. All fifteen frames
currently send `core.app.localhost`, which is the agreed staging: reach one Rails
endpoint over VPC first, split the routes per brand afterwards. The split will
therefore need no second VPC Service and no tunnel change — only the origin
constant in each frame's `rails-client.ts`. `pnpm run check:config` with
`STRICT_BRAND_ROUTING=1` enforces the split once it starts.

**2. A fourth thing the documentation had wrong.** Item 2 below says to blank
`CLOUDFLARE_API_TOKEN` rather than unset it, because `next build` reloads the
root `.env`. Under `wrangler dev` that is necessary but **not sufficient**:
wrangler loads the repo-root `.env` itself and re-injects the token, and the
session dies with `remote session could not be authenticated … authenticating via
a custom API token` even though the variable was blanked. The fix is
`--env-file <an empty file>`; `tools/vpc-probe/empty.env` exists for exactly
this and explains itself. `CLOUDFLARE_ENV` must also be cleared, since the
container exports it.

**Regression check.** This record is no longer the only evidence. Rerun it with

```bash
pn run check:vpc            # the raw binding transport
pn run check:connectivity   # config, vpc, next dev, preview, preview:vpc
```

See `docs/operations/connectivity-acceptance.md`.

### Three things the documentation had wrong, corrected here

1. **An API token cannot open a remote-binding session.** `POST
/accounts/<id>/workers/subdomain/edge-preview` returns `10405 Method not
allowed for this authentication scheme`; no scope changes it. `preview:vpc`
   requires `wrangler login`. `compose.yaml` previously asserted the opposite
   ("a scoped API token … is the supported path here").
2. **`CLOUDFLARE_API_TOKEN` must be blanked, not unset.** `next build` loads the
   repo-root `.env` into `process.env` and the wrangler child inherits it, so
   `env -u` is worse than useless — an absent key is what dotenv fills in.
   Symptom: the first remote connection succeeds, a second fails citing the
   token.
3. **`preview` serves on 8787**, not the frame's dev port; it passes no
   `--port`.

Also worth recording: wrangler's OAuth callback listener binds `::1` only, so an
IPv4 port forward never reaches it. Procedure for logging in from inside a
container is in `docs/operations/cloudflare-tunnel-development.md`.
