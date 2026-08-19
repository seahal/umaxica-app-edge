# The status surfaces: 404 and /offline.
#
# Both are chrome-free by design (docs/design/ui-shell-contract.md §15) but not
# unstyled — they link the same compiled stylesheet as every other document, and
# they must carry the brand title contract `{PAGE} — UMAXICA (ORG)` like any
# other page. Replaces the `app.request()` halves of
# `test/routes/error-pages.test.ts`, `test/routes/coverage.test.ts` and
# `test/status-surfaces.test.ts`.

GET {{base}}/__definitely_not_found__
HTTP 404
[Asserts]
header "content-type" == "text/html; charset=UTF-8"
header "cache-control" == "no-store"
xpath "string(//html/@lang)" == "ja"
xpath "string(//title)" == "ページが見つかりません — UMAXICA (ORG)"
xpath "normalize-space(//h1)" == "ページが見つかりません"
xpath "count(//link[@rel='stylesheet'])" == 1
xpath "string(//link[@rel='stylesheet']/@href)" matches /^\/[^"]+\.css(\?[^"]*)?$/
body contains "HTTP 404"
# The 404 is not a 5xx, so it offers a way home but no reload affordance.
body contains "トップへ戻る"
body not contains "再読み込み"


# A nested path must reach the same handler — `app.notFound()` is global, and a
# route added later that shadows it would show up here first.
GET {{base}}/about/definitely/not/here
HTTP 404
[Asserts]
xpath "normalize-space(//h1)" == "ページが見つかりません"


GET {{base}}/offline
HTTP 200
[Asserts]
header "content-type" matches /^text\/html/
xpath "string(//html/@lang)" == "ja"
xpath "string(//title)" == "オフライン — UMAXICA (ORG)"
xpath "normalize-space(//h1)" == "オフラインです"
xpath "count(//link[@rel='stylesheet'])" == 1
xpath "string(//link[@rel='stylesheet']/@href)" matches /^\/[^"]+\.css(\?[^"]*)?$/
body contains "トップへ戻る"
[Captures]
stylesheet_url: xpath "string(//link[@rel='stylesheet']/@href)"


# The stylesheet the three status documents above link to. It is served by the
# assets binding without invoking the Worker, so a broken build shows up as a
# 404 here and nowhere else in this suite.
#
# The URL is captured rather than written down, because it is not the same URL
# in both places this suite can run. `vite dev` serves the stylesheet from its
# source path; only `vite build` puts a content hash in the filename. So the
# contract asserted here is the one that holds in either mode — exactly one
# stylesheet, and it resolves — and NOT the hash.
#
# The hash and the `immutable` response that depends on it are properties of
# the built artefact and of `public/_headers`, neither of which a dev server
# applies. The policy half is pinned by `test/asset-cache-policy.test.ts`; the
# hashing half is Vite's, and `pnpm run build` exercises it.
GET {{base}}{{stylesheet_url}}
HTTP 200
[Asserts]
header "content-type" matches /^text\/css/
