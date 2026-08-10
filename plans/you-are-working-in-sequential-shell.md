# Manual walkthrough of every local surface

## Context

The connectivity work is done and committed (three commits; ADR 006 amended,
`docs/operations/connectivity-acceptance.md` written). The automated checker now
proves all fifteen Rails-backed frames reach Rails over the Workers VPC binding.

What it does **not** do is look at the pages. `pn run check:local` asserts
`/health` returns `status: ok`, `/` returns 2xx, and `/rails-health` reports the
expected kind — nothing about whether the pages are actually right. This plan is
the human pass: walk every surface, one at a time, and judge it.

The previous plan file's content is preserved in git history (commit `9a42876`
onward) and in `adr/006` + `docs/operations/`.

## The cycle

Agreed protocol, repeated per frame:

1. I confirm the frame's server is up and print its links.
2. You open them and judge **good / bad**.
3. good → next frame. bad → we stop and investigate that one before moving on.

**Mode: `pn run dev`** — all nineteen servers at once, so any link is clickable
at any time and there is no per-frame wait. **Rails is being restarted first.**

### The one result that looks like a failure and is not

Under `pn run dev` every frame runs `next dev` with `--env development`, which
carries **no VPC binding**. So on all fifteen Rails-backed frames:

> **Rails VPC binding is not configured**

is the **correct, expected** answer, whatever Rails is doing. It is not affected
by restarting Rails. Judge it `good`.

Seeing a frame connected to Rails means switching that one frame to
`preview:vpc` on the same port — say the word for any frame and I will, then put
it back:

```bash
CLOUDFLARE_API_TOKEN= pnpm --filter <pkg> run preview:vpc -- --ip 0.0.0.0 --port <devport>
```

### The other one

The twelve content frames (`info` / `docs` / `news` / `help`) have **no
`/health` route** — only the three cores do. A 404 there is correct, and there
is no link for it below.

## The list, in walking order

Nineteen surfaces. Ports are read from each workspace's own `dev` script.

### app — umaxica.app

| #   | Surface    | Port | Links                                                                                                                                                                                        |
| --- | ---------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/apex` | 5401 | `/health` · `/health.json` · `/health.html` · `/` (expect a redirect)                                                                                                                        |
| 2   | `app/core` | 5405 | `/` · `/home` · `/about` · `/explore` · `/messages` · `/notifications` · `/doctor` · `/configuration` · `/configuration/account` · `/configuration/preference` · `/health` · `/rails-health` |
| 3   | `app/info` | 5403 | `/` · `/rails-health`                                                                                                                                                                        |
| 4   | `app/docs` | 5406 | `/` · `/rails-health`                                                                                                                                                                        |
| 5   | `app/news` | 5407 | `/` · `/rails-health`                                                                                                                                                                        |
| 6   | `app/help` | 5408 | `/` · `/rails-health`                                                                                                                                                                        |

### com — umaxica.com

| #   | Surface    | Port | Links                                             |
| --- | ---------- | ---- | ------------------------------------------------- |
| 7   | `com/apex` | 5101 | `/health` · `/health.json` · `/health.html` · `/` |
| 8   | `com/core` | 5105 | same twelve as `app/core`                         |
| 9   | `com/info` | 5103 | `/` · `/rails-health`                             |
| 10  | `com/docs` | 5106 | `/` · `/rails-health`                             |
| 11  | `com/news` | 5107 | `/` · `/rails-health`                             |
| 12  | `com/help` | 5108 | `/` · `/rails-health`                             |

### org — umaxica.org

| #   | Surface    | Port | Links                                             |
| --- | ---------- | ---- | ------------------------------------------------- |
| 13  | `org/apex` | 5301 | `/health` · `/health.json` · `/health.html` · `/` |
| 14  | `org/core` | 5305 | same twelve as `app/core`                         |
| 15  | `org/info` | 5303 | `/` · `/rails-health`                             |
| 16  | `org/docs` | 5306 | `/` · `/rails-health`                             |
| 17  | `org/news` | 5307 | `/` · `/rails-health`                             |
| 18  | `org/help` | 5308 | `/` · `/rails-health`                             |

### net

| #   | Surface    | Port | Links                                                        |
| --- | ---------- | ---- | ------------------------------------------------------------ |
| 19  | `net/apex` | 5201 | `/health` · `/health.json` · `/health.html` · `/` → `/about` |

## What each route type should show

| Route                   | Expected                                              |
| ----------------------- | ----------------------------------------------------- |
| core `/health`          | JSON, `{"status":"ok","timestamp":…,"version":{…}}`   |
| core `/rails-health`    | HTML page, **"Rails VPC binding is not configured"**  |
| content `/rails-health` | JSON, `{"rails":{"kind":"not-configured"}}`, HTTP 503 |
| apex `/health.json`     | JSON from the Hono worker; apex never contacts Rails  |
| any `/`                 | renders, no console errors, no 500                    |

The apex `/` redirect target is the one thing below that was **not** verified by
reading the source — the route grep found only the `/health*` handlers, so
whatever `/` does is worth an actual look rather than an assumption.

## Running it

```bash
pn run dev          # all nineteen, from the repo root
```

Readiness is not instant: the first request to a Next.js route compiles it, so
the first click on each page is slow and the second is not. That is `next dev`,
not a fault.

Cleanup at the end: stop the `pn run dev` process; `pgrep -f 'next dev|wrangler'`
should come back empty.

## Recording the result

I keep a running tally as we go and, at the end, write the verdict per surface
here — including every `bad` with what was wrong, so the list doubles as the
record of what this pass actually covered.
