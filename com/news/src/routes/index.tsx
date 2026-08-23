import { createFileRoute } from '@tanstack/react-router';

import { PageHero } from '../components/page-hero';
import { brandTitle } from '../lib/title';

/*
 * This is what Next expressed as `metadata.title.default` on the root layout.
 * It lives on the index route rather than on `__root` because the root must not
 * emit a title at all — see the comment in `__root.tsx`.
 */
export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: brandTitle('News') }] }),
  component: Home,
});

function Home() {
  return (
    <PageHero
      eyebrow="UMAXICA ニュース"
      title="最新のお知らせをお届けします"
      paragraphs={[
        '新機能のリリース、メンテナンスの予定、障害発生時のご報告などを掲載しています。重要なお知らせは順次このページに追加されます。',
      ]}
    />
  );
}
