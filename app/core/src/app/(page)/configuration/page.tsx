import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { PageMain } from '@/components/page-main';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(defaultLocale);

  return { title: dict.configuration.title };
}

export default async function Configuration() {
  const dict = await getDictionary(defaultLocale);

  return (
    <PageMain>
      <h1>{dict.configuration.title}</h1>
    </PageMain>
  );
}
