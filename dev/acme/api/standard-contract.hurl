# The HTTP contract of the ACME dev frame.
#
# This unit is deliberately smaller than the fifteen Cloudflare frames: it has
# no `/about`, no `/offline`, no `/revision` and no `global-not-found.tsx`, so
# the standard URL contract it can satisfy is the subset below. Adding a
# surface here means adding it to this file — an empty section is how a missing
# route stays visible rather than silently absent.
#
# The second half replaces the `serves the local health response` test from
# `e2e/smoke.spec.ts`, which was pure `request.get()` — it started Chromium to
# read one status line and one JSON key. What stayed in that spec is the part
# that needs a browser: that the page renders and exposes its heading.

GET {{base}}/
HTTP 200
[Asserts]
header "content-type" matches /^text\/html/
xpath "count(//title)" == 1
xpath "string(//title)" matches /^(?:.+ — )?UMAXICA \(DEV\)$/
# The title must never name the surface or the runtime that served it.
xpath "string(//title)" not matches /(?i)\b(auth|core|apex|side|edge|next|nextjs|hono|workers?|cloudflare|opennext|vercel)\b/
xpath "string(//title)" not matches /Umaxica|umaxica/
xpath "//h1" exists

GET {{base}}/manifest.webmanifest
HTTP 200
[Asserts]
header "content-type" matches /json/
jsonpath "$.name" exists
jsonpath "$.start_url" == "/"
jsonpath "$.display" == "standalone"
jsonpath "$.icons" count > 0

GET {{base}}/favicon.svg
HTTP 200
[Asserts]
header "content-type" matches /svg/


# `/health` here is this frame's own state only — unlike the Cloudflare frames,
# it has no Rails half to be blocked on, so 200 is the honest, unconditional
# answer and the 503 branch needs `toISOString` to throw (unit-tested, not
# reachable from a client).
#
# The cache headers are the point as much as the payload: a health document
# served from a cache answers for a past moment, which is exactly when it is
# most misleading.
GET {{base}}/health
HTTP 200
[Asserts]
header "content-type" matches /^application\/json/
header "cache-control" contains "no-store"
header "x-robots-tag" contains "noindex"
jsonpath "$.status" == "ok"
jsonpath "$.timestamp" matches /^\d{4}-\d{2}-\d{2}T/
jsonpath "$.version" exists
# No internal detail may reach a public health document.
body not contains "Authorization"
body not contains "Cookie"
