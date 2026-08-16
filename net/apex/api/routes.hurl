# The routed surfaces: the apex redirect and /about.
#
# Replaces the routing half of `test/app.test.tsx`, which drove the whole
# surface through `app.request()`. The routing decision — which status, which
# Location, which document — is only observable over HTTP.
#
# This unit is the one apex that does NOT do region selection. `umaxica.net`
# has no per-region hosts and no `src/root-redirect.ts`: the root is a plain
# 301 to `/about`, and there is no `?ri=` allowlist to defeat. The open-redirect
# cases the other apexes assert here have no counterpart, because there is no
# request-supplied value that reaches `Location`. That absence is the point of
# this comment — a future `?ri=` on this unit needs the app/apex file's checks
# brought over with it.

GET {{base}}/
HTTP 301
[Asserts]
header "location" == "/about"


# A query string is not a redirect target here. It is carried nowhere, and the
# destination must not vary with it.
GET {{base}}/?ri=us
HTTP 301
[Asserts]
header "location" == "/about"

GET {{base}}/?ri=https://evil.example.com
HTTP 301
[Asserts]
header "location" == "/about"


# Security headers are on the redirect too — it is a response like any other.
GET {{base}}/
HTTP 301
[Asserts]
header "strict-transport-security" contains "max-age=31536000"
header "content-security-policy" contains "default-src 'self'"
header "permissions-policy" contains "accelerometer=()"
header "x-frame-options" == "DENY"
header "referrer-policy" == "no-referrer"


# /about is the one rendered page this unit serves. It goes through the JSX
# renderer, so it carries the full shell: manifest link, favicon, stylesheet,
# service worker registration, the SEO head and the title contract.
GET {{base}}/about
HTTP 200
[Asserts]
header "content-type" matches /^text\/html/
xpath "string(//html/@lang)" == "ja"
# The UMAXICA title contract is `{PAGE} — UMAXICA ({TLD})` with an EM DASH:
# the page name leads and the brand closes.
xpath "string(//title)" == "About — UMAXICA (NET)"
xpath "string(//meta[@name='description']/@content)" == "umaxica.net is a UMAXICA platform domain. Services and content are available on dedicated subdomains"
xpath "string(//link[@rel='canonical']/@href)" == "https://umaxica.net/about"
xpath "string(//meta[@name='robots']/@content)" == "index,follow"
xpath "string(//meta[@name='twitter:card']/@content)" == "summary_large_image"
xpath "//link[@rel='manifest'][@href='/manifest.webmanifest']" exists
xpath "//link[@rel='icon'][@href='/favicon.ico']" exists
xpath "//link[@rel='stylesheet'][@href='/style.css']" exists
xpath "//script[@src='/service-worker-register.js']" exists
xpath "//head" exists
xpath "//body" exists
xpath "//main" exists
# The title must never name the runtime or the surface that served it.
xpath "string(//title)" not contains "apex"
xpath "string(//title)" not contains "Hono"
xpath "string(//title)" not contains "Workers"
