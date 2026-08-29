# The UMAXICA <title> contract, on every HTML document this unit serves.
#
#   Root title -> `UMAXICA (NET)`
#   Page title -> `{LOCALIZED_PAGE_TITLE} — UMAXICA (NET)`   (EM DASH, not a
#                                                             hyphen or a pipe)
#
# The rules, which every surface below must satisfy:
#
#   1. exactly one <title>
#   2. non-empty after trim
#   3. the brand is exactly "UMAXICA", casing does not vary
#   4. the TLD segment matches this deployment family — (NET)
#   5. a non-root surface carries a page-specific segment before the EM DASH
#   6. the title never names the surface or the runtime that served it
#
# Rule 6 is the one with teeth: Rails and Edge split routes inside one FQDN, and
# that split has to be invisible to a user reading their tab. `apex`, `core`,
# `hono`, `workers`, `cloudflare`, `next` and friends must not appear.
#
# `test/title-contract.test.ts` keeps the one surface no client can request —
# the 500 document — using the same rules from `test/utils/title-contract.ts`.

GET {{base}}/about
HTTP 200
[Asserts]
xpath "count(//title)" == 1
xpath "normalize-space(//title)" != ""
xpath "string(//title)" matches /^.+ — UMAXICA \(NET\)$/
xpath "string(//title)" not matches /(?i)\b(auth|core|apex|side|edge|next|nextjs|hono|workers?|cloudflare|opennext)\b/
xpath "string(//title)" not matches /Umaxica|umaxica/

GET {{base}}/health
HTTP 200
[Asserts]
xpath "count(//title)" == 1
xpath "string(//title)" matches /^.+ — UMAXICA \(NET\)$/
xpath "string(//title)" not matches /(?i)\b(auth|core|apex|side|edge|next|nextjs|hono|workers?|cloudflare|opennext)\b/

GET {{base}}/health.html
HTTP 200
[Asserts]
xpath "count(//title)" == 1
xpath "string(//title)" matches /^.+ — UMAXICA \(NET\)$/

GET {{base}}/offline
HTTP 200
[Asserts]
xpath "count(//title)" == 1
xpath "string(//title)" matches /^.+ — UMAXICA \(NET\)$/
xpath "string(//title)" not matches /(?i)\b(auth|core|apex|side|edge|next|nextjs|hono|workers?|cloudflare|opennext)\b/

GET {{base}}/definitely-missing
HTTP 404
[Asserts]
xpath "count(//title)" == 1
xpath "string(//title)" matches /^.+ — UMAXICA \(NET\)$/
xpath "string(//title)" not matches /(?i)\b(auth|core|apex|side|edge|next|nextjs|hono|workers?|cloudflare|opennext)\b/


# The contract applies to HTML and must leave the JSON surfaces alone: a `title`
# key appearing in either payload would mean the renderer had reached a response
# it does not own. The exact key sets are pinned for the same reason — these two
# are consumed by machines, so an added or dropped field is a breaking change.
GET {{base}}/health.json
HTTP 200
[Asserts]
header "content-type" matches /^application\/json/
jsonpath "$.status" exists
jsonpath "$.service" exists
jsonpath "$.version" exists
jsonpath "$.environment" not exists
jsonpath "$.edge" exists
jsonpath "$.time" exists
jsonpath "$.title" not exists
# The exact key count, not just the presence of each key. `exists` cannot see an
# ADDED field, and this payload is consumed by machines, so a new key is as much
# a breaking change as a dropped one. Moved here from Guard C of
# `test/html-title-contract.test.ts`, which asserted the same set with
# `Object.keys().sort()` against an in-process response.
jsonpath "$.*" count == 5

GET {{base}}/revision
HTTP 200
[Asserts]
header "content-type" matches /^application\/json/
jsonpath "$.id" exists
jsonpath "$.tag" exists
jsonpath "$.timestamp" exists
jsonpath "$.title" not exists
jsonpath "$.*" count == 3
