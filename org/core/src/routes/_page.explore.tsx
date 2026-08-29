import { createFileRoute } from '@tanstack/react-router';

import { PageHeading } from '@/components/page-heading';
import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageTitles } from '@/lib/page-titles';

export const Route = createFileRoute('/_page/explore')({
  loader: () => getDictionary(defaultLocale),
  head: () => ({ meta: [{ title: pageTitles.explore }] }),
  component: ExplorePage,
});

function ExplorePage() {
  const dict = Route.useLoaderData();

  return (
    <PageMain>
      <PageHeading>{dict.explore.title}</PageHeading>
    </PageMain>
  );
}
