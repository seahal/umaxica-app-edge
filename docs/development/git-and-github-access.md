# Git and GitHub access

The authoritative repository is `https://github.com/seahal/umaxica-apps-edge.git`.
Container-side Git uses HTTPS only. Host SSH keys, SSH agents, host GitHub CLI state, and
host Git configuration are not mounted.

Use a dedicated fine-grained token restricted to `seahal/umaxica-apps-edge` with:

- Metadata: read (implicit)
- Contents: read/write only when container push is genuinely required
- Pull requests: read/write only when PR creation/update is required
- Issues: read only unless a demonstrated workflow needs writes

Do not grant repository/organization administration, Actions administration, workflow
modification, or secret administration.

Register `dev_github_token`, start the credential overlay, then run inside `core`:

```bash
scripts/github-readonly-check
```

This runs `gh auth status` and `git ls-remote`; it does not push or mutate GitHub.
