import type { ReactNode } from 'react';

/**
 * The content surface this unit serves: the page's single `<h1>`, the site it
 * belongs to, and its body copy.
 *
 * Extracted because both of this unit's pages open with exactly this block,
 * and the `<main>` landmark is a property of the shell rather than of either
 * page — a page free to write its own would be free to write a second one, or
 * to drop the `flex-1` that keeps the footer at the bottom of a short page.
 *
 * Paragraphs arrive as strings rather than as `children` so that a caller
 * cannot put a heading, a second `<main>` or an interactive control inside the
 * hero without saying so.
 *
 * Three things about the composition are decisions rather than defaults, and
 * each replaced something that was one:
 *
 * - **It sits on the shell's width carrier.** `mx-auto w-full max-w-7xl px-4
 *   wide:px-8` is the same run the header and the footer use
 *   (docs/design/ui-shell-contract.md §9), so the `<h1>` starts on the same
 *   left edge as the brand above it and the copyright below it. It used to be
 *   a `max-w-3xl` block centred inside a `px-5` main, which put the heading
 *   224px right of the brand on a desktop viewport and 4px right of it on a
 *   phone — two alignment systems in one document.
 * - **It is anchored to the top.** `place-items-center` centred a one-paragraph
 *   page in the middle of an otherwise empty viewport, which reads as a splash
 *   screen rather than as the first page of a content site.
 * - **The site name follows the heading rather than sitting above it.** An
 *   eyebrow above an `<h1>` is the form that arrives when nothing was decided,
 *   and this one was `text-brand` — the link colour — on a label that is not a
 *   link. Accent stays on interactive elements; the site name is attribution,
 *   so it reads as attribution, and a screen reader now reaches the page's own
 *   heading first.
 *
 * `id="main-content"` is the skip link's target (contract §12). `tabIndex` of
 * `-1` is what makes that link move focus rather than only scroll — without it
 * the browser jumps to the fragment and leaves focus on the link, so the next
 * Tab returns to the header the reader just skipped. It draws no ring on click,
 * because the focus rule in `style.css` is `:focus-visible` rather than
 * `:focus`.
 */
export function PageHero({
  siteName,
  title,
  paragraphs,
}: Readonly<{ siteName: string; title: string; paragraphs: readonly string[] }>): ReactNode {
  return (
    <main className="flex-1 py-12" id="main-content" tabIndex={-1}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 wide:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="max-w-prose text-4xl leading-heading font-bold tracking-tight wide:text-5xl">
            {title}
          </h1>
          <p className="text-sm text-gray-600">{siteName}</p>
        </div>
        <div className="flex flex-col gap-4">
          {paragraphs.map((paragraph) => (
            <p className="max-w-prose text-lg" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
