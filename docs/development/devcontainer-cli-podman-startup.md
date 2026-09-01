# Dev Containers CLI startup on rootless Podman

This repository has no launcher script. `podman/tools/dcup` used to be one; it was removed
because it was a wrapper around `devcontainer up` and nothing more. Everything it appeared to
configure — the rootless user mapping, the workspace bind, the port publication, the build
arguments — already lives in `compose.yaml` and `.devcontainer/devcontainer.json`, and Dev
Containers CLI reads both itself. Only two flags and one environment variable were load-bearing, and they
are written out below instead of hidden behind a script.

## Starting the container

From the repository root:

```bash
PODMAN_COMPOSE_PROVIDER=/usr/bin/podman-compose \
devcontainer up \
  --docker-path /usr/bin/podman \
  --docker-compose-path /usr/bin/podman-compose \
  --workspace-folder .
```

Then open a shell — `--docker-path` is required here too:

```bash
devcontainer exec --docker-path /usr/bin/podman --workspace-folder . -- bash -l
```

## Why each part is required

`--docker-path /usr/bin/podman` — Dev Containers CLI shells out to `docker` for every
lifecycle query. A real Docker installation may be present on the development host, so
omitting this flag does not fail loudly; it silently drives the wrong engine, and the
resulting container has none of the rootless properties this project depends on.

`PODMAN_COMPOSE_PROVIDER=/usr/bin/podman-compose` — this is the part that actually selects
the Compose implementation, and it is not optional. Once `--docker-path` points at Podman,
the CLI invokes the `podman compose` subcommand rather than the `--docker-compose-path`
executable, and `podman compose` delegates to an external provider that prefers
`docker-compose` when one is installed. Without the variable the build fails at
`unix:///run/user/<uid>/podman/podman.sock: no such file or directory`, because real Docker
Compose is trying to reach a Docker daemon. This was verified on this host, not assumed.

`--docker-compose-path /usr/bin/podman-compose` — kept because the CLI still uses it on the
paths where it invokes a standalone Compose binary instead of the subcommand. It is not a
substitute for the environment variable.

`--workspace-folder .` — the CLI has no implicit current-directory default worth relying on.
Naming the folder makes the command copy-pasteable and makes it obvious that it must be run
from the repository root.

## What the configuration already does

`devcontainer.json` declares no `initializeCommand` of its own, and nothing has to run on
the host before a build. Two hooks used to: one wrote the host `UID`/`GID` into the
repository-root `.env` because a bare `userns_mode: keep-id` passes the host id through
while the image bakes 1000 into `/home/edge`; the other deleted containers left over from an
earlier Compose project name for this workspace folder, which `devcontainer exec` — it
selects by the `devcontainer.local_folder` label, not by Compose project — would otherwise
pick, failing with `can only create exec sessions on running containers: container state
improper` while naming neither container.

Both causes were removed rather than papered over. `userns_mode: keep-id:uid=1000,gid=1000`
pins the in-container id, so the host id no longer needs to be discovered, and every compose
file sets the same `name: umaxica-apps-edge`, so no new project name can appear for this
folder.

`devcontainer.json` lists `../compose.yaml` and nothing else. The Dev Containers CLI passes
each `dockerComposeFile` entry to Compose as `-f`, so an entry a fresh clone does not contain
fails the whole `up` at configuration resolution — which is how a gitignored overlay used to
break Codespaces. The same `-f` also suppresses Compose's auto-discovery of
`compose.override.yaml`, so the optional local override applies to `scripts/dev-start` and a
bare `docker compose`, not to the editor. If a leftover from before that fix is still around, `podman rm --force` it once.

`cloudflare-tunnel` declares no `depends_on: core` for a related reason. Podman turns a
Compose dependency into a container dependency, and `--remove-existing-container` runs a bare
`podman rm -f <core>` with no `--depend`, so the connector beside it would fail the removal
and take the whole `devcontainer up` with it.

The Podman-specific properties are Compose concerns and need no flags:
`userns_mode: keep-id:uid=1000,gid=1000`,
`security_opt: [no-new-privileges:true]`, `cap_drop: [ALL]`, `init: true`, the
`CONTAINER_UID`/`CONTAINER_GID` build arguments, loopback-only port publication on
`127.0.0.1`, and the named volumes
`node-volume`, `home-cache`, `pnpm-store`, and `workspace-secrets-mask`. The
Edge's `cloudflare-tunnel` sidecar is declared in `compose.yaml` beside `core`, uses the compose default
network, and requires `EDGE_CLOUDFLARED_TOKEN` (or, as a fallback, `CLOUDFLARED_TOKEN`) from the gitignored
root `.env`.

## What is now your responsibility

The removed launcher enforced a handful of rules mechanically. They still apply; nothing
checks them at `devcontainer up` time any more.

Run as the normal rootless Podman user. Never `sudo devcontainer` or `sudo podman` — the
container's whole security model assumes a user namespace owned by your account. Confirm with
`podman info --format '{{.Host.Security.Rootless}}'`, which must print `true`.

Keep ignored credential files out of the workspace. `.dev.vars`, `.env.local`,
`.env.test.local`, and `.env.production.local` anywhere in the tree enter the container
through the workspace bind. Dedicated credential inputs belong under `.secrets/` and are
registered as Podman Secrets. `scripts/dev-start` still refuses to start when it finds one.

Do not add `--mount`, `--secrets-file`, `--remote-env`, `--config`, or `--override-config`.
Each of them reaches past the repository's security boundary and injects host state the image
is built to exclude.

Add `--remove-existing-container` when a previous start failed partway. A `Created` or
`Exited` container is treated as reusable and started with `compose up --no-recreate`, so
corrected service and health-check configuration silently fails to take effect.

## Direct Compose modes

`scripts/dev-build`, `scripts/dev-start [--rails] [--tunnel]`, and
`scripts/dev-stop` are a separate, still-supported path that drives Compose directly. They
carry their own root/rootless and credential-file preflights and are unaffected by the
launcher's removal. See
[Edge development environment overview](development-environment-overview.md) and
[Edge development container](edge-development-container.md).
