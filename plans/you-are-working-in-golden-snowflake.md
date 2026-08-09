# Toolchain refresh: Node/pnpm parity, `pn`, and version-authority cleanup

## Context

The Edge repo's development toolchain has drifted in three independent ways, and it
has drifted _away_ from the sibling Rails repo (`seahal/umaxica-apps-jit-global`).

1. **Node/pnpm are unpinned or inconsistent.** `Dockerfile` floats on
   `NODE_VERSION=24-trixie` and installs `corepack install --global pnpm@latest`,
   even though `package.json#packageManager` claims an exact
   `pnpm@11.20.0+sha512…`. Two authorities, one of which floats.
2. **`@types/node` has three different majors in play.** Root says `^26.1.2`,
   the catalog says `^25.7.0`, three `*/docs` workspaces hard-code `^25.9.1`,
   and the runtime is Node 24. None of these agree with each other or the runtime.
3. **`pn` works in Global but not in Edge.** Investigation showed `pn` is _not_
   repository-controlled in Global either — it is ambient host state.

Additionally, `wrangler@4.119.0` now declares
`peerDependencies: {"@cloudflare/workers-types": "^5.20260801.1"}`, so the catalog's
`^4.20260523.0` is already an unmet peer under `.npmrc`'s `engine-strict=true`.

Intended outcome: one authority per version, an exactly-pinned Node/pnpm that a
rebuild reproduces, a repo-owned `pn`, and stable toolchain upgrades that still
pass every existing quality gate.

## Investigation results (verified at execution time)

Primary sources, checked 2026-08-09:

| Question                         | Answer                                                     | Source                                        |
| -------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| Latest Node Active LTS           | **24.19.0** (Krypton, 2026-08-03)                          | `nodejs.org/dist/index.json`                  |
| Node 26 status                   | 26.7.0 = **Current**, not LTS — excluded                   | same                                          |
| Node 25 status                   | EOL, last release 25.9.0 (2026-03-31)                      | same                                          |
| Latest stable pnpm               | **11.20.0** (`latest` dist-tag; 12.0.0-rc.1 is prerelease) | `registry.npmjs.org/-/package/pnpm/dist-tags` |
| Latest `@types/node` for Node 24 | **24.13.3** (26.2.0 is the Node-26 line)                   | registry `versions`                           |

Current state:

|               | Global                                                      | Edge                                                                            |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Node          | `ARG NODE_MAJOR=26` → `node:26-trixie-slim`                 | `ARG NODE_VERSION=24-trixie`; container runs `v24.19.0`                         |
| pnpm          | `npm install -g pnpm@11.1.3`; `packageManager: pnpm@11.1.3` | `corepack install --global pnpm@latest`; `packageManager: pnpm@11.20.0+sha512…` |
| `@types/node` | catalog `26.1.0`                                            | root `^26.1.2` / catalog `^25.7.0` / docs `^25.9.1`                             |

**Edge is already on the correct Node line and the correct pnpm. Global is the
repo that is off on both.** Per your decision, this plan changes Edge only and
delivers a written spec for Global (below).

### `pn` — where it actually comes from

Global's `.devcontainer/dotfiles/bashrc` defines `ll`, `la`, `..`, `...`, `be`,
`rc`, `rt`, `rr` — **no `pn`**. There is no `bin/pn` in Global's 7924-file tree.
So Global's working `pn` is ambient host state, not a repository feature. We do
not reproduce the accident; we make it explicit in Edge.

## Approach

### 1. Pin Node and pnpm exactly (`Dockerfile`)

```dockerfile
ARG NODE_VERSION=24.19.0-trixie      # was: 24-trixie
```

Confirm the `node:24.19.0-trixie` tag exists on Docker Hub before committing; if
only `24.19.0-trixie-slim`/digest forms are published, pin by digest instead.

Replace the floating corepack line:

```dockerfile
RUN corepack enable \
  && corepack install --global pnpm@11.20.0
```

This must stay byte-identical to the version in `package.json#packageManager`.
Keep the existing `+sha512…` integrity hash on `packageManager` — it is a
supply-chain control, not drift.

### 2. Provide `pn` as a repo-owned wrapper (`Dockerfile`, development stage only)

In the `development` stage, before the `USER` switch:

```dockerfile
RUN printf '#!/bin/sh\nexec pnpm "$@"\n' > /usr/local/bin/pn \
  && chmod 0755 /usr/local/bin/pn
```

