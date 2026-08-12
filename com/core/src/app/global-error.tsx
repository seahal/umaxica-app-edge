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
          <h1>現在、このページを表示できません</h1>
          <p>HTTP 500</p>
          <button onClick={handleReset} type="button">
            再読み込み
          </button>
          <p>
            <a href="/">トップへ戻る</a>
          </p>
        </main>
      </body>
    </html>
  );
}
