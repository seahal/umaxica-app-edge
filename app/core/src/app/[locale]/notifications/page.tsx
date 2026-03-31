import { getDictionary } from '@/i18n/dictionaries';

export default async function Notifications({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <main>
      <h1>{dict.notifications.title}</h1>
      <p>{dict.notifications.wip}</p>
    </main>
  );
}
