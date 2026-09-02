# Grill me with docs: Astro public content surfaces

## Status

Implementation prompt / working plan. **Astro / Edge side only. Do not modify the Rails repository.**

This plan covers migrating the public content surfaces in `seahal/umaxica-apps-edge` from TanStack Start to Astro:

- `app/{docs,help,info,news}`
- `com/{docs,help,info,news}`
- `org/{docs,help,info,news}`

Keep `*/core` on TanStack Start and keep apex Workers on Hono.

`adr/004-public-information-surfaces-astro.md` is a rejected historical record and explicitly says that reopening the decision requires a new ADR. Do not flip ADR 004 back to Accepted. Add a new ADR at implementation time that supersedes the public-surface portion of ADR 013 while leaving Core on TanStack Start.

## Source of truth and reference implementation

Treat this repository as the source of truth. Inspect current code before changing anything.

Use `seahal/hub` only as an implementation reference for Astro patterns, especially:

- Astro Content Collections
- `defineCollection()` + `glob()` loaders
- Zod schema validation
- `getCollection()` / `getEntry()` / `render()`
- Markdown authoring
- i18n / locale routing
- canonical and hreflang handling
- `@astrojs/sitemap`
- strict Vitest/Hurl/Playwright layering

Do **not** create cross-repository imports or runtime dependencies on `seahal/hub`.

## Architectural decision

The public content workload is HTML-first and overwhelmingly read-only. Use Astro because its islands model fits the workload better than a React application runtime.

Responsibility split:

```text
Rails
  = durable content authority, policy, public read APIs

Astro
  = routing, presentation, HTML generation, SEO, locale/region URLs

Cloudflare Workers VPC
  = private server-side transport from Astro to Rails

Cloudflare Workers Cache
  = later optimization, not part of the first correctness slice

Islands
  = interaction only
```

Do not turn Astro into an RP/BFF. Public Astro surfaces must not handle refresh tokens, authenticated mutation, user-scoped secrets, or browser session forwarding.

## Rendering: SSR for Rails-owned documents

Do not lazy-load SEO-visible document bodies in the browser.

For Rails-owned documents, use Astro on-demand rendering (`prerender = false` or the current Astro equivalent) so the request flow is:

```text
Browser
  -> Astro SSR Worker
  -> Workers VPC binding
  -> Rails public read API
  -> runtime validation
  -> Astro components
  -> complete HTML
  -> Browser DOM
```

The initial HTML must contain the document title, headings, main content, canonical URL, hreflang metadata, and indexable metadata.

Do not make Astro understand S3 buckets, object keys, or storage topology. Rails/storage may use S3 internally, but Astro consumes only a document representation contract.

Reuse/adapt the hardening already present in the current Rails client path: VPC binding transport, timeout, credential stripping, closed logging, and fail-closed behavior. Do not add a generic Rails proxy endpoint.

The Rails endpoint path and final JSON field names are **not decided in this task**. On the Astro side, design against semantic requirements only:

- document identity / slug
- locale/region
- content representation
- `updated_at`
- stable revision marker
- lifecycle state
- redirect target when moved

Validate upstream JSON at runtime with Zod or an equivalent explicit schema before rendering.

## Markdown / Content Collections

Some documents should remain Git-owned and use Astro Markdown.

Adopt the `seahal/hub` style:

```text
src/content.config.ts
src/content/<collection>/<locale>/**/*.md
src/schemas/*.ts
```

Use Content Collections with schema validation. Authoring errors should fail the build.

Do not duplicate presentation between Markdown documents and Rails documents. Both should feed a common document shell/layout:

```text
Markdown -> Astro render() --+
                            +-> DocumentShell/Layout -> HTML
Rails JSON -> mapper -------+
```

Do not add MDX until a concrete requirement needs component execution inside content.

## i18n / region

Preserve the repository's existing locale and regional URL conventions. Do not redesign URLs just because Astro is being introduced.

Keep i18n configuration unit-local; do not create cross-unit imports or a shared runtime package.

Astro owns:

- locale/region routing
- `<html lang>`
- canonical generation
- alternate URLs
- `hreflang`

Only emit alternate links for real counterparts. Preserve any existing `x-default` policy where applicable.

## Canonical

Every indexable page needs exactly one canonical URL.

Canonical means the preferred Web URL for the representation; it is not a DOI-like durable identifier.

