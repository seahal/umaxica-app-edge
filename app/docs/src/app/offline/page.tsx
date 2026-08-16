import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'オフライン' };

export default function OfflinePage() {
  return (
    <main className="grid flex-1 place-content-center gap-3 p-6 text-center">
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
