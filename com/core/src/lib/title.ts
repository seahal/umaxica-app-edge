/*
 * The UMAXICA brand title contract, in the one place this unit composes it.
 *
 * Next's Metadata API had `title.template = '%s — UMAXICA (COM)'` and
 * `title.absolute` to escape it. TanStack Router has neither: `head.meta` takes
 * a finished string, and nested titles simply override ancestors. So the suffix
 * is composed here instead, and `test/title-contract.test.tsx` pins the result
 * against the same regex the repository-wide suite uses.
 *
 * The separator is an EM DASH (U+2014) with a single space on each side. It is
 * not a hyphen and not an EN DASH; `test/html-title-contract.test.ts` matches on
 * the exact character.
 */
export const BRAND_TITLE = 'UMAXICA (COM)';

export function brandTitle(pageTitle: string): string {
  return `${pageTitle} — ${BRAND_TITLE}`;
}
