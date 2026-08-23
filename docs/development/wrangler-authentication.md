# Wrangler authentication

Wrangler holds **dedicated container OAuth state, never an API token**. This is not a
preference: an API token cannot open a remote-binding session at all. The edge-preview
endpoint answers `10405 Method not allowed for this authentication scheme`, so
`--env vpc` — the only path that reaches Rails over the VPC binding — is unavailable
without an OAuth session. `tools/vpc-probe/empty.env` exists to keep a stray
`CLOUDFLARE_API_TOKEN` out of the way for exactly this reason.

## The default is `pnpm run login`

```bash
pnpm run login
```

`compose.yaml` publishes `127.0.0.1:8976:8976`, so the ordinary loopback flow works from a
browser on the container host and that is what `scripts/wrangler-login` runs. Reach for the
device grant below when that published port is not reachable — under `podman exec`, over
SSH, or from any browser that is not on the host.

## Otherwise, the Device Authorization Grant

```bash
pnpm run login:device
```

which is `scripts/wrangler-login --device`:

```bash
pnpm exec wrangler login --device --no-browser --no-use-keyring
```

Wrangler prints a verification URL and a short user code. Open the URL in any browser,
on any machine, enter the code, and approve. The CLI polls until it is authorized and
then writes the token itself.

From outside the container, the same thing without entering it first:

```bash
podman exec -it -w /home/edge/workspace \
  umaxica-apps-edge-dc-core-1 \
  pnpm run login:device
```

`--no-browser` because the container has no browser to open. `--no-use-keyring` because
it has no OS keychain; the token lands in a plaintext file instead, described below.

## Why the loopback flow cannot always work

`wrangler login` defaults to the Authorization Code Grant with PKCE, which receives the
authorization code by **redirecting the browser to `http://localhost:8976/oauth/callback`**.
That requires an inbound path from the browser into the container. `compose.yaml` provides
one for the host browser and nothing else: `podman exec` publishes no port at all, and a
browser on another machine has no route to the host's loopback. In those cases the browser
fails to connect and the code is stranded in the address bar.

Pasting that stranded URL back does not rescue it. The `state` and the PKCE
`code_verifier` live only in the memory of the `wrangler login` process that started the
flow, so a code can be redeemed by that process and no other. Once it exits — and it
exits after **two minutes** — the code is unredeemable regardless of who holds it.

The device grant inverts the direction. Nothing is delivered _to_ the CLI; the CLI
fetches the token itself from `oauth2/token`. Only outbound HTTPS is needed, which the
container always has.

|                                     | Authorization Code + PKCE (loopback) | Device Authorization Grant   |
| ----------------------------------- | ------------------------------------ | ---------------------------- |
| Code arrives via                    | browser redirect to `localhost:8976` | CLI polls the token endpoint |
| Requires a published port           | yes, `127.0.0.1:8976`                | no                           |
| Requires a browser on the same host | yes                                  | no                           |
| Approval window                     | ~2 minutes                           | 5 minutes                    |
| Works under `podman exec`           | no                                   | yes                          |

Wrangler documents `--device` for precisely this case: "Useful in containers, remote SSH
sessions, or other environments where localhost:8976 is unreachable from your browser."

## Verify

```bash
pnpm exec wrangler whoami
```

Confirm the account is the intended one **before** relying on the session — authorizing
while signed into the wrong Cloudflare account produces a perfectly valid token for the
wrong tenant, and nothing downstream will flag it. `connectivity (admin)` must appear in
the scope list; it is what grants access to the VPC Service.

Then exercise the transport itself:

```bash
pnpm run check:vpc
```

## Where the token lives

`~/.config/.wrangler/config/default.toml`, mode `0600`, inside the container. Nothing on
the host holds a copy and nothing persists it: the container obtains the session
interactively rather than receiving it, and recreating the container means logging in
again — see [credential-and-secret-management.md](credential-and-secret-management.md).

## Measured, 2026-08-21

The device grant completed in a container reached over `podman exec`, with no port
reachable from the browser. From the Wrangler log of the successful run:

```text
grant_type=urn:ietf:params:oauth:grant-type:device_code
https://dash.cloudflare.com/oauth2/device
https://dash.cloudflare.com/oauth2/token
```

Three loopback attempts immediately before it reached only
`https://dash.cloudflare.com/oauth2/auth` and stranded their codes.

`pnpm run check:vpc` then resolved the binding and reached Rails over the VPC Service,
which is the acceptance this login exists to make possible.
