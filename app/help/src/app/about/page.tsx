import type { Metadata } from 'next';
import { PageHero } from '../../components/page-hero';

/**
 * The root layout's `template` closes this with the brand, producing
 * `このサイトについて — UMAXICA (APP)`. The page title names the page, never the
 * surface or the runtime that served it.
 */
export const metadata: Metadata = {
  title: 'このサイトについて',
  description: 'Help and support for the UMAXICA platform.',
};

export default function About() {
  return (
    <PageHero
      eyebrow="UMAXICA ヘルプ"
      title="このサイトについて"
      paragraphs={[
        'このサイトでは、UMAXICA のサービスをご利用中にお困りごとが生じた際の解決をお手伝いしています。よくあるご質問と対処方法をまとめています。',
        '掲載内容で解決しない場合は、お問い合わせフォームから状況をお知らせください。',
      ]}
    />
  );
}
