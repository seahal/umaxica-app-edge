import { defaultLocale, isLocale, type Locale } from './config';

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  ja: () => import('./dictionaries/ja.json').then((m) => m.default),
};

export const getDictionary = async (locale: string) => {
  const safeLocale: Locale = isLocale(locale) ? locale : defaultLocale;
  return dictionaries[safeLocale]();
};
