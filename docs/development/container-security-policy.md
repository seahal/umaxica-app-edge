# Development-container security policy

## Boundary

The host and Edge container are separate security principals. Host credential bind mounts
are forbidden. Podman-managed runtime secret delivery and dedicated container-only state
are allowed because neither reuses the host identity.

Forbidden inputs include host HOME, the `.ssh` directory, SSH agents, `.gnupg`, GitHub/
Wrangler/Claude/Codex/OpenCode/Copilot state, private keys, Podman/Docker sockets, arbitrary
credential directories, privileged mode, added capabilities, and host networking.

There is one exception, and it is deliberately narrow. `compose.remote-access.yaml` mounts
`${HOME}/.ssh/authorized_keys` — a single file, read-only — so that an SSH server inside
`core` has something to authenticate against. A public key carries no secret; the directory,
private keys, and the agent socket stay forbidden, and agent forwarding is disabled in
`sshd_config`. The invariant test permits that exact path and no other `.ssh` occurrence in
any compose file.

The `core` service runs as `edge` through rootless `userns_mode: keep-id`, drops all
capabilities, and enables `no-new-privileges`. Only `core` has `tty` and `stdin_open`.
Normal ports and the temporary OAuth callback are published on `127.0.0.1` only.

That capability set is why the optional SSH server runs **as `edge` on port 2222** rather than
as root on 22: a container that drops `CAP_NET_BIND_SERVICE` cannot bind a privileged port,
and one with `no-new-privileges` cannot separate privileges to another account. The tailnet
still sees only port 22, because the Tailscale sidecar maps it. Granting a capability to
recover port 22 would trade an enforced invariant for cosmetics. The sidecar itself uses
userspace networking, so it needs no `/dev/net/tun`, no `NET_ADMIN`, and no host networking,
and it publishes no ports. See
[Remote SSH into `core` over Tailscale](tailscale-remote-ssh.md).

## Filesystem

The repository is a bind mount, not HOME. An empty `nocopy` volume masks `.secrets/`, and a
tracked value-free file masks the root `.env` plus all Rails-frame
`.env.development.local` files. This prevents ignored host credential inputs from leaking
through the source bind mount. Cache, dependency, pnpm-store, Wrangler, and OpenCode volumes
are purpose-specific. Image construction creates writable XDG and tool
directories with the final UID/GID; startup performs no recursive ownership repair and
never changes host file ownership.

`test/development-container-security.test.ts` rejects regressions in these invariants.
The harmless canary in `scripts/verify-build-context` proves `.secrets/` is excluded.
