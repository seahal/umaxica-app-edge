/*
 * This frame's public origin, and the only place it is written.
 *
 * `robots.txt` and `sitemap.xml` both name it, and they must not be allowed to
 * disagree — a sitemap that advertises one host while robots.txt points at
 * another is the kind of SEO fault that fails silently. `site-footer.tsx` keeps
 * its own copy with a trailing slash because it is display text rather than a
 * machine-read URL.
 *
 * It is per-brand: `org/info` and `com/info` carry their own value here, and a
 * copied APP value would be a real regression rather than a cosmetic one.
 */
export const CANONICAL_ORIGIN = 'https://info-jp.umaxica.org';
