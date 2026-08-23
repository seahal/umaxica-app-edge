import { BRAND_TITLE } from '../lib/title';

/*
 * The two failure documents, in one module because the router and the root route
 * both have to name them.
 *
 * `__root.tsx` sets them as the root route's own `notFoundComponent` and
 * `errorComponent`; `router.tsx` sets the same two as `defaultNotFoundComponent`
 * and `defaultErrorComponent`. Both are needed and they are not redundant: the
 * root's pair covers a failure in the root itself, the router's defaults cover
 * every descendant route that declares none. Measured 2026-08-22 — with only the
 * root's `errorComponent` set, a throwing child route answered 500 with no
 * `<title>` and no `<main>` at all.
 *
 * Each renders its own `<title>`, which React hoists into `<head>`. That is why
 * `__root.tsx` deliberately emits no title: two sources would produce two
 * `<title>` elements and `api/title-contract.hurl` asserts there is exactly one.
 *
 * Both carry `id="main-content"` and `tabIndex={-1}`, because they render inside
 * the shell and the skip link sits ahead of the header on these documents too. A
 * skip link whose target is missing on the one page a reader reaches when
 * something has already gone wrong is worse than none.
 */

/** HTTP 404. The status comes from the router's not-found signal, not from here. */
export function NotFoundDocument() {
  return (
    <>
      <title>{`ページが見つかりません — ${BRAND_TITLE}`}</title>
      <main
        className="grid flex-1 place-content-center gap-3 p-6 text-center"
        id="main-content"
        tabIndex={-1}
      >
        <h1 className="text-2xl leading-heading font-semibold">ページが見つかりません</h1>
        <p>HTTP 404</p>
        {/*
         * No reload control: a 404 is not a transient failure, and
         * `api/status-surfaces.hurl` asserts this document does not contain
         * 再読み込み.
         */}
        <a
          className="inline-flex min-h-11 items-center justify-self-center rounded-full border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100"
          href="/"
        >
          トップへ戻る
        </a>
      </main>
    </>
  );
}

/**
 * HTTP 500.
 *
 * The reset control stays a plain `<button>`. It hand-maintains no keyboard,
 * focus or ARIA behaviour for React Aria to take over — the element already
 * carries all of it.
 */
export function ErrorDocument({ reset }: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <>
      <title>{`現在、このページを表示できません — ${BRAND_TITLE}`}</title>
      <main
        className="grid flex-1 place-content-center gap-3 p-6 text-center"
        id="main-content"
        tabIndex={-1}
      >
        <h1 className="text-2xl leading-heading font-semibold">現在、このページを表示できません</h1>
        <p>HTTP 500</p>
        <button
          type="button"
          className="inline-flex min-h-11 cursor-pointer items-center justify-self-center rounded-full border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100"
          onClick={() => reset()}
        >
          再読み込み
        </button>
        <p>
          <a className="text-brand" href="/">
            トップへ戻る
          </a>
        </p>
      </main>
    </>
  );
}
