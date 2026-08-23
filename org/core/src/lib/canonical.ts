/*
 * This frame's public origin, and the only place it is written.
 *
 * `robots.txt` and `sitemap.xml` both name it, and they must not be allowed to
 * disagree — a sitemap that advertises one host while robots.txt points at
 * another is the kind of SEO fault that fails silently.
 *
 * It is the same hostname `PUBLIC_CORE_HOST` names in `src/lib/core-dispatch.ts`,
 * and deliberately a second declaration rather than an import: that constant is
 * part of the ADR 007 dispatch boundary, which decides whether Rails or this
 * application owns a path. Coupling SEO copy to it would let an edit made for
 * one reason change the other.
 */
export const CANONICAL_ORIGIN = 'https://jp.umaxica.org';
