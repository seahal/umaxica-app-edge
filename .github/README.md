![GitHub last commit (branch)](https://img.shields.io/github/last-commit/seahal/umaxica-app-edge/main)

# Development (Docker Compose)
- You can run this project with Docker Compose.
```
docker compose up
Stop the container with `docker compose down` when you are done.
```
- DevContainer is partly supported.
  - VSCode -> OK
  - IntelliJ -> NG
- Baremetal is not recommended.
  - You could run this project on your mac/linux environments, but you might suffer from malware. 

# Setup (Bun)
```
bun install
```

# Development
Run each workspace locally with Cloudflare Wrangler so dev matches production:
```
bun run --cwd com server  # http://localhost:5170
# in another terminal
bun run --cwd app server # http://localhost:5171
# in another terminal
bun run --cwd org server   # http://localhost:5172
# in another terminal
bun run --cwd dev server   # http://localhost:5173
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

# How to test / lint / format / typecheck
- test => `bun test`
- lint => `bun run lint`
- format =>`bun run format`
- typecheck => `bun run typecheck`

# Staging site is here!
  * com
    * https://jp.umaxica.com
    * https://us.umaxica.com
  * app
    * https://jp.umaxica.app
    * https://us.umaxica.app
  * org
    * https://jp.umaxica.org
    * https://us.umaxica.org
  * dev
    * https://jp.umaxica.dev
    * https://us.umaxica.dev