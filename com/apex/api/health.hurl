# Health probes and revision.
#
# Kubernetes probes, Playwright `webServer` readiness and
# `tools/verify-edge-connectivity.mjs` speak to `/health` over HTTP.
# `/health.html` and `/health.json` are not health documents: both are 404
# HTML pages, even when the client sends `Accept: application/json`.
# `/health` itself stays text/plain under that header too — content type is
# not negotiated.

GET {{base}}/health
HTTP 200
[Asserts]
header "content-type" == "text/plain; charset=utf-8"
header "cache-control" == "no-store"
body == "status: ok\nstartup: ok\nliveness: ok\nreadiness: ok\n"
body not contains "{"
body not contains "<html"

GET {{base}}/health
Accept: application/json
HTTP 200
[Asserts]
header "content-type" == "text/plain; charset=utf-8"
header "content-type" not contains "json"
body not contains "{"

GET {{base}}/health.json
HTTP 404
[Asserts]
header "content-type" == "text/html; charset=UTF-8"
header "content-type" not contains "json"
body not contains "{"

GET {{base}}/health.json
Accept: application/json
HTTP 404
[Asserts]
header "content-type" == "text/html; charset=UTF-8"
header "content-type" not contains "json"
body not contains "{"

GET {{base}}/health.html
HTTP 404
[Asserts]
header "content-type" == "text/html; charset=UTF-8"
header "content-type" not contains "json"
body not contains "{"

GET {{base}}/health.html
Accept: application/json
HTTP 404
[Asserts]
header "content-type" == "text/html; charset=UTF-8"
header "content-type" not contains "json"
body not contains "{"

GET {{base}}/health/startups
HTTP 200
[Asserts]
header "content-type" == "text/plain; charset=utf-8"
header "cache-control" == "no-store"
body == "ok\n"

GET {{base}}/health/livenesses
HTTP 200
[Asserts]
header "content-type" == "text/plain; charset=utf-8"
header "cache-control" == "no-store"
body == "ok\n"

GET {{base}}/health/readinesses
HTTP 200
[Asserts]
header "content-type" == "text/plain; charset=utf-8"
header "cache-control" == "no-store"
body == "ok\n"

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
