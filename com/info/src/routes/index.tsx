import { createFileRoute } from '@tanstack/react-router';

import { PageHero } from '../components/page-hero';
import { brandTitle } from '../lib/title';

/*
 * This is what Next expressed as `metadata.title.default` on the root layout.
 * It lives on the index route rather than on `__root` because the root must not
 * emit a title at all — see the comment in `__root.tsx`.
 */
export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: brandTitle('Info') }] }),
  component: Home,
});

function Home() {
  return (
    <PageHero
      eyebrow="UMAXICA インフォメーション"
      title="サービスに関するご案内"
      paragraphs={[
        '提供中のサービス内容、利用条件、各種お手続きについてご案内しています。内容は予告なく変更される場合があります。',
      ]}
    />
  );
}
