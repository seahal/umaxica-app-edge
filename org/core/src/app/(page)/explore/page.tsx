import type { Metadata } from 'next';

import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

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
