# Memo: the `/rails-health` HTML page, as it existed before removal

**Status: removed 2026-08-10.** `/rails-health` now returns JSON on all fifteen
frames. This memo exists so the page can be rebuilt deliberately rather than
reconstructed from memory. It is a design note, not a spec — the next version
should be designed, not restored verbatim.

## Why it was removed

The three `*/core` frames rendered an HTML status page while the twelve content
frames returned JSON from a Route Handler. That split was deliberate and pinned
by `test/rails-connection-invariants.test.ts`, on the stated grounds that
"the content frames have no such UI" — which turned out to be false: they have
`layout.tsx`, `page.tsx` and `style.css`.

The split cost more than it returned. It forced two parsers into
`tools/verify-edge-connectivity.mjs`, a "piping a core port through `jq` returns
markup" warning into the operations doc, and it tripped the author during a
manual walkthrough. Unifying on JSON removed all three.

Unifying _upward_ — the page on all fifteen — was considered and rejected: the
page is known to be heading for a refactor, and copying a provisional view plus
its CSS into twelve more frames would have meant paying the duplication cost now
and again at refactor time, across fifteen copies instead of three.

## What the page actually did

Server component, `await connection()` (dynamic), then
`checkRailsHealth(getRailsClient())`. It rendered a `RailsHealthResult` and
nothing else — **it never rendered a Rails response body**, deliberately. That
property is worth keeping in whatever replaces it: the page reports
reachability, not content.

Four states, one heading and one detail block each:

| `kind`           | Heading                             | Detail                                             |
| ---------------- | ----------------------------------- | -------------------------------------------------- |
| `ok`             | Rails health is reachable           | `Status: {status}`                                 |
| `http-error`     | Rails responded with an error       | `Status: HTTP {status}`                            |
| `unreachable`    | Rails is unreachable                | `Rails did not respond.` + `errorMessage`          |
| `not-configured` | Rails VPC binding is not configured | names `UMAXICA_APPS_EDGE_CF_WORKERS_VPC` as absent |

Two pieces of copy were load-bearing and took a correction to get right:

- **"Rails did not respond."** — the original read "Request failed before a
  response arrived", which is false for the `ProxyError` case: a response _did_
  arrive, from the tunnel, and only Rails did not answer. Any replacement has to
  stay true for both causes (a thrown fetch, and a Workers VPC `ProxyError`).
- **"Response bodies are never rendered here."** — stated on the page itself, so
  a reader knows the page is not a Rails proxy.

## Layout

```
main.page-main.health-page
├── section.health-hero
│   ├── p.health-eyebrow        "Diagnostics"
│   ├── h1                      "Rails /health/liveness.json"
│   ├── p.health-description    what the page checks, and what it will not show
│   └── p.health-workspace      workspace URL, from getJitWorkspaceUrl(brand, frame)
└── section.health-card
    ├── div.health-meta > span.health-pill    the heading, as a pill
    └── the detail block
```

`getJitWorkspaceUrl()` came from `src/lib/jit-url.ts`, which exists only in the
cores. It is the reason a naive copy of this page to the content frames would
have dragged a library along with it.

## Styling

Fifteen rules under `.health-*` in `app/core/src/app/globals.css`: a grid page,
an uppercase letter-spaced eyebrow, a `clamp()` display heading, a 60ch
description, and a rounded card with a soft gradient and a large low-opacity
shadow. Light-mode only — **there was no dark-mode treatment**, which is one
thing to fix rather than reproduce.

The full text of both files is in git: `app/core/src/app/(page)/rails-health/`
at commit `5c5fd56` and earlier.

## If it comes back

- Build it **once**, in one place, and decide deliberately which frames mount
  it. Fifteen copies of a diagnostics UI is the situation this removal undid.
- Keep `/rails-health` JSON as the machine contract whatever happens — the
  connectivity checker and any future monitoring depend on one shape across all
  fifteen frames. A page should be an addition, at its own path.
- Carry over: the four states, the "never renders a Rails body" guarantee, and
  the `unreachable` copy that stays true for a `ProxyError`.
- Add: dark mode, and the timestamp of the check (the page showed a status but
  never said _when_, which matters when a tab has been open a while).
