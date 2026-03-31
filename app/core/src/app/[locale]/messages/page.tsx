import { getDictionary } from '@/i18n/dictionaries';

export default async function Messages({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <main>
      <h1>{dict.messages.title}</h1>
      <p>{dict.messages.wip}</p>
    </main>
  );
}
