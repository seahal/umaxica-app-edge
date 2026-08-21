# Wrangler authentication

Wrangler holds **dedicated container OAuth state, never an API token**. This is not a
preference: an API token cannot open a remote-binding session at all. The edge-preview
endpoint answers `10405 Method not allowed for this authentication scheme`, so
`--env vpc` — the only path that reaches Rails over the VPC binding — is unavailable
without an OAuth session. `tools/vpc-probe/empty.env` exists to keep a stray
`CLOUDFLARE_API_TOKEN` out of the way for exactly this reason.

## Use the Device Authorization Grant

```bash
pnpm exec wrangler login --device --no-browser --no-use-keyring
```

Wrangler prints a verification URL and a short user code. Open the URL in any browser,
on any machine, enter the code, and approve. The CLI polls until it is authorized and
then writes the token itself.

From outside the container, the same thing without entering it first:

```bash
podman exec -it -w /home/edge/workspace \
  umaxicaappsedgedc_core_1 \
  pnpm exec wrangler login --device --no-browser --no-use-keyring
```

`--no-browser` because the container has no browser to open. `--no-use-keyring` because
it has no OS keychain; the token lands in a plaintext file instead, described below.

## Why the loopback flow does not work here

`wrangler login` defaults to the Authorization Code Grant with PKCE, which receives the
authorization code by **redirecting the browser to `http://localhost:8976/oauth/callback`**.
That requires an inbound path from the browser into the container, and there usually
isn't one — `compose.yaml` publishes no 8976, and `podman exec` publishes nothing at all.
The browser then fails to connect and the code is stranded in the address bar.

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
| Requires inbound to the container   | yes                                  | no                           |
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

`~/.config/.wrangler/config/default.toml`, mode `0600`, inside the container. It is not
a Podman Secret and has no `.secrets/` source file, because the container obtains it
interactively rather than receiving it — see
[credential-and-secret-management.md](credential-and-secret-management.md). Without the
Wrangler state volume from the `--credentials` overlay it does not survive recreating the
container, so a base-mode container needs this login again after each `up`.

## `scripts/wrangler-login` still uses the loopback flow

It passes `--callback-host=0.0.0.0 --callback-port=8976` and requires
`/run/secrets/dev_github_token`, so it only works under `scripts/dev-start --credentials`,
which is what publishes `127.0.0.1:8976:8976` (`compose.credentials.yaml`). That path is
still valid. The device grant is preferred because it does not depend on the overlay, the
published port, or the two-minute window.

## Measured, 2026-08-21

The device grant completed in a base-mode container with no port published and no
credential overlay. From the Wrangler log of the successful run:

```text
grant_type=urn:ietf:params:oauth:grant-type:device_code
https://dash.cloudflare.com/oauth2/device
https://dash.cloudflare.com/oauth2/token
```

Three loopback attempts immediately before it reached only
`https://dash.cloudflare.com/oauth2/auth` and stranded their codes.

`pnpm run check:vpc` then resolved the binding and reached Rails over the VPC Service,
which is the acceptance this login exists to make possible.
