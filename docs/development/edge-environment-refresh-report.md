# Edge environment refresh report

## Architecture discovered

The repository contains local Next.js applications, Hono Workers, OpenNext previews, and
Rails clients. They use four deliberately independent paths:

1. local Node.js to Rails over an optional private rootless-Podman network;
2. HTTPS through Cloudflare Access and a Rails-owned development Tunnel;
3. local workerd through the real remote development Workers VPC binding and Tunnel;
4. production Workers through a production VPC binding, currently absent and therefore
   fail-closed.

The former Compose file also defined an orphan PostgreSQL service. No Edge application
consumed it; Rails and its database are owned outside this repository.

## Problems and security issues found

- A repository-owned `Dockerfile` was authoritative and `.containerignore` was absent.
- Host SSH, GitHub, Wrangler, and AI-tool state could enter the development container.
- Normal services received Cloudflare credentials and published ports on all interfaces.
- The old setup recursively changed HOME permissions and included unused Bun and `pn` setup.
- VS Code settings bypassed extension-signature and Claude permission checks.
- Rails clients silently fell back from a missing Workers binding to an Access hostname.
- Playwright exercised a tutorial website instead of Edge endpoints.
- The origin still names the obsolete singular repository (`umaxica-app-edge`).

## Changes made

- Replaced the repository build definition with `Containerfile`; added both build-context
  ignore formats and the `.secrets/` exclusion contract.
- Reduced active Compose topology to the interactive `core` service, retained keep-id,
  dropped all capabilities, enabled no-new-privileges, limited ports to loopback, and retained
  TTY/stdin only on `core`. The PostgreSQL service was removed without deleting any volume.
- Split the credential-free base, optional Rails network, and optional credential overlays.
  Host HOME and credential paths are neither mounted nor copied. Ignored workspace credential
  files are masked inside the broad source bind.
- Kept Node 24.19.0 and pnpm 11.20.0; removed unused Bun and `pn`; created only the required
  edge-owned HOME/XDG directories at image-build time.
- Added guarded rootless secret registration, container-only Wrangler/OpenCode state,
  process-scoped GitHub/Access/Claude/Codex adapters, and a loopback-only Wrangler callback.
- Removed the Rails public fallback. Workers remain binding-first and fail closed; local Node
  can use the private Rails origin only when both explicit runtime flags are present.
- Added targeted checks, a harmless build-context canary, storage benchmark, disposable
  zero-state verification, local Chromium smoke tests, and security invariant tests.

## Files added, removed, and renamed

Added: `Containerfile`, `.containerignore`, `.devcontainer/empty.env`, the two optional Compose
overlays, `scripts/*`, `test/development-container-security.test.ts`, four local Playwright
smoke tests, and the focused documents in this directory.

Removed: the repository-owned `Dockerfile`, the active PostgreSQL service definition, and four
scaffold `example.spec.ts` tests. No database data or named volume was deleted. Conceptually the
Dockerfile was migrated to `Containerfile`; Git will determine whether to display that as a
rename.

## Credential architecture and expected names

`.secrets/` is a permission-protected registration input, not encrypted storage. The normal
flow is `.secrets/*` to the rootless Podman Secret store to `/run/secrets/*` only in the
credential overlay. Expected secrets are:

- `dev_github_token`: fine-grained token restricted to this repository; Contents read/write,
  Pull requests read/write, and Metadata read are sufficient for the intended pull/push/PR
  workflow. Omit write permissions if only read checks are needed.
- `dev_cloudflare_access_client_id` and `dev_cloudflare_access_client_secret`: one Access
  service token admitted only by the development Rails Access application policy.
- `dev_claude_api_key`: dedicated Anthropic project/workspace key with only model-use authority.
- `dev_codex_api_key`: dedicated OpenAI project key limited to model inference, with project
  budget/rate limits.

Wrangler uses container-local OAuth state rather than an API-token secret. OpenCode uses its
official interactive provider login and container-only `auth.json` state. No Tailscale secret
is requested in this phase. See the credential and AI-tool documents for exact commands,
rotation, revocation, missing-secret behavior, and storage trade-offs.

## Verification results (2026-08-10)

