import type { Metadata } from 'next';

import { PageHero } from '../../components/page-hero';

/**
 * The root layout's `template` closes this with the brand, producing
 * `このサイトについて — UMAXICA (ORG)`. The page title names the page, never the
 * surface or the runtime that served it.
 */
export const metadata: Metadata = {
  title: 'このサイトについて',
  description: 'News and announcements from UMAXICA.',
};

export default function About() {
  return (
    <PageHero
      eyebrow="UMAXICA ニュース"
      title="このサイトについて"
      paragraphs={[
        'このサイトでは、UMAXICA からの最新のお知らせをお届けしています。新機能のリリース、メンテナンスの予定、障害発生時のご報告などを掲載しています。',
        '重要なお知らせは順次このページに追加されます。',
      ]}
    />
  );
}
