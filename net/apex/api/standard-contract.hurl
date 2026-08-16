# The standard URL contract every UMAXICA deployment unit serves.
#
# Moved out of `e2e/standard-contract.spec.ts`, where it ran through
# Playwright's `APIRequestContext`. Nothing in it needed a browser: it started a
# Chromium, an OS window and a page context in order to make nine HTTP requests
# and read their status lines. Here it is nine HTTP requests.
#
# What stayed in Playwright is the part that genuinely needs a browser — that
# the manifest link resolves, that the service worker registers and activates,
# and that the offline document is what a real navigation falls back to.

GET {{base}}/robots.txt
HTTP 200
[Asserts]
header "content-type" matches /^text\/plain/
body contains "User-agent:"

GET {{base}}/sitemap.xml
HTTP 200
[Asserts]
header "content-type" matches /xml/
xpath "//*[local-name()='urlset']" exists

GET {{base}}/favicon.ico
HTTP 200

GET {{base}}/manifest.webmanifest
HTTP 200
[Asserts]
header "content-type" matches /json/
# A manifest without these is not installable, which is the only reason the
# file is served at all.
jsonpath "$.name" exists
jsonpath "$.start_url" exists
jsonpath "$.display" exists
jsonpath "$.icons" count > 0

GET {{base}}/service-worker.js
HTTP 200
[Asserts]
header "content-type" matches /javascript/

GET {{base}}/offline
HTTP 200

GET {{base}}/health
HTTP 200

GET {{base}}/revision
HTTP 200

GET {{base}}/__definitely_not_found__
HTTP 404
