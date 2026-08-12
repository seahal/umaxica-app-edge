const IMAGE_FONT_CSP = [
  "default-src 'self'",
  "base-uri 'none'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  'upgrade-insecure-requests',
].join('; ');

/**
 * Defense-in-depth headers for statically rendered Next.js pages. Inline
 * scripts and styles remain allowed because Next hydration emits both; the
 * remaining directives constrain every other resource and embedding boundary.
 */
export const imageFontSecurityHeaders = async () => [
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
