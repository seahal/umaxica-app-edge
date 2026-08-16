# The two documents a user meets when something is wrong: the 404 and the
# offline page.
#
# The React components behind them are rendered and asserted in
# `test/status-surfaces.test.tsx`, which is the right layer for their markup.
# What that layer cannot show is whether Next actually serves them — whether
# `global-not-found.tsx` is wired to an unmatched path and whether `/offline`
# is a real route rather than a component nothing routes to. That is what these
# requests prove.

GET {{base}}/__definitely_not_found__
HTTP 404
[Asserts]
header "content-type" matches /^text\/html/
xpath "string(//html/@lang)" == "ja"
xpath "string(//title)" == "ページが見つかりません — UMAXICA (ORG)"
xpath "//h1" exists
# A 404 offers a way home. It must not offer a reload — the request will not
# succeed the second time, and telling a user otherwise is the difference
# between the 404 document and the 500 one.
body not contains "再読み込み"

# A nested path proves the handler is global rather than attached to one route.
GET {{base}}/about/definitely/not/here
HTTP 404
[Asserts]
xpath "string(//title)" == "ページが見つかりません — UMAXICA (ORG)"


# `/offline` is what the service worker serves from cache when the network is
# gone. It has to be a real, cacheable document served over the network first —
# a service worker cannot cache a route that never answered.
GET {{base}}/offline
HTTP 200
[Asserts]
header "content-type" matches /^text\/html/
xpath "string(//html/@lang)" == "ja"
xpath "string(//title)" == "オフライン — UMAXICA (ORG)"
xpath "//h1" exists
