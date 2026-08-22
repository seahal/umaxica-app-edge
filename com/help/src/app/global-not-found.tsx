import type { Metadata } from 'next';

import './style.css';
export const metadata: Metadata = {
  title: { absolute: 'ページが見つかりません — UMAXICA (COM)' },
};

export default function GlobalNotFound() {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col bg-gray-50 leading-body text-gray-900">
        <main className="grid flex-1 place-content-center gap-3 p-6 text-center">
          <h1 className="text-2xl leading-heading font-semibold">ページが見つかりません</h1>
          <p>HTTP 404</p>
          <a
            className="inline-flex min-h-11 items-center justify-self-center rounded-full border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100"
            href="/"
          >
            トップへ戻る
          </a>
        </main>
      </body>
    </html>
  );
}
