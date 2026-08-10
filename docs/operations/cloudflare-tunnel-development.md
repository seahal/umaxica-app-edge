# Cloudflare Tunnel and local Edge development

## One connector, in the Rails repository

There is exactly one Cloudflare Tunnel connector for the whole system, and it is
**not** in this repository. This repository used to run a second connector, on
its own `Edge` tunnel; that has been removed.

**Why one.** A Cloudflare Tunnel load-balances across every connector registered
to it, for high availability. Two connectors on the same tunnel therefore means
requests for _any_ of its routes may land on _either_ connector. The Rails
tunnel carries thirteen public hostnames plus the Workers VPC route, so a second
connector that cannot serve Rails would break roughly half of those requests —
including `core-jp.umaxica.app`, the hostname local development calls. The
failure is intermittent, which makes it expensive to diagnose.

This constrains **connectors per tunnel**, not the number of tunnels. Adding a
separate tunnel is fine; adding a second connector to an existing one is what
breaks. A connector in _this_ repository would be the bad case twice over: it
could not reach Rails (different Compose project, no shared network), and it
would take roughly half the VPC traffic away from the connector that can.

`test/compose-tunnel-invariants.test.ts` fails the build if a connector, a
`compose.custom.yaml`, or a `CLOUDFLARED_TOKEN` reappears here.

## What this leaves

| Concern                      | How it works today                                    |
| ---------------------------- | ----------------------------------------------------- |
| Edge → Rails, development    | Workers VPC binding (`env.vpc` only), `preview:vpc`   |
| Edge → Rails, production     | **nothing** — no production VPC Service exists yet    |
| Edge → Rails, fallback       | HTTPS to `core-jp.umaxica.app` + Access service token |
| Browser → local dev surfaces | `localhost` only — no tunnel, not exposed             |

Production carries no binding on purpose. The only VPC Service that exists is on
the **development** tunnel and terminates on a developer's machine, so pointing
production at it would route production traffic off the production network. Until
a production VPC Service exists, production fails closed — `/rails-health` reports
`not-configured`. See
[ADR 006](../../adr/006-development-workers-vpc-transport.md).

Note that the "fallback" row is not an independent path: `core-jp.umaxica.app`
fronts the same tunnel. It exists for a developer without a Cloudflare
credential, not as a second environment.

The Rails connection is unaffected by any of this: it goes over the Rails-side
tunnel either way. See
[ADR 005](../../adr/005-rails-edge-workers-vpc-connection.md) and
[`cloudflare-access.md`](cloudflare-access.md).

**Local dev surfaces are currently reachable only from this machine.** Exposing
them on real hostnames again is the "unified connector" work below, which is not
done.

## Local development — three tiers

| Command                              | Runtime           | Rails              | Cloudflare credential |
| ------------------------------------ | ----------------- | ------------------ | --------------------- |
| `pnpm run dev`                       | Node (`next dev`) | `not-configured`   | **none**              |
| `pnpm --filter <ws> run preview`     | local workerd     | `not-configured`   | **none**              |
| `pnpm --filter <ws> run preview:vpc` | local workerd     | **real, over VPC** | required              |

The first two need nothing Cloudflare-related — no API token, no
`wrangler login`, no connector token:

```bash
pnpm install
pnpm run dev        # every dev server, on the ports in CLAUDE.md
```

`vpc_services` is declared in `env.vpc` alone, so `next dev` and
`preview` resolve no remote binding and never authenticate to Cloudflare.

### `preview:vpc` — the production-shaped path

```bash
wrangler login      # OAuth. An API token does NOT work — see below.
CLOUDFLARE_API_TOKEN= pnpm --filter umaxica-apps-edge-app-docs run preview:vpc
curl -s 127.0.0.1:8787/rails-health | jq .rails
```

Two things about that invocation are load-bearing, both established by
measurement rather than by reading:

**It must be OAuth, not an API token.** Opening a remote-binding session POSTs
to `/accounts/<id>/workers/subdomain/edge-preview`, and that endpoint answers
`10405 Method not allowed for this authentication scheme` to token auth — no
combination of scopes changes this. With a token you get
`remote session could not be authenticated`, which reads like a permissions
problem and is not one.

**`CLOUDFLARE_API_TOKEN` must be blanked, not unset.** `next build` loads the
repo-root `.env` into `process.env`, and the wrangler child inherits it, so the
token comes back even after `env -u` — an absent key is precisely what dotenv
fills in. Assigning an empty value makes dotenv treat the key as already set and
leave it alone. Symptom if you get this wrong: the first remote connection
succeeds and prints the binding table, then a second one fails citing the token.

