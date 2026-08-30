// The half of the security-header contract `api/security-headers.hurl` cannot
// reach.
//
// That suite asserts on a real response, which is where every header value a
// client can observe belongs — but the server it starts is `vite dev`, so the
// only policy it ever sees is the development one. The two differ in exactly one
// source expression set: development carries 'unsafe-inline' and 'unsafe-eval',
// because the dev bundle and React's development build both call eval() and Vite
// injects inline scripts this code never sees. Production carries neither — it
// names a per-request nonce instead. Shipping the development list to production
// is the mistake worth catching, and no HTTP client pointed at a dev server can
// catch it, so the branch that decides it is asserted here from both sides.
//
// The nonce assertions live here for the same reason: the Hurl suite only ever
// observes the development policy, which has no nonce in it at all.
//
// The branch used to read `process.env.NODE_ENV` at module scope, which is why
// this file used to stub the environment and reset the module registry. It is
// now a parameter — `src/server.ts` passes `import.meta.env.PROD`, which the
// bundler replaces with a literal — so the test simply calls it twice.

import { describe, expect, it } from 'vitest';

import { getRouter } from '../src/router';
import { securityHeaders, withSecurityHeaders } from '../src/security-headers';
import { createNonce, getRequestNonce, runWithNonce } from '../src/security-nonce';

function directiveFor(isProduction: boolean, name: string, nonce?: string): string {
  const policy = securityHeaders(isProduction, nonce)['Content-Security-Policy'];
  const directive = policy?.split('; ').find((entry) => entry.startsWith(`${name} `));
  if (directive === undefined) {
    throw new Error(`no ${name} directive in ${policy ?? 'a missing policy'}`);
  }
  return directive;
}

function scriptSrcFor(isProduction: boolean, nonce?: string): string {
  return directiveFor(isProduction, 'script-src', nonce);
}

describe('content security policy', () => {
  it("omits both 'unsafe-eval' and 'unsafe-inline' in production", () => {
    expect(scriptSrcFor(true)).toBe("script-src 'self'");
  });

  it("allows 'unsafe-eval' in development, where the dev bundle and React call eval()", () => {
    expect(scriptSrcFor(false)).toBe("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  // The nonce is what replaces 'unsafe-inline' rather than joining it: naming a
  // nonce makes a browser ignore 'unsafe-inline' entirely, so a policy carrying
  // both would be the development policy with extra characters.
  it('names the nonce it was given, and no unsafe-inline beside it', () => {
    expect(scriptSrcFor(true, 'abc123')).toBe("script-src 'self' 'nonce-abc123'");
  });

  it('nonces style-src too, so TanStack inline CSS needs no unsafe-inline', () => {
    expect(directiveFor(true, 'style-src', 'abc123')).toBe("style-src 'self' 'nonce-abc123'");
    expect(directiveFor(true, 'style-src')).toBe("style-src 'self'");
    expect(directiveFor(false, 'style-src')).toBe("style-src 'self' 'unsafe-inline'");
  });

  // A nonce authorises elements, not attributes, so `script-src` alone leaves
  // `onclick="..."` permitted once a nonce is present.
  it('forbids event-handler and style attributes outright', () => {
    const policy = securityHeaders(true, 'abc123')['Content-Security-Policy'] ?? '';
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).toContain("style-src-attr 'none'");
  });

  it('never emits the same nonce twice', () => {
    const nonces = new Set(Array.from({ length: 50 }, () => createNonce()));
    expect(nonces.size).toBe(50);
  });

  it('mints a nonce with at least 128 bits of entropy', () => {
    // base64 of 16 bytes is 24 characters including padding.
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/]{22}==$/u);
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

/*
 * The nonce's other end.
 *
 * `securityHeaders` names a nonce in the policy; this is what puts the SAME
 * value on the one inline script TanStack emits. Naming a nonce no script
 * carries does not weaken the policy — it blocks that script outright, so the
 * two halves are only correct together.
 *
 * `getRouter()` reads the value from `AsyncLocalStorage` instead of taking it as
 * an argument, because `createStartHandler` calls it with none. Entering and
 * leaving that scope is the only way to reach either branch, and it is not
 * something an HTTP client can arrange.
 */
describe('router nonce', () => {
  it('carries the nonce of the request it is called inside onto the router', () => {
    const router = runWithNonce('nonce-under-test', () => getRouter());

    expect(router.options.ssr?.nonce).toBe('nonce-under-test');
  });

  /*
   * The scope itself. A nonce that outlived its request would be reused by the
   * next one, which is the same as having no nonce — and development mints none
   * at all, so the callback has to run unwrapped rather than inside a scope
   * holding `undefined`.
   */
  it('scopes the nonce to the call it was given, and yields none outside one', () => {
    expect(runWithNonce('scoped-nonce', () => getRequestNonce())).toBe('scoped-nonce');
    expect(runWithNonce(undefined, () => getRequestNonce())).toBeUndefined();
    expect(getRequestNonce()).toBeUndefined();
  });

  it('omits `ssr` entirely outside a request, where there is no nonce to name', () => {
    /*
     * Every development response and the build itself land here. The key has to
     * be ABSENT rather than present holding `undefined`: `ssr: { nonce:
     * undefined }` is what makes TanStack emit an empty `nonce=""`, which a
     * policy naming a real nonce then rejects.
     */
    expect(getRouter().options.ssr).toBeUndefined();
  });
});
