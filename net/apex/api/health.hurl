# Health and revision endpoints.
#
# These are the two surfaces something other than a browser depends on: the
# Playwright `webServer` readiness probe, `tools/verify-edge-connectivity.mjs`
# and Cloudflare's own health checks all speak to them over HTTP and none of
# them can call `renderHealthJson` directly. That makes the HTTP shape — not the
# function's return value — the thing worth pinning here.
#
# `src/health-page.ts` is still unit-tested in `test/health-page.test.ts`, but
# only for what it computes (payload assembly, brand fallback). The wire format
# lives here.

GET {{base}}/health.json
HTTP 200
[Asserts]
header "content-type" == "application/json; charset=UTF-8"
header "x-robots-tag" == "noindex, nofollow"
jsonpath "$.status" == "OK"
jsonpath "$.service" == "net"
jsonpath "$.edge" == "cloudflare"
jsonpath "$.time" matches /^\d{4}-\d{2}-\d{2}T/
# Present but not pinned: both are read from bindings, so their values differ
# between `wrangler dev`, preview and production. That the keys are always
# emitted — null rather than absent when the binding is missing — is the part
# of the contract a consumer can rely on.
jsonpath "$.version" exists
jsonpath "$.environment" exists
[Captures]
health_version: jsonpath "$.version"


# `/health` and `/health.html` are the same document. The e2e `webServer` block
# waits on `/health`, so a regression here stalls Playwright rather than failing
# it — worth catching at this layer instead.
GET {{base}}/health
HTTP 200
[Asserts]
header "content-type" == "text/html; charset=UTF-8"
header "x-robots-tag" == "noindex, nofollow"
xpath "string(//html/@lang)" == "ja"
xpath "string(//title)" == "Health status — UMAXICA (NET)"
xpath "string(//meta[@name='robots']/@content)" == "noindex, nofollow"
xpath "//link[@rel='stylesheet'][@href='/style.css']" exists
xpath "normalize-space(//h1)" == "status"
# The HTML page and the JSON payload are two renderings of one payload, so the
# definition list must carry the same values the JSON does.
xpath "string(//dt[text()='status']/following-sibling::dd[1])" == "OK"
xpath "string(//dt[text()='service']/following-sibling::dd[1])" == "net"
xpath "string(//dt[text()='edge']/following-sibling::dd[1])" == "cloudflare"
xpath "string(//dt[text()='version']/following-sibling::dd[1])" == "{{health_version}}"
xpath "string(//dt[text()='time']/following-sibling::dd[1])" matches /^\d{4}-\d{2}-\d{2}T/
# Chrome-free by design (docs/design/ui-shell-contract.md §15): the health page
# is an operational surface, not a page of the site.
xpath "//header" not exists
xpath "//nav" not exists


GET {{base}}/health.html
HTTP 200
[Asserts]
header "content-type" == "text/html; charset=UTF-8"
xpath "string(//title)" == "Health status — UMAXICA (NET)"


# Deployment identity. The three fields are always present and always null
# outside the Workers runtime with version metadata bound — the endpoint must
# not 500 or omit keys when the binding is absent.
GET {{base}}/revision
HTTP 200
[Asserts]
header "content-type" matches /^application\/json/
header "cache-control" == "no-store"
header "x-robots-tag" == "noindex, nofollow"
jsonpath "$.id" exists
jsonpath "$.tag" exists
jsonpath "$.timestamp" exists
# The two endpoints read the same `CF_VERSION_METADATA` binding, so they must
# name the same deployment. A drift here means one of them is reading a stale
# or different source — which is exactly the failure that makes a health check
# untrustworthy for deciding whether a rollout landed.
jsonpath "$.id" == {{health_version}}
