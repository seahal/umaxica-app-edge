import './globals.css';

export default function GlobalNotFound() {
  return (
    <html lang="en">
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
