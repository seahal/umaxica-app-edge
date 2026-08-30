# Development-container security policy

## Boundary

The host and Edge container are separate security principals. Host credential bind mounts
are forbidden. Podman-managed runtime secret delivery and dedicated container-only state
are allowed because neither reuses the host identity.

Forbidden inputs include host HOME, the `.ssh` directory, `.gnupg`, GitHub/Wrangler/
Claude/Codex/OpenCode/Copilot state, private keys, Podman/Docker sockets, arbitrary
credential directories, privileged mode, added capabilities, and host networking.

There is one exception, and it is deliberately narrow: the host's GitHub identity is
**borrowed, never copied**. `compose.custom.yaml` — the developer-local overlay, and the
only file permitted to carry any of this — forwards exactly three things:

| Input                                                      | Shape                          | Why it carries no secret                                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `${SSH_AUTH_SOCK}` → `/ssh-agent`                          | Unix socket bind               | The private key stays in the host agent. Only signature requests and their results cross the socket; the key itself is never transmitted and never lands in the container filesystem. |
| `${HOME}/.ssh/known_hosts` → `/home/edge/.ssh/known_hosts` | Single file, `read_only: true` | Public host keys. Read-only, so the container cannot rewrite the host's trust store.                                                                                                  |
| `${GH_TOKEN}`                                              | Environment variable           | Interpolated from the host environment. No token literal appears in any tracked file, and `:-` rather than `:?` keeps a token-less machine bootable.                                  |

Everything else about `.ssh` stays forbidden. `test/development-container-security.test.ts`
asserts the exact set of `.ssh` paths in the overlay — one source, one target — so a
private key (`id_rsa`, `id_ed25519`, …), a whole-directory `~/.ssh` bind, or a second
mount of any kind fails the test however it is spelled. `compose.yaml`, the file every
developer shares, must contain neither `SSH_AUTH_SOCK` nor any `.ssh` path, and
`.devcontainer/devcontainer.json` must contain neither either.

The trade-off this accepts, stated plainly: for the lifetime of the forwarded agent,
anything running in `core` can ask the host key to sign. Bound it on the host — a
dedicated agent holding only the GitHub key, and `ssh-add -t <seconds>` — rather than
inside the container, which is the side that cannot enforce it.

The `core` service runs as `edge` through rootless
`userns_mode: keep-id:uid=1000,gid=1000`, drops all
capabilities, and enables `no-new-privileges`. Only `core` has `tty` and `stdin_open`.
Normal ports and the temporary OAuth callback are published on `127.0.0.1` only.

There is no SSH server in the image, and none may be added: the forwarded agent is an
_outbound_ credential, and nothing about it justifies an inbound path. Development shells
reach `core` through `devcontainer exec` or `podman exec`. The Tailscale client is
present, pinned, and started by nothing — `tailscale up` is an interactive browser login,
in userspace-networking mode, needing no capability and no key file. The AI CLIs likewise
sign in themselves through their own browser flows.

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