**The port is 8787**, not the frame's dev port: `preview` does not pass
`--port`, so wrangler uses its own default. `pnpm dev` still uses 5406.

**Blanking the token is not enough for a bare `wrangler dev`.** Wrangler loads
the repo-root `.env` itself and re-injects `CLOUDFLARE_API_TOKEN`, so a session
started outside a workspace script needs `--env-file <an empty file>` as well —
see `tools/vpc-probe/empty.env` and
[`connectivity-acceptance.md`](connectivity-acceptance.md).

This runs the app in local **workerd** and proxies only the VPC binding out to
Cloudflare (`remote: true`), so the request travels
workerd → Cloudflare → VPC Service → tunnel → Rails — the same hops production
will use. It is the only way to catch a wrong `service_id`, a VPC Service aimed
at the wrong host or port, or a tunnel that is down, before a deploy.

Run it **one workspace at a time**. There is no root-level fan-out on purpose:
fifteen concurrent preview servers would each open their own remote-proxy
session against Cloudflare.

Reaching Rails without a Cloudflare credential is still possible over the
fallback transport — copy each frame's `.env.example` to `.env.development.local`
and fill in the Access service token, per
[`cloudflare-access.md`](cloudflare-access.md), section 2b. That path does not
exercise the binding, so a green `/rails-health` there says nothing about
whether the VPC configuration is correct.

## Verifying the Rails connection

The apex workers do not contact Rails, so `/health.json` reports only the worker
itself. Check Rails through a Next.js frame's `/rails-health`.

All fifteen frames expose it in **one** form: a JSON Route Handler answering
`{"rails": {...}}`, 200 when the kind is `ok` and 503 otherwise. So the same
command works against any port:

```bash
curl -s http://127.0.0.1:5405/rails-health | jq .rails   # app/core
curl -s http://127.0.0.1:5406/rails-health | jq .rails   # app/docs
curl -s http://127.0.0.1:5106/rails-health | jq .rails   # com/docs
curl -s http://127.0.0.1:5306/rails-health | jq .rails   # org/docs
```

The three cores used to render an HTML status page here instead, so `jq` against
a core port returned markup. Unified on JSON 2026-08-10;
`docs/design/rails-health-page.md` records what that page did, for whenever a
diagnostics UI is built deliberately rather than copied fifteen times.

`test/rails-connection-invariants.test.ts` pins the uniformity.
The `kind` field is one of four values:

| `kind`           | Meaning                                  |
| ---------------- | ---------------------------------------- |
| `ok`             | Rails answered — HTTP 200                |
| `http-error`     | Rails answered with a non-2xx status     |
| `unreachable`    | Timed out (5 s) or the connection failed |
| `not-configured` | No transport configured — fail closed    |

The route returns HTTP 503 for everything except `ok`.

`not-configured` in development almost always means `.env.development.local` is
missing or has an empty token. A `200` carrying HTML rather than JSON means the
request reached Cloudflare Access and got a login page — the service token is
wrong, or the Access application has no Service Auth policy.

## Unifying onto one connector — not done yet

To expose the local dev surfaces on real hostnames again, the single Rails-side
connector has to be able to reach **both** Rails and the Edge containers. That
means:

1. **A shared container network.** Both Compose projects join one external
   network so the connector can resolve the Edge services:

   ```bash
   podman network create umaxica-tunnel
   ```

   Then, in this repository, attach `core` to it. This is deliberately **not**
   wired up yet: `compose.custom.yaml` was merged unconditionally by
   `.devcontainer/devcontainer.json`, and an `external:` network that does not
   exist makes `compose up` fail for the whole project, devcontainer included.
   Add it only once the network and the Rails-side connector are both ready:

   ```yaml
   # compose.custom.yaml — re-add to devcontainer.json's dockerComposeFile
   networks:
     umaxica-tunnel:
       external: true
   services:
     core:
       networks:
         default: {}
         umaxica-tunnel:
           aliases:
             - edge-core
   ```

   The alias matters: `core` is a generic service name and the Rails project may
   well have its own.

2. **Public Hostname entries on the Rails-side tunnel**, pointing at
   `http://edge-core:<port>` for each surface to expose.

3. **An Access application** covering those hostnames, with an interactive Allow
   policy — see [`cloudflare-access.md`](cloudflare-access.md), section 2.

Note that step 1 abandons a property this repository previously held as an
invariant: that the Edge and Rails Compose projects never share a network. That
was correct while Edge reached Rails only through the VPC binding. Sharing a
network is the price of a single connector, and it is a deliberate trade, not an
oversight.

## Authenticating wrangler

Only needed to **deploy**, never to develop.

```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
```

