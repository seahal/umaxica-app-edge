import './globals.css';

export const dynamic = 'force-static';

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="status-page">
          <h1>404</h1>
          <p>Page not found.</p>
        </main>
      </body>
    </html>
  );
}
