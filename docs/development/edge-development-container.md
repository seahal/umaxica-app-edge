# Edge development container

`Containerfile` builds the Podman-first development image. It pins Node 24.19.0, pnpm
11.20.0, Claude Code, Codex, and OpenCode, and installs GitHub CLI, Chromium prerequisites,
Wrangler through project dependencies, and Tailscale tooling. No credential enters a build
argument, environment instruction, copy, or image layer.

The effective user is `edge`, mapped through rootless `keep-id`. HOME is `/home/edge` and
the XDG config/cache/data/state paths are writable without sudo. The image creates exact
tool paths at build time.

Start the credential-free Dev Container through Dev Containers CLI from any directory:

```bash
/path/to/umaxica-apps-edge/podman/tools/dcup
```

The launcher uses only `/usr/bin/podman` with `/usr/bin/podman-compose`, resolves the repository
from its own location, and passes that absolute root as `--workspace-folder`.

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
