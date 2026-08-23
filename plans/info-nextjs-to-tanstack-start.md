# Next.js + OpenNext → TanStack Start + Vite + Cloudflare Workers

Technical migration record. Not a scratch note — this is the evidence base for the
GO / CONDITIONAL GO / NO-GO decision at the end.

Started 2026-08-22, completed 2026-08-23. Branch `develop`.

**Scope grew during the work.** It began as a three-surface evaluation of `info`.
`app/info` cleared its acceptance gate, so the remaining `info` frames followed,
then the nine other satellites, and finally the three Cores. All fifteen Next.js
frames are migrated. The Hono apex Workers were never in scope and are untouched.

## 1. Goal

Remove the Next.js + `@opennextjs/cloudflare` layer and make Vite +
`@cloudflare/vite-plugin` + workerd the first-class runtime, **without changing
any externally observable contract**, and record honestly whether the result is
fit for use.

## 2. Scope

Migrated, in this order, each gated on the previous one passing:

1. `app/info` — the reference implementation, built by hand.
2. `org/info`, `com/info` — ported from it.
3. `app/{docs,news,help}` and the six `com`/`org` equivalents — the nine
   remaining satellites.
4. `app/core`, `com/core`, `org/core` — the Cores, last and deliberately so.

Fifteen units. All twenty deployment units now build with Vite.

## 3. Non-goals

The five Hono apex Workers — untouched, as required. Shared runtime packages, UI
redesign, URL changes, unrelated dependency upgrades.

The root catalog entries for `next`, `@opennextjs/cloudflare`, `server-only` and
`@tailwindcss/postcss` WERE removed, at the end and only once no workspace
declared any of them. That was the stated condition. `@tailwindcss/cli` and
`nuqs` are also unreferenced but were already so before this work, so they are
left alone.

## 4. Current architecture

Twenty deployment units: fifteen Next.js frames on OpenNext, five apex Workers already on
Hono + Vite + `@cloudflare/vite-plugin` (`adr/012-apex-vite-build-and-static-assets.md`,
implemented 2026-08-19). `app/info` is a "satellite" frame: no `worker.ts`, so its wrangler
`main` is `.open-next/worker.js` and `src/middleware.ts` is its only first-touch hook
(`adr/010-first-touch-rate-limiting.md:70-77`).

Rails is reached over a Workers VPC binding `UMAXICA_APPS_EDGE_CF_WORKERS_VPC`. The VPC
Service — not the URL — decides the destination; `PRIVATE_RAILS_ORIGIN` only populates the
`Host` header, which is how fifteen frames reach fifteen Rails namespaces through one Service
(`adr/006`, `adr/009:130-166`).

## 5. Current route contract (measured 2026-08-22 against `next dev` on :5403)

| URL                     | Status                              | Content-Type                                   | Title / body                                                                                                                                         | Cache-Control                                               | Other                                                                        |
| ----------------------- | ----------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/`                     | 200                                 | `text/html; charset=utf-8`                     | `Info — UMAXICA (APP)`                                                                                                                               | `no-cache, must-revalidate`                                 | full security set                                                            |
| `/about`                | 200                                 | text/html                                      | `このサイトについて — UMAXICA (APP)`                                                                                                                 | ″                                                           | ″                                                                            |
| `/offline`              | 200                                 | text/html                                      | `オフライン — UMAXICA (APP)`                                                                                                                         | ″                                                           | ″                                                                            |
| `/health`               | **503** (200 iff Rails liveness ok) | `application/json`                             | `{"status":"error","timestamp":…,"edge":{"status":"ok","version":{id,tag,timestamp}},"rails":{"liveness":{"kind":"not-configured","latency_ms":0}}}` | `no-store, no-cache, must-revalidate`                       | `x-robots-tag: noindex, nofollow`                                            |
| `/health.json`          | 200                                 | `application/json`                             | `{"status":"OK","service":"app","frame":"info","environment":"development","time":…}`                                                                | —                                                           | `x-robots-tag`                                                               |
| `/revision`             | 200                                 | `application/json`                             | exactly 3 keys `{id,tag,timestamp}`                                                                                                                  | `no-store`                                                  | `x-robots-tag`                                                               |
| `/robots.txt`           | 200                                 | `text/plain`                                   | 73 B, `Sitemap: https://info-jp.umaxica.app/sitemap.xml`                                                                                             | `public, max-age=0, must-revalidate`                        | —                                                                            |
| `/sitemap.xml`          | 200                                 | `application/xml`                              | 220 B                                                                                                                                                | ″                                                           | —                                                                            |
| `/manifest.webmanifest` | 200                                 | `application/manifest+json`                    | 220 B                                                                                                                                                | ″                                                           | —                                                                            |
| `/favicon.ico`          | 200                                 | `image/x-icon`                                 | 5430 B                                                                                                                                               | —                                                           | —                                                                            |
| `/service-worker.js`    | 200                                 | forced `application/javascript; charset=utf-8` | 749 B                                                                                                                                                | `no-cache,no-store,must-revalidate` (via `public/_headers`) | —                                                                            |
| unknown path            | **404**                             | text/html                                      | `ページが見つかりません — UMAXICA (APP)`, must NOT contain `再読み込み`                                                                              | —                                                           | full security set (CSP, X-Frame-Options and X-Content-Type-Options verified) |
| segment error           | 500                                 | text/html                                      | `現在、このページを表示できません — UMAXICA (APP)`                                                                                                   | —                                                           | inside the shell                                                             |
| global error            | 500                                 | text/html                                      | same title, own `<html>`                                                                                                                             | —                                                           | chrome-free                                                                  |
| rate limited            | **429**                             | `text/html; charset=UTF-8`                     | `リクエストを処理できませんでした — UMAXICA (APP)`                                                                                                   | `no-store`                                                  | no `Retry-After`                                                             |

