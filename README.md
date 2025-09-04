[![Deploy Worker](https://github.com/seahal/umaxica-app-edge/actions/workflows/deploy.yaml/badge.svg?branch=main)](https://github.com/seahal/umaxica-app-edge/actions/workflows/deploy.yaml) ![GitHub last commit (branch)](https://img.shields.io/github/last-commit/seahal/umaxica-app-edge/main)

# Setup (Bun)

```
bun install
```

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

# how to test

```
bun test
```

# how to lint / format / typecheck

```
bun run lint
bun run format
bun run typecheck
```
