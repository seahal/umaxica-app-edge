# Cloudflare development network

Local Node and the Cloudflare Workers runtime are not equivalent. A missing Workers binding
is never fabricated and never falls back to Access or another environment.

```text
1. next dev (Node) ── private rootless Podman network ── Rails development
     lifecycle: development · runtime: Node · remoteBindings: false

2. check-tunnel ── HTTPS + Access service token ── Cloudflare Access
                                                    └─ Tunnel (Rails-owned) ── Rails

3. local workerd ── remote:true VPC binding ── development VPC Service
     lifecycle: development · runtime: workerd    └─ Tunnel ── Rails

4. production Worker ── deployed VPC binding ── VPC Service ── Tunnel ── Rails
     lifecycle: production · BOOTSTRAP: currently the DEVELOPMENT Service

5. browser ── Cloudflare ── Tunnel (Rails-owned) ── shared Podman network
                                                    └─ Edge dev server (Hono/Next.js)
```

Paths 1 and 3 are the **same lifecycle environment** (`env.development`) in two
runtimes over two transports. That separation — lifecycle vs runtime vs transport — is
the model; see [`adr/009`](../../adr/009-wrangler-lifecycle-environment-reconstruction.md).
There is no `env.vpc` and no staging tier.

Path 5 is inbound and browser-facing; paths 2–4 are outbound, server-to-server. They share the one
connector and nothing else. A Tunnel route on path 5 does not give the local process a Workers
runtime or a Workers binding — that is what paths 3 and 4 are for.

| Path          | Caller/runtime         | Destination                                              | Authentication/product                        | Failure behavior                                                              | Validation                                    | Status after repository implementation |
| ------------- | ---------------------- | -------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| Private Rails | `next dev`, local Node | `<frame>.<brand>.localhost:3000` on `EDGE_RAILS_NETWORK` | Rootless Podman network; no Access credential | Missing overlay returns `not-configured`; unreachable network reports failure | `scripts/check-rails`, `pnpm run check:local` | Runtime verification required          |

> `next dev` resolves `env.development`, which _does_ declare the VPC binding — but with
> `remoteBindings: false` wrangler materialises it as a stub that throws rather than
> opening a session. `getRailsClient()` therefore checks the `EDGE_LOCAL_NODE_RUNTIME`
> marker **before** the binding; see adr/009 §4.
> | Access/Tunnel | `scripts/check-tunnel` | `EDGE_TUNNEL_RAILS_URL` | Dedicated Access service token; Rails-owned Tunnel | Missing token is `BLOCKED`; Access/Tunnel/backend failures stay distinct | `scripts/check-tunnel` | Credential verification required |
> | Development VPC | local workerd probe or OpenNext `preview` | development VPC Service, then Rails | Wrangler dedicated OAuth; real `remote: true` binding | Missing binding/auth/service fails closed; no Node fallback | `scripts/check-vpc`, `pnpm run check:preview` | `COMPLETE` (2026-08-22) |
> | Production VPC | deployed production Worker | production VPC Service (BOOTSTRAP: the development one) | Workers runtime binding, no `remote` key | Missing binding is `not-configured`; during bootstrap it reaches a developer's machine | static binding invariants; `$productionIsBootstrap` | Deploy not yet exercised |

The URL host passed to Workers VPC supplies Host/SNI semantics; the VPC Service determines
routing, and the port in the URL is ignored. Tests pin each frame host and the service ID
per tier. Production must not reuse the development service once
`$productionIsBootstrap` is `false` — while it is `true`, production deliberately does,
and `pnpm run check:config` reports that as a standing `WARN`.

| Edge dev exposure | browser | sixteen published FQDNs, then `edge-core:<port>` | Cloudflare Access on all sixteen, whole host, no `/health*` Bypass | Container or dev server down returns 502, reported BLOCKED not FAIL; unauthenticated is 302 to the team domain | `pnpm run check:tunnel:edge` | `COMPLETE` (2026-08-11) |

The Edge repository does not run `cloudflared`, hold a Tunnel token, or own Tunnel lifecycle. It
does now define a Podman network, `umaxica-edge-tunnel`, that the connector joins so it can reach
the Edge container — see
[`docs/operations/cloudflare-tunnel-development.md`](../operations/cloudflare-tunnel-development.md)
and `adr/008-edge-development-tunnel-exposure.md`, which amends ADR 006 §6 on that one point.
External Cloudflare dashboard/API changes are outside this refresh and must be documented and
authorized separately.
