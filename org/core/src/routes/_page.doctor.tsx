import { createFileRoute } from '@tanstack/react-router';

import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageTitles } from '@/lib/page-titles';

export const Route = createFileRoute('/_page/doctor')({
  loader: () => getDictionary(defaultLocale),
  head: () => ({ meta: [{ title: pageTitles.doctor }] }),
  component: DoctorPage,
});

function DoctorPage() {
  const dict = Route.useLoaderData();

  return (
    <PageMain>
      <h1>{dict.doctor.title}</h1>
    </PageMain>
  );
}
