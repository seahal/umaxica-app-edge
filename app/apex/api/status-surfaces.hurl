# The status surfaces: 404 and /offline.
#
# Both are chrome-free by design (docs/design/ui-shell-contract.md §15) but not
# unstyled — they link the same compiled stylesheet as every other document, and
# they must carry the brand title contract `{PAGE} — UMAXICA (APP)` like any
# other page. Replaces the `app.request()` halves of
# `test/routes/error-pages.test.ts`, `test/routes/coverage.test.ts` and
# `test/status-surfaces.test.ts`.

GET {{base}}/__definitely_not_found__
HTTP 404
[Asserts]
header "content-type" == "text/html; charset=UTF-8"
header "cache-control" == "no-store"
xpath "string(//html/@lang)" == "ja"
xpath "string(//title)" == "ページが見つかりません — UMAXICA (APP)"
xpath "normalize-space(//h1)" == "ページが見つかりません"
xpath "//link[@rel='stylesheet'][@href='/style.css']" exists
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
xpath "string(//title)" == "オフライン — UMAXICA (APP)"
xpath "normalize-space(//h1)" == "オフラインです"
xpath "//link[@rel='stylesheet'][@href='/style.css']" exists
body contains "トップへ戻る"


# The stylesheet the three status documents above link to. It is served by the
# assets binding without invoking the Worker, so a broken `build:css` shows up
# as a 404 here and nowhere else in this suite.
GET {{base}}/style.css
HTTP 200
[Asserts]
header "content-type" matches /^text\/css/
