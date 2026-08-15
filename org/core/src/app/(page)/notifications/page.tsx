import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { PageMain } from '@/components/page-main';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(defaultLocale);

  return { title: dict.notifications.title };
}

export default async function Notifications() {
  const dict = await getDictionary(defaultLocale);

  return (
    <PageMain>
      <h1>{dict.notifications.title}</h1>
      <p>{dict.notifications.wip}</p>
    </PageMain>
  );
}
