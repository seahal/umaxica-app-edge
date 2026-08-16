import type { Metadata } from 'next';

import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(defaultLocale);

  return { title: dict.configuration_account.title };
}

export default async function Account() {
  const dict = await getDictionary(defaultLocale);

  return (
    <PageMain>
      <h1>{dict.configuration_account.title}</h1>
    </PageMain>
  );
}
