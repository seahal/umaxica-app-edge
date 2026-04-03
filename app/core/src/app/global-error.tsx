'use client';

import { useCallback } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const handleReset = useCallback(() => reset(), [reset]);
  return (
    <html lang="ja">
      <body>
        <main className="status-page">
          <h1>500</h1>
          <p>{error.message || 'Something went wrong.'}</p>
          <button onClick={handleReset} type="button">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
