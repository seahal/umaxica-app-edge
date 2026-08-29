/**
 * The page's single `<h1>`, for every page under the `(page)` route group.
 *
 * It exists because the pages had no heading treatment at all: each rendered a
 * bare `<h1>`, and Tailwind's Preflight resets a heading to the surrounding
 * font size and weight. Every core page therefore shipped a title that was
 * pixel-identical to the paragraph under it — a document with no hierarchy,
 * which is the one thing a heading exists to provide.
 *
 * `text-2xl` rather than the satellites' `text-4xl`: this is an application
 * screen reached from a persistent navigation, not the opening page of a
 * content site, and a page title inside an app competes with the navigation
 * beside it if it is set at landing-page scale. The rest is the treatment the
 * whole repository uses on a heading — `leading-heading` from `@theme` because
 * Japanese glyphs fill the em box, and `tracking-tight` because letter-spacing
 * closes at large sizes (docs/design/ui-shell-contract.md §10).
 *
 * The brand in the header is deliberately not this element: it is a link, and
 * the document's single `<h1>` belongs to the page, inside `<main>` (§3).
 */
export function PageHeading({ children }: Readonly<{ children: React.ReactNode }>) {
  return <h1 className="text-2xl leading-heading font-semibold tracking-tight">{children}</h1>;
}
