import type { ReactNode } from 'react';

/**
 * The content surface this unit serves: an eyebrow, the page's single `<h1>`,
 * and its body copy.
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
 * `id="main-content"` is the skip link's target (contract §12). `tabIndex` of
 * `-1` is what makes that link move focus rather than only scroll — without it
 * the browser jumps to the fragment and leaves focus on the link, so the next
 * Tab returns to the header the reader just skipped. It draws no ring on click,
 * because the focus rule in `style.css` is `:focus-visible` rather than
 * `:focus`.
 */
export function PageHero({
  eyebrow,
  title,
  paragraphs,
}: Readonly<{ eyebrow: string; title: string; paragraphs: readonly string[] }>): ReactNode {
  return (
    <main
      className="grid flex-1 place-items-center px-5 py-12 wide:px-8"
      id="main-content"
      tabIndex={-1}
    >
      <section className="w-full max-w-3xl">
        <p className="mb-3 text-sm font-bold text-brand">{eyebrow}</p>
        <h1 className="text-4xl leading-heading font-bold wide:text-6xl">{title}</h1>
        {paragraphs.map((paragraph) => (
          <p className="mt-6 max-w-prose text-lg text-gray-600" key={paragraph}>
            {paragraph}
          </p>
        ))}
      </section>
    </main>
  );
}
