```txt
pnpm install
pnpm --dir dev/core run build
pnpm --dir dev/core run server
```

Free-tier observability is configured through Sentry:

```txt
export SENTRY_DSN="https://<public-key>@o<org>.ingest.sentry.io/<project>"
export SENTRY_ENVIRONMENT="local-dev"
pnpm --dir dev/core run server
```

If `SENTRY_DSN` is not set, telemetry remains disabled and the app falls back to console logging only.

Vercel deployment uses:

```txt
pnpm --dir dev/core run build
```

The runtime entrypoint for Vercel is `api/[[...route]].ts`, which adapts the Hono app with `hono/vercel`.
