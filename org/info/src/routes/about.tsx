import { createFileRoute } from '@tanstack/react-router';

import { PageHero } from '../components/page-hero';
import { brandTitle } from '../lib/title';

/**
 * `brandTitle` closes this with the brand, producing
 * `このサイトについて — UMAXICA (ORG)`. The page title names the page, never the
 * surface or the runtime that served it.
 */
export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: brandTitle('このサイトについて') },
      { name: 'description', content: 'Information about the UMAXICA platform.' },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageHero
      siteName="UMAXICA インフォメーション"
      title="このサイトについて"
      paragraphs={[
        'このサイトでは、UMAXICA のサービスに関するご案内を掲載しています。提供中のサービス内容、利用条件、各種お手続きについてご確認いただけます。',
        '掲載内容は予告なく変更される場合があります。',
      ]}
    />
  );
}
