![GitHub last commit (branch)](https://img.shields.io/github/last-commit/seahal/umaxica-app-edge/main)


# Umaxica App (EDGE)
（ ＾ν＾） Hello, World!

## Prerequisites
- [Bun](https://bun.sh/) 1.3+ (verify with `bun -v`)
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/) 
- Vecerl
- Docker & Docker Compose (optional for containerized dev)

## Workspace Overview
| Workspace | Purpose                            | Default Dev Port |
| --------- |------------------------------------| ---------------- |
| `app` | Service app for `*.umaxica.app`    | `http://localhost:5171` |
| `com` | Corporate site for `*.umaxica.com` | `http://localhost:5170` |
| `org` | Organize site for `*.umaxica.org`  | `http://localhost:5172` |
| `dev` | Status site  for `*.umaxica.dev`   | `http://localhost:5173` |


Install dependencies once from the repo root:
```bash
bun install
```

## Local Development
### Dev Containers
- Works best with VS Code Remote Containers / Dev Containers.
- JetBrains IDEs are not fully supported in the container yet.
### Docker Compose
Spin up the development environment inside Docker:

```bash
docker compose up
```
- if you want to use '' as you want to dive in `docker compose exec bash`
- separated env if you want to use `docker compose run bash`
- Stop the stack with `docker compose down` when finished.

### Bun + Wrangler (bare metal)
Run each workspace in its own terminal so that Wrangler mirrors the production runtime:
```bash
bun run --cwd com server   # http://localhost:5170
```
```
bun run --cwd app server   # http://localhost:5171
```
```
bun run --cwd org server   # http://localhost:5172
```
```
bun run --cwd dev server   # http://localhost:5173
```

## Environment Variables

Vite reads `.env.local` while developing and `.env.production.local` when `NODE_ENV=production`. Copy the examples provided per workspace, update hostnames and API endpoints, and remember that only `VITE_`-prefixed variables are exposed to the client. Secrets should be stored with `wrangler secret put` or in `wrangler.jsonc` `vars`.

## Common Scripts

- Format code: `bun run format`
- Lint code: `bun run lint`
- Generate Cloudflare types: `bun run cf-typegen`
- Workspace-specific tasks: `bun run --cwd <workspace> <script>`

Workspace scripts for testing, preview builds, and deployments live in each `package.json`. Example:

```bash
bun run --cwd app test
bun run --cwd com preview
bun run --cwd org deploy
```

## Deployment

Deploy each Workers site to Cloudflare:

```bash
bun run --cwd com deploy
bun run --cwd app deploy
bun run --cwd org deploy
```

`dev` is typically deployed on demand for demos.

## Staging Hosts

- `com`: https://jp.umaxica.com, https://us.umaxica.com  
- `app`: https://jp.umaxica.app, https://us.umaxica.app  
- `org`: https://jp.umaxica.org, https://us.umaxica.org  
- `dev`: https://jp.umaxica.dev, https://us.umaxica.dev


# tools
- Sentry ... ?


## Known Issues & Limitations
- This is a work in progress.
- The public availability of this repository is not guaranteed permanently.
- No warranty is provided, and the authors shall not be held liable for any damages arising from the use of this repository.