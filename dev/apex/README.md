```txt
pnpm install
pnpm --dir dev/apex run build
pnpm --dir dev/apex run server
```

Vercel deployment uses:

```txt
pnpm --dir dev/apex run build
```

The runtime entrypoint for Vercel is `api/[[...route]].ts`, which adapts the Hono app with `hono/vercel`.
