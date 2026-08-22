# Git and GitHub access

The authoritative repository is `https://github.com/seahal/umaxica-apps-edge.git`.
Container-side Git uses HTTPS only. Host SSH keys, SSH agents, host GitHub CLI state, and
host Git configuration are not mounted.

Authenticate with the browser device flow inside `core`. No token is registered on the
host and none is mounted in:

```bash
gh auth login --web --git-protocol https
gh auth setup-git
```

Grant the OAuth app only the scopes the work needs — `repo` and `read:org` cover normal
development. Do not grant `admin:org`, `admin:repo_hook`, `workflow`, or any secret
administration scope. Revoke the session at GitHub `Settings → Applications` when done;
recreating the container discards the credential either way.

`gh auth setup-git` wires the HTTPS credential helper. `~/.ssh` is not mounted, so a
`git@github.com:` remote cannot authenticate — use the HTTPS remote.

Then run inside `core`:

```bash
scripts/github-readonly-check
```

This runs `gh auth status` and `git ls-remote`; it does not push or mutate GitHub.
