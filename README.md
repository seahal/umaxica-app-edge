[![Deploy Worker](https://github.com/seahal/umaxica-app-edge/actions/workflows/deploy.yaml/badge.svg?branch=main)](https://github.com/seahal/umaxica-app-edge/actions/workflows/deploy.yaml) ![GitHub last commit (branch)](https://img.shields.io/github/last-commit/seahal/umaxica-app-edge/main)

# Setup (Bun)

```
bun install
```

# Development (wrangler dev)

Run each workspace locally with Cloudflare Wrangler so dev matches production:

```
cd com && bun run dev   # http://localhost:5170
# in another terminal
cd app && bun run dev   # http://localhost:5171
# in another terminal
cd org && bun run dev   # http://localhost:5172
```

# Deploy to Cloudflare

```
cd com && bun run deploy
cd app && bun run deploy
cd org && bun run deploy
```

# how to test

```
bun test
```

# how to lint / format / typecheck

```
npm run lint
npm run format
npm run typecheck
```
