# AI development tools

Claude, Codex, and OpenCode are installed independently inside the image. No host AI state
is mounted and no permission bypass is enabled.

## Claude Code

`scripts/claude-dev` gives Claude only `dev_claude_api_key` through the documented
`apiKeyHelper` mechanism. The key is not exported by the container entrypoint. Use a
dedicated Anthropic API key with only the API/project authority needed for development.

## Codex

`scripts/codex-login` passes `dev_codex_api_key` to `codex login --with-api-key` over stdin.
The raw key is not kept in the general shell environment. Resulting `~/.codex` state is
container-only and intentionally non-persistent; recreation requires bootstrap again.

## OpenCode Go

Current OpenCode documentation specifies `opencode auth login`/`/connect` and stores
credentials in `~/.local/share/opencode/auth.json`. The repository therefore does not
assume `OPENCODE_API_KEY`. `scripts/opencode-login` writes container-created state into the
dedicated `opencode-state` volume; never copy a host `auth.json`.

Run `scripts/check-ai-tools` for versions and non-billable authentication resolution. A
credential does not authorize a paid model request; obtain explicit approval before one.
