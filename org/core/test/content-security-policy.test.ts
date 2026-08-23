// The half of the security-header contract `api/security-headers.hurl` cannot
// reach.
//
// That suite asserts on a real response, which is where every header value a
// client can observe belongs — but the server it starts is `vite dev`, so the
// only policy it ever sees is the development one. The two differ in exactly one
// source expression: `script-src` carries 'unsafe-eval' in development, because
// the dev bundle and React's development build both call eval(). Shipping it to
// production is the mistake worth catching, and no HTTP client pointed at a dev
// server can catch it, so the branch that decides it is asserted here from both
// sides.
//
// The branch used to read `process.env.NODE_ENV` at module scope, which is why
// this file used to stub the environment and reset the module registry. It is
// now a parameter — `src/server.ts` passes `import.meta.env.PROD`, which the
// bundler replaces with a literal — so the test simply calls it twice.

import { describe, expect, it } from 'vitest';

import { securityHeaders, withSecurityHeaders } from '../src/security-headers';

function scriptSrcFor(isProduction: boolean): string {
  const policy = securityHeaders(isProduction)['Content-Security-Policy'];
  const directive = policy?.split('; ').find((entry) => entry.startsWith('script-src '));
  if (directive === undefined) {
    throw new Error(`no script-src directive in ${policy ?? 'a missing policy'}`);
  }
  return directive;
}

describe('content security policy', () => {
  it("omits 'unsafe-eval' in production", () => {
    expect(scriptSrcFor(true)).toBe("script-src 'self' 'unsafe-inline'");
  });

  it("allows 'unsafe-eval' in development, where the dev bundle and React call eval()", () => {
    expect(scriptSrcFor(false)).toBe("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it('carries the full defense-in-depth set, not only a policy', () => {
    expect(Object.keys(securityHeaders(true)).sort()).toEqual([
      'Content-Security-Policy',
      'Permissions-Policy',
      'Referrer-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
    ]);
  });
});

describe('withSecurityHeaders', () => {
  // The headers have to survive onto documents the router produced for a failure,
  // which is the case `api/security-headers.hurl` pins on the 404.
  it('preserves the status and body it wraps', async () => {
    const wrapped = withSecurityHeaders(new Response('not found', { status: 404 }), true);

    expect(wrapped.status).toBe(404);
    await expect(wrapped.text()).resolves.toBe('not found');
    expect(wrapped.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('overwrites a weaker value a route already set rather than appending to it', () => {
    const wrapped = withSecurityHeaders(
      new Response('', { headers: { 'X-Frame-Options': 'SAMEORIGIN' } }),
      true,
    );

    expect(wrapped.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('leaves headers the route owns alone', () => {
    const wrapped = withSecurityHeaders(
      new Response('{}', {
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
      }),
      true,
    );

    expect(wrapped.headers.get('Cache-Control')).toBe('no-store');
    expect(wrapped.headers.get('Content-Type')).toBe('application/json');
  });
});
