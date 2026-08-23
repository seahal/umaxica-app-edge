# AI development tools

Claude and Codex are installed independently inside the image by devcontainer features. No
host AI state is mounted, no API key is injected, and no permission bypass is enabled.

Both authenticate through their own browser login, initiated from inside the container. The
resulting state lives in the container only and is discarded when the container is
recreated; there is no persistent volume and nothing is written back to the host.

## Claude Code

```bash
claude      # then /login
```

## Codex

```bash
codex login
```

Run `scripts/check-ai-tools` for versions and non-billable authentication resolution. A
credential does not authorize a paid model request; obtain explicit approval before one.
