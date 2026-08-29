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
      { name: 'description', content: 'Help and support for the UMAXICA platform.' },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageHero
      siteName="UMAXICA ヘルプ"
      title="このサイトについて"
      paragraphs={[
        'このサイトでは、UMAXICA のサービスをご利用中にお困りごとが生じた際の解決をお手伝いしています。よくあるご質問と対処方法をまとめています。',
        '掲載内容で解決しない場合は、お問い合わせフォームから状況をお知らせください。',
      ]}
    />
  );
}