| Check                                                         | Status     | Evidence/result                                                                                                   |
| ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| frozen pnpm install                                           | PASS       | Node 24.19.0 and pnpm 11.20.0 lockfile install completed                                                          |
| format, type-aware lint, typecheck                            | PASS       | all repository scripts completed                                                                                  |
| Vitest                                                        | PASS       | 164 files, 1,234 tests                                                                                            |
| coverage                                                      | FAIL       | tests pass; existing 100% gate remains unmet (93.90% statements, 91.57% branches, 96.41% functions, 94.07% lines) |
| Workers static configuration                                  | PASS       | 19 Workers validated; 15 routing hosts checked                                                                    |
| production VPC                                                | DEFERRED   | binding intentionally absent; production remains fail-closed                                                      |
| Hono apex dry-run build                                       | PASS       | Wrangler dry-run bundle completed without deployment                                                              |
| Compose syntax/merge                                          | PASS       | base and overlays parse; published addresses resolve to `127.0.0.1`; secret modes are `0400`                      |
| security invariants                                           | PASS       | included in the 1,234-test Vitest run                                                                             |
| explicit tmpfs                                                | PASS       | none configured                                                                                                   |
| Next production build                                         | BLOCKED    | sandbox denied the build helper's loopback listen with `EPERM`                                                    |
| rootless Podman info/ps                                       | BLOCKED    | sandbox cannot modify `/run/user/1000/libpod`                                                                     |
| Containerfile build and canary                                | BLOCKED    | dependent on usable rootless Podman runtime                                                                       |
| base startup, UID/GID/HOME, TTY, signals, live loopback ports | UNVERIFIED | dependent on the blocked Podman startup                                                                           |
| local Next and Hono/workerd HTTP checks                       | UNVERIFIED | dependent on container startup                                                                                    |
| private Rails network                                         | UNVERIFIED | network name and running Rails environment are host-specific                                                      |
| Chromium smoke and storage benchmark                          | UNVERIFIED | dependent on container startup                                                                                    |
| zero-state disposable rebuild                                 | UNVERIFIED | dependent on usable rootless Podman runtime                                                                       |
| GitHub read-only auth                                         | BLOCKED    | dedicated secret not registered                                                                                   |
| Wrangler OAuth/read-only Cloudflare                           | BLOCKED    | container not running and OAuth state not established                                                             |
| development VPC                                               | BLOCKED    | requires authenticated workerd/remote binding validation                                                          |
| Access/Tunnel                                                 | BLOCKED    | dedicated Access secrets and target URL not provided                                                              |
| AI CLI authentication                                         | BLOCKED    | dedicated credentials/state not registered; no billable call attempted                                            |
| Tailscale Phase 1                                             | BLOCKED    | tooling is in the image definition but image startup was unavailable                                              |
| Tailscale phases 2-8                                          | DEFERRED   | intentionally outside this refresh                                                                                |

Sandbox-blocked checks are not counted as passes. No Cloudflare resource was deployed or
mutated, no GitHub mutation occurred, no paid AI request was made, and no production VPC
configuration was copied from development.

## HOME, storage, and TTY outcome

The effective user remains `edge` under keep-id. HOME is `/home/edge`; its pnpm, Wrangler,
Claude, Codex, OpenCode, Git, Playwright, and XDG paths are created with targeted ownership.
There is no host-HOME mount and no recursive startup chown/chmod. No explicit tmpfs existed or
was added. Storage performance therefore retains a normal-storage baseline. Only `core` has
`tty: true` and `stdin_open: true`; runtime interaction is still unverified because Podman was
blocked.

## External handoffs and remaining risks

The checkout identity is the expected working tree, but `.git/config` is read-only in this
sandbox. The current origin remains `https://github.com/seahal/umaxica-app-edge`; normalize it
on the host without changing other Git configuration:

```bash
git remote set-url origin https://github.com/seahal/umaxica-apps-edge.git
```

Then perform the ordered host verification in
`development-environment-overview.md`. The principal remaining risks are the unexecuted real
Podman lifecycle, unknown external Rails network name, unverified Cloudflare destinations and
Host/SNI behavior, unmet pre-existing coverage threshold, and credential-dependent checks.
Cloudflare dashboard/API changes, production deployment, Tailscale enrollment, and billable AI
smoke requests remain deferred and require separate authority.
