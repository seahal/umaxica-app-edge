import { createFileRoute } from '@tanstack/react-router';

import { PageHero } from '../components/page-hero';
import { brandTitle } from '../lib/title';

/**
 * `brandTitle` closes this with the brand, producing
 * `このサイトについて — UMAXICA (COM)`. The page title names the page, never the
 * surface or the runtime that served it.
 */
export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: brandTitle('このサイトについて') },
      { name: 'description', content: 'News and announcements from UMAXICA.' },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageHero
      siteName="UMAXICA ニュース"
      title="このサイトについて"
      paragraphs={[
        'このサイトでは、UMAXICA からの最新のお知らせをお届けしています。新機能のリリース、メンテナンスの予定、障害発生時のご報告などを掲載しています。',
        '重要なお知らせは順次このページに追加されます。',
      ]}
    />
  );
}
