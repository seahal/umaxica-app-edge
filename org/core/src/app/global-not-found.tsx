import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { absolute: 'ページが見つかりません — UMAXICA (ORG)' },
};

export default function GlobalNotFound() {
  return (
    <html lang="ja">
      <body>
        <main className="status-page">
          <h1>ページが見つかりません</h1>
          <p>HTTP 404</p>
          <a href="/">トップへ戻る</a>
        </main>
      </body>
    </html>
  );
}
