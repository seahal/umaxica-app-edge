import type { NextConfig } from 'next';

// `next dev` is the only server that needs a looser `script-src`. Turbopack
// wraps development modules in eval() and React's development build calls it to
// reconstruct callstacks across environments, so a dev server answering with the
// production policy fails before the page hydrates: "eval() is not supported in
// this environment. If this page was served with a `Content-Security-Policy`
// header, make sure that `unsafe-eval` is included."
//
// React never calls eval() in production mode, so the loosening is keyed to
// NODE_ENV and confined to `script-src`: `next build`, every preview and every
// deployment keep the policy below unchanged.
// `test/content-security-policy.test.ts` asserts both sides of that branch — the
// Hurl suite runs against `next dev` and can only ever observe the development
// half.
const isProduction = process.env['NODE_ENV'] === 'production';

const IMAGE_FONT_CSP = [
  "default-src 'self'",
  "base-uri 'none'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  'upgrade-insecure-requests',
].join('; ');

/**
 * Defense-in-depth headers for statically rendered Next.js pages. Inline
 * scripts and styles remain allowed because Next hydration emits both; the
 * remaining directives constrain every other resource and embedding boundary.
 */
export const imageFontSecurityHeaders: NonNullable<NextConfig['headers']> = async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'Content-Security-Policy', value: IMAGE_FONT_CSP },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
      },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ],
  },
];
