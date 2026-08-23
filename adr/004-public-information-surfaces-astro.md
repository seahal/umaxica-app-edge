# ADR 004: Public Information Surfaces Use Astro

## Status: Rejected 2026-08-12 — the twelve content frames stay Next.js

**This plan is discarded. Do not implement it.** `docs`, `news`, `info` and
`help` remain Next.js on OpenNext across all three families, as they are today.

Nothing was ever built against this record: `astro` appears in no `package.json`,
no source file and no config anywhere in the repository. So there is nothing to
undo — only this status to correct, because an `Accepted` record with deferred
implementation reads as work still queued, and it is not.

Two things had accumulated against it in the meantime, which is part of why it is
being closed rather than left open:

- **ADR 009 gave the twelve content frames a Rails-touching `/health`.** Their
  health route is now a dynamic Route Handler that probes Rails liveness over the
  Workers VPC binding, byte-identical with the three Cores'. Migrating those
  twelve to Astro would mean carrying `rails-client.ts` and `rails-health.ts` into
  an Astro app, which this record's own constraint below — Astro surfaces may
  consume "only public, read-only content APIs" — does not obviously permit for a
  private-network health probe. That tension was never resolved.
- **The fifteen frames converged rather than diverged.** `rails-client.ts`,
  `rails-health.ts` and now `health/route.ts` are one implementation copied
  fifteen times, pinned byte-identical by
  `test/rails-connection-invariants.test.ts`. Splitting three of the five roles
  onto a second framework would break that pin in exchange for benefits nobody
  had measured.

The reasoning below is left as written. It records what was decided when it was
written, and the framework comparison in it may still be useful if the question
is reopened — as a new record, with a new number.

## Context

Project Umaxica has separate edge workspaces for Core application surfaces and
public information surfaces. Core application surfaces need authenticated
state, RP/BFF behavior, logged-in UI, React UI primitives, and account,
organization, and avatar operations. Public information surfaces need fast,
lightweight content delivery, MDX authoring, content collections, SSG/SSR, and
image optimization.

The repository currently has Next.js workspaces for `core`, `docs`, `news`,
and `help` across the `app`, `com`, and `org` families. The target architecture
keeps Core on Next.js and introduces Astro only for public information surfaces.

## Decision

Core workspaces remain Next.js. Do not replace Core Next.js with Astro.

Astro is introduced only for public information surfaces:

- `docs`
- `news`
- `info`
- `help`

The surface split is:

| Surface         | Framework | Responsibility                                                                       |
| --------------- | --------- | ------------------------------------------------------------------------------------ |
| `*/core`        | Next.js   | RP/BFF, authenticated UI, React Aria, logged-in state, account/org/avatar operations |
| `*/docs`        | Astro     | Public documentation and knowledge content                                           |
| `*/news`        | Astro     | Public news and announcements                                                        |
| `*/info`        | Astro     | Public informational pages                                                           |
| `*/help`        | Astro     | Public help content                                                                  |
| Rails Core/Base | Rails     | Source of truth, authority, policy, mutation, content JSON authority                 |

Astro surfaces may consume only public, read-only content APIs from Rails
through the Cloudflare Workers private connectivity boundary. They must not
receive Acme refresh tokens, user-scoped secrets, browser session cookies, or
authorization material intended for authenticated Core flows.

## Consequences

- Next.js remains the framework for `app/core`, `com/core`, and `org/core`.
- Astro becomes the framework for `app|com|org` public information workspaces:
  `docs`, `news`, `info`, and `help`.
- Rails remains the authority for durable content JSON, policy, and mutation.
- Cloudflare Workers are the edge runtime and the private connectivity boundary
  between Astro/Next surfaces and Rails private APIs.
- Astro must not implement RP/BFF behavior, authenticated mutation, account
  authority, organization authority, avatar authority, or refresh-token handling.
- Public content fetchers must be explicit and narrow; no generic Rails proxy
  route should be added to Astro.

## Implementation Notes

This ADR records the framework and authority boundary only. It does not
implement the migration.

The edge migration should happen in a later implementation slice:

1. Add `info` workspaces for `app`, `com`, and `org`.
2. Convert `docs`, `news`, `info`, and `help` public workspaces to Astro.
3. Keep `core` workspaces on Next.js/OpenNext.
4. Add a server-only public content client for read-only Rails content JSON
   once the Rails API contract is available.
5. Verify with pnpm scripts: `pnpm install`, `pnpm run check`, and `pnpm run test`.

## Outcome

**Rejected, 2026-08-12, without ever being implemented.** The twelve content
frames stay Next.js. See the status note at the top of this file for why, and for
the two developments — ADR 009's Rails-touching `/health` and the byte-identity
pin across all fifteen frames — that the migration would have had to answer for.

This record was `Accepted` with implementation deferred for long enough that it
read as queued work. It was not queued; it is closed.
