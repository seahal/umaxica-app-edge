'use client';

import { useCallback } from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleReset = useCallback(() => reset(), [reset]);
  return (
    <html lang="ja">
      <body>
        <main className="status-page">
          <h1>500</h1>
          <p>Something went wrong.</p>
          <button onClick={handleReset} type="button">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
