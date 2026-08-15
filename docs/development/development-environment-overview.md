# Edge development environment overview

The Edge development environment is a rootless Podman workspace. The container is an
independent security principal: it never receives the host HOME, authentication agents,
private keys, CLI credential stores, or Podman/Docker sockets.

## Dev Container startup

Start the credential-free Dev Container through Dev Containers CLI. The script can be invoked
from any current working directory:

```bash
/path/to/umaxica-apps-edge/podman/tools/dcup
```

`dcup` fixes the integration points explicitly:

```text
--docker-path /usr/bin/podman
--docker-compose-path /usr/bin/podman-compose
--workspace-folder <repository-root>
```

It exports `PODMAN_COMPOSE_PROVIDER=/usr/bin/podman-compose`, rejects root/sudo, verifies
rootless Podman and the merged base Dev Container Compose configuration, and performs the
Edge workspace-bind credential-file preflight before calling `devcontainer up`.

## Direct Compose modes

The separate direct Compose entrypoint remains available for the optional Rails and credential
overlays:

```bash
scripts/dev-start
scripts/dev-start --rails
scripts/dev-start --credentials
scripts/dev-start --rails --credentials
```

The base mode is credential-free and Rails-independent. `--rails` joins an existing
rootless Podman network named by `EDGE_RAILS_NETWORK`; it never creates or guesses one.
`--credentials` adds Podman Secrets, the Wrangler/OpenCode state volumes, and the
loopback-only Wrangler OAuth callback.

Enter the interactive service with:

```bash
podman compose exec core bash -l
```

Node.js is pinned to 24.19.0 and pnpm to 11.21.0, both declared in
`package.json#devEngines` and matched by `Containerfile`. pnpm is installed from the
standalone script, not Corepack, which the image removes outright. Use `pnpm` directly in
scripts and documented commands; the `pn`/`pnpx`/`pnx` short commands that pnpm 11 installs
alongside it are on `PATH` too. Bun is not part of the environment.

The runtime/network architecture is documented in
[cloudflare-development-network.md](cloudflare-development-network.md). Security and
credential rules are in [container-security-policy.md](container-security-policy.md) and
[credential-and-secret-management.md](credential-and-secret-management.md).
