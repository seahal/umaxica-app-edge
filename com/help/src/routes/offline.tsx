import { createFileRoute } from '@tanstack/react-router';

import { brandTitle } from '../lib/title';

export const Route = createFileRoute('/offline')({
  head: () => ({ meta: [{ title: brandTitle('オフライン') }] }),
  component: OfflinePage,
});

/*
 * Rendered inside the root shell, so it carries the skip link the shell places
 * ahead of the header. This `<main>` is that link's target on this document
 * (docs/design/ui-shell-contract.md §12); `tabIndex={-1}` is what makes the
 * browser move focus rather than only scroll.
 *
 * The service worker caches this document at install and serves it for a failed
 * navigation, so it must stay reachable as an ordinary route.
 */
function OfflinePage() {
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
