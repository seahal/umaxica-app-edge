# Credential and secret management

```text
browser login, initiated from inside the container
        ↓
short-lived credential issued by the identity provider
        ↓
container-local process state only
        ↓
discarded when the container is recreated
```

**No credential enters this repository or this container from the host.** There is no
`.secrets/` registration flow, no Podman Secret Store delivery, no `/run/secrets` mount,
and no host bind of `~/.ssh`, `~/.config/gh`, `~/.gitconfig`, `~/.claude`, or `~/.codex`.
Long-lived API tokens were retired entirely: the failure mode they carried — a credential
that stays valid long after the container that read it is gone — is the thing this design
removes.

Nothing is persisted. Recreating the container means logging in again, and that is the
point: an abandoned container leaks nothing.

## Obtaining credentials

Run these inside `core`, after `scripts/dev-start`:

| Need                | Command                                                           | Flow                    |
| ------------------- | ----------------------------------------------------------------- | ----------------------- |
| GitHub + HTTPS Git  | `gh auth login --web --git-protocol https && gh auth setup-git`   | OAuth device flow       |
| Cloudflare Wrangler | `scripts/wrangler-login`                                          | OAuth, callback on 8976 |
| Cloudflare Access   | `cloudflared access login <url>` (`scripts/check-tunnel` prompts) | Access browser login    |
| Claude Code         | `claude`, then `/login`                                           | OAuth                   |
| Codex               | `codex login`                                                     | OAuth                   |

`scripts/wrangler-login` passes `--callback-host=0.0.0.0 --callback-port=8976`; the port is
published on host loopback only by `compose.yaml`, which is what lets the host browser
complete the redirect.

When the browser cannot reach that port — `podman exec` publishes nothing, and a remote
session has no host loopback to share — authenticate Wrangler with the Device
Authorization Grant instead. See
[Wrangler authentication](wrangler-authentication.md).

Git remotes must be HTTPS. `~/.ssh` is not mounted and no SSH key exists in the container,
so `git@github.com:` remotes cannot authenticate — `gh auth setup-git` wires the HTTPS
credential helper instead.

## Workspace credential inputs stay out

`scripts/dev-start` refuses to start when an unmasked `.dev.vars`, `.env.local`,
`.env.test.local`, or `.env.production.local` exists in the workspace. The known legacy
root `.env` and per-frame `.env.development.local` paths are masked by value-free mounts,
and `.secrets/` is masked by an empty read-only volume, so none of them can enter the
container even if a file is left behind on the host.

`scripts/verify-build-context` proves the same for image builds with a canary file, and
`test/development-container-security.test.ts` fails the suite if a host identity mount, a
container-runtime socket, a `secrets:` block, or a `/run/secrets` reference is reintroduced.

## Rotation, revocation, and incidents

Rotation is not a procedure here — credentials expire on their own and are reissued by the
next browser login. For a suspected exposure, revoke the session at the issuer (GitHub
`Settings → Applications`, the Cloudflare dashboard, the Anthropic or OpenAI console) and
remove the container:

```bash
scripts/dev-stop
podman container rm -f umaxica-apps-edge-dc-core-1
```

There is no host-side file to overwrite and no Podman Secret to delete.
