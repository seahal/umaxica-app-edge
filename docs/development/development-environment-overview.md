# Edge development environment overview

The Edge development environment is a rootless Podman workspace. The container is an
independent security principal: it never receives the host HOME, authentication agents,
private keys, CLI credential stores, or Podman/Docker sockets.

## Dev Container startup

Start the credential-free Dev Container through Dev Containers CLI, from the repository root:

```bash
PODMAN_COMPOSE_PROVIDER=/usr/bin/podman-compose \
devcontainer up \
  --docker-path /usr/bin/podman \
  --docker-compose-path /usr/bin/podman-compose \
  --workspace-folder .
```

There is no launcher script; the command line is the whole integration surface, and none of it
can move into `devcontainer.json`. `--docker-path` selects the engine, and
`PODMAN_COMPOSE_PROVIDER` selects the Compose implementation: with Podman as the engine the
CLI invokes `podman compose`, which delegates to an external provider and prefers
`docker-compose` when a Docker installation is present on the host. Omitting the variable
fails against a Docker daemon socket that does not exist.

Rootless verification, the root/sudo refusal, and the workspace-bind credential-file
preflight are no longer performed at startup. They remain requirements:
[Dev Containers CLI startup on rootless Podman](devcontainer-cli-podman-startup.md) states
them, and `scripts/dev-start` still enforces its own copies on the direct Compose path.

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
loopback-only Wrangler OAuth callback. That callback is no longer the recommended way to
authenticate Wrangler — see [wrangler-authentication.md](wrangler-authentication.md) — but
the state volume it adds is still what makes a session survive recreating the container.

Enter the interactive service with:

```bash
podman compose exec core bash -l
```

Node.js is pinned to 24.19.0 and pnpm to 11.22.0, both declared in
`package.json#devEngines` and matched by `Containerfile`. pnpm is installed from the
standalone script, not Corepack, which the image removes outright. Use `pnpm` directly in
scripts and documented commands; the `pn`/`pnpx`/`pnx` short commands that pnpm 11 installs
alongside it are on `PATH` too. Bun is not part of the environment.

The runtime/network architecture is documented in
[cloudflare-development-network.md](cloudflare-development-network.md). Security and
credential rules are in [container-security-policy.md](container-security-policy.md) and
[credential-and-secret-management.md](credential-and-secret-management.md); logging
Wrangler in is [wrangler-authentication.md](wrangler-authentication.md).
