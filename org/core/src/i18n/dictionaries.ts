import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { defaultLocale, isLocale } from './config';

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  ja: () => import('./dictionaries/ja.json').then((m) => m.default),
};

export const getDictionary = async (locale: string = defaultLocale) => {
  'use cache';
  cacheLife('max');

  if (!isLocale(locale)) {
    notFound();
  }

  return dictionaries[locale]();
};
