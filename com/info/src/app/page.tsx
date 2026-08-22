import { PageHero } from '../components/page-hero';
export default function Home() {
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