`/rails-health` **does not exist** — 404. Deleted by `adr/009`; `/health` replaced it.

Security headers on every path (`security-headers.ts`, `source: '/:path*'`), verified on `/`
and on the 404:

```
Content-Security-Policy: default-src 'self'; base-uri 'none'; connect-src 'self';
  font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:;
  object-src 'none'; script-src 'self' 'unsafe-inline' ['unsafe-eval' in dev only];
  style-src 'self' 'unsafe-inline'; upgrade-insecure-requests
Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

Document landmarks on `/`: `<html lang="ja" class="…inter…variable">`, one `<header>`, one
`<main id="main-content" tabindex="-1" class="… flex-1 …">`, one `<footer>`, skip link first.

Title contract: `/^(?:.+ — )?UMAXICA \((APP|COM|ORG|NET|DEV)\)$/u`, and no rendered `<title>`
may contain `next|nextjs|hono|workers?|cloudflare|opennext|edge|core|apex|auth|side`.

Rails security contract: `cookie`, `authorization`, `cf-access-client-id`,
`cf-access-client-secret` stripped from every outbound request, before transport credentials
are applied; fixed origin; path validated before any fetch; 5000 ms timeout; `redirect:
'manual'`; `cache: 'no-store'`; a `500 text/plain ProxyError: …` body is reported as
`unreachable`, not `http-error`.

## 6. Next/OpenNext dependency inventory

**Next.js-specific** — App Router tree (`layout.tsx`, 3 `page.tsx`, `error.tsx`,
`global-error.tsx`, `global-not-found.tsx` + `experimental.globalNotFound`), 3 Route Handlers,
3 Metadata Routes (`robots.ts`, `sitemap.ts`, `manifest.ts`), `favicon.ico` file convention,
Metadata API in 4 files, `next/font/google` Inter, `next/link` ×2, `connection()` ×2,
`export const dynamic`, `src/middleware.ts` + its `matcher`, `next-env.d.ts`, `next.config.ts`,
`NextConfig` types in `security-headers.ts` and `image-config.ts`.

**OpenNext-specific** — `open-next.config.ts`, `initOpenNextCloudflareForDev({remoteBindings:false})`,
`getCloudflareContext()` ×4, `.open-next/worker.js` as wrangler `main`, `.open-next/assets` as
`assets.directory`, the `DOQueueHandler`/`DOShardedTagCache`/`BucketCachePurge` durable objects,
`opennextjs-cloudflare` in 6 scripts.

**Potentially obsolete after migration** — `IMAGES` binding + `image-config.ts` +
`test/image-config.test.ts` (`next/image` is used **nowhere**; the binding's only consumer is
OpenNext's own `handleImageRequest`); `WORKER_SELF_REFERENCE` (OpenNext requirement, no
application reader); `assets.directory` (ADR 012 forbids it in the input config);
`server-only` (replaced by `@tanstack/react-start/server-only`).

**Framework-neutral, carries over unchanged** — `src/lib/rails-client.ts`,
`src/lib/rails-health.ts`, `src/i18n/config.ts`, all 5 components, `style.css`,
`public/service-worker.js`, `api/*.hurl` ×4, `api/run.mjs`, `playwright.config.ts`, `e2e/*`.

**Cloudflare-specific, keep** — `REVISION` (version metadata), `RATE_LIMITER` (namespaces
1001/2001/3001/4001), `vpc_services` in all four tiers with the exact `remote` placement,
`placement.mode: smart`, the `observability` block, `global_fetch_strictly_public`,
`nodejs_compat`.

**Repo-level enforcers that assume `app/info` is one of fifteen identical OpenNext frames** —
`test/html-title-contract.test.ts` (static import + counts 15/63/15/15/12),
`test/workerd-runtime-invariants.test.ts` (reads `next.config.ts`),
`test/rails-connection-invariants.test.ts`, `test/tunnel-surface-identity.test.ts`,
`test/compose-tunnel-invariants.test.ts`, `tools/workers-manifest.json`,
`tools/check-workers.mjs` (`checkOpenNext`), `tools/verify-edge-connectivity.mjs`
(health-route path, `cloudflare-env.d.ts` interfaces, `preview:vpc`, `'Worker saved in'`,
`/_next/static/` regex), `app/info/.size-limit.json`.

## 7. Official documentation consulted (all fetched 2026-08-22)

TanStack — overview (Start is **Release Candidate**, "feature-complete and its API is
considered stable"), hosting/Cloudflare, server-routes, middleware, server-entry-point,
selective-ssr, static-prerendering, import-protection, seo, migrate-from-next-js,
server-functions (`setResponseStatus`, `setResponseHeaders` from
`@tanstack/react-start/server`), router document-head-management, not-found-errors,
error-boundaries, routing; plus the `examples/react/start-basic-cloudflare` sources on GitHub.

Cloudflare — `workers/framework-guides/web-apps/tanstack-start/`,
`workers/vite-plugin/reference/{static-assets,api,cloudflare-environments}/`,
`workers/static-assets/routing/worker-script/`, `workers-vpc/configuration/vpc-services/`,
`workers/development-testing/remote-bindings/`.

Key findings: assets are matched **before** the Worker by default, so request middleware
never runs for static assets and `run_worker_first` must stay unset; the Vite plugin writes
the output `wrangler.json` with `assets.directory` filled in, so the input config must not
declare it; `CLOUDFLARE_ENV` selects the environment at dev/build time and has no effect on
`vite preview`; `remoteBindings` defaults to `true`; VPC Service config always determines the
connection target regardless of the `fetch()` URL.

Documented gaps: neither the not-found nor the error-boundary guide states what HTTP status
SSR emits; the Next.js migration guide is silent on the Metadata API, `error.tsx`,
`not-found.tsx`, middleware and caching; there is no built-in title-template primitive.

## 8. Version matrix (live registry, 2026-08-22)

| Package                   | latest                       | published  | clears `minimumReleaseAge: 1440`? |
| ------------------------- | ---------------------------- | ---------- | --------------------------------- |
| `@tanstack/react-start`   | 1.168.48                     | 2026-08-19 | yes                               |
| `@tanstack/react-router`  | 1.170.31                     | 2026-08-19 | yes                               |
| `@vitejs/plugin-react`    | 6.1.0                        | —          | yes                               |
| `@cloudflare/vite-plugin` | 1.53.1 (catalog `^1.53.0`)   | 2026-08-20 | yes                               |
| `vite`                    | 8.2.2 (catalog `^8.2.1`)     | 2026-08-20 | yes                               |
| `wrangler`                | 4.125.0 (catalog `^4.125.0`) | 2026-08-20 | yes                               |

No supply-chain exception is required. `minimumReleaseAge`, `minimumReleaseAgeStrict`,
`minimumReleaseAgeIgnoreMissingTime` and `minimumReleaseAgeExclude` are untouched.

## 9. Baseline measurements (2026-08-22, before any edit)

Taken on a tree with 34 pre-existing uncommitted files from unrelated work (dependency bumps,
an `audit.ignore` entry, added rails-client tests). Recorded as-is.

| Gate                                       | Result                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `pnpm install`                             | Already up to date, 21 projects                                                                        |
| `pnpm run format:check`                    | **pass**                                                                                               |
| `pnpm run lint`                            | **pass**                                                                                               |
| `pnpm run typecheck`                       | **pass**                                                                                               |
| `pnpm run knip`                            | **pass**                                                                                               |
| `pnpm run check:workers`                   | **pass** — `OK (20 workers validated)`                                                                 |
| `pnpm run test`                            | **pass** — `app/info` 17 files / 107 tests; root suite 11 files / 429 tests                            |
| `pnpm --dir app/info run test:api`         | **pass** — 4 Hurl files, 23 requests, 100%                                                             |
| `pnpm --dir app/info run build`            | **pass** — `Worker saved in .open-next/worker.js`                                                      |
| `pnpm --dir app/info run check:size`       | **pass** — **184.87 kB gzipped** (budget 205 kB), 10 chunks                                            |
| `.open-next/assets`                        | 560 K                                                                                                  |
| `pnpm --dir app/info run test:e2e`         | **not tested** — no chromium binary installed                                                          |
| `pnpm run check:vpc` / `check:preview:vpc` | **not tested** — needs interactive `wrangler login`                                                    |
| live Rails connectivity                    | **not tested** — Rails is not running in this environment (`/health` reports `kind: "not-configured"`) |

### 9a. workerd private-fetch measurement (decides the development transport)

Question: does `global_fetch_strictly_public` prevent workerd from reaching the private Rails
origin, once `vite dev` replaces `next dev` and the dev server is workerd rather than Node?

Method: scratch Worker under `wrangler dev`, `compatibility_flags:
["nodejs_compat","global_fetch_strictly_public"]`, fetching a local Node HTTP server.

| Target                                                | Result                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `http://127.0.0.1:39999/`                             | **200**                                                                                          |
| `http://localhost:39999/`                             | **200**                                                                                          |
| `http://info.app.localhost:39999/`                    | **200** — the exact `PRIVATE_RAILS_ORIGIN` hostname shape                                        |
| `http://info.app.localhost:3000/health/liveness.json` | `THREW: Error: Network connection lost.` — because Rails is not running, not because of the flag |

**Conclusion: the local direct-fetch Rails transport survives inside workerd, and
`global_fetch_strictly_public` needs no exception in any environment.** The thrown error shape
is what `rails-client.ts` already translates to `unreachable`.

## 10. Cloudflare compatibility matrix

| Item                                        | Verdict                  | Note                                                                                                                                                                                                                |
| ------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static Assets                               | **architectural change** | No `assets.directory` and no `ASSETS` binding: `vite build` writes the directory into the output `wrangler.json`. `html_handling` and `not_found_handling` both `"none"`, as the apex Workers already pin them.     |
| Assets binding                              | **obsolete**             | Cloudflare matches assets before the Worker; nothing needs to serve one.                                                                                                                                            |
| Cloudflare Images                           | **obsolete**             | `next/image` was used in no frame. The binding's only consumer was OpenNext's own image handler.                                                                                                                    |
| Version metadata (`REVISION`)               | keep unchanged           | Verified live on `/revision` and `/health`.                                                                                                                                                                         |
| Rate Limiting                               | keep unchanged           | Same four namespaces; a fifth (`50xx`) added for the new `local` tier so no tier shares a budget.                                                                                                                   |
| Service bindings / `WORKER_SELF_REFERENCE`  | **obsolete**             | An OpenNext requirement with no application reader.                                                                                                                                                                 |
| Observability / traces                      | keep unchanged           |                                                                                                                                                                                                                     |
| Smart Placement                             | keep unchanged           |                                                                                                                                                                                                                     |
| `compatibility_date` / `nodejs_compat`      | keep unchanged           | TanStack Start requires `nodejs_compat`.                                                                                                                                                                            |
| `global_fetch_strictly_public`              | keep unchanged           | Measured not to block the private Rails origin in workerd (§9a).                                                                                                                                                    |
| Workers VPC                                 | keep unchanged           | Same binding, same four tiers, same `remote` placement.                                                                                                                                                             |
| Remote bindings                             | **syntax change**        | `remoteBindings: false` unless `CLOUDFLARE_ENV=vpc`, the exact analogue of OpenNext's `initOpenNextCloudflareForDev({ remoteBindings: false })`. Without it `vite preview` demands an interactive `wrangler login`. |
| `development` / `test` / `vpc` environments | keep unchanged           |                                                                                                                                                                                                                     |
| `local` environment                         | **new**                  | Credential-free; declares no `vpc_services`. See D2.                                                                                                                                                                |
| Production top-level config                 | keep unchanged           | Verified in the built artefact: production vars, namespace `1001`, top-level VPC service with no `remote`, no `env` key, no `EDGE_LOCAL_*`.                                                                         |

## 11. VPC compatibility

Unchanged in every tier. The transport selection in `src/lib/rails-client.ts` keeps
its order and its fail-closed behaviour; only `getCloudflareContext()` became
`cloudflare:workers`' `env`, behind one module.

One real defect was found and fixed during the work, and it is the most important
thing in this document. `vite dev` runs the Worker in **workerd**, whose
`process.env` is built from the Worker's own vars and **not** from the shell — so
`EDGE_LOCAL_NODE_RUNTIME=1` in the dev script silently stopped selecting the
direct Rails transport. Bridging the two flags through `vite.config.ts` fixed it,
and bridging them **only while serving** was then necessary: `compose.yaml`
exports `EDGE_LOCAL_RAILS_ENABLED` container-wide, and a first attempt baked both
flags into the production artefact's `vars`. A deployed Worker carrying them would
have taken the direct transport to a `.localhost` origin instead of the VPC
binding. Both directions are now covered by
`test/rails-connection-invariants.test.ts`.

Measured, per frame, through `pnpm run check:local` — 15/15 green:

| State                                                 | Result                                                    |
| ----------------------------------------------------- | --------------------------------------------------------- |
| `pnpm dev`, no Rails overlay                          | `not-configured` (fail closed)                            |
| `pnpm dev` + `EDGE_LOCAL_RAILS_ENABLED=1`, Rails down | `unreachable`                                             |
| Rails reachable                                       | **not tested** — Rails is not running in this environment |
| `remote: true` VPC binding                            | **not tested** — needs an interactive `wrangler login`    |

## 12. Static Assets compatibility

`public/_headers` now marks `/assets/*` `immutable` instead of `/_next/static/*`,
which is a small improvement: the Vite output is content-hashed, so the
fingerprint is what makes `immutable` safe (`adr/012`). Verified against
`vite preview`:

```
/assets/style-<hash>.css   cache-control: public, max-age=31536000, immutable
/assets/index-<hash>.js    cache-control: public, max-age=31536000, immutable
/service-worker.js           cache-control: no-cache,no-store,must-revalidate
                             content-type: application/javascript; charset=utf-8
```

## 13. Images compatibility

Removed. `next/image` appeared in no frame, `remotePatterns` was empty, and the
`IMAGES` binding's only consumer was OpenNext's `handleImageRequest`. The binding,
`image-config.ts` and `test/image-config.test.ts` are gone from all fifteen units.
Cloudflare Images can return the moment a real `<img>` needs it.

## 14. Cache model comparison

Nothing replaced Next's cache layer, because nothing used it. `cacheComponents`
was already disabled in every frame — Next's Cache Components hang under workerd
— and no frame used `use cache`, `cacheLife` or `cacheTag`. The layers now in play
are exactly the ones that were: HTTP `Cache-Control` per route, the CDN for hashed
assets, and the browser. No Worker Cache API, no TanStack Query, no router cache
tuning. `/health`, `/health.json` and `/revision` keep their `no-store`.

## 15. Middleware comparison

|                 | Next.js                           | TanStack Start                                                                               |
| --------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Satellites      | `src/middleware.ts` + a `matcher` | `src/rate-limit.ts` called by `src/server.ts`                                                |
| Cores           | `src/worker.ts` (ADR 010)         | `src/worker.ts` — **unchanged**                                                              |
| Asset exclusion | `matcher` regex                   | none needed: Cloudflare matches assets before the Worker, and `run_worker_first` stays unset |

The 429 contract is byte-identical: status, `Cache-Control: no-store`,
`text/html; charset=UTF-8`, and the UMAXICA title.

## 16. Routing comparison

URLs are unchanged everywhere. Next file conventions map as:

| Next.js                                    | TanStack Start                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `app/layout.tsx`                           | `routes/__root.tsx` (`shellComponent`)                                                                        |
| `(page)/layout.tsx`                        | `routes/_page.tsx` (pathless layout)                                                                          |
| `page.tsx`                                 | `routes/index.tsx` / `_page.index.tsx`                                                                        |
| `route.ts`                                 | `server: { handlers: { GET } }` on a route                                                                    |
| `robots.ts` / `sitemap.ts` / `manifest.ts` | server routes with `[.]`-escaped filenames                                                                    |
| `global-not-found.tsx` / `error.tsx`       | `notFoundComponent` / `errorComponent`                                                                        |
| `loading.tsx`                              | dropped — no async boundary needs one; `pendingComponent` exists if it does                                   |
| `unauthorized.tsx`                         | **dropped** — `experimental.authInterrupts`, never invoked, never routed, never asserted by any HTTP contract |
| `redirect()`                               | `throw redirect({ to })` in `beforeLoad`                                                                      |
| `typedRoutes`                              | native, and stronger                                                                                          |

## 17. Metadata / SEO comparison

`metadata.title.template` has no equivalent, so `src/lib/title.ts` composes the
suffix and every route calls it. The root route deliberately declares **no**
title: `<HeadContent />` renders the head tags of every matched route and React
hoists a component-rendered `<title>` on top of that, so a root title plus a
failure document's own title served **two** `<title>` elements. That was measured,
not predicted, and `count(//title) == 1` in every unit's `api/title-contract.hurl`
is what caught it.

robots.txt, sitemap.xml and the manifest are now explicit server routes, which
means each one states the `Content-Type` Next used to infer.

## 18. User decisions

| #   | Decision                                                    | Chosen                                                                                               | Rationale                                                                                                            |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| D1  | Repo-level invariants pinning fifteen identical Next frames | Make them framework-aware                                                                            | They encode contracts, not framework identity; the migration deliberately changes the architecture they describe     |
| D2  | `pnpm dev` runtime                                          | New credential-free `local` wrangler env with no `vpc_services`; `dev:vpc` keeps `remote: true`      | Preserves the credential-free loop and CI's `test:api`, which has no Cloudflare credentials. Confirmed viable by §9a |
| D3  | Rendering                                                   | SSR everything; prerender nothing                                                                    | One enforcement point for security headers and the rate limiter; no build-time binding reads                         |
| D4  | 404 / 500 documents                                         | Accept the idiomatic shape — they render inside the root shell and gain chrome                       | Reported as a regression in §28                                                                                      |
| D5  | `next/font/google` Inter                                    | Self-hosted `@fontsource-variable/inter`                                                             | CSP is `font-src 'self' data:`; a CDN is not an option                                                               |
| D6  | ADR                                                         | No new ADR until the final verdict; `adr/004` invites reopening "as a new record, with a new number" | —                                                                                                                    |

## 19. Migration plan

See `§17` of the approved plan. Phase 0 baseline (done, §9) → Phase A `app/info` → gate →
Phase B `org/info` → Phase C `com/info` → cleanup.

## 20. Acceptance criteria

`next`, `@opennextjs/cloudflare`, `next/server`, App Router and `.open-next` absent from the
unit · `vite build` and `vite preview` work · wrangler config valid · every URL, status,
`<title>`, security header and `X-Robots-Tag` in §5 preserved · `/health` 200/503 semantics and
the four VPC failure modes preserved · credential strip toward Rails preserved · rate limiter
and the 429 contract preserved · static assets, favicon, fonts, CSS served from Cloudflare
Assets · no stale Next agent rule · 99% coverage thresholds held · root `pnpm run check` green ·
**all four Hurl suites pass unmodified**.

## 21. Results, per unit

Every unit passes its OWN `api/*.hurl` suite **unmodified**. That is the strongest
evidence here: those files encode each unit's brand, host, title and status
contract, and none of them was edited.

| Unit                    | vitest   | coverage | static | Hurl | build | client JS (gzip) |
| ----------------------- | -------- | -------- | ------ | ---- | ----- | ---------------- |
| `app/info`              | 119      | 100%     | pass   | 4/4  | pass  | 101.84 kB        |
| `com/info` / `org/info` | 119 each | 100%     | pass   | 4/4  | pass  | 101.84 kB        |
| `{app,com,org}/docs`    | 116 each | 100%     | pass   | 4/4  | pass  | 101.93 kB        |
| `{app,com,org}/news`    | 116 each | 100%     | pass   | 4/4  | pass  | 101.85 kB        |
| `{app,com,org}/help`    | 116 each | 100%     | pass   | 4/4  | pass  | 101.86 kB        |
| `{app,com,org}/core`    | 282 each | 100%     | pass   | 4/4  | pass  | 117.3 kB         |

Repository level: `pnpm run test` 415 root invariants + every unit suite, green.
`check:workers` OK (20 workers). `check:local` 15/15. `check:architecture`,
`check:spelling`, `typecheck`, `knip`, `lint`, `lint:types`, `format:check` green.
Playwright sampled on `app/core` (3), `org/info` (2), `com/news` (2) — green.

**Bundle size is the headline number.** Client JavaScript went from **184.87 kB**
gzipped to **101.84 kB** on a satellite — a 45% reduction — and to 117.3 kB on a
Core. The per-unit budgets were rebaselined to the measured values plus 10%.

Speed, incidentally measured: `app/info`'s Hurl suite went from 1576 ms to 111 ms,
and `vite build` completes in under a second where `opennextjs-cloudflare build`
took tens of seconds.

## 22. Not tested

Stated rather than assumed. None of these was made to pass; none was skipped
silently.

- **Live Rails connectivity.** Rails is not running in this environment, so every
  `/health` observation is `not-configured` or `unreachable`. The transport
  selection is verified; a successful Rails response is not.
- **Workers VPC with `remote: true`.** Needs an interactive `wrangler login`;
  `pnpm run check:vpc`, `check:preview:vpc` and `pnpm dev:vpc` were never run.
- **A real deployment.** `wrangler deploy` was never run. The generated
  `dist/server/wrangler.json` was inspected instead, which is what would be
  uploaded.
- **Playwright on 17 of 20 units.** A sample of three was run; CI does not run
  `test:e2e` at all.

## 23. Regressions discovered during the work

Each was found by measurement, not by reading, and each is fixed:

1. **Two `<title>` elements on the 404.** A root-route title plus the not-found
   document's own. Fixed by moving the document default onto the index route.
2. **A thrown render error answered HTTP 200 with no `<title>`.** The streaming
   handler flushes the shell before the failure is known. Fixed by using
   `defaultRenderHandler`. The residue is in §28.
3. **The error document never rendered server-side for a child route.** The root's
   `errorComponent` does not cover descendants; `defaultErrorComponent` on the
   router does.
4. **The local Rails transport stopped working.** `vite dev` is workerd, whose
   `process.env` is not the shell's. §11.
5. **`EDGE_LOCAL_*` leaked into a production build.** §11 — the serious one.
6. **`/configuration/account` silently rendered `/configuration`.** TanStack flat
   routing made `_page.configuration.tsx` the parent of
   `_page.configuration.account.tsx`, and that parent renders no `<Outlet />`. The
   URL and the title were both still correct; only coverage noticed. Renamed to
   `_page.configuration.index.tsx`, and `test/pages-smoke.test.tsx` now compares
   each page's `<h1>` against its dictionary entry so it cannot recur.
7. **`notFound()` stopped throwing.** Next's threw internally; TanStack's returns
   the signal for the caller to throw. An unsupported locale would have crashed
   instead of 404ing.

## 24. Repository-level changes this required

The migration could not be confined to the units. These are the repo-level files
that had to change, and why:

- `tools/workers-manifest.json` — a fourth class, `railsBackedVite`.
- `tools/check-workers.mjs` — `checkViteWorker()` beside `checkOpenNext()`, a
  `local` tier in `VPC_POLICY`, and `vite` added to the `CLOUDFLARE_ENV` script
  scan (the plugin reads that variable exactly as wrangler does).
- `tools/verify-edge-connectivity.mjs` — health-route path, build-success string
  and asset-URL pattern made bundler-agnostic.
- `test/html-title-contract.test.ts` — counts derived instead of pinned, and a new
  guard for the TanStack frames so they are checked rather than excluded.
- `test/rails-connection-invariants.test.ts`, `test/workerd-runtime-invariants.test.ts`,
  `test/tunnel-surface-identity.test.ts`, `test/compose-tunnel-invariants.test.ts`,
  `test/core-dispatch-contract.test.ts` — paths and markers per bundler.
- `AGENTS.md` — it said "Next.js in the fifteen frames", which would now
  misdirect every agent that read it.

The Next-shaped guards (`checkOpenNext`, the `cacheComponents` assertion, the
root-layout metadata guard) are **kept, not deleted**, even though their sets are
now empty. They are the only written record of what an OpenNext frame had to
declare, and a frame returning to Next.js has to come back through them.

## 25. Remaining risks

| Risk                                                            | Severity | Probability |
| --------------------------------------------------------------- | -------- | ----------- |
| TanStack Start is Release Candidate; API churn between minors   | High     | High        |
| SSR status codes are undocumented and partly defective (§28.3)  | High     | Medium      |
| No deployment or live-Rails verification has been done          | High     | Medium      |
| `src/routeTree.gen.ts` is committed and can go stale            | Medium   | Medium      |
| Flat-routing nesting can silently swallow a child route (§23.6) | Medium   | Low         |
| `only-throw-error` disagrees with TanStack's control-flow API   | Low      | High        |

## 26. How to undo this

The whole migration is one contiguous body of work on `develop`, on top of
`1b2a337c`. Nothing was committed, so:

```sh
git status                     # 15 units + tools/ + test/ + AGENTS.md + catalog
git stash push -u -m tanstack  # keep it, reversibly
# or, to discard outright:
git checkout -- . && git clean -fd
pnpm install                   # restore next / @opennextjs/cloudflare
```

Reverting a single unit is `git checkout -- <unit>` plus removing its entry from
`railsBackedVite` in `tools/workers-manifest.json` — the repo-level guards read
that file and the presence of `next.config.ts`, so they adapt on their own.

**Caveat:** the working tree also carried 34 files of unrelated uncommitted work
before this started (dependency bumps, an `audit.ignore` entry, added
rails-client tests). A blanket `git checkout -- .` would discard those too.

## 27. What got WORSE

Asked for explicitly, and not left empty.

1. **TanStack Start is at Release Candidate**, not GA (its own overview page,
   2026-08-22). Next.js 16 was stable. The API moves fast enough that the docs
   themselves were stale in two places during this work — `shellComponent` and
   `createServerEntry` are both current and both absent from the guide pages that
   should describe them.
2. **A thrown render error still answers HTTP 200.** With
   `defaultRenderHandler` a _loader_ throw produces a correct 500 with the error
   document; a synchronous throw in a route _component_ produces 200 with no
   `<title>` and no error document, because React resolves the boundary on the
   client after hydration. Next.js server-rendered `error.tsx` with a 500 in both
   cases. Measured repeatedly and stable. **This is the single worst finding.**
3. **Streaming had to be given up to get the 500 right.** `defaultStreamHandler`
   is the framework default; this estate cannot use it. Nothing here streams
   anything today, so the cost is latent rather than real — but it will bite the
   first route that wants an async loader.
4. **404 and 500 gained shell chrome on the twelve satellites.** Next's
   `global-not-found.tsx` and `global-error.tsx` replaced the layout; TanStack's
   render inside the root document. The three Cores were unaffected — their chrome
   already sat on a nested layout, which maps to a pathless layout route exactly —
   so this is a satellite-only loss, and a deliberate one (D4).
5. **No title-template primitive.** `metadata.title.template` was one line per
   unit; `src/lib/title.ts` plus a call in every route replaces it.
6. **`next/font` is gone**, replaced by a self-hosted `@fontsource-variable/inter`
   import. That is more explicit but also more to maintain, and it adds seven
   woff2 files to the client build.
7. **`src/routeTree.gen.ts` is generated but committed.** No CLI regenerates it,
   so `typecheck`, `lint` and `test` all fail on a clone that has never built.
   Committing it contradicts this repository's instinct that generated files are
   gitignored (`cloudflare-env.d.ts` is regenerated by `cf-typegen` before every
   gate) and it can silently go stale.
8. **`only-throw-error` had to be disabled**, scoped to two files per Core.
   TanStack's `notFound()` and `redirect()` return plain objects, so there is no
   code change that satisfies the rule and keeps the behaviour.
9. **`experimental.authInterrupts` has no equivalent**, so `unauthorized.tsx` was
   deleted. Nothing invoked it, but the capability is gone rather than moved.
10. **Two silent-failure modes are new**, both caught here only by luck or by
    coverage: flat routing making a sibling into a parent (§23.6), and workerd's
    `process.env` not being the shell's (§23.4). Neither has an analogue in the
    Next.js setup.

## 28. Known regressions (running list, from the outset)

1. TanStack Start is labelled **Release Candidate**, not GA.
2. 404 and 500 documents gain shell chrome on the satellites (D4).
3. SSR status-code control is undocumented, with open upstream issues about
   `setResponseStatus` in global middleware and server routes.
4. No built-in title-template primitive.
5. `next/font` replaced by a hand-wired self-hosted font.
6. The 429 document still has no stylesheet (`docs/design/ui-shell-contract.md`
   §16 gap 9 survives the migration unchanged).

## 29. Final technical assessment

### Decision

**`CONDITIONAL GO`** — usable, and now in use, with explicit constraints.

Not an unqualified GO, for one reason: §27.2. A route component that throws
answers 200. Every other contract in this repository is preserved or improved,
and the constraint is nameable and testable rather than diffuse.

### Constraints the GO is conditional on

1. Keep `defaultRenderHandler`. Reverting to the streaming default silently
   re-breaks the 500 path.
2. Treat a route component that throws as an unhandled fault. Put failure paths in
   loaders, where the status is correct.
3. Pin TanStack minors and read the changelog. RC plus 1.168 → 1.171 drift within
   this one session is not a stable target.
4. Do not deploy on this evidence alone. §22 lists what is untested — a real
   deploy and a live Rails path are both still owed.

### Evidence

| Dimension            | Verdict vs Next.js                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Build / tooling      | **Better** — one bundler for all twenty units; seconds instead of tens of seconds                   |
| pnpm workspace       | **Equivalent** — catalog policy honoured, no age-policy bypass                                      |
| Local DX             | **Better** — `vite dev` starts in ~5 s and HMR is immediate                                         |
| Production parity    | **Better** — dev, preview and production are all workerd now; `next dev` was Node                   |
| Cloudflare Workers   | **Better** — no `.open-next` layer, no unused Durable Objects                                       |
| VPC                  | **Equivalent** — same bindings, same fail-closed behaviour, one bug found and fixed                 |
| Static Assets        | **Better** — content-hashed, so `immutable` is honest                                               |
| Images               | **Equivalent** — the capability was unused either way                                               |
| Cache                | **Equivalent** — nothing used Next's cache layer                                                    |
| SSR                  | **Worse** — §27.2 and §27.3                                                                         |
| Routing              | **Better**, with a sharp edge — typed routes natively, but flat-routing nesting can swallow a child |
| Metadata / SEO       | **Worse** — no template, and the two-title trap is easy to fall into                                |
| Testing              | **Better** — driving a real router renders the document a browser gets; 100% coverage in every unit |
| Security             | **Equivalent** — ADR 007 boundary untouched and verified; headers preserved                         |
| Maintainability      | **Worse for now** — RC API, committed generated file, two lint suppressions                         |
| Migration complexity | High but mechanical after the first unit                                                            |

### Recommendation for the remaining surfaces

None remain: all fifteen frames are migrated. The five Hono apex Workers should
**stay Hono** — `adr/011` rejected moving them, its reasoning (≈3,150 lines of
`app.request()`-driven tests, 502 B of client JS) is untouched by this work, and
they were out of scope throughout.

### Follow-ups this work did not do

- Promote this record to an ADR. `adr/004` rejected a framework move for the
  content frames and invites reopening "as a new record, with a new number".
- `docs/public-information-surfaces.md` still says these frames "use Astro" — it
  was already stale before this work and is now doubly so.
- `docs/design/ui-shell-contract.md` and
  `docs/development/static-analysis-and-hygiene.md` still describe Next/OpenNext
  archetypes and counts.
- Root `package.json` pins `vitest: ^4.1.11` instead of `catalog:`, which fails
  `pnpm run check:deps`. **Pre-existing** — it arrived in the uncommitted work
  this session started on top of, and was deliberately left alone.
