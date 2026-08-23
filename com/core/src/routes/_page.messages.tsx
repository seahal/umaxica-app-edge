import { createFileRoute } from '@tanstack/react-router';

import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageTitles } from '@/lib/page-titles';

export const Route = createFileRoute('/_page/messages')({
  loader: () => getDictionary(defaultLocale),
  head: () => ({ meta: [{ title: pageTitles.messages }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const dict = Route.useLoaderData();

  return (
    <PageMain>
      <h1>{dict.messages.title}</h1>
      <p>{dict.messages.wip}</p>
    </PageMain>
  );
}
