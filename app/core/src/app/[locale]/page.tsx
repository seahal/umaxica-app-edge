import { getDictionary } from '@/i18n/dictionaries';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <main>
      <h1>{dict.home.title}</h1>
      <p>{dict.home.description}</p>
    </main>
  );
}
