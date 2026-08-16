# The UMAXICA application shell.
#
# What has to stay stable across every deployment unit is the emitted document —
# semantics, hierarchy, accessible names — not the way this unit happens to
# build it. `docs/design/ui-shell-contract.md` is normative.
#
# These assertions deliberately do not name a CSS class. Every visual rule is a
# Tailwind utility, so a class list is styling rather than structure: a test
# that pinned one would fail on a padding change while still passing if the
# `<nav>` lost its accessible name.
#
# Replaces `test/ui-shell-contract.test.tsx`, which asserted the same things on
# the same responses but had to reach them through happy-dom — including a
# regex that stripped `<link rel="stylesheet">` out of the document before
# parsing, because happy-dom would otherwise try to fetch `/style.css` over a
# network no unit test has. XPath over a real response needs none of that.

# `/about` is the only user-facing HTML page this unit serves, so it is the
# whole shell surface.
GET {{base}}/about
HTTP 200
[Asserts]
# Exactly one of each landmark, in document order.
xpath "count(//header)" == 1
xpath "count(//main)" == 1
xpath "count(//footer)" == 1
xpath "count(//body/header/following-sibling::main)" == 1
xpath "count(//body/main/following-sibling::footer)" == 1

# The brand links home and does not steal the page heading: the `<h1>` belongs
# to the page, inside `<main>`.
xpath "string(//header//a/@href)" == "/"
xpath "normalize-space(//header//a)" == "UMAXICA"
xpath "count(//header//h1)" == 0
xpath "count(//main//h1)" == 1

# No dead control in the header. Nothing on this unit toggles, so the header
# holds the brand link and nothing else interactive.
xpath "count(//header//a)" == 1
xpath "count(//header//button)" == 0

# No main navigation, because this unit has no second destination. The only
# `<nav>` in the document is the footer's.
xpath "count(//nav)" == 1
xpath "count(//footer//nav)" == 1

# The footer has two layers: a named utility nav, then the site identity.
xpath "string(//footer//nav/@aria-label)" == "Utility navigation"
xpath "string(//footer//nav//a/@href)" == "/about"
xpath "normalize-space(//footer//nav//a)" == "About"
xpath "count(//footer//nav/following-sibling::p)" == 1
xpath "normalize-space(//footer//nav/following-sibling::p)" matches /©\s*\d{4} UMAXICA/
xpath "string(//footer//nav/following-sibling::p//a/@href)" == "https://umaxica.com/"
xpath "normalize-space(//footer//nav/following-sibling::p//a)" == "https://umaxica.com/"

# One compiled stylesheet, nothing inline. The CSS used to be an inline
# `<style>` whose sha256 was hand-maintained in the CSP; it is a static asset
# now, so no document may carry an inline stylesheet or a `style` attribute —
# `style-src-attr 'none'` would drop the latter anyway.
xpath "//link[@rel='stylesheet'][@href='/style.css']" exists
xpath "count(//style)" == 0
xpath "count(//*[@style])" == 0

# The shell must not link to a surface this unit does not serve. No Privacy,
# Terms or Preferences page exists here.
xpath "count(//a[@href='/privacy'])" == 0
xpath "count(//a[@href='/terms'])" == 0
xpath "count(//a[@href='/preferences'])" == 0


# Rather than compare the shell's hrefs against a hand-kept allowlist, ask the
# server. Every internal destination the shell offers must answer.
GET {{base}}/about
HTTP 200

GET {{base}}/favicon.ico
HTTP 200

GET {{base}}/manifest.webmanifest
HTTP 200
[Asserts]
header "content-type" matches /json/

GET {{base}}/style.css
HTTP 200

GET {{base}}/service-worker-register.js
HTTP 200
[Asserts]
header "content-type" matches /javascript/


# The shell localises through the same language detector as the page copy.
# Sent first in this file's cookie jar, so `Accept-Language` still decides —
# see api/i18n.hurl for why that ordering matters.
GET {{base}}/about?lang=ja
HTTP 200
[Asserts]
xpath "string(//footer//nav/@aria-label)" == "ユーティリティナビゲーション"
xpath "normalize-space(//footer//nav//a)" == "このサイトについて"


# `/health` is outside the shell. It is a health check, not a page.
GET {{base}}/health
HTTP 200
[Asserts]
xpath "count(//header)" == 0
xpath "count(//nav)" == 0
xpath "count(//footer//nav)" == 0
xpath "count(//a[@href='/about'])" == 0
# Chrome-free, not unstyled: it links the same compiled stylesheet.
xpath "//link[@rel='stylesheet'][@href='/style.css']" exists
