import type { Metadata } from 'next';

import { PageHero } from '../../components/page-hero';

/**
 * The root layout's `template` closes this with the brand, producing
 * `このサイトについて — UMAXICA (COM)`. The page title names the page, never the
 * surface or the runtime that served it.
 */
export const metadata: Metadata = {
  title: 'このサイトについて',
  description: 'Information about the UMAXICA platform.',
};

export default function About() {
  return (
    <PageHero
      eyebrow="UMAXICA インフォメーション"
      title="このサイトについて"
      paragraphs={[
        'このサイトでは、UMAXICA のサービスに関するご案内を掲載しています。提供中のサービス内容、利用条件、各種お手続きについてご確認いただけます。',
        '掲載内容は予告なく変更される場合があります。',
      ]}
    />
  );
}
