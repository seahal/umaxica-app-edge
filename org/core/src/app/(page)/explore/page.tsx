import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { PageMain } from '@/components/page-main';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(defaultLocale);

  return { title: dict.explore.title };
}

export default async function Explore() {
  const dict = await getDictionary(defaultLocale);

  return (
    <PageMain>
      <h1>{dict.explore.title}</h1>
    </PageMain>
  );
}
