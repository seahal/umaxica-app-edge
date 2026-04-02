import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export default async function Authentication() {
  const dict = await getDictionary(defaultLocale);

  return (
    <main className="page-main">
      <h1>{dict.authentication.title}</h1>
    </main>
  );
}
