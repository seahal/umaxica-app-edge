'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ja">
      <body>
        <main className="status-page">
          <h1>500</h1>
          <p>{error.message || 'Something went wrong.'}</p>
          <button onClick={() => reset()} type="button">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
