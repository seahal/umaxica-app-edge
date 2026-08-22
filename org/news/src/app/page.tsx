import { PageHero } from '../components/page-hero';
export default function Home() {
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
