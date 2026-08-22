import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'オフライン' };

/*
 * Rendered inside the root layout, so it carries the shell — and therefore the
 * skip link the layout places ahead of the header. This `<main>` is that
 * link's target on this document (contract §12); `tabIndex={-1}` is what makes
 * the browser move focus rather than only scroll.
 */
export default function OfflinePage() {
  return (
    <main
      className="grid flex-1 place-content-center gap-3 p-6 text-center"
      id="main-content"
      tabIndex={-1}
    >
      <h1 className="text-2xl leading-heading font-semibold">オフラインです</h1>
      <p>ネットワーク接続を確認して再読み込みしてください。</p>
      <a
        className="inline-flex min-h-11 items-center justify-self-center rounded-full border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100"
        href="/"
      >
        トップへ戻る
      </a>
    </main>
  );
}
