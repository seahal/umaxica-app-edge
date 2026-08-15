import { PageHero } from '../components/page-hero';
export default function Home() {
  return (
    <PageHero
      eyebrow="UMAXICA ドキュメント"
      title="使い方と技術情報をまとめています"
      paragraphs={[
        'サービスの設定手順、API リファレンス、運用上の注意点を掲載しています。目的の項目が見つからない場合はヘルプをご利用ください。',
      ]}
    />
  );
}
