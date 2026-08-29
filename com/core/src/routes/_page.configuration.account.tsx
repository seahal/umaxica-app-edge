import { createFileRoute } from '@tanstack/react-router';

import { PageHeading } from '@/components/page-heading';
import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageTitles } from '@/lib/page-titles';

export const Route = createFileRoute('/_page/configuration/account')({
  loader: () => getDictionary(defaultLocale),
  head: () => ({ meta: [{ title: pageTitles.configuration_account }] }),
  component: ConfigurationAccountPage,
});

function ConfigurationAccountPage() {
  const dict = Route.useLoaderData();

  return (
    <PageMain>
      <PageHeading>{dict.configuration_account.title}</PageHeading>
    </PageMain>
  );
}
