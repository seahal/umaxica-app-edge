import { createFileRoute } from '@tanstack/react-router';

import { PageHero } from '../components/page-hero';
import { brandTitle } from '../lib/title';

/**
 * `brandTitle` closes this with the brand, producing
 * `このサイトについて — UMAXICA (APP)`. The page title names the page, never the
 * surface or the runtime that served it.
 */
export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: brandTitle('このサイトについて') },
      { name: 'description', content: 'Documentation for the UMAXICA platform.' },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageHero
      siteName="UMAXICA ドキュメント"
      title="このサイトについて"
      paragraphs={[
        'このサイトでは、UMAXICA のサービスをご利用いただくための使い方と技術情報をご案内しています。設定手順、API リファレンス、運用上の注意点を掲載しています。',
        '掲載内容は予告なく変更される場合があります。目的の項目が見つからない場合は、ヘルプをご利用ください。',
      ]}
    />
  );
}
