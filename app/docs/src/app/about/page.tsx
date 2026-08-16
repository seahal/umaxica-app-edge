import type { Metadata } from 'next';

import { PageHero } from '../../components/page-hero';

/**
 * The root layout's `template` closes this with the brand, producing
 * `このサイトについて — UMAXICA (APP)`. The page title names the page, never the
 * surface or the runtime that served it.
 */
export const metadata: Metadata = {
  title: 'このサイトについて',
  description: 'Documentation for the UMAXICA platform.',
};

export default function About() {
  return (
    <PageHero
      eyebrow="UMAXICA ドキュメント"
      title="このサイトについて"
      paragraphs={[
        'このサイトでは、UMAXICA のサービスをご利用いただくための使い方と技術情報をご案内しています。設定手順、API リファレンス、運用上の注意点を掲載しています。',
        '掲載内容は予告なく変更される場合があります。目的の項目が見つからない場合は、ヘルプをご利用ください。',
      ]}
    />
  );
}
