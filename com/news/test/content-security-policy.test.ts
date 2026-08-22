// The half of the security-header contract `api/security-headers.hurl` cannot
// reach.
//
// That suite asserts on a real response, which is where every header value a
// client can observe belongs — but the server it starts is `next dev`, so the
// only policy it ever sees is the development one. The two differ in exactly one
// source expression: `script-src` carries 'unsafe-eval' under `next dev`,
// because Turbopack and React's development build both call eval(). Shipping it
// to production is the mistake worth catching, and no HTTP client pointed at a
// dev server can catch it, so the branch that decides it is asserted here from
// both sides.

import { afterEach, describe, expect, it, vi } from 'vitest';

async function scriptSrcFor(nodeEnv: string): Promise<string> {
  vi.stubEnv('NODE_ENV', nodeEnv);
  // The policy is built once at module scope, so the stub only takes effect on a
  // fresh evaluation.
  vi.resetModules();
  const { imageFontSecurityHeaders } = await import('../security-headers');

  const rules = await imageFontSecurityHeaders();
  const policy = rules[0]?.headers.find(
    (header) => header.key === 'Content-Security-Policy',
  )?.value;
  const directive = policy?.split('; ').find((entry) => entry.startsWith('script-src '));
  if (directive === undefined) {
    throw new Error(`no script-src directive in ${policy ?? 'a missing policy'}`);
  }
  return directive;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('content security policy', () => {
  it("omits 'unsafe-eval' in production", async () => {
    await expect(scriptSrcFor('production')).resolves.toBe("script-src 'self' 'unsafe-inline'");
  });

  it("allows 'unsafe-eval' in development, where Turbopack and React call eval()", async () => {
    await expect(scriptSrcFor('development')).resolves.toBe(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    );
  });
});
