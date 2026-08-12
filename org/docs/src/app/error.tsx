'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h1>現在、このページを表示できません</h1>
      <p>HTTP 500</p>
      <button type="button" onClick={() => reset()}>
        再読み込み
      </button>
      <p>
        <a href="/">トップへ戻る</a>
      </p>
    </main>
  );
}
