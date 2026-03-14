![GitHub last commit (branch)](https://img.shields.io/github/last-commit/seahal/umaxica-app-edge/main)

# Umaxica App (EDGE)

（ ＾ν＾） Hello, World!

## Prerequisites

- Node.js 24.x (project Docker image uses `node:24-trixie`)
- [pnpm](https://pnpm.io/) 10.29+ (verify with `pnpm -v`)
- Docker & Docker Compose (optional)

## Workspace Overview

This repository is a pnpm workspace with 8 packages:

| Package    | Role                                    | Dev Port |
| ---------- | --------------------------------------- | -------- |
| `com/core` | React Router app (`*.umaxica.com`)      | `5102`   |
| `com/apex` | Apex/static worker (`com`)              | `5101`   |
| `app/core` | React Router app (`*.umaxica.app`)      | `5402`   |
| `app/apex` | Apex/static worker (`app`)              | `5401`   |
| `org/core` | React Router app (`*.umaxica.org`)      | `5302`   |
| `org/apex` | Apex/static worker (`org`)              | `5301`   |
| `dev/core` | Core app (React Router + Vercel preset) | `5502`   |
| `net/apex` | Network-facing apex worker              | `5201`   |

Install dependencies once from the repo root:

```bash
pnpm install
```

## Local Development

### Docker Compose

Start containerized development shell:

```bash
docker compose up
docker compose exec core bash
```

Stop with:

```bash
docker compose down
```

### pnpm + Wrangler (bare metal)

Run only the package(s) you need:

```bash
pnpm run --filter com/core server
pnpm run --filter app/core server
pnpm run --filter org/core server
pnpm run --filter dev/core server
pnpm run --filter com/apex server
pnpm run --filter app/apex server
pnpm run --filter org/apex server
pnpm run --filter net/apex server
```

## Environment Variables

Cloudflare-targeted workspaces manage runtime values mainly through `wrangler.jsonc` (`vars` and environments).
`dev/core` can also read runtime values from Vercel environment variables (`process.env`) and `VITE_`-prefixed variables.

## Monitoring

External monitoring is handled with Pulsetic.
It is used for synthetic uptime checks and other external health monitoring against publicly reachable endpoints.

## Common Scripts

- Format code: `pnpm run format`
- Lint code: `pnpm run lint`
- Type-check: `pnpm run type`
- Run tests: `pnpm run test`
- Workspace-specific tasks: `pnpm run --filter <workspace> <script>`

Examples:

```bash
pnpm run --filter app/core preview
pnpm run --filter com/apex deploy
pnpm run --filter net/apex cf-typegen
```

## Deployment

This project uses two hosting platforms:

- **Cloudflare Workers** — `com/*`, `app/*`, `org/*`, `net/*` packages are deployed as Workers
- **Vercel** — `dev/*` packages are deployed via the Vercel React Router preset

For Cloudflare Workers packages, use the `deploy` script.
For versioned rollout, use `deploy:upload` then `deploy:promote`.

```bash
pnpm run --filter com/core deploy
pnpm run --filter app/core deploy
pnpm run --filter org/core deploy
pnpm run --filter com/apex deploy
pnpm run --filter app/apex deploy
pnpm run --filter org/apex deploy
pnpm run --filter net/apex deploy
```

Versioned workflow example:

```bash
pnpm run --filter com/apex deploy:upload
pnpm run --filter com/apex deploy:promote
```

`dev/core` does not currently provide a `deploy` script in `package.json` (Vercel preset is configured in `react-router.config.ts`).
