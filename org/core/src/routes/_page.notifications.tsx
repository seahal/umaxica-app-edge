import { createFileRoute } from '@tanstack/react-router';

import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageTitles } from '@/lib/page-titles';

export const Route = createFileRoute('/_page/notifications')({
  loader: () => getDictionary(defaultLocale),
  head: () => ({ meta: [{ title: pageTitles.notifications }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const dict = Route.useLoaderData();

  return (
    <PageMain>
      <h1>{dict.notifications.title}</h1>
      <p>{dict.notifications.wip}</p>
    </PageMain>
  );
}
