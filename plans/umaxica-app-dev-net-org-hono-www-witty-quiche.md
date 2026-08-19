# Plan 011: Record that the apex workers stay Hono

## Context

The question was raised whether the four apex workers — `app/apex`, `com/apex`,
`net/apex`, `org/apex`, the units serving `umaxica.{app,com,net,org}` without a
`www` — should migrate from Hono to Astro. Two reasons were given: Hono alone
makes design work painful, and the current implementation is small enough that
Astro could clearly carry it. A third consideration was that `umaxica.dev` is
moving off Vercel onto Cloudflare, which seemed like a natural moment to change
framework at the same time.

The investigation does not support the migration, and the decision is **not to
migrate**. What is missing is not the decision but the record of it: the
question has now been asked twice against this repository, and the previous
answer — `adr/004-public-information-surfaces-astro.md`, Rejected 2026-08-12 —
covers the twelve content frames, not the apex workers. Its own closing note
says that if the question is reopened it should be reopened "as a new record,
with a new number." This plan writes that record.

The intended outcome is that the next person who asks this question finds the
measurements rather than repeating them, and finds a stated trigger for when
reopening it would be legitimate.

Two things are deliberately **out of scope** and must not be quietly folded in:

- **The `umaxica.dev` Vercel → Cloudflare migration.** It is real and wanted, but
  it is independent of the framework question — `dev/apex` is already Hono — and
  it is being planned separately.
- **The Tailwind v4 work.** It is already in flight in the working tree
  (`4006466a [UPDATE] began to use tailwind css.` plus the uncommitted
  `.size-limit.json` and `style.css` additions). This plan neither advances nor
  blocks it.

This is a documentation-only change. No source file is touched.

## Change

Create one new file: `adr/011-apex-workers-stay-hono.md`.

Follow the house style of the existing records — `adr/004-…` and `adr/007-…`
are the closest models. Specifically:

- `# ADR 011: The apex workers stay Hono`
- `## Status: Rejected <date>` — this record rejects a proposal rather than
  accepting a boundary, exactly as ADR 004 does.
- Prose that states the measurements, not just the conclusion. ADR 004 was
  closed partly because its predecessor's benefits were "never measured"; this
  record should not repeat that.
- `## Outcome` section, as `adr/README.md` requires of every ADR.
- en-GB spelling, matching `cspell.config.yaml`'s `language: en,en-GB`.

### What the record must contain

The reasoning below is the substance. It should be written as prose, not
transplanted as a bullet list.

**1 — Astro's three headline strengths all land on empty here.** Content-heavy
multi-page authoring: the apex units serve exactly one page, `/about`
(`*/apex/src/page-content.tsx`, 77 lines). No MDX, no content collections.
Zero-JS by default: the units already ship 502 B of client JavaScript, pinned by
`*/apex/.size-limit.json` at a 560 B budget. Island hydration: nothing on the
page is interactive — the actions slot in `*/apex/src/shell.tsx` is empty by
design and says so.

**2 — Most of the code is edge middleware Astro has no equivalent for.** Of
roughly 997 lines of `src`, about 228 are UI (`page-content.tsx` 77,
`shell.tsx` 108, `renderer.tsx` 43). The rest is `create-apex-app.ts` (130),
`health-page.ts` (120), `brand.ts` (91), `seo.tsx` (87), `security-headers.ts`
(58), `csrf.ts` (24), `structured-logger.ts` (24), `rate-limit.ts` (16–21). Hono
supplies `secureHeaders`, `csrf`, `etag`, `languageDetector` and `timeout` as
tested library middleware; Astro offers a single `onRequest` hook and no
equivalents, so CSP assembly, CSRF origin matching, ETag generation and language
negotiation would become bespoke code in the security layer. The CSRF origin
allowlist in `*/apex/src/csrf.ts` is three regular expressions pinned by
`*/apex/api/csrf.hurl`; hand-rolling it is a pure increase in risk.

**3 — The Workers-native surfaces do not survive the move intact.**
`/health.json`, `/revision` and `/offline` return `Response` objects with no
HTML. `/revision` reads `CF_VERSION_METADATA`, rate limiting reads the
`RATE_LIMITER` binding, and `/health.json` stamps `new Date()` per request — so
static output is impossible and SSR is mandatory. The realistic end state is
Hono mounted inside Astro or a Worker in front of it: one more framework, not
one fewer.

**4 — Bundle and delivery path regress against an explicit budget.** Alongside
the 502 B/560 B pin, `assets: { directory: "./public" }` in each
`*/apex/wrangler.jsonc` means static assets — `/style.css` included — are served
before the Worker runs, at zero invocation cost. `*/apex/src/renderer.tsx`
records this as the reason the stylesheet is a linked asset rather than an
inline `<style>`. Preserving that under Astro SSR takes deliberate design.

