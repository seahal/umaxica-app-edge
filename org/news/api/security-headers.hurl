# The security header contract.
#
# This replaces `test/security-headers.test.ts`, which imported the header helper
# from `../security-headers`, awaited it, and asserted that the returned array
# contained the values the same file had just declared. That test could not fail
# for any reason a user would notice: it shared no code path with a served
# response, so it stayed green through any mistake in the wiring that applies
# those headers to a response.
#
# Asserting on a real response closes that gap. Read the header values here as
# the contract; `security-headers.ts` is one implementation of it.

GET {{base}}/
HTTP 200
[Asserts]
header "content-security-policy" contains "default-src 'self'"
header "content-security-policy" contains "base-uri 'none'"
header "content-security-policy" contains "connect-src 'self'"
header "content-security-policy" contains "font-src 'self' data:"
header "content-security-policy" contains "form-action 'self'"
header "content-security-policy" contains "frame-ancestors 'none'"
header "content-security-policy" contains "img-src 'self' data:"
header "content-security-policy" contains "object-src 'none'"
header "content-security-policy" contains "upgrade-insecure-requests"
# `script-src` and `style-src` carry 'unsafe-inline' because hydration emits both
# inline. That is a documented, deliberate loosening — but it must stay confined
# to those two directives, so the negative assertions below are the part with
# teeth.
#
# `script-src` carries 'unsafe-eval' too whenever the server answering is a dev
# server, which is what this runner starts: `security-headers.ts` adds it on the
# non-production branch, and React's development build calls eval(). The regex
# pins the whole source list, so it accepts that one expression there and
# nothing else anywhere — a policy that lets eval() into another directive still
# fails here. The other half, "a production build never emits it", is in
# test/content-security-policy.test.ts, because a client talking to a dev
# server cannot see it.
header "content-security-policy" matches "script-src 'self' 'unsafe-inline'( 'unsafe-eval')?;"
header "content-security-policy" contains "style-src 'self' 'unsafe-inline'"
header "content-security-policy" not contains "default-src 'self' 'unsafe-inline'"
header "content-security-policy" not matches "(?:default-src|style-src|connect-src)[^;]*unsafe-eval"
header "content-security-policy" not contains "*"
header "strict-transport-security" contains "max-age=31536000"
header "strict-transport-security" contains "includeSubDomains"
header "x-content-type-options" == "nosniff"
header "x-frame-options" == "DENY"
header "referrer-policy" == "no-referrer"
header "permissions-policy" contains "camera=()"
header "permissions-policy" contains "geolocation=()"
header "permissions-policy" contains "microphone=()"
header "permissions-policy" contains "payment=()"
header "permissions-policy" contains "usb=()"


# The `source: '/:path*'` pattern claims every path, so the error path has to
# carry the headers too — a 404 answering without a CSP is the case a
# happy-path-only assertion misses, and it is a page an attacker can always
# reach.
GET {{base}}/__definitely_not_found__
HTTP 404
[Asserts]
header "content-security-policy" contains "default-src 'self'"
header "content-security-policy" contains "frame-ancestors 'none'"
header "x-content-type-options" == "nosniff"
header "x-frame-options" == "DENY"
header "referrer-policy" == "no-referrer"


# And on a JSON route handler, which does not go through the page renderer at
# all.
GET {{base}}/revision
HTTP 200
[Asserts]
header "content-security-policy" contains "default-src 'self'"
header "x-content-type-options" == "nosniff"
header "x-frame-options" == "DENY"
