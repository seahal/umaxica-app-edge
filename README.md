![GitHub last commit (branch)](https://img.shields.io/github/last-commit/seahal/umaxica-apps-edge/main)

# Umaxica App (EDGE)

（ ＾ν＾） Hello, World!

A multi-domain monorepo of Next.js applications deployed to Cloudflare Workers
and Vercel, spanning three domain families: `umaxica.com` (corporate),
`umaxica.app` (service), and `umaxica.org` (staff).

## Prerequisites

- Node.js 24.19.0 — Active LTS "Krypton" (declared in `package.json#devEngines.runtime`, matched by `Containerfile` as `node:24.19.0-trixie`)
- [pnpm](https://pnpm.io/) 11.22.0 (declared in `package.json#devEngines.packageManager`, matched by `Containerfile`)
- Docker & Docker Compose (optional)

## Workspaces

| Package    | Role                | Domain             | Dev Port |
| ---------- | ------------------- | ------------------ | -------- |
| `com/apex` | Apex/static worker  | `umaxica.com`      | 5101     |
| `com/info` | Corporate info      | `info.umaxica.com` | 5103     |
| `com/core` | Corporate app       | `umaxica.com`      | 5105     |
| `com/docs` | Corporate docs      | `docs.umaxica.com` | 5106     |
| `com/news` | Corporate news      | `news.umaxica.com` | 5107     |
| `com/help` | Corporate help      | `help.umaxica.com` | 5108     |
| `net/apex` | Network apex worker | `umaxica.net`      | 5201     |
| `org/apex` | Apex/static worker  | `umaxica.org`      | 5301     |
| `org/info` | Staff info          | `info.umaxica.org` | 5303     |
| `org/core` | Staff app           | `umaxica.org`      | 5305     |
| `org/docs` | Staff docs          | `docs.umaxica.org` | 5306     |
| `org/news` | Staff news          | `news.umaxica.org` | 5307     |
| `org/help` | Staff help          | `help.umaxica.org` | 5308     |
| `app/apex` | Apex/static worker  | `umaxica.app`      | 5401     |
| `app/info` | Service info        | `info.umaxica.app` | 5403     |
| `app/core` | Service app         | `umaxica.app`      | 5405     |
| `app/docs` | Service docs        | `docs.umaxica.app` | 5406     |
| `app/news` | Service news        | `news.umaxica.app` | 5407     |
| `app/help` | Service help        | `help.umaxica.app` | 5408     |
| `dev/apex` | Apex/static worker  | `umaxica.dev`      | 5501     |
| `dev/acme` | Development app     | `umaxica.dev`      | 5502     |

`{com,org,app}/apex` are lightweight Hono workers (root redirect, `/health`,
`/about`); `{com,org,app}/core` are the Next.js applications behind them at
regional subdomains. Cloudflare's custom domain for each apex root
(`umaxica.com` / `.org` / `.app`) must point at the `*-apex` Worker, not
`*-core` — reassigning production domain routing is a Cloudflare
dashboard/DNS change outside this repo and must be coordinated before
deploying `*/apex`.

Those custom domains are currently **removed**: since 2026-08-11 the four apex
hostnames are Public Hostnames on the development Cloudflare Tunnel, and a
custom domain and a Public Hostname cannot both own one name. Each
`*/apex/wrangler.jsonc` therefore declares `"routes": []`. Returning an apex to
its Worker means removing the Public Hostname entry first, then restoring the
route — in that order. See `adr/008-edge-development-tunnel-exposure.md`.

## Quick Start

```bash
pnpm install

# Git hooks. `.npmrc` sets `ignore-scripts=true`, so the `prepare` script does
# NOT run on install and the hooks are not installed for you.
pnpm exec lefthook install

# Browsers for `pnpm run test:e2e`. Neither the image nor CI installs one;
# Containerfile provides Chromium's shared libraries but no browser binary.
pnpm exec playwright install chromium

# Run a specific workspace
pnpm --filter <workspace> run dev   # e.g. com/core, app/core

# Podman (optional)
podman compose up -d && podman compose exec core bash
```

## Scripts

The toolchain is plain pnpm scripts backed by standalone Oxfmt, Oxlint, tsc,
Vitest, Hurl and Playwright — nothing wraps `next dev` / `next build`.

Every deployment unit exposes the same script contract, and the root scripts are
thin `pnpm -r` fan-outs over them plus the repository-level files:

```bash
pnpm run format          # each unit's `format`, then oxfmt . at the root
pnpm run format:check    # each unit's `format:check`, then oxfmt --check .
pnpm run lint            # each unit's `lint`, then oxlint at the root
pnpm run lint:types      # the same, with `--type-aware` (needs a whole program)
pnpm run lint:fix        # the only script that rewrites code
pnpm run typecheck       # each unit's `typecheck` (cf-typegen, then tsc --noEmit)
pnpm run test            # each unit's Vitest run, then the root invariant suite
pnpm run test:cov        # same, with per-unit coverage thresholds
pnpm run test:api        # each unit's Hurl suite, one unit at a time
pnpm run test:e2e        # each unit's Playwright run, one unit at a time
pnpm run build           # each unit's native build (Wrangler / OpenNext / Next)
pnpm run check           # check:static + test
pnpm run check:static    # format:check + lint + lint:types + check:generated
                         #   + typecheck + knip + check:workers
```

`check` deliberately stops short of `test:api` and `test:e2e`: those start
servers, so they are a separate gate rather than part of the one a pre-push hook
can afford. See [Testing](#testing) for what each layer is responsible for.

Run any of them for a single deployment unit — this is the same command the
root fan-out uses, and it works from the unit's own directory:

```bash
pnpm --dir app/core run check     # or: pnpm --filter <pkg> run check
cd app/core && pnpm run test      # unit owns its vitest config, setup and mocks
```

Each unit carries its own `vitest.config.ts`, `vitest.setup.ts`,
`.oxlintrc.json`, `.oxfmtrc.json`, `tsconfig.json` and `knip.jsonc`, and
declares every binary its scripts invoke. Nothing in a unit resolves through a
repository-root config, so a unit can be extracted into its own repository
without rewriting its toolchain. `test/deployment-unit-boundaries.test.ts`
enforces this.

## Development Environment

### Toolchain

| Tool                                                            | Role                                 | Version |
| --------------------------------------------------------------- | ------------------------------------ | ------- |
| [pnpm](https://pnpm.io/)                                        | Package manager & task orchestration | 11.22.0 |
| [Next.js](https://nextjs.org/)                                  | Framework, dev server, build         | 16.x    |
| [Oxfmt](https://oxc.rs/)                                        | Formatter (`pnpm run format`)        | 0.63.x  |
| [Oxlint](https://oxc.rs/)                                       | Linter (`pnpm run lint`)             | 1.78.x  |
| [TypeScript](https://www.typescriptlang.org/)                   | Type checker (`pnpm run typecheck`)  | 7.0.x   |
| [Vitest](https://vitest.dev/)                                   | Unit tests (`pnpm run test`)         | 4.1.x   |
| [Hurl](https://hurl.dev/)                                       | HTTP tests (`pnpm run test:api`)     | 8.0.x   |
| [Playwright](https://playwright.dev/)                           | Browser E2E (`pnpm run test:e2e`)    | 1.62.x  |
| [Lefthook](https://github.com/evilmartians/lefthook)            | Git hooks                            | 2.1.x   |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Cloudflare Workers CLI               | 4.x     |

### Node and pnpm versions

`package.json#devEngines` is the single declaration of both:

```jsonc
"devEngines": {
  "runtime":        { "name": "node", "version": "24.19.0", "onFail": "warn" },
  "packageManager": { "name": "pnpm", "version": "11.22.0", "onFail": "download" }
}
```

Three separate things keep that declaration true, and they are worth not
confusing with one another:

- **Declaration** — `devEngines`, replacing the legacy `packageManager` field.
  pnpm 11 records the resolved package-manager version in `pnpm-lock.yaml`, which
  the legacy field does not do below pnpm 12.
- **Installation** — the Dev Container installs pnpm from the standalone script
  at a version fixed by `ARG PNPM_VERSION`; CI installs it with
  [`pnpm/setup`](https://github.com/pnpm/setup), which reads `devEngines`
  directly. Neither uses Corepack. `pnpm/setup` supplies Node as well, so CI has
  no separate `setup-node` step and no floating major version.
- **Enforcement** — pnpm's default `pmOnFail: download` runs the declared version
  if the invoking one differs, and
  `test/development-container-security.test.ts` fails if `Containerfile` and
  `package.json` ever disagree. `runtime.onFail` is `warn`, deliberately not
  `download`: `download` would have pnpm fetch a second Node.js into
  `node_modules` instead of using the image's.

Bumping a version therefore means editing `package.json` and `Containerfile`
together; the test tells you when you have edited only one.

### Podman / DevContainer

The development environment is started with Dev Containers CLI over rootless Podman.

- **Base image**: `node:24.19.0-trixie` from `Containerfile`, with pnpm 11.22.0
  pre-installed via the standalone script documented at <https://pnpm.io/installation>.
  Both are
  pinned to exact versions so a rebuild reproduces the same toolchain, and both match
  the sibling Rails repo (`seahal/umaxica-apps-jit-global`).
- **No Corepack**: the image deletes it (`npm rm --global corepack`) rather than
  merely declining to call it. Node ships Corepack only below 25.0.0 and pnpm no
  longer documents it as an installation method, so it is a dependency with an
  expiry date; removing it also stops `corepack enable` from putting a second
  `pnpm` on `PATH`. The standalone install under `$PNPM_HOME/bin` is the single
  source of pnpm in the image.
- **Package manager**: use the directly available `pnpm` command; the `pn` and `pnx`
  short commands that ship with pnpm 11 are also on `PATH`. Scripts and documented
  commands stay on `pnpm`. Bun is intentionally absent.
- **DevContainer**: configured in `.devcontainer/devcontainer.json`
  - Extensions: Claude Code, Oxc, Playwright
  - Disabled: ESLint, Prettier, GitLens, GitHub Copilot
  - Security: Trivy, Gitleaks (via pre-commit hooks)
- Runs as the non-root `edge` user (uid/gid 1000) via `userns_mode: keep-id`; the container has no `sudo` or `visudo`, and `su` cannot authenticate as root.

Start the credential-free Dev Container from the repository root:

```bash
PODMAN_COMPOSE_PROVIDER=/usr/bin/podman-compose \
devcontainer up \
  --docker-path /usr/bin/podman \
  --docker-compose-path /usr/bin/podman-compose \
  --workspace-folder .
```

There is no launcher script. `PODMAN_COMPOSE_PROVIDER` and `--docker-path` are both mandatory
and have no `devcontainer.json` equivalent; run the command as the normal rootless user, never
through `sudo`. See
[Dev Containers CLI startup on rootless Podman](docs/development/devcontainer-cli-podman-startup.md).

The direct Compose launcher remains available for optional overlays:

```bash
scripts/dev-start [--rails] [--credentials]
podman compose exec core bash -l
```

#### Getting an interactive shell

Use `podman compose exec` (or `podman exec -it`) — both allocate a pseudo-terminal:

```bash
podman compose exec core bash -l
podman exec -it umaxica-apps-edge-dc-core-1 bash -l
```

`devcontainer exec` is for **one-shot commands only**. It wires stdin to a plain pipe
and never allocates a PTY, so the shell has no line discipline: Ctrl+C is delivered as
a raw `0x03` byte instead of `SIGINT`, line editing and history are dead, and Ctrl+D
closes the pipe rather than sending EOF — the shell exits instantly and it looks like
the container died. Confirm with `tty`: an interactive shell answers `/dev/pts/N`, a
broken one answers `not a tty`. VS Code's integrated terminal allocates its own PTY and
is unaffected.

Note also that `tty: true` / `stdin_open: true` in `compose.yaml` apply to PID 1
(`sleep infinity`) only — they have no bearing on shells started later via `exec`.

### Cloudflare

Base local development needs **no Cloudflare credentials** — no API token, no
`wrangler login`, and no tunnel connector. `vpc_services` exists only in the
explicit `env.vpc` development environment; production remains fail-closed.

```bash
pnpm run dev   # every dev server, on the ports in the table above
```

This repository runs no tunnel connector. There is one connector for the whole
system and it lives in the Rails repository — a second one on the same tunnel
would make Cloudflare load-balance Rails traffic onto Edge containers.

What this repository does own is the Podman network that connector reaches:
`compose.custom.yaml` defines `umaxica-edge-tunnel` and gives the container the
alias `edge-core`, so Cloudflare Public Hostname entries can point at
`http://edge-core:<port>`. The network existing is not exposure — that
additionally needs the connector to join it and a Public Hostname pointing at
it, both operator acts. See `docs/operations/cloudflare-tunnel-development.md`
and `adr/008-edge-development-tunnel-exposure.md`.

To reach Rails from local Node development, set `EDGE_RAILS_NETWORK` to the existing
Rails rootless Podman network and use `scripts/dev-start --rails`. Access credentials
are reserved for the independent `scripts/check-tunnel` path.

The authoritative topology and security documentation begins at
[`docs/development/development-environment-overview.md`](docs/development/development-environment-overview.md).

## Testing

Three tools, split by **responsibility, not by capability**. Each can technically
do the others' job; none may.

| Layer           | Tool       | Lives in       | Answers                                      |
| --------------- | ---------- | -------------- | -------------------------------------------- |
| `pnpm test`     | Vitest     | `<unit>/test/` | did the internal logic break?                |
| `pnpm test:api` | Hurl       | `<unit>/api/`  | did the HTTP contract break?                 |
| `pnpm test:e2e` | Playwright | `<unit>/e2e/`  | did the user's path through a browser break? |

The rule that decides where something goes is **what the assertion is about**,
not what the tool can reach:

- If the assertion is on a **response** — status, headers, body, cookies,
  redirects — it belongs in a `.hurl` file and runs against a real server.
- If the assertion is on **something no HTTP client can produce** — a route that
  throws, an injected `RATE_LIMITER`, a Workers binding, a `console` line — it
  stays in Vitest. There `app.request()` is the driver and the assertion is
  elsewhere; every such case says so in a comment.
- If the assertion needs a **real engine** — rendering, the accessibility tree,
  service-worker activation, offline navigation — it belongs in Playwright.

Duplication across layers is allowed only when the layers have different failure
modes. `POST /sign/in → Set-Cookie → GET /me` is a Hurl test, the JWT parser
behind it is a Vitest test, and the login screen is a Playwright test; the same
`GET /health → 200` in all three is not.

Each unit's `api/README.md` states this contract locally and names the Vitest
file each `.hurl` file replaced.

### Running them

```bash
pnpm run test                              # every unit, then the root invariants
pnpm --dir app/core run test               # one unit
pnpm exec vitest run path/to/file.test.ts  # one file
pnpm exec vitest run -t "test name"        # one test

pnpm --dir app/core run test:api           # starts a server, runs Hurl, stops it
EDGE_API_BASE=https://preview.example run  # ...or point it at a deployment
pnpm --dir app/core run test:e2e           # Playwright, with its own webServer
```

`test:api` needs no running server: each unit's `api/run.mjs` starts one, waits
for it, and stops it — and reuses one that is already listening, so
`pnpm run dev` in another terminal keeps working. Setting `EDGE_API_BASE` targets
an existing deployment and spawns nothing.

**Vitest** runs with the `happy-dom` environment and globals enabled, from each
unit's own `vitest.config.ts` and `vitest.setup.ts`
(`@testing-library/jest-dom`, `@testing-library/react`).

Two caveats worth knowing before a first run:

- **Playwright browsers are not installed** by the image or by CI. Run
  `pnpm exec playwright install chromium` once before `test:e2e`.
- **`dev/apex` has no `test:api`**, and this is the single exception to the
  split above. Its only server is `vercel dev`, which blocks on interactive
  device authentication without a linked project, so no Hurl suite can run in CI
  or a clean checkout. Its HTTP assertions stay in Vitest; the header of
  `dev/apex/test/app.test.ts` records why and what would retire them.

CI runs `test:api` for the other twenty units. It does not run `test:e2e`, for
the browser reason above.

## TypeScript

Strict mode is enabled across the monorepo. Key compiler options:
`noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
Module resolution is `Bundler`.

> Do not modify the configurations for Oxlint, Oxfmt, TypeScript, Vitest, Hurl or
> Playwright without
> explicit user permission.

## Production Environment

| Platform                                              | Workspaces                | Domains                                     |
| ----------------------------------------------------- | ------------------------- | ------------------------------------------- |
| [Cloudflare Workers](https://workers.cloudflare.com/) | `com/*`, `app/*`, `org/*` | `umaxica.com`, `umaxica.app`, `umaxica.org` |
| [Vercel](https://vercel.com/)                         | `dev/*`                   | `umaxica.dev`                               |

### Deployment

```bash
pnpm --filter <workspace> run deploy           # direct deploy
pnpm --filter <workspace> run deploy:upload    # versioned: upload, then promote
pnpm --filter <workspace> run deploy:promote
```

Root-level shortcuts exist for the docs workspaces:

```bash
pnpm run deploy:app-docs:upload
pnpm run deploy:com-docs:upload
pnpm run deploy:org-docs:upload
```

Notes:

- Do not point Cloudflare at the removed `post` workspace. If Wrangler reports
  that CI expected a `*-post` Worker while the workspace config uses `*-docs`,
  the Cloudflare Workers Build is still connected to the removed `post` Worker —
  reconnect or recreate that build for the matching docs Worker before deploying.
- `npm --dir` is not a valid flag — but neither is reaching for npm here. pnpm
  is the only package manager this repository supports, `pnpm-lock.yaml` is the
  only lockfile it tracks, and `test/package-manager-invariants.test.ts` fails
  the build if another one appears. Use `pnpm --dir app/docs run deploy:upload`.
  If a platform genuinely cannot run pnpm, that is a platform decision to make
  deliberately, not a flag to swap.
- **Cloudflare Workers Builds must call a repo script, never `wrangler` directly.**
  The build environment exports `CLOUDFLARE_ENV=production`, and wrangler reads it
  as `--env=production`. The top level of every `wrangler.jsonc` here _is_
  production and there is deliberately no `env.production`, so a deploy command of
  `pnpm --dir org/core exec wrangler versions upload` fails with
  `No environment found in configuration with name "production"`. A raw
  `wrangler versions upload` is wrong for the OpenNext workspaces for a second
  reason: it uploads `main` (`src/worker.ts`) instead of the built
  `.open-next/worker.js`. Configure the Workers Builds commands as:

  ```text
  Build command:   pnpm --dir org/core run build
  Deploy command:  pnpm --dir org/core run upload:ci
  ```

  `upload:ci` is `CLOUDFLARE_ENV= opennextjs-cloudflare upload` — it blanks the
  injected variable and uploads the output the build step already produced. Every
  deployable workspace defines `upload:ci`; for the Hono apex workspaces it is
  `CLOUDFLARE_ENV= wrangler versions upload --config wrangler.jsonc`. Keep it in
  place when adding a workspace, and substitute the workspace path in both
  commands above.

### Environment Variables

Cloudflare workspaces use `wrangler.jsonc` (`vars` + environments).

For local Docker Compose development, the workspace URL convention is:

```text
JIT_{COM,ORG,APP}_{CORE,DOCS,NEWS,INFO,HELP}_URL
```

Compose defaults map those names to the local dev ports for each workspace.
Use the same naming pattern in other workspaces when you need a self URL or a
cross-workspace link target.

## Surface Architecture

Core workspaces stay on Next.js. They own RP/BFF behavior, authenticated UI,
React Aria surfaces, logged-in state, and account, organization, and avatar
operations.

Public information workspaces (`docs`, `news`, `info`, and `help`) also use
Next.js and OpenNext on Cloudflare Workers. They are limited to public content,
read-only content APIs, SSG/SSR, and image optimization.

Rails Core/Base remains the source of truth for policy, mutation, authority,
and content JSON APIs. Public information surfaces may consume only public,
read-only Rails content APIs through the Cloudflare Workers private connectivity
boundary. They must not receive Acme refresh tokens, user-scoped secrets, or
authenticated Core session material.

## Review Checklist for Agents

- [ ] Run `pnpm install` after pulling remote changes and before getting started.
- [ ] Run `pnpm run check` — `format:check`, `lint`, `lint:types`,
      `check:generated`, `typecheck`, `knip`, `check:workers`, then `test`.
- [ ] Run `pnpm run test:api` when you touched anything a client can observe:
      a route, a header, a redirect, a status, a rendered document.

## Notes

- Secrets must stay in Rails credentials; do not commit plaintext secrets.
- WebAuthn origins are controlled by `TRUSTED_ORIGINS`.
- Public availability of this repository is not guaranteed permanently.
