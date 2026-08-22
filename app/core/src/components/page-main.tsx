/**
 * The page-content landmark for every page under the `(page)` route group.
 *
 * Extracted because all nine pages open with the same `<main>`: the element is
 * the shell's second grid column above the breakpoint and a full-width row
 * below it, and that placement is a property of the shell rather than of any
 * one page. A page that repeated the classes would be free to get them subtly
 * wrong, and the layout cannot supply the element itself — every page already
 * renders one, and a second `<main>` would break the document landmarks.
 *
 * `min-w-0` is load-bearing: a grid item's default `min-width: auto` lets wide
 * content — a long URL, a `<pre>` — push the column past its track and widen
 * the whole shell.
 *
 * `id="main-content"` is the skip link's target (contract §12), and it is here
 * rather than on the layout for the same reason the element is: the layout
 * cannot supply a `<main>` without giving every page a second one. `tabIndex`
 * of `-1` is what makes the skip link move focus rather than only scroll —
 * without it the browser jumps to the fragment and leaves focus on the link, so
 * the next Tab returns to the navigation the reader just skipped. It draws no
 * ring on click, because the focus rule in `globals.css` is `:focus-visible`
 * rather than `:focus`.
 */
export function PageMain({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-w-0 px-5 py-6 wide:col-start-2 wide:p-8" id="main-content" tabIndex={-1}>
      {children}
    </main>
  );
}
