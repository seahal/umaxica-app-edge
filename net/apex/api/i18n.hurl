# Language negotiation, and the cookie that makes it sticky.
#
# This file exists as its own file on purpose: Hurl keeps one cookie jar per
# `.hurl` file, so the sequence below starts from a browser that has never
# visited. Folding it into `routes.hurl` would have it inherit a `language`
# cookie set by the requests above it, which is precisely the variable under
# test here.
#
# The behaviour documented below was NOT visible to the `app.request()` tests
# this replaces. Each `app.request()` call constructs a bare `Request` with an
# empty cookie jar, so every one of them looked like a first-ever visit and
# `Accept-Language` always won. A real client — a browser, curl with a jar,
# Hurl — carries the cookie back, and then it does not.
#
# `<html lang>` stays pinned to this unit's `defaultLocale` (ja) on every
# response regardless of the negotiated copy: it drives
# `word-break: auto-phrase` in `src/style.css`, which must only run on
# Japanese text.

# 1. A first visit, no cookie. `Accept-Language` decides, and the decision is
#    cached for a year.
GET {{base}}/about
Accept-Language: ja
HTTP 200
[Asserts]
xpath "string(//html/@lang)" == "ja"
body contains "このサイトについて"
body not contains "About this site."
header "set-cookie" contains "language=ja"
header "set-cookie" contains "Max-Age=31536000"
header "set-cookie" contains "HttpOnly"
header "set-cookie" contains "SameSite=Strict"

# 2. The cookie now outranks the header. A visitor who switches their browser
#    language sees no change — `languageDetector`'s default precedence is
#    querystring, then cookie, then header, and the cookie was just written.
GET {{base}}/about
Accept-Language: en-US,en;q=0.9
HTTP 200
[Asserts]
body contains "このサイトについて"
body not contains "About this site."

# 3. The querystring outranks the cookie, and re-caches. This is the only route
#    by which a visitor whose language was pinned in step 1 can change it, which
#    is worth knowing before anyone builds a language switcher for this unit.
GET {{base}}/about?lang=en
HTTP 200
[Asserts]
body contains "About this site."
body not contains "このサイトについて"
header "set-cookie" contains "language=en"

# 4. The new cache sticks in the other direction too.
GET {{base}}/about
Accept-Language: ja
HTTP 200
[Asserts]
body contains "About this site."

# 5. An unsupported language falls back rather than erroring or echoing.
GET {{base}}/about?lang=de
HTTP 200
[Asserts]
xpath "string(//html/@lang)" == "ja"
