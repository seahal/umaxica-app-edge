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
describe('apex CSRF config', () => {
  it('validates production and localhost apex origins', () => {
    expect(isAllowedApexOrigin('https://umaxica.com')).toBe(true);
    expect(isAllowedApexOrigin('https://umaxica.org')).toBe(true);
    expect(isAllowedApexOrigin('https://umaxica.app')).toBe(true);
    expect(isAllowedApexOrigin('https://umaxica.dev')).toBe(true);
    expect(isAllowedApexOrigin('http://app.localhost:3333')).toBe(true);
    expect(isAllowedApexOrigin('https://evil.example')).toBe(false);
    expect(isAllowedApexOrigin(undefined)).toBe(false);
  });

  it('allows preview/staging origins on workers.dev', () => {
    expect(isAllowedApexOrigin('https://abc123.com-apex.workers.dev')).toBe(true);
    expect(isAllowedApexOrigin('https://preview-branch.app-apex.workers.dev')).toBe(true);
    expect(isAllowedApexOrigin('http://abc123.com-apex.workers.dev')).toBe(false);
    expect(isAllowedApexOrigin('https://workers.dev')).toBe(false);
    expect(isAllowedApexOrigin('https://preview.attacker-account.workers.dev')).toBe(false);
  });
});
