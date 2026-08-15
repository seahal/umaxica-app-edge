/**
 * This unit's own language facts.
 *
 * Every deployment unit owns this file outright — it is deliberately not
 * imported from a sibling or a shared package, because a unit that reaches
 * across the boundary cannot be extracted into its own repository
 * (`test/deployment-unit-boundaries.test.ts`).
 *
 * Unlike the other apexes, this unit negotiates a locale per request, so
 * `defaultLocale` is the fallback rather than the only answer. Documents that
 * are not negotiated — the health page — still state it explicitly.
 */
export const defaultLocale = 'en';
export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
