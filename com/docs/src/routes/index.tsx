import { createFileRoute } from '@tanstack/react-router';

import { PageHero } from '../components/page-hero';
import { brandTitle } from '../lib/title';

/*
 * This is what Next expressed as `metadata.title.default` on the root layout.
 * It lives on the index route rather than on `__root` because the root must not
 * emit a title at all — see the comment in `__root.tsx`.
 */
export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: brandTitle('Docs') }] }),
  component: Home,
});

function Home() {
  return (
    <PageHero
      siteName="UMAXICA ドキュメント"
      title="使い方と技術情報をまとめています"
      paragraphs={[
        'サービスの設定手順、API リファレンス、運用上の注意点を掲載しています。目的の項目が見つからない場合はヘルプをご利用ください。',
      ]}
    />
  );
}
