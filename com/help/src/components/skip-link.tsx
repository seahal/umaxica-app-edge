/**
 * The first focusable element in the document, so a keyboard or switch user can
 * reach `<main>` without tabbing through the header
 * (docs/design/ui-shell-contract.md §12).
 *
 * The label is a Japanese literal rather than a dictionary lookup, which is how
 * this archetype carries every other shell label — `src/i18n/config.ts` holds
 * `defaultLocale` and nothing else. §13 records the three mechanisms; what has
 * to match across them is the meaning of the label, not the machinery.
 *
 * Hidden by translating itself off the top edge rather than by `sr-only`. Both
 * keep the link in the accessibility tree and focusable, which `display: none`
 * and `visibility: hidden` would not, but `sr-only` has to be undone by
 * `not-sr-only`, whose `position: static` then has to be overridden back to
 * `absolute` in the same variant — two utilities fighting over one property,
 * decided by the order Tailwind happens to emit them in. The two `translate`
 * utilities below set one custom property, and the focused one compiles to
 * `.focus\:translate-y-0:focus` — a pseudo-class the base class does not carry
 * — so it wins on specificity rather than on emission order. Checked against
 * the compiled stylesheet, not assumed.
 *
 * There is deliberately no `transition`: an instant position change is not
 * motion, so §12's reduced-motion precondition stays vacuous.
 *
 * `href` points at the `id` every `<main>` under this layout carries — the
 * hero, `error.tsx` and `/offline` — and each of them also carries
 * `tabIndex={-1}` so the browser moves focus rather than only scrolling.
 */
export function SkipLink() {
  return (
    <a
      className="absolute top-0 left-4 z-50 inline-flex min-h-11 -translate-y-full items-center rounded-b-lg border border-t-0 border-gray-200 bg-white px-4 text-brand focus:translate-y-0"
      href="#main-content"
    >
      本文へスキップ
    </a>
  );
}
