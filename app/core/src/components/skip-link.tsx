/**
 * The first focusable element in the document, so a keyboard or switch user can
 * reach `<main>` without tabbing through the header and the six navigation
 * entries (docs/design/ui-shell-contract.md §12).
 *
 * It is a Server Component and stays out of `app-chrome.tsx` deliberately: the
 * chrome is the one client component the shell needs, and a static link has no
 * state to justify shipping it to the browser. Keeping it in the layout is also
 * what puts it ahead of the header in document order, which is the requirement.
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
 * `href` points at `<PageMain>`'s `id`, and that element carries `tabIndex={-1}`
 * so the browser moves focus rather than only scrolling.
 */
export function SkipLink({ label }: Readonly<{ label: string }>) {
  return (
    <a
      className="absolute top-0 left-4 z-50 inline-flex min-h-11 -translate-y-full items-center rounded-b-lg border border-t-0 border-gray-200 bg-white px-4 text-brand focus:translate-y-0"
      href="#main-content"
    >
      {label}
    </a>
  );
}
