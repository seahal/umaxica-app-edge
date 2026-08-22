# Edge development container

`Containerfile` builds the Podman-first development image. It pins Node 24.19.0, pnpm
11.22.0, Claude Code, Codex, and OpenCode, and installs GitHub CLI, Chromium prerequisites,
Wrangler through project dependencies, and Tailscale tooling. No credential enters a build
argument, environment instruction, copy, or image layer.

pnpm comes from the standalone install script at <https://pnpm.io/installation> and lands in
`$PNPM_HOME/bin`, which is the only pnpm on `PATH`. The image removes Corepack
(`npm rm --global corepack`) instead of merely not calling it: Node ships Corepack only
below 25.0.0, and leaving the binary in place would let `corepack enable` shadow the
standalone install. The pinned version is `ARG PNPM_VERSION`, held equal to
`package.json#devEngines.packageManager` by `test/development-container-security.test.ts`.

The effective user is `edge`, mapped through rootless `keep-id`. HOME is `/home/edge` and
the XDG config/cache/data/state paths are writable without sudo. The image creates exact
tool paths at build time.

Start the credential-free Dev Container through Dev Containers CLI from the repository root:

```bash
PODMAN_COMPOSE_PROVIDER=/usr/bin/podman-compose \
devcontainer up \
  --docker-path /usr/bin/podman \
  --docker-compose-path /usr/bin/podman-compose \
  --workspace-folder .
```

There is no launcher script. The engine flag and the `PODMAN_COMPOSE_PROVIDER` variable have
no `devcontainer.json` equivalent and must be typed; everything else is Compose configuration
the CLI reads on its own.
[Dev Containers CLI startup on rootless Podman](devcontainer-cli-podman-startup.md) explains
why each flag is required and what the removed `podman/tools/dcup` used to enforce.

The optional direct-Compose workflows remain available separately:

```bash
scripts/dev-build
scripts/dev-start [--rails] [--credentials]
podman compose exec core bash -l
node --version
pnpm --version
```

The interactive `core` service has a TTY and open stdin; infrastructure overlays do not.
Validate `tty`, Ctrl-L, Ctrl-C, pnpm, Wrangler, and each AI CLI after building on the real
rootless Podman host.

Next.js `next dev` is Node. Hono `wrangler dev` and OpenNext preview use workerd-compatible
runtimes. The project does not call either one generically “Node development.”
