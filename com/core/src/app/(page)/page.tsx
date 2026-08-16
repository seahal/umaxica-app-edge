import { PageMain } from '@/components/page-main';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export default async function PageIndex() {
  const dict = await getDictionary(defaultLocale);

  return (
    <PageMain>
      <h1>{dict.home.title}</h1>
      <p>{dict.home.description}</p>
    </PageMain>
  );
}