**5 — The test estate is the largest hidden cost.** Across the four units:
about 48 Vitest files, ~190 tests, ~3,150 lines; 36 `.hurl` files, ~2,560 lines;
8 Playwright specs. State honestly that **Hurl and Playwright survive** — they
assert over HTTP and in a browser and cannot tell which framework answered. The
Vitest suites do not: they drive the app through `app.request()`, a Hono API, so
every file reaching `create-apex-app.ts` is a rewrite. Coverage thresholds in
`*/apex/vitest.config.ts` are 99% lines/statements/functions and 97% branches,
so partial coverage fails the build rather than warning.

**6 — The repository's own rules multiply the cost by four.**
`test/deployment-unit-boundaries.test.ts` forbids cross-unit imports,
`workspace:`/`link:`/`file:` protocols and `tsconfig` extends outside the unit,
and requires each unit to own its tooling configuration. There is therefore no
shared preset to put an Astro config in — the same rule that produced twenty-one
`@theme` blocks (`docs/design/ui-shell-contract.md` §2). The migration is four
parallel migrations. It would also add a Vite/Rollup dependency tree to units
whose `dependencies` today are two entries, `hono` and
`@hono/structured-logger`, against a 21-job Knip matrix running
`--treat-config-hints-as-errors` and a syncpack-enforced `catalog:`.

**7 — ADR 004's central reason transfers directly.** It closed because the
frames "converged rather than diverged" and splitting roles onto a second
framework would break a byte-identity pin "in exchange for benefits nobody had
measured." The four apex units are the same story: identical but for TLD
literals, service names, KV ids and rate-limit namespace ids.

**8 — The stated motivation has already been addressed.** "Hono alone makes
design painful" predates the Tailwind v4 work now in the tree. `shell.tsx` and
`page-content.tsx` are already utility-class markup, and the `@theme` blocks
already carry Japanese typography (`word-break: auto-phrase`,
`text-spacing-trim`, `text-autospace`, a Noto Sans JP-led stack). Judging Astro
against the pre-Tailwind state compares it to something that no longer exists.

**9 — Vercel escape does not require Astro.** `dev/apex` is already Hono
(`src/app.ts`, 217 lines). What is Vercel-specific is `api/index.ts`
(`hono/vercel`'s `handle`) and `vercel.json`'s catch-all rewrite. Reshaping it
after `net/apex` is a copy from a working sibling, and it would close two
documented CI exceptions — `dev/apex` is excluded from the `test-api` matrix
because `vercel dev` blocks on interactive authentication, and from `check:size`
because it has no `.size-limit.json`. Astro adds work here rather than removing
it.

### Two incompatibilities worth recording explicitly

They are easy to miss and would surface late in any future attempt:

- **`<html lang>` is pinned to `defaultLocale` (`ja`) independently of the
  negotiated locale**, so English copy is still served as `lang="ja"`. The
  reason is that the CSS `word-break: auto-phrase` rule must apply to Japanese
  only. `*/apex/api/i18n.hurl` pins this at steps 1 and 5. Astro's i18n routing
  assumes locale and `lang` agree.
- **The CSP forbids inline script and style entirely** — `script-src 'self'`,
  `script-src-attr 'none'`, `style-src-attr 'none'`
  (`*/apex/src/security-headers.ts`). This is why the status-page class strings
  in `create-apex-app.ts` are constant literals rather than assembled at
  runtime. Astro islands would have to be reconciled with it.

### The trigger for reopening

State it plainly, so a future reader knows this record is not a permanent ban:
reopen when **the apex units become a genuine multi-page content surface**, or
when **the twelve content frames are reconsidered** and a single framework
across the estate becomes the point. Astro's real wins — content collections and
MDX, layouts and slots, image optimisation, a sitemap integration in place of
the hand-maintained `*/apex/public/sitemap.xml` — are wins for that shape of
problem, not for one `/about` page.

## Files

| File                                | Change                           |
| ----------------------------------- | -------------------------------- |
| `adr/011-apex-workers-stay-hono.md` | New. The record described above. |

`adr/004-public-information-surfaces-astro.md` is **not** edited. It is a closed
record about a different set of units, and rewriting closed records is what its
own header warns against.

## Verification

Documentation-only, so the relevant gates are the prose ones:

```sh
pnpm run check:spelling     # CSpell, repository-wide, en-GB
pnpm run test               # repository invariants — no ADR is enumerated by them
```

Add any genuinely new proper noun to `.cspell/project-words.txt` under the right
heading rather than reaching for a `cspell:disable` comment — `cspell.config.yaml`
is explicit that the latter is not a substitute. "Astro" already appears
throughout ADR 004 and passes today, so no new entry is expected.

Then read the finished record once against the question it answers: a reader who
arrives asking "why not Astro?" should leave with the measurements and the
reopening trigger, without needing to re-derive either.
