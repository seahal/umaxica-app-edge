import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: { absolute: 'ページが見つかりません — UMAXICA (COM)' },
};

export default function GlobalNotFound() {
  return (
    <html lang="ja">
      <body>
        <main>
          <h1>ページが見つかりません</h1>
          <p>HTTP 404</p>
          <a href="/">トップへ戻る</a>
        </main>
      </body>
    </html>
  );
}
