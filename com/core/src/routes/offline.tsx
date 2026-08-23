import { createFileRoute } from '@tanstack/react-router';

import { brandTitle } from '@/lib/title';

/*
 * Outside `_page`, so it carries no application chrome — the shape it had as
 * `src/app/offline/page.tsx`, which sat outside the `(page)` route group for the
 * same reason.
 *
 * The service worker caches this document at install and serves it for a failed
 * navigation, so it must stay reachable as an ordinary route.
 */
export const Route = createFileRoute('/offline')({
  head: () => ({ meta: [{ title: brandTitle('オフライン') }] }),
  component: OfflinePage,
});

function OfflinePage() {
  return (
    <main className="grid min-h-screen place-content-center gap-3 p-6 text-center">
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
