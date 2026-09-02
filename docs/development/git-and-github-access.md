# Git and GitHub access

The authoritative repository is `git@github.com:seahal/umaxica-apps-edge.git`.

The container reuses the **host's** GitHub identity, borrowed rather than copied. Nothing
is registered inside `core`, and no key file or token literal exists in this repository or
in the image:

| Operation                  | Credential         | How it arrives                                                                                                                           |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `git` clone / fetch / push | Host ssh-agent     | `${SSH_AUTH_SOCK}` bound to `/ssh-agent` — **opt-in**, via your own `compose.override.yaml`; the private key never leaves the host agent |
| Host key verification      | Host `known_hosts` | `${HOME}/.ssh/known_hosts` bound **read-only** — **opt-in**, same file                                                                   |
| `gh` API calls             | `GH_TOKEN`         | Interpolated from the host environment by `compose.yaml` — standard, always present                                                      |

The two opt-in rows are host-specific: the agent socket path differs per machine and
`known_hosts` may not exist at all, and either missing source fails the bind before any
container starts. So they live in the optional
[`compose.override.yaml`](../../README.md#the-three-compose-files) rather than in the
standard environment, and the Dev Container does not load them at all. Use `gh` over HTTPS
if you have not opted in.

`gh auth login` is not part of this flow and must not be relied on. `gh` resolves tokens
in the order `GH_TOKEN` → `GITHUB_TOKEN` → its configuration file, so `GH_TOKEN` wins even
when a stale token is left in the image's `gh` state.

## Host-side prerequisites

Set up once, on the host, before starting the container:

```bash
eval "$(ssh-agent -s)"          # if no agent is running
ssh-add                          # load the GitHub key
ssh-add -l                       # must list it
ssh -T git@github.com            # "Hi <user>! You've successfully authenticated"

test -f ~/.ssh/known_hosts       # must be a regular FILE, or Podman creates a directory
                                 #   ssh-keyscan github.com >> ~/.ssh/known_hosts

export GH_TOKEN="$(gh auth token)"   # persist this in the shell profile
```

Both variables must be exported in the shell that runs `scripts/dev-start` or
`devcontainer up`: Compose reads that process environment, not the container's.
`scripts/dev-start` refuses to start only when your own override binds `known_hosts` and
the host file is missing, and it warns when either variable is unset. Neither is required —
an agent-less, token-less host still boots, it just cannot reach GitHub over SSH.

New mounts apply only to a **new** container. Recreate rather than restart after changing
either value.

Scope the token to what the work needs — `repo` and `read:org` cover normal development.
Do not grant `admin:org`, `admin:repo_hook`, `workflow`, or any secret administration
scope. Bound the agent's reach on the host too: a dedicated agent holding only the GitHub
key, and `ssh-add -t <seconds>` for a lifetime limit.

## Verifying, inside `core`

```bash
scripts/github-readonly-check
```

It checks `gh auth status`, `ssh -T git@github.com`, that `origin` is an SSH remote, and
`git ls-remote`. It does not push or mutate GitHub. Run the pieces directly if one fails:

```bash
ssh-add -l                # proves the forwarded agent is reachable
ssh -T git@github.com     # exit status 1 is SUCCESS here — GitHub grants no shell
git fetch
gh auth status
gh repo view
```

The container may read `known_hosts` but not write it, so `ssh` cannot record a new host
key. That is deliberate: add the entry on the host instead.
