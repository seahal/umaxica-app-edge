import { createFileRoute } from '@tanstack/react-router';

import { PageHero } from '../components/page-hero';
import { brandTitle } from '../lib/title';

/*
 * This is what Next expressed as `metadata.title.default` on the root layout.
 * It lives on the index route rather than on `__root` because the root must not
 * emit a title at all — see the comment in `__root.tsx`.
 */
export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: brandTitle('Help') }] }),
  component: Home,
});

function Home() {
  return (
    <PageHero
      eyebrow="UMAXICA ヘルプ"
      title="お困りごとの解決をお手伝いします"
      paragraphs={[
        'よくあるご質問と対処方法をまとめています。解決しない場合は、お問い合わせフォームから状況をお知らせください。',
      ]}
    />
  );
}
