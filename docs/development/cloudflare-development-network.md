# Cloudflare development network

Local Node and the Cloudflare Workers runtime are not equivalent. A missing Workers binding
is never fabricated and never falls back to Access or another environment.

```text
1. next dev (Node) ── private rootless Podman network ── Rails development

2. check-tunnel ── HTTPS + Access service token ── Cloudflare Access
                                                    └─ Tunnel (Rails-owned) ── Rails

3. local workerd ── remote:true VPC binding ── development VPC Service
                                               └─ Tunnel ── Rails

4. production Worker ── production VPC binding (currently absent: fail closed)

5. browser ── Cloudflare ── Tunnel (Rails-owned) ── shared Podman network
                                                    └─ Edge dev server (Hono/Next.js)
```

Path 5 is inbound and browser-facing; paths 2–4 are outbound, server-to-server. They share the one
connector and nothing else. A Tunnel route on path 5 does not give the local process a Workers
runtime or a Workers binding — that is what paths 3 and 4 are for.

| Path            | Caller/runtime                                      | Destination                                              | Authentication/product                                 | Failure behavior                                                                                               | Validation                                         | Status after repository implementation        |
| --------------- | --------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------- |
| Private Rails   | `next dev`, local Node                              | `<frame>.<brand>.localhost:3000` on `EDGE_RAILS_NETWORK` | Rootless Podman network; no Access credential          | Missing overlay returns `not-configured`; unreachable network reports failure                                  | `scripts/check-rails`, `pnpm run check:local`      | Runtime verification required                 |
| Access/Tunnel   | `scripts/check-tunnel`                              | `EDGE_TUNNEL_RAILS_URL`                                  | Dedicated Access service token; Rails-owned Tunnel     | Missing token is `BLOCKED`; Access/Tunnel/backend failures stay distinct                                       | `scripts/check-tunnel`                             | Credential verification required              |
| Development VPC | local workerd: `pnpm preview`, `preview:vpc`, probe | configured development VPC Service, then Rails           | Interactive `wrangler login`; an API token is rejected | Without a session `preview` aborts; `next dev` keeps serving and logs one unhandled rejection, with no binding | `scripts/check-vpc`, `pnpm run check:preview:vpc`  | Blocked: no OAuth session in this environment |
| Production VPC  | deployed production Worker                          | **bootstrap: the development VPC Service**, then Rails   | Workers runtime binding, no `remote`                   | Binding present; a stopped local Rails/tunnel makes production report 503                                      | static binding invariants; `pnpm run check:config` | Bootstrap — AWS cutover pending               |

The URL host passed to Workers VPC supplies Host/SNI semantics; the VPC Service determines
routing. Tests pin each frame host and the shared development service ID.

Production deliberately shares that development service **for now**. AWS production Rails does not
exist, and pointing the deployed Worker at the one service that does is the only way to exercise the
real edge → Workers VPC → VPC Service → Tunnel → Rails path before it does. The cost is stated
plainly: production Rails connectivity is only as available as the developer machine behind the
tunnel. `tools/workers-manifest.json` holds the two ids as separate fields so the AWS cutover is a
change to `vpcProductionServiceId` and the fifteen top-level `service_id`s, with no application
change. See ADR 006.

| Edge dev exposure | browser | sixteen published FQDNs, then `edge-core:<port>` | Cloudflare Access on all sixteen, whole host, no `/health*` Bypass | Container or dev server down returns 502, reported BLOCKED not FAIL; unauthenticated is 302 to the team domain | `pnpm run check:tunnel:edge` | `COMPLETE` (2026-08-11) |

The Edge repository does not run `cloudflared`, hold a Tunnel token, or own Tunnel lifecycle. It
does now define a Podman network, `umaxica-edge-tunnel`, that the connector joins so it can reach
the Edge container — see
[`docs/operations/cloudflare-tunnel-development.md`](../operations/cloudflare-tunnel-development.md)
and `adr/008-edge-development-tunnel-exposure.md`, which amends ADR 006 §6 on that one point.
External Cloudflare dashboard/API changes are outside this refresh and must be documented and
authorized separately.
