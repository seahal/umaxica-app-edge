# ADR 010: Rate limiting happens once, at first touch

## Status: Implemented

## Context

The three Core frames called the rate limiter from two places, against the same
Cloudflare binding:

- `src/worker.ts`, the Workers entry point (ADR 007), on the Rails-owned branch —
  before `dispatchToRails()`
- `src/middleware.ts`, a Next.js middleware with matcher
  `/((?!_next/static|_next/image|favicon.ico).*)`, on everything else

Both resolved to `checkRateLimit(request, env.RATE_LIMITER)` in the same
`src/lib/rate-limit.ts`, so this was one mechanism reached by two routes rather
than two competing mechanisms. `RATE_LIMITER` is Cloudflare's own Rate Limiting
binding, declared per tier in each `wrangler.jsonc` (`ratelimits`, namespace ids
1001/2001/3001/4001 for `app` and so on), keyed on `cf-connecting-ip`.

No request was ever charged twice: `worker.ts` returns on the Rails branch before
`nextWorker.fetch` is called, so the middleware never runs for a Rails-owned path.
The problem was not double counting. It was that a Next-owned request had to boot
the OpenNext middleware runtime to answer a question `worker.ts` — already the
first code the runtime invokes for every request — could answer first, and that
one concern lived in two files with two different trigger conditions.

## Decision

**`worker.ts` checks the limiter once, for both branches.** The Cores'
`src/middleware.ts` is deleted, with its test.

Order inside `worker.ts` is cheapest-first:

1. `classifyCorePath()`
2. BLOCKED → 404 immediately, **without** a limiter call. A blocked path reaches
   no application code either way, so spending a limiter call on it buys nothing
3. exempt path → skip the limiter
4. otherwise → `checkRateLimit()`; a 429 returns here
5. RAILS → `dispatchToRails()`; NEXT → the cookie-stripped `nextWorker.fetch`

The exemption list is carried over verbatim from the matcher the middleware
declared, so nothing changes about which requests are limited:

```ts
function isRateLimitExempt(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico'
  );
}
```

`/_next/static/` and `/favicon.ico` are normally served from the `ASSETS` binding
without invoking the Worker at all, so in practice the load-bearing entry is
`/_next/image`, which is a real Worker route: a page with many images would
otherwise spend its whole budget on its own thumbnails.

### What this does not change

- `src/lib/rate-limit.ts` is untouched, including its hand-written 429 HTML
  document and its per-brand `<title>`. `test/html-title-contract.test.ts`
  imports it directly for the Core 429 guard, and did so before this change too
- The `RATE_LIMITER` binding, its per-tier `namespace_id`s, and the
  `cf-connecting-ip` key
- Every ADR 007 cookie-boundary property. The limiter check sits before the
  branch, and the Cookie-stripping and `Set-Cookie`-stripping code is reached
  exactly as before
- **The twelve content frames keep their `src/middleware.ts`.** They have no
  `worker.ts` — their wrangler `main` is `.open-next/worker` — so middleware is
  the only first-touch hook they have. This is the same asymmetry that already
  exists for `worker.ts` itself, and
  `test/html-title-contract.test.ts` already encoded it: its satellite guard
  filters `/src/middleware.ts` while excluding `/core/`, and asserts the count is
  exactly twelve. That assertion passes unchanged, which is what confirms the
  Cores were never part of that contract

### Rejected: layering application logic on top of the binding

Considered and declined for now: per-route or per-identity limits, burst
allowances, or combining the binding with WAF rules. Cloudflare's own mechanism is
the first choice and is sufficient at present; adding a second layer would mean
maintaining a policy in code that the platform can express in configuration.

## Consequences

- A Next-owned request that is over its limit is now rejected before any Next.js
  or OpenNext code runs, rather than inside the middleware runtime. Strictly
  cheaper and strictly earlier
- One fewer bundled artifact per Core: OpenNext no longer emits a middleware
  function for them
- One call site to read when asking "is this request limited?", instead of two
  files with two trigger conditions
- The Cores and the content frames now differ in where the limiter is called.
  That difference tracks a real structural difference — who owns first touch — and
  is recorded here rather than being left to be rediscovered

## Guardrails

`<brand>/core/test/worker.test.ts` (×3, byte-identical modulo the brand host)
covers: a rate-limited Rails-owned request reaching neither Rails nor Next.js; a
rate-limited Next-owned request reaching Next.js not at all; exactly one limiter
call per request, against the binding from `env`; the three exempt paths reaching
Next.js with no limiter call; and a blocked path 404ing with no limiter call and
no Next.js call.

`test/core-dispatch-contract.test.ts` pins `worker.ts` byte-identical across the
three Cores, so the new exemption helper cannot drift between them.

## Outcome

**Implemented** for `app/core`, `com/core` and `org/core`.
`src/middleware.ts` and `test/middleware.test.ts` are deleted from all three; the
twelve content frames are untouched.

`pnpm run format:check`, `pnpm run lint:check`, `pnpm run typecheck`,
`pnpm run test`, `pnpm run check:workers`, `pnpm run knip` and `pnpm run build`
all pass. Per-Core coverage stays at 100% of statements, branches, functions and
lines against the 99% threshold.
