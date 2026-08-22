# ADR 009: Three lifecycle environments, and VPC as a binding rather than an environment

## Status: Implemented and verified end to end (2026-08-22)

## Supersedes

The **environment model** of [ADR 005](005-rails-edge-workers-vpc-connection.md) and
[ADR 006](006-development-workers-vpc-transport.md), including every amendment
attached to ADR 006. Those records are kept for history and their superseded
statements are marked in place.

What survives from them, unchanged and restated here so no one has to reassemble
it from four amendments:

- ADR 005 §2 — the apex workers hold no Rails dependency (still true, still enforced).
- ADR 005 §4 — health is per-frame at `/rails-health`.
- ADR 005 §6 — inbound credentials are stripped before the transport's own are applied.
- ADR 005 §7 — 5 s timeout, no retry, `redirect: 'manual'`, `cache: 'no-store'`.
- ADR 006 §4 — **no `/{frame}/{brand}` path prefix**; Rails routes on the path as given.
- ADR 006 §6 — this repository runs no tunnel connector (as amended by ADR 008 on the
  shared-network half only).
- ADR 006 §7 — Cloudflare Access is not part of the Rails path.
- ADR 006 amendment 2026-08-10 — fifteen frames, one VPC Service, distinguished by `Host`.

## Problem

`wrangler.jsonc` encoded **three different axes as one**.

ADR 006 created a fourth Wrangler environment, `env.vpc`, to hold the `remote: true`
VPC Service binding. Its reason was real: a remote-binding session needs an
interactive `wrangler login`, and putting the binding in `env.development` would have
made every `pnpm dev` demand a Cloudflare credential. Isolating it in its own
environment kept that cost on one opt-in command.

But the cost of that fix was that a _transport capability_ became a _lifecycle tier_:

- `EDGE_ENV` carried the value `'vpc'`, which names a binding, not a stage of anything.
- The environment a developer previewed under (`vpc`) was not the environment anything
  deployed from, and not the one `pnpm preview` used either.
- Generated types advertised a `Cloudflare.VpcEnv` with no counterpart in the lifecycle.
- `tools/check-workers.mjs` derived per-environment requirements from a generic
  `NON_INHERITABLE` array — using the schema fact "Wrangler does not inherit this key"
  to assert the architectural claim "every environment must contain this binding".
  Those are different statements, and the second is false.

