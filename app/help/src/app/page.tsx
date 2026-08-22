import { PageHero } from '../components/page-hero';
export default function Home() {
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