Generate canonical URLs in Astro from the public routing/TLD/locale model. Do not make Rails own absolute presentation URLs.

## HTTP semantics

Treat these surfaces as a CMS and make status codes exact:

```text
200  current public document
3xx  moved document / replacement URL
404  unknown or intentionally undisclosed
410  explicitly withdrawn/deleted with no replacement
5xx  temporary Edge/Rails/VPC failure
```

Do not use `200 + meta refresh` for moves. Do not collapse every retired document to 404 when 410 is semantically correct.

Public error bodies must be generic. Internal failure reasons can be distinguished only in closed structured logs. Do not leak Rails error bodies, storage paths, secrets, cookies, or internal hostnames.

## Last-Modified / ETag

Carry `updated_at` and a stable revision marker through the Astro presentation model.

- `updated_at` -> `Last-Modified`
- document revision + locale/region + renderer version -> HTML representation `ETag`

Do not copy a Rails JSON ETag directly onto rendered HTML; JSON and HTML are different representations.

Implement deterministic conditional request handling (`If-None-Match` / `If-Modified-Since` -> `304`) once the representation contract is stable.

Use the same `updated_at` for dynamic sitemap `<lastmod>`.

## Cache rollout

### Phase 1: no cache

First make every Rails-owned document request actually reach Rails:

```text
request -> Astro SSR -> Workers VPC -> Rails -> validate -> HTML
```

Establish correctness first:

- routing
- VPC transport
- validation
- HTTP lifecycle semantics
- canonical / hreflang
- Last-Modified / ETag
- security headers
- sitemap
- timeout/error behavior
- tests and observability

### Phase 2: short-TTL Workers Cache

After Phase 1 is proven, integrate Astro's caching abstraction with `@astrojs/cloudflare` / Workers Cache using the current official API.

Prefer **cache by default, explicit bypass for exceptions** rather than a large route-by-route cache table.

Express cache intent through Astro middleware, not Cloudflare-specific cache code scattered across page components.

Initial cache policy should use short TTL + natural expiry. Do not implement purge webhooks/tag invalidation initially.

Do not make deploy correctness depend on timing a Rails deployment immediately before cache expiry. Cache expiry is not globally synchronized by URL/colo/request time.

## Sitemap

Use three sitemap resources:

```text
/sitemap-index.xml
/sitemap-0.xml          # build-known Astro routes
/sitemap-dynamic.xml    # Rails-owned SSR documents
```

Use `@astrojs/sitemap` for build-known routes.

Generate `/sitemap-dynamic.xml` from an Astro server endpoint that fetches the public document listing from Rails over Workers VPC. The Rails listing endpoint and response shape remain TBD in this task.

Add the dynamic sitemap to the sitemap index using Astro's supported custom-sitemap mechanism.

Include `lastmod` from `updated_at` when available and preserve locale/region alternate metadata where valid.

## robots.txt

Add a real `/robots.txt`; the current contract that expects 404 must be updated.

Prefer an Astro endpoint so canonical host configuration is not duplicated:

```text
User-agent: *
Allow: /
Sitemap: https://<canonical-host>/sitemap-index.xml
```

Ensure preview/development hosts do not accidentally advertise themselves as the canonical production sitemap host.

## Search: intentionally deferred Rails contract

Search is a separate path from document SSR.

Future direction:

```text
Browser
  -> versioned public API (`/api/v1/...`, exact host/path TBD)
  -> Rails
  -> JSON search results
```

Do not make Astro a search API proxy.

Known requirements only:

- `info` uses a global search entry
- `docs` / `help` / `news` use local search entries
- multiple TLD/surface search entry points will exist
- the API must be versioned (`v1`)

Do not freeze the number of endpoints, hostname layout, controller/service shape, search engine, ranking, CORS, or rate-limit details in this task. Leave an explicit TODO for the later Rails/search design task.

Astro may expose only the UI/island boundary needed for future search.

## Security headers

Preserve the current security-header contract during migration. Astro must not weaken CSP or other headers merely to make the framework migration easier.

Review at least:

- CSP
- `frame-ancestors`
- Referrer-Policy
- X-Content-Type-Options
- Permissions-Policy
- existing HSTS ownership
- nonce/hash handling

The server-side Workers VPC fetch is not a browser `connect-src` concern. Browser -> Rails search API policy is deferred to the search task.