Why this and not an alias: it works in non-interactive shells, in `sh`, from
`lefthook`, and from VS Code tasks; it forwards arbitrary args verbatim; and
because it resolves `pnpm` through `PATH` it **cannot** diverge from the
corepack-managed binary. It lives only in the `development` stage, so it never
reaches a production image. Do not add it to `com/…`/`app/…` app code.

### 3. Normalise `@types/node` to the Node 24 line

- `pnpm-workspace.yaml` catalog: `'@types/node': ^24.13.3`
- Root `package.json`: change `"@types/node": "^26.1.2"` → `"catalog:"`
- `app/docs`, `com/docs`, `org/docs`: change `"^25.9.1"` → `"catalog:"`

Result: exactly one authority (the catalog), matching the Node 24.19.0 runtime.
**Risk to verify, not assume:** dropping from types 25/26 to 24 can surface real
type errors if any code uses a Node API only typed in 25+. `pn run typecheck`
is the gate; if it fails, report the specific API before widening the pin.

### 4. Eliminate the rest of the catalog/root drift

Same pattern — catalog is the single authority:

| Package                        | Drift found                                                                                    | Fix                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `wrangler`                     | root `^4.119.0` vs catalog `^4.93.0`; `*/docs` hard-code `^4.93.0`                             | catalog → `^4.119.0`; root and `*/docs` → `catalog:`                                              |
| `vitest`                       | root `^4.1.10`, catalog `^4.1.10`, plus an `overrides` entry                                   | root → `catalog:` (keep the override)                                                             |
| `@cloudflare/workers-types`    | catalog `^4.20260523.0`; `app/docs`, `com/docs`, `org/docs` hard-code `^4.20260523.0`          | catalog → `^5.2026xxxx.x` (latest stable at implementation time); the three `*/docs` → `catalog:` |
| `@opennextjs/cloudflare`       | `*/docs` hard-code `^1.19.11` vs catalog `^1.19.11`                                            | `*/docs` → `catalog:`                                                                             |
| `next` / `react` / `react-dom` | `*/core` and `*/docs` hard-code `^16.3.0` / `^19.2.6` / `^19.2.7` while a catalog entry exists | all → `catalog:`                                                                                  |
| `nuqs`                         | catalog `^2.8.9`, resolved 2.9.4                                                               | catalog → `^2.9.5`                                                                                |

`@cloudflare/workers-types` v5 is safe here: **no `tsconfig.json` in the repo lists
it in `types` and nothing imports it** — real Workers types come from the
`wrangler types`-generated `worker-configuration.d.ts` / `cloudflare-env.d.ts`,
picked up via each `tsconfig`'s `*.d.ts` include. It exists only to satisfy
wrangler's peer. (Removing it entirely is a defensible follow-up; out of scope here.)

### 5. Stable toolchain upgrades

Confirmed available and stable, Node-24 compatible:

- `oxlint` 1.74.0 → **1.77.0**
- `oxfmt` ^0.61.0 → **^0.62.0**
- `knip` ^6.31.0 → **^6.32.0**
- `wrangler` → **^4.119.0** (4.120.0 exists but is inside `minimumReleaseAge`)
- `nuqs` → **^2.9.5**
- `happy-dom` → **^20.11.2**

Left unchanged, deliberately:

- `next` 16.3.0, `hono` 4.13.x, `react` 19.2.x, `@opennextjs/cloudflare` 1.20.x —
  already current stable majors; no major jump (rule 9).
- `vite` 8.2.0 → 8.2.1 and `vitest` 4.1.10 — transitive via the catalog; no
  root-level change needed.
- `miniflare` — the `latest` dist-tag is `5.20260801.1-alpha`, a **prerelease**.
  Not selected. It arrives transitively through wrangler; do not pin it.
- `jsdom` 29 → 30 — a major, and `happy-dom` is the configured test environment.
  Deferred; report it.
- `@opentelemetry/*` 0.214 → 0.221 in `dev/acme` — runtime instrumentation, not
  toolchain. Out of scope.
- `dependency-cruiser` 18.1.1, `lefthook` 2.1.10, `vite-tsconfig-paths` 6.1.1,
  `@testing-library/*` — already latest.

### 6. Refresh the pnpm supply-chain controls (do not weaken them)

In `pnpm-workspace.yaml`, `minimumReleaseAgeExclude` is a pinned allow-list that
goes stale on every upgrade. Update, do not delete:

