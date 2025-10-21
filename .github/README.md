![GitHub last commit (branch)](https://img.shields.io/github/last-commit/seahal/umaxica-app-edge/main)

# Setup (Bun)

```
bun install
```

# Development (Docker Compose)

```
docker compose up -d dev
docker compose exec dev bun install
docker compose exec dev bun run dev  # http://localhost:4000
```

Stop the container with `docker compose down` when you are done.

# Development (wrangler dev)

Run each workspace locally with Cloudflare Wrangler so dev matches production:

```
bun run --cwd com dev  # http://localhost:5170
# in another terminal
bun run --cwd app dev # http://localhost:5171
# in another terminal
bun run --cwd org dev   # http://localhost:5172
```

# Deploy to Cloudflare

```
bun run --cwd com deploy
bun run --cwd app deploy
bun run --cwd org deploy
```

# Environment variables

Vite looks for `.env.local` during development and `.env.production.local` when you build with `NODE_ENV=production`. Each workspace ships examples you can copy

Edit the copied files with your real hostnames and API endpoints. Only `VITE_`-prefixed values are exposed to the client; secrets must stay in Cloudflare via `wrangler secret put` or `wrangler.jsonc` `vars`.

# how to test
`bun run test`

# how to lint / format / typecheck
- lint
`bun run lint`
- format
`bun run format`
- typecheck
`bun run typecheck`

# site
- https://jp.umaxica.com
- https://jp.umaxica.app
- https://jp.umaxica.org 
- https://jp.umaxica.dev