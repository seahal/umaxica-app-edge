import type { Metadata } from 'next';

import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(defaultLocale);

  return { title: dict.messages.title };
}

export default async function Messages() {
  const dict = await getDictionary(defaultLocale);

  return (
    <PageMain>
      <h1>{dict.messages.title}</h1>
      <p>{dict.messages.wip}</p>
    </PageMain>
  );
}
