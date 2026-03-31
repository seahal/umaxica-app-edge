import { getDictionary } from '@/i18n/dictionaries';

export default async function Preference({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <main>
      <h1>{dict.configuration_preference.title}</h1>
    </main>
  );
}
