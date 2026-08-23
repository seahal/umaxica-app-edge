import { createFileRoute } from '@tanstack/react-router';

import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageTitles } from '@/lib/page-titles';

export const Route = createFileRoute('/_page/about')({
  loader: () => getDictionary(defaultLocale),
  head: () => ({ meta: [{ title: pageTitles.about }] }),
  component: AboutPage,
});

function AboutPage() {
  const dict = Route.useLoaderData();

  return (
    <PageMain>
      <h1>{dict.about.title}</h1>
    </PageMain>
  );
}
