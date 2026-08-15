/**
 * This unit's own language facts.
 *
 * Every deployment unit owns this file outright — it is deliberately not
 * imported from a sibling or a shared package, because a unit that reaches
 * across the boundary cannot be extracted into its own repository
 * (`test/deployment-unit-boundaries.test.ts`).
 *
 * `defaultLocale` is the single source of truth for `<html lang>` on this
 * unit's root document. Sub-documents that replace the root layout state the
 * language of their own copy instead; `test/html-lang-contract.test.ts` pins
 * both halves.
 *
 * This unit serves one language and does not negotiate, so that is the whole
 * surface. A unit that starts negotiating adds the locale list here, next to
 * the fact it varies.
 */
export const defaultLocale = 'en';
