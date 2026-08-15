'use client';

/*
 * A failure document: chrome-free by design (`docs/design/ui-shell-contract.md`
 * §15), which is why it sits outside the `(page)` route group.
 *
 * The reset control stays a plain `<button>`. It hand-maintains no keyboard,
 * focus or ARIA behaviour for React Aria to take over — the element already
 * carries all of it — and the shell contract reserves the library for the
 * interactive primitives that would otherwise be built by hand.
 */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-content-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold leading-heading">現在、このページを表示できません</h1>
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
  );
}
