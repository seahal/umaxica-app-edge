import type { Metadata } from 'next';

import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(defaultLocale);

  return { title: dict.about.title };
}

export default async function About() {
  const dict = await getDictionary(defaultLocale);

  return (
    <PageMain>
      <h1>{dict.about.title}</h1>
    </PageMain>
  );
}
