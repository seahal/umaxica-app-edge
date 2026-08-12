import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'オフライン' };

export default function OfflinePage() {
  return (
    <main className="status-page">
      <h1>オフラインです</h1>
      <p>ネットワーク接続を確認して再読み込みしてください。</p>
      <a href="/">トップへ戻る</a>
    </main>
  );
}