`compose.yaml` passes both through to the `core` service. Create the token at
<https://dash.cloudflare.com/profile/api-tokens> → _Create Token_ → the
**Edit Cloudflare Workers** template, then add `Connectivity: Read`:

| Scope   | Permission         | Access                                 |
| ------- | ------------------ | -------------------------------------- |
| Account | Workers Scripts    | Edit                                   |
| Account | Workers KV Storage | Edit                                   |
| Account | Connectivity       | Read — **required for `vpc_services`** |
| Account | Account Settings   | Read                                   |
| User    | User Details       | Read                                   |

Restrict _Account Resources_ to the one account. The account ID is in the
Workers & Pages sidebar, or the path segment of
`https://dash.cloudflare.com/<account-id>`.

`Workers Scripts: Edit` is account-wide write access to every Worker, and is
required for deployment.

**It is not sufficient for `remote: true`, and no scope is.** The
`edge-preview` endpoint rejects token authentication as a scheme, so remote
bindings need `wrangler login`. The token above covers deploys only.

Confirmed on this account rather than assumed:

```
GET  /accounts/<id>/workers/subdomain             → 200  {"subdomain":"umaxica"}
GET  /accounts/<id>/workers/subdomain/edge-preview → 403  10000
POST /accounts/<id>/workers/subdomain/edge-preview → 405  10405
     "Method not allowed for this authentication scheme"
```

Note also that a VPC binding **can** be used locally — `remote: true` exists for
exactly that. The constraint is the authentication scheme, not the runtime.

#### Logging in from inside the container

`wrangler login`'s callback listener binds `localhost:8976` **inside** the
container, and on IPv6 (`::1`) only — which is why a devcontainer port forward
watching IPv4 sees nothing. Two ways through:

1. Run a relay so IPv4 reaches it, then approve in the browser normally:
   `node -e 'const n=require("net");n.createServer(c=>{const u=n.connect({port:8976,host:"::1"});c.pipe(u);u.pipe(c)}).listen(8976,"0.0.0.0")'`
2. Or approve in the browser, let the redirect to `localhost:8976` fail, copy the
   full `…/oauth/callback?code=…&state=…` URL out of the address bar, and replay
   it inside the container against `http://[::1]:8976`. Wrangler's wait has a
   short timeout, so do this promptly.

Credentials then persist in the `wrangler-config` volume across rebuilds.

Credentials survive container recreation: `wrangler login` writes to
`$XDG_CONFIG_HOME/.wrangler`, so `/home/edge/.config/.wrangler` is a named
volume (`wrangler-config`). It is declared in **both** `compose.yaml` and
`.devcontainer/compose.override.yml` — the override replaces the whole volume
list with `!override`, so an entry missing there is silently dropped in
devcontainer mode.

## Troubleshooting

| Symptom                                                          | Cause                                                         | Fix                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| `/rails-health` reports `not-configured`                         | `.env.development.local` missing, or a token is empty         | Copy `.env.example` and fill in both token halves         |
| `/rails-health` reports `unreachable`                            | Wrong `PUBLIC_CORE_RAILS_ORIGIN`, or the Rails tunnel is down | Check the hostname; check the tunnel in Zero Trust        |
| 200 with an HTML login page instead of JSON                      | Service token rejected, or no Service Auth policy             | See `cloudflare-access.md` 2b.3                           |
| `Authentication error [code: 10000]` on a `wrangler vpc` command | Token is missing `Connectivity: Read`                         | Edit the token's permissions                              |
| `remote session could not be authenticated` on `preview:vpc`     | Token is missing `Workers Scripts: Edit`                      | Add the scope, or use `wrangler login` instead            |
| `preview:vpc` reports `unreachable`                              | Development tunnel or its connector is down                   | Check the tunnel in Zero Trust; restart the connector     |
| `preview:vpc` reports `not-configured`                           | Ran `--env development` rather than `--env vpc`               | Use the `preview:vpc` script; only it carries the binding |
| Prompted to log in to Cloudflare after every rebuild             | `wrangler-config` volume missing from the `!override` list    | Re-add it to `.devcontainer/compose.override.yml`         |

## Environment separation

The application environment is `development` and stays `development`. No source
file branches on the environment name; transports are selected by which
configuration exists (ADR 005, decision 5).
`test/compose-tunnel-invariants.test.ts` enforces the no-`staging`-branch rule.

Re-introducing staging means a new `wrangler.jsonc` env block with its own
bindings — bindings are **not** inherited into env blocks — plus `'staging'` in
the `CLOUDFLARE_ENV` union in `*/cloudflare-env.d.ts`, and its own Rails
transport configuration. Nothing in application logic changes.
