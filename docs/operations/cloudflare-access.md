# Cloudflare Access development validation

The active procedure moved to
[`docs/development/cloudflare-development-network.md`](../development/cloudflare-development-network.md)
and
[`docs/development/credential-and-secret-management.md`](../development/credential-and-secret-management.md).

Access service tokens are used only by `scripts/check-tunnel` and, optionally, by
`tools/verify-edge-connectivity.mjs`. They are not a Next.js fallback and are not loaded into the
normal application runtime.

For the sixteen Edge development surfaces, the authority is the "Cloudflare Access" section of
[`cloudflare-tunnel-development.md`](cloudflare-tunnel-development.md). Two things to know before
reading anything older: Access covers **all sixteen** hostnames as of 2026-08-11, and it covers the
**whole host** — there is no `/health*` Bypass, so health endpoints answer a 302 unauthenticated
like every other path. `adr/008-edge-development-tunnel-exposure.md` records why the Bypass was
declined and what it costs.