Never forward Rails `Set-Cookie` or arbitrary upstream headers to the public Astro response.

## Observability

Do not add a new observability vendor.

Preserve the repository's `no-console` rule and closed structured logging style.

For Astro -> Rails document requests, record only bounded/closed fields such as:

- surface/route class
- result class (`ok`, `redirect`, `not-found`, `gone`, `upstream-error`, `timeout`, `invalid-contract`)
- upstream status class
- upstream latency milliseconds
- total server latency milliseconds

Do not log document bodies, search queries, arbitrary URLs, cookies, tokens, user IDs, or raw upstream error bodies.

## Workers VPC and local development

Preserve the existing environment separation (`local`, VPC-enabled development tier, test, production) and the binding name `UMAXICA_APPS_EDGE_CF_WORKERS_VPC` unless a current Cloudflare/Astro constraint forces a documented change.

Everyday local development should remain credential-free. Explicit VPC development may use remote bindings. Test must not accidentally reach production Rails.

Update `tools/check-workers.mjs`, manifests, generated types, and invariant tests together with the framework migration.

## Health

Do not treat the existing Rails-touching `/health` as a blocker to Astro. Astro Workers can use the same VPC binding.

Preserve the health contract, but keep health probing separate from public document fetching. Neither should become a generic proxy.

## RSS / OG / JSON-LD

Out of scope for this implementation slice:

- RSS: do not add
- generated OG images: defer
- JSON-LD: planned later, do not implement now

Keep the metadata/layout structure easy to extend later.

## Testing

Preserve the repository's layer contract.

### Vitest — internal logic

Cover at minimum:

- upstream schema validation
- lifecycle -> HTTP mapping
- canonical builder
- locale/region alternates
- ETag determinism
- Last-Modified formatting
- sitemap model/XML generation helpers
- security header builder
- structured-log redaction/closed fields
- cache middleware when Phase 2 lands

### Hurl — HTTP contract

Cover at minimum:

- 200 document
- 3xx + `Location`
- 404
- 410
- upstream failure -> generic 5xx
- correct `Content-Type`
- canonical in rendered HTML
- Last-Modified / ETag
- 304 once conditional handling lands
- `/robots.txt` -> 200 text/plain
- `/sitemap-index.xml`
- `/sitemap-0.xml`
- `/sitemap-dynamic.xml`
- security headers

### Playwright — browser behavior only

Use only for real-engine behavior: DOM/rendering, accessibility tree, islands, keyboard/focus, responsive layout. Do not duplicate status/header tests here.

## Migration strategy

Do not convert all 12 units blindly in one giant unverified rewrite.

Recommended sequence:

1. Write new ADR.
2. Choose one representative public unit (prefer one `docs` unit) and migrate it fully to Astro.
3. Prove local build/test/Hurl/Playwright and explicit Workers VPC path.
4. Prove Rails-owned SSR document rendering with cache disabled.
5. Add Markdown Content Collection path and shared DocumentShell.
6. Add canonical/i18n/status/validators/sitemap/robots/security semantics.
7. Replicate the proven implementation to the other 11 public units while preserving unit independence.
8. Update repository-wide worker/dependency/invariant checks.
9. Only after correctness is stable, add Workers Cache Phase 2.

Do not deploy or change Cloudflare Dashboard resources without explicit authorization.

## Acceptance criteria

The work is complete only when:

- `*/core` remains TanStack Start and unchanged in framework responsibility.
- all 12 public content units build/run as Astro on Cloudflare Workers.
- Rails-owned main content is SSR-rendered into initial HTML, not lazy-loaded after page load.
- Git-owned Markdown documents use Content Collections with schema validation.
- VPC connectivity remains private and no generic proxy exists.
- canonical/hreflang and existing locale/region conventions are preserved.
- 200/3xx/404/410/5xx semantics are tested.
- Last-Modified/ETag are deterministic and tested.
- sitemap index contains build-known and dynamic sitemap sources.
- robots.txt points to the sitemap index.
- current CSP/security posture is preserved or strengthened.
- search remains a documented future browser->Rails `v1` API, not an Astro proxy.
- RSS/OG image generation/JSON-LD remain deferred.
- Phase 1 works with cache disabled.
- Phase 2 cache work, if included, uses short TTL/natural expiry and does not require purge to be correct.
- repository `pnpm run check`, relevant builds, Hurl and browser tests are green.