- Rewrite all 19 `@oxlint/binding-*@1.74.0` entries and `oxlint@1.74.0` → `1.77.0`.
- `knip@6.27.0` → `6.32.0`; `wrangler@4.111.0` → `4.119.0`.
- `miniflare@4.20260710.0` is stale — the lockfile actually resolves
  `miniflare@5.2026…-alpha` via wrangler. Update to the version wrangler 4.119
  actually pulls, read from the regenerated lock.
- `next@16.3.0` / `@next/*@16.3.0` / `hono@4.13.0` entries: keep if the version is
  unchanged; re-target if the catalog moves.
- Update the `overrides` entry `'oxlint@>=1.73.0 <2.0.0-0': 1.74.0` → `1.77.0`.

Leave `minimumReleaseAge: 4320`, `allowBuilds`, `ignoredBuiltDependencies`,
`peerDependencyRules`, and `.npmrc` (`engine-strict`, `ignore-scripts`, private
registry `https://npm.flatt.tech/`) untouched.

### 7. Documentation

`README.md` carries stale literals: line 13 `Node.js 24.x`, line 14 and 85
`pnpm 11.13.x`, line 87 `Oxfmt 0.58.x`, line 88 `Oxlint 1.73.x`, line 99
`node:24-trixie`. Update to the pinned values and document `pn`.

### 8. Devcontainer

`.devcontainer/devcontainer.json` and `compose.override.yml` need no change for
this task. After the Dockerfile edits, refresh `.devcontainer/devcontainer-lock.json`
against current stable feature releases (github-cli, neovim-prebuilt, copilot-cli,
opencode, codex, claude-code). Keep the same feature providers and the existing
Podman/`userns_mode: keep-id` behaviour — no Docker-only assumptions.

## Explicitly out of scope

No changes to `compatibility_date`, `nodejs_compat`, VPC/Tunnel/Access config,
bindings, routing, domains, Rails code, GitHub Actions, or test bodies. Bun stays.
pnpm stays the package manager.

## Spec for the Global repo (deliverable, not applied)

To be applied by you in `seahal/umaxica-apps-jit-global`:

- `Dockerfile`: `ARG NODE_MAJOR=26` → pin to the same exact Node as Edge
  (`node:24.19.0-trixie-slim` for the `node-toolchain` stage).
- `Dockerfile`: `RUN npm install -g pnpm@11.1.3` → `pnpm@11.20.0`.
- `package.json`: `"packageManager": "pnpm@11.1.3"` → `pnpm@11.20.0` (add the
  same `+sha512…` integrity hash Edge uses).
- `pnpm-workspace.yaml`: catalog `"@types/node": 26.1.0` → `24.13.3`.
- `.devcontainer/dotfiles/bashrc`: add the same `pn` mechanism, or better, add
  `/usr/local/bin/pn` in Global's `development` stage so both repos use the
  identical repo-owned wrapper rather than a shell alias.
- Then regenerate Global's lockfile with `pnpm install`.

## Verification

Run in this order. Everything except the last block runs in the current container.

```sh
pn install                      # regenerate pnpm-lock.yaml — never hand-edit it
pn install --frozen-lockfile    # prove the lock is complete and reproducible
pn run format:check
pn run lint:check
pn run typecheck
pn run test
pn run test:cov
pn run check:workers
```

Representative builds — one Hono/Workers app and one Next.js/OpenNext app:

```sh
pnpm --filter umaxica-apps-edge-apex-app run build   # wrangler deploy --dry-run
pnpm --filter umaxica-apps-edge-app-core run build   # opennextjs-cloudflare build
pnpm --filter umaxica-apps-edge-apex-app run cf-typegen   # wrangler config parses + types generate
```

Hygiene and stale-literal sweep:

```sh
git diff --check
git status --short
git grep -nE "pnpm@1[01]\.|node:2[456]|NODE_VERSION|@types/node.*2[56]\." -- . ':!pnpm-lock.yaml'
```

**Requires your action — then I verify.** I cannot rebuild the image: there is no
`/var/run/docker.sock` or podman socket inside this container. After you rebuild
from the host, I re-run in the fresh container:

```sh
node --version    # expect v24.19.0
pnpm --version    # expect 11.20.0
pn --version      # must equal pnpm --version exactly
npm --version
pn install --help
pn exec --help
```

Global parity (`Node: Global == Edge`, `pnpm: Global == Edge`) cannot be _proven_
from here — Global is not mounted and I can only read it over `gh`. It will be
reported as pending your application of the Global spec, not claimed as verified.
