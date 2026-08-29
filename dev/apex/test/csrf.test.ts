import { isAllowedApexOrigin } from '../src/csrf';

/*
 * The origin predicate only. Whether `apexCsrf` is mounted, and whether it
 * actually refuses a cross-origin POST, is asserted over real HTTP in
 * `api/csrf.hurl` — the two tests that used to live here could not tell: one
 * mounted the middleware on a throwaway `new Hono()` (so it stayed green if
 * `create-apex-app.ts` dropped it) and the other invoked the middleware against
 * a hand-built fake context, which asserted the shape of the mock as much as
 * the behaviour of the code.
 */
const production = { allowLocalhost: false };
const development = { allowLocalhost: true };

describe('apex CSRF config', () => {
  it("accepts this unit's own apex origin and nothing adjacent to it", () => {
    expect(isAllowedApexOrigin('https://umaxica.dev', production)).toBe(true);
    expect(isAllowedApexOrigin('http://umaxica.dev', production)).toBe(false);
    expect(isAllowedApexOrigin('https://umaxica.dev.evil.example', production)).toBe(false);
    expect(isAllowedApexOrigin('https://evil.example', production)).toBe(false);
    expect(isAllowedApexOrigin(undefined, production)).toBe(false);
  });

  /*
   * The sibling apexes are separate sites. This predicate was shared verbatim
   * by all five units and accepted every one of them, so a form on one UMAXICA
   * domain could post to another; nothing in this unit needs that.
   */
  it('rejects the sibling apex domains', () => {
    expect(isAllowedApexOrigin('https://umaxica.com', production)).toBe(false);
    expect(isAllowedApexOrigin('https://umaxica.org', production)).toBe(false);
  });

  it('accepts the local dev origin only off production', () => {
    expect(isAllowedApexOrigin('http://dev.localhost:3333', development)).toBe(true);
    expect(isAllowedApexOrigin('http://dev.localhost', development)).toBe(true);
    expect(isAllowedApexOrigin('http://dev.localhost:3333', production)).toBe(false);
    expect(isAllowedApexOrigin('http://com.localhost:3333', development)).toBe(false);
  });

  /*
   * A preview of this worker is this worker, so it stays allowed on production
   * too — `preview_urls` is on at the top level of wrangler.jsonc. What it may
   * not do is let any workers.dev host in: the worker name is pinned and only
   * the account label is open.
   */
  it('accepts previews of this worker on workers.dev', () => {
    expect(
      isAllowedApexOrigin('https://umaxica-apps-edge-dev-apex.acct.workers.dev', production),
    ).toBe(true);
    expect(
      isAllowedApexOrigin('https://abc123-umaxica-apps-edge-dev-apex.acct.workers.dev', production),
    ).toBe(true);
    expect(
      isAllowedApexOrigin('http://umaxica-apps-edge-dev-apex.acct.workers.dev', production),
    ).toBe(false);
    expect(
      isAllowedApexOrigin('https://umaxica-apps-edge-com-apex.acct.workers.dev', production),
    ).toBe(false);
    expect(isAllowedApexOrigin('https://preview.attacker.workers.dev', production)).toBe(false);
    expect(isAllowedApexOrigin('https://workers.dev', production)).toBe(false);
  });
});
