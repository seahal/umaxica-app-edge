# Development-container security policy

## Boundary

The host and Edge container are separate security principals. Host credential bind mounts
are forbidden. Podman-managed runtime secret delivery and dedicated container-only state
are allowed because neither reuses the host identity.

Forbidden inputs include host HOME, `.ssh`, SSH agents, `.gnupg`, GitHub/Wrangler/Claude/
Codex/OpenCode/Copilot state, private keys, Podman/Docker sockets, arbitrary credential
directories, privileged mode, added capabilities, and host networking.

The `core` service runs as `edge` through rootless `userns_mode: keep-id`, drops all
capabilities, and enables `no-new-privileges`. Only `core` has `tty` and `stdin_open`.
Normal ports and the temporary OAuth callback are published on `127.0.0.1` only.

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