Meanwhile production carried **no** Rails transport at all (ADR 006 §2 removed it
because the only VPC Service on the account terminates on a developer's machine), so
`/rails-health` answered 503 `not-configured` in production.

## Decision

### 1. Exactly three lifecycle environments

| Lifecycle     | Where             | Deployed by                       |
| ------------- | ----------------- | --------------------------------- |
| `production`  | the **top level** | `wrangler deploy`, **no** `--env` |
| `development` | `env.development` | never deployed                    |
| `test`        | `env.test`        | never deployed                    |

There is **no staging**, **no `env.production`**, and **no `env.vpc`**.

Production sits at the top level because a Wrangler environment "effectively creates a
new Worker with the name `<top-level-name>-<environment-name>`"
([Environments](https://developers.cloudflare.com/workers/wrangler/environments/)), so
an `env.production` would have to re-declare `name` purely to cancel that out.

Note this is a _repository_ convention, not something Cloudflare's documentation
states. The docs call the top level "the top-level environment" and do not name it
production. The convention is sound and is now asserted by `checkProductionEnvironment()`.

### 2. Runtime mode and transport mode are separate axes from the lifecycle tier

This is the load-bearing idea, and the one `env.vpc` obscured.

| Purpose                   | Lifecycle     | Runtime            | Rails transport                |
| ------------------------- | ------------- | ------------------ | ------------------------------ |
| fast local development    | `development` | Node (`next dev`)  | direct private Podman network  |
| production-parity preview | `development` | local workerd      | **remote** VPC Service binding |
| automated tests           | `test`        | vitest             | none                           |
| production                | production    | Cloudflare Workers | deployed VPC Service binding   |

Two rows share one lifecycle environment. That is the point: `pnpm dev` and
`pnpm preview` are the same _tier_ in different _runtimes_ over different _transports_.

### 3. The VPC binding lives in production and development, under one name

```jsonc
// top level = production
"vpc_services": [
  { "binding": "UMAXICA_APPS_EDGE_CF_WORKERS_VPC", "service_id": "<production>" }
]

// env.development
"vpc_services": [
  { "binding": "UMAXICA_APPS_EDGE_CF_WORKERS_VPC", "service_id": "<development>", "remote": true }
]
```

Same binding name, so application code calls
`env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC.fetch(...)` identically in both and contains no
environment branch. **That** is the production parity being claimed — not
byte-identical configuration. Different lifecycle environments are allowed to point
one binding interface at different resources.

**Production omits `remote` entirely.** On deploy "all remote bindings are disabled,
which behaves exactly as if they were configured with `remote: false`", and
Cloudflare's own get-started example writes a deployed binding as
`{binding, service_id}`. Setting `remote: false` there would imply the key does
something in production; it does not.

**`env.test` declares no `vpc_services`, and the absence is an invariant.** Non-inheritable
means an environment that needs a key must state it — not that every environment must
carry every production binding. The test architecture has no Rails dependency.

### 4. `pnpm dev` stays credential-free — and that required an application change

`initOpenNextCloudflareForDev(options?: GetPlatformProxyOptions)` forwards its options
straight to `getPlatformProxy()`, whose **`remoteBindings` option defaults to `true`**
(wrangler 4.120.1). `compose.yaml` exports `CLOUDFLARE_ENV=development`. So once the
binding moved into `env.development`, plain `next dev` would have opened a
remote-binding session — which an API token cannot authenticate at all.

All fifteen `next.config.ts` therefore pass `{ remoteBindings: false }`.

Measured 2026-08-22 through `getPlatformProxy` against `app/info`:

| `remoteBindings` | Result                                                                                            | Time    |
| ---------------- | ------------------------------------------------------------------------------------------------- | ------- |
| `false`          | binding **present**, `fetch()` throws `Binding … needs to be run remotely`; no Cloudflare contact | 208 ms  |
| `true` (default) | `⎔ Establishing remote connection…`, Rails answers `HTTP 200`                                     | 2702 ms |

The first row is a trap, and it is why `src/lib/rails-client.ts` changed. Under
`next dev` the binding is **truthy but non-functional**. `getRailsClient()` used to
test `if (binding)` first, so it would have selected a transport that always throws and
made the direct Podman path dead code — reporting `unreachable` for every local Rails
call, with nothing failing anywhere else. The local-Node check now runs **first**:

```ts
if (EDGE_LOCAL_NODE_RUNTIME === '1') {
  return EDGE_LOCAL_RAILS_ENABLED === '1'
    ? createRailsClient({ fetch }, ORIGIN)
    : null;
}
// workerd / Workers only
const binding = env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC;
```

This is still a branch on **runtime capability**, never on an environment name —
ADR 005 §5's property is preserved. `EDGE_LOCAL_NODE_RUNTIME` is set only by the `dev`
scripts, so workerd preview and the deployed Worker are unaffected. Requiring
`EDGE_LOCAL_RAILS_ENABLED` too means Node dev fails closed to `not-configured` rather
than borrowing a transport it was not granted.

`EDGE_LOCAL_NODE_RUNTIME` / `EDGE_LOCAL_RAILS_ENABLED` are therefore **kept**. Fast
Node development against local Rails is a distinct, valuable path, and preview gaining
VPC is not a reason to remove it.

### 5. Production bootstrap: production points at the development VPC Service

The account holds exactly one VPC Service (verified 2026-08-22,
`wrangler vpc service list`):

```
019f5fe0-287f-7040-9f2f-036cb5b21df7  umaxica-apps-edge-cf-workers-vpc
host core.app.localhost  HTTP:3000, HTTPS:443  tunnel 1d501e9a…
```

Production Rails on AWS does not exist. Production therefore points at the
**development** Service as an explicit, temporary bootstrap state.

**State plainly what this costs.** A deployed production Worker's Rails traffic leaves
the production network and terminates on a developer's machine through the development
tunnel, and production `/rails-health` will report `ok` for the wrong reason. ADR 006 §2
removed the binding precisely to prevent this. That removal is being reversed
deliberately, with the hazard made loud rather than tolerated quietly.

The safety property is **suspended, not deleted**. `tools/workers-manifest.json`
carries:

```jsonc
"vpcServices": { "development": "019f5fe0-…", "production": "019f5fe0-…" },
"$productionIsBootstrap": true
```

While the flag is `true`, the two ids are _required_ to match. The moment it is
`false`, both `tools/check-workers.mjs` and `test/rails-connection-invariants.test.ts`
require them to **differ**. `pnpm run check:config` reports the state as a standing
`WARN` on every run so it cannot fade into the background.

### 6. VPC Services, not VPC Networks

Workers VPC now offers both. VPC Networks "allow your Workers to access any service in
your private network without pre-registering individual hosts or ports", and "the URL
you pass to `fetch()` … determines the destination"
([VPC Networks](https://developers.cloudflare.com/workers-vpc/configuration/vpc-networks/)).

For this use case that is strictly worse. The destination set is **fixed and known**:
one Rails deployment behind one tunnel. A Service binding pins host and port in
Cloudflare's configuration, so a Worker bug cannot redirect the request — the SSRF
blast radius is one origin. A Network binding would move destination selection into
Worker code, which is the thing we do not want to be able to get wrong.

Networks would also buy nothing here: the fifteen frames already reach fifteen Rails
entry points through one Service, because `Host` is the discriminator. **Retain VPC
Services.** Revisit only if Rails destinations become dynamic or numerous.

### 7. VPC routing semantics, restated from current documentation

- "The VPC Service configuration host and port(s) will always be used to connect and
  route requests to your services."
- "The host provided in the `fetch()` operation is not used to route requests, and
  instead only populates the `Host` field" — and the SNI value for HTTPS.
- "The port provided in the `fetch()` operation is ignored."

So `PRIVATE_RAILS_ORIGIN = 'http://<frame>.<brand>.localhost:3000'` is **not** a label.
The host selects the Rails namespace `<Frame>::<Brand>::…`; the `:3000` is decorative.
A wrong host does not fail — it answers 200 from the wrong namespace. Pinned per frame
in `test/rails-connection-invariants.test.ts`.

**One documented behaviour disagrees with what this repository measured.** Cloudflare
states that when Workers VPC cannot establish a connection, "`fetch()` will throw an
exception". ADR 006 measured a `500 text/plain` response with body
`ProxyError: connection_refused`. `rails-client.ts` handles **both** — `readProxyError()`
maps the response form to `unreachable`, and the `catch` handles the throw form. Neither
path is removed on the strength of the other.

### 8. `wrangler dev --remote` is not used, and that is now the documented default

Cloudflare describes `--remote` as **legacy**, not supported in the Vite plugin, and
reserved for features "highly specific to Cloudflare's network"; local execution plus
remote bindings is the recommendation. This repository already did the recommended
thing. No exception is needed.

### 9. Environment variable semantics

| Variable         | Owner             | Meaning                                                                                                                                       |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `EDGE_ENV`       | UMAXICA           | the lifecycle tier: `production` / `development` / `test`                                                                                     |
| `NODE_ENV`       | framework runtime | Next.js only accepts these three; set in vars because a Worker has no other source. **Not** set on the Hono apex workers, which never read it |
| `CLOUDFLARE_ENV` | Wrangler          | control mechanism only — **never** bound as a Worker var                                                                                      |

`EDGE_ENV` is deliberately _not_ consumed by transport logic — `getRailsClient()`
branches on capability, so an environment cannot end up on the wrong transport by being
renamed. It survives as the diagnostic/observability label, surfaced through the
generated `NodeJS.ProcessEnv` interface.

**The `CLOUDFLARE_ENV` blanking is still required.** `--env` takes precedence over the
variable, but with no `--env` the variable selects the environment, and `compose.yaml`
exports `CLOUDFLARE_ENV=development`. Re-measured 2026-08-22 on wrangler 4.120.1 with
`wrangler deploy --dry-run` on `app/apex`:

```
CLOUDFLARE_ENV=development, no --env   ->  env.EDGE_ENV ("development")
CLOUDFLARE_ENV=,            no --env   ->  env.EDGE_ENV ("production")
```

A deploy from inside the container that did not blank it would ship to
`<name>-development` and leave production untouched — a failure that looks like
success. Every no-`--env` wrangler invocation blanks it, and `checkPackageScripts()`
fails the build otherwise.

The related `opennextjs-cloudflare upload` hazard also stands: it reads Worker vars
through `getPlatformProxy()` into its own `process.env` before spawning wrangler, so a
var named `CLOUDFLARE_ENV` would come back as `--env=<value>`. That is why the tier is
`EDGE_ENV`.

### 10. Compatibility dates are deliberately untouched

Frames are on `2026-05-13`, apex workers on `2026-02-27`. **This migration changed
neither**, because a compatibility-date bump is a behavioural change and mixing it into
an environment restructure would make any regression un-attributable.

Both flag sets are still justified:

- **`nodejs_compat`** — auto-enabled only for `compatibility_date >= 2026-08-04`. Both
  dates predate that, so the explicit flag is load-bearing today.
- **`global_fetch_strictly_public`** — stops a deployed Worker reaching a private or
  non-publicly-resolvable host via the global `fetch()`. This is what makes the VPC
  binding the _only_ route to Rails rather than merely the intended one. Keep.
- **`nodejs_als`** — `AsyncLocalStorage` for the Hono workers.

Advancing the dates is a **separate migration unit** with its own verification. When
frames pass `2026-08-04`, the explicit `nodejs_compat` can be dropped at the same time.

### 11. Guardrails are written as policy, not as schema trivia

`tools/check-workers.mjs` is split in two:

- **Layer 1 — Wrangler schema facts.** `WRANGLER_NON_INHERITABLE` documents which keys
  are not inherited. It is consulted only to validate the keys a worker _class_ declares
  it needs; it is never iterated over the top-level config.
- **Layer 2 — UMAXICA policy**, as named functions: `checkProductionEnvironment`,
  `checkDevelopmentEnvironment`, `checkTestEnvironment`, `checkProductionVpcPolicy`,
  `checkDevelopmentVpcPolicy`, `checkTestVpcPolicy`, `checkBootstrapPolicy`,
  `checkRateLimitIsolation`, `checkRailsBackedWorker`, `checkApexWorker`,
  `checkContentSurfaceWorker`, `checkDiagnosticWorker`, `checkPackageScripts`.

Each was negative-tested on 2026-08-22 by reintroducing the violation and confirming the
failure message, then reverting:

| Reintroduced                                   | Caught by                    |
| ---------------------------------------------- | ---------------------------- |
| `env.vpc`                                      | `checkProductionEnvironment` |
| `vpc_services` in `env.test`                   | `checkTestVpcPolicy`         |
| `remote: true` on the production binding       | `checkProductionVpcPolicy`   |
| `$productionIsBootstrap: false` with equal ids | `checkBootstrapPolicy`       |
| a `preview:vpc` script passing `--env vpc`     | `checkPackageScripts`        |

### 12. Commands

| Command           | Lifecycle   | Runtime            | Rails transport      | Cloudflare credential    |
| ----------------- | ----------- | ------------------ | -------------------- | ------------------------ |
| `pnpm dev`        | development | Node (`next dev`)  | direct local Podman  | **none**                 |
| `pnpm preview`    | development | local workerd      | remote VPC binding   | `wrangler login` (OAuth) |
| `pnpm test`       | test        | vitest             | none                 | none                     |
| `pnpm build`      | production  | —                  | —                    | none                     |
| `pnpm deploy`     | production  | Cloudflare Workers | deployed VPC binding | API token                |
| `pnpm cf-typegen` | production  | —                  | —                    | none                     |

`preview:vpc` is **gone**; `preview` is what it was. There is deliberately no root-level
`preview` fan-out: fifteen concurrent preview servers would open fifteen remote-proxy
sessions. `pnpm run check:preview` is therefore **strictly sequential**, and that
constraint followed the binding out of `env.vpc` rather than disappearing with it.

Run one workspace at a time:

```bash
CLOUDFLARE_API_TOKEN= pnpm --filter umaxica-apps-edge-app-docs run preview
```

`CLOUDFLARE_API_TOKEN` must be **blanked, not unset** — an absent key is what dotenv
fills in, and an API token cannot open a remote-binding session.

## Verification

`pnpm install` first — nothing runs without it.

| Gate                     | Result (2026-08-22)                  |
| ------------------------ | ------------------------------------ |
| `pnpm run format:check`  | pass                                 |
| `pnpm run lint:check`    | pass                                 |
| `pnpm run typecheck`     | pass, 19 workspaces                  |
| `pnpm run test`          | 1576 tests, 188 files, pass          |
| `pnpm run check:workers` | OK (19 workers validated)            |
| `pnpm run check:config`  | pass, with the bootstrap `WARN`      |
| `pnpm run check:vpc`     | 15/15 Rails 200 over the raw binding |
| `pnpm run check:preview` | see Outcome                          |

Environment resolution was proved directly rather than inferred, with
`wrangler deploy --dry-run` per environment and with the `preview` banner:

```
env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC (019f5fe0-…)   VPC Service   remote
env.EDGE_ENV ("development")
```

and `curl 127.0.0.1:8787/rails-health` → `{"rails":{"kind":"ok","status":200}}`.

**Production is not verified live.** `wrangler deploy` was not run as part of this
record. The remaining step is a real production deploy followed by checking production
`/rails-health` — which, during bootstrap, will answer `ok` by reaching a developer's
machine.

## Consequences

- Credential-free _previewing_ is gone. It only ever existed because the preview
  environment had no binding. `pnpm dev` keeps it.
- `check:preview` is sequential and therefore slow — fifteen builds and fifteen servers
  in series.
- Preview is not byte-identical to production: the binding call originates from the
  developer's machine through the remote proxy, and smart placement, real rate limiting
  and ISR are not exercised.
- Workers VPC remains in **beta**: "Features and APIs may change before general
  availability."

## AWS cutover procedure

1. Create the production Tunnel beside production Rails, and a production VPC Service on
   it (`wrangler vpc service create`). **Cloudflare-side; not doable from this repository.**
2. `tools/workers-manifest.json`: set `vpcServices.production` to the new id and
   `$productionIsBootstrap` to `false`.
3. Replace `service_id` in the fifteen top-level `vpc_services` blocks.
4. `pnpm run check:workers && pnpm run test` — the guardrails now _require_ the two ids
   to differ.
5. Deploy and verify production `/rails-health`.

No `rails-client.ts` change. No `env.development` change. No command change.

## Outcome

**Implemented.** Changed:

- `*/wrangler.jsonc` (×19) — regenerated to one canonical ordering per class; `env.vpc`
  removed; the binding added to `env.development` (remote) and to the top level
  (production, no `remote`); `4001/4002/4003` rate-limit namespaces retired; the apex
  workers' redundant `env.development.observability` duplicate dropped in favour of
  inheritance. Verified key-by-key against `HEAD` so nothing was silently lost.
- `*/next.config.ts` (×15) — `initOpenNextCloudflareForDev({ remoteBindings: false })`.
- `*/src/lib/rails-client.ts` (×15) — local-Node transport resolved before the binding.
- `*/package.json` (×15) + root — `preview:vpc` and `check:preview:vpc` removed.
- `*/cloudflare-env.d.ts` — regenerated for all 19; `EDGE_ENV` is now
  `"development" | "test" | "production"`, `Cloudflare.VpcEnv` is gone,
  `Cloudflare.DevelopmentEnv` carries the binding, `TestEnv` does not. Confirmed
  deterministic by regenerating and diffing.
- `tools/workers-manifest.json` — `vpcServices` per tier plus `$productionIsBootstrap`.
- `tools/check-workers.mjs` — two-layer rewrite; negative-tested.
- `tools/verify-edge-connectivity.mjs` — `preview:vpc` mode removed, `preview` made
  sequential and VPC-carrying, config mode taught the three-tier model, environment
  isolation gated on the bootstrap flag.
- `test/rails-connection-invariants.test.ts` — rewritten on parsed configs; no string
  positions.

The one thing that was **not** expected going in: moving the binding into
`env.development` silently broke the Node dev Rails path, because a disabled remote
binding is still a truthy object. That is decision 4, and it is the reason the phased
sequence (prove the new path before deleting the old one) was worth the extra steps.
