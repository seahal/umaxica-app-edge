# NET-series `www` canonicalisation

`www.umaxica.net` and `www.umaxica.dev` redirect to their apex hosts. This is
**infrastructure canonicalisation**, and it is deliberately not application
code — see "Why not Hono" below, which is the whole point of this document.

## The contract

```text
https://www.umaxica.net/foo?x=1  →  301  →  https://umaxica.net/foo?x=1
https://www.umaxica.dev/foo?x=1  →  301  →  https://umaxica.dev/foo?x=1
```

- **301**, not 302. A temporary redirect leaves both hostnames indexable and
  splits link equity, which is the SEO failure the rule exists to prevent.
- **Path preserved.** A rule that sends every `www` URL to the apex root turns
  every deep link into a homepage visit, and does it silently.
- **Query string preserved.** This is the setting most likely to be missed:
  Cloudflare's "Preserve query string" is **off** by default.
- **Scheme is HTTPS.** The apex is the canonical host.

Verify with `scripts/check-www-canonical`, which asserts all three properties
against the live hostnames and does not follow the redirect.

## What this repository does, and does not

**Does not:** create the rules. This repository has no Terraform, no Pulumi and
no wrangler surface for zone-level configuration — Redirect Rules are a zone
product, not a Worker one, and `wrangler.jsonc` cannot express them. No IaC was
invented for this: a single hand-maintained file describing infrastructure that
nothing applies is worse than a documented manual step, because it reads as
authoritative while drifting silently.

**Does:** everything the redirect depends on being true.

- `net/apex` and `dev/apex` answer `/` with a homepage. They previously
  redirected — `net/apex` to `/about`, `dev/apex` to `https://www.umaxica.dev/`
  — and the second of those is the reason ordering matters below.
- `scripts/check-www-canonical` is the acceptance check.
- `api/routes.hurl` in both units asserts that `/` returns 200 and emits no
  `Location`, so a reintroduced redirect fails in CI rather than in production.

## Cloudflare-side work

### Prerequisite: the zone must be on Cloudflare

`umaxica.net` is a Cloudflare zone. **`umaxica.dev` is not** — it is delegated
to Vercel DNS (`ns1/ns2.vercel-dns.com`), which is recorded in
`docs/operations/cloudflare-tunnel-development.md`. Until that zone is moved to
Cloudflare nameservers, neither the `dev` redirect rule nor a custom domain for
the `dev/apex` Worker can exist. The Worker deploys and is reachable on its
`workers.dev` URL either way; what is blocked is the hostname.

This is the one item here that is not a five-minute dashboard change, and it
should be scheduled before anything below is attempted for `.dev`.

### 1. A proxied DNS record for each `www` hostname

Single Redirects only run on traffic Cloudflare proxies, so `www` needs a record
even though nothing serves it. Use a placeholder:

| Type   | Name  | Content | Proxy   |
| ------ | ----- | ------- | ------- |
| `AAAA` | `www` | `100::` | Proxied |

`100::` is the reserved discard-prefix address Cloudflare documents for exactly
this case. The request never reaches it — the rule answers first.

### 2. A Single Redirect rule per zone

Two rules, one in each zone. Both zones are on the free plan's limit of 10
Single Redirects, so this uses two of twenty.

| Field                 | Value           |
| --------------------- | --------------- |
| Rule type             | Wildcard        |
| Request URL           | `https://www.*` |
| Target URL            | `https://${1}`  |
| Status code           | `301`           |
| Preserve query string | **Enabled**     |

This is Cloudflare's own documented www→root pattern. `${1}` is the wildcard
capture, so `www.umaxica.net/foo` yields `umaxica.net/foo` without the rule
needing to name the domain.

### Ordering — this is the part that bites

**Deploy the application change before creating the `dev` rule.**

`dev/apex` used to answer `/` with `301 https://www.umaxica.dev/`. If the
redirect rule is created while a Worker doing that is still deployed:

```text
umaxica.dev/  →301→  www.umaxica.dev/  →301 (rule)→  umaxica.dev/  →  …
```

The browser sees an infinite redirect and the domain is unreachable. The rule
and the old application behaviour are individually correct and jointly fatal,
which is why the order is written down rather than left to be inferred.

`umaxica.net` has no such hazard: its `/` redirected to `/about` on the same
host, so the rule cannot close a loop through it.

## Why not Hono

Both directions of redirect exist in this system and they belong in different
places. The distinction is an architectural contract, not a preference:

| Redirect                          | Owner            | Why                                                                                                                                                                                 |
| --------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `www.umaxica.{net,dev}` → apex    | Cloudflare Rules | Pure host canonicalisation. It depends on nothing in the request but the hostname, and running it in a Worker would bill an invocation to answer a question the edge already knows. |
| `umaxica.{app,com,org}/` → region | Hono             | Application logic. `?ri=` selects between `jp.` and `us.` hosts against a closed allowlist, with a default and open-redirect defences. A rule cannot express it and must not try.   |

The second row is why `run_worker_first` is not set on any apex Worker and why
the COM-series `/` handler stays in `src/root-redirect.ts`. Moving it into a
redirect rule would move a security-relevant allowlist out of code review, out
of the test suite, and into a dashboard.
